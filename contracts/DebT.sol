// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IDebT} from "./interfaces/IDebT.sol";
import {IDebTErrors} from "./interfaces/IDebTErrors.sol";
import {ArrayLib} from "./utils/ArrayLib.sol";

contract DebT is IDebT, IDebTErrors {
    using ArrayLib for ArrayLib.Bytes32ArrayMap;

    modifier onlyOwner() {
        if (_owner != msg.sender) {
            revert IllegalCaller(msg.sender, _owner);
        }
        _;
    }

    modifier onlyDebtorHash(bytes32 _producerHash) {
        address _debtor = _debtProduced[_producerHash].debtor;

        if (_debtor != msg.sender) {
            revert IllegalCaller(msg.sender, _debtor);
        }
        _;
    }

    modifier onlyCreditorHash(bytes32 _consumerHash) {
        address _creditor = _debtConsumed[_consumerHash].creditor;

        if (_creditor != msg.sender) {
            revert IllegalCaller(msg.sender, _creditor);
        }
        _;
    }

    modifier onlyExchange(address _exchange) {
        if (allowedExchanges[_exchange] == false) {
            revert IllegalExchange(_exchange);
        }
        _;
    }

    IERC20 private immutable _SFT;
    string public constant name = "Debt Token";
    string public constant symbol = "DebT";
    address private immutable _owner;

    constructor(address _sftAddress) {
        _SFT = IERC20(_sftAddress);
        _owner = msg.sender;
    }

    mapping(bytes32 _producerHash => DebtProducer) private _debtProduced;
    mapping(bytes32 _consumerHash => DebtConsumer) private _debtConsumed;
    mapping(address _debtor => ArrayLib.Bytes32ArrayMap) private _debtorHash;
    mapping(address _creditor => ArrayLib.Bytes32ArrayMap)
        private _creditorHash;
    mapping(address _debtor => mapping(address _exchange => mapping(bytes32 _producerHash => uint256)))
        public debtorAllowance;
    mapping(address _creditor => mapping(address _exchange => mapping(bytes32 _consumerHash => uint256)))
        public creditorAllowance;
    mapping(address _exchange => bool) public allowedExchanges;

    function debtProduced(
        bytes32 _producerHash
    ) external view returns (DebtProducer memory) {
        return _debtProduced[_producerHash];
    }

    function debtConsumed(
        bytes32 _consumerHash
    ) external view returns (DebtConsumer memory) {
        return _debtConsumed[_consumerHash];
    }

    function debtorHash(
        address _debtor
    ) external view returns (bytes32[] memory) {
        return _debtorHash[_debtor].keys;
    }

    function creditorHash(
        address _creditor
    ) external view returns (bytes32[] memory) {
        return _creditorHash[_creditor].keys;
    }

    function createDebt(
        uint256 _amount,
        uint256 _instalPeriods,
        uint256 _instalPayment,
        uint256 _instalPenalty
    ) external {
        if (_amount == 0) {
            revert IllegalArgumentUint256(_amount);
        }

        // 用于索引债务信息的Hash
        bytes32 _producerHash = keccak256(
            abi.encodePacked(
                msg.sender,
                _amount,
                _instalPeriods,
                _instalPayment,
                _instalPenalty
            )
        );

        DebtProducer memory _debtProducer = _debtProduced[_producerHash];

        // 创建的债务信息与之前创建的债务相同时，合并份额
        // 否则新建债务
        if (_debtProducer.amount == 0) {
            _addProducerDebt(
                DebtProducer({
                    debtor: msg.sender,
                    amount: _amount,
                    unconfirmedAmount: _amount,
                    instalPeriods: _instalPeriods,
                    instalPayment: _instalPayment,
                    instalPenalty: _instalPenalty
                }),
                _producerHash,
                msg.sender
            );
        } else {
            _mergeProducerDebt(_producerHash, _amount);
        }

        emit Produce(
            msg.sender,
            _producerHash,
            _amount,
            _instalPeriods,
            _instalPayment,
            _instalPenalty
        );
    }

    function revokeDebt(
        bytes32 _producerHash,
        uint256 _amount
    ) external onlyDebtorHash(_producerHash) {
        DebtProducer memory _debtProducer = _debtProduced[_producerHash];

        if (_amount == 0) {
            revert IllegalArgumentUint256(_amount);
        }

        if (_debtProducer.unconfirmedAmount < _amount) {
            revert InsufficientShares(_debtProducer.unconfirmedAmount, _amount);
        }

        // 债务没有确权份额，且撤销份额等于债务总份额时，删除债务信息
        // 否则扣除未确权份额
        if (_debtProducer.amount == _amount) {
            _deleteProducerDebt(_producerHash);
        } else {
            _splitProducerDebt(_producerHash, _amount);
        }

        emit Revoke(_producerHash, _amount);
    }

    function debtorApprove(
        address _exchange,
        bytes32 _producerHash,
        uint256 _amount
    ) external onlyExchange(_exchange) onlyDebtorHash(_producerHash) {
        debtorAllowance[msg.sender][_exchange][_producerHash] = _amount;

        emit Approve(msg.sender, _exchange, _producerHash, _amount);
    }

    function creditorApprove(
        address _exchange,
        bytes32 _consumerHash,
        uint256 _amount
    ) external onlyExchange(_exchange) onlyCreditorHash(_consumerHash) {
        creditorAllowance[msg.sender][_exchange][_consumerHash] = _amount;

        emit Approve(msg.sender, _exchange, _consumerHash, _amount);
    }

    function setUnconfirmedAmount(
        bytes32 _producerHash,
        uint256 _unconfirmedAmount
    ) public onlyExchange(msg.sender) {
        _debtProduced[_producerHash].unconfirmedAmount = _unconfirmedAmount;
    }

    function confirmCreditor(
        address _creditor,
        bytes32 _producerHash,
        uint256 _amount
    ) external {
        DebtProducer memory _debtProducer = _debtProduced[_producerHash];

        if (_debtProducer.debtor == _creditor) {
            revert IllegalArgumentAddress(_creditor);
        }

        if (_amount == 0) {
            revert IllegalArgumentUint256(_amount);
        }

        if (_debtProducer.unconfirmedAmount < _amount) {
            revert InsufficientShares(_debtProducer.unconfirmedAmount, _amount);
        }

        uint256 _allowance = debtorAllowance[_debtProducer.debtor][msg.sender][
            _producerHash
        ];

        if (_allowance < _amount) {
            revert InsufficientAllowedShares(_allowance, _amount);
        }

        // 扣除未确权份额
        setUnconfirmedAmount(
            _producerHash,
            _debtProducer.unconfirmedAmount - _amount
        );

        // 扣除交易所的债权确认额度
        _deductDebtorAllowance(
            _debtProducer.debtor,
            msg.sender,
            _producerHash,
            _amount
        );

        uint256 _confirmTime = block.timestamp;
        uint256 _currentPeriod = 1;
        uint256 _breachTimes = 0;
        uint256 _lastUnpaid = 0;

        // 用于索引偿还信息的索引
        bytes32 _consumerHash = keccak256(
            abi.encodePacked(
                _producerHash,
                _confirmTime,
                _currentPeriod,
                _breachTimes,
                _creditor
            )
        );

        // 若存在相同偿还信息的债务，合并份额
        // 否则，新增偿还信息
        DebtConsumer memory _debtConsumer = _debtConsumed[_consumerHash];

        if (_debtConsumer.amount == 0) {
            _addConsumerDebt(
                DebtConsumer({
                    creditor: _creditor,
                    amount: _amount,
                    producerHash: _producerHash,
                    confirmTime: block.timestamp,
                    currentPeriod: _currentPeriod,
                    breachTimes: _breachTimes,
                    lastUnpaid: _lastUnpaid
                }),
                _consumerHash,
                _creditor
            );
        } else {
            _mergeConsumerDebt(_consumerHash, _amount, 0);
        }

        emit Consume(_debtProducer.debtor, _creditor, _consumerHash, _amount);
    }

    function transferCreditor(
        address _creditor,
        bytes32 _consumerHash,
        uint256 _amount
    ) external {
        DebtConsumer memory _debtConsumer = _debtConsumed[_consumerHash];

        if (_debtConsumer.creditor == _creditor) {
            revert IllegalArgumentAddress(_creditor);
        }

        if (_amount == 0) {
            revert IllegalArgumentUint256(_amount);
        }

        if (_debtConsumer.amount < _amount) {
            revert InsufficientShares(_debtConsumer.amount, _amount);
        }

        uint256 _allowance = creditorAllowance[_debtConsumer.creditor][
            msg.sender
        ][_consumerHash];

        if (_allowance < _amount) {
            revert InsufficientAllowedShares(_allowance, _amount);
        }

        // 若债权全部转移，移除原债权人持有的份额
        // 否则，原债权人持有份额减少
        if (_debtConsumer.amount == _amount) {
            _deleteConsumerDebt(_consumerHash);
        } else {
            _splitConsumerDebt(
                _consumerHash,
                _amount,
                _debtConsumer.lastUnpaid *
                    ((_debtConsumer.amount - _amount) / _debtConsumer.amount)
            );
        }

        // 扣除交易所的债权转移额度
        _deductCreditorAllowance(
            _debtConsumer.creditor,
            msg.sender,
            _consumerHash,
            _amount
        );

        // 生成偿还信息的Hash
        bytes32 _newConsumerHash = keccak256(
            abi.encodePacked(
                _debtConsumer.producerHash,
                _debtConsumer.confirmTime,
                _debtConsumer.currentPeriod,
                _debtConsumer.breachTimes,
                _creditor
            )
        );

        // 若存在相同偿还信息的债务，合并份额
        // 否则，新增偿还信息
        DebtConsumer memory _debtConsumerNew = _debtConsumed[_newConsumerHash];

        if (_debtConsumerNew.amount == 0) {
            _addConsumerDebt(
                DebtConsumer({
                    creditor: _creditor,
                    amount: _amount,
                    producerHash: _debtConsumer.producerHash,
                    confirmTime: _debtConsumer.confirmTime,
                    currentPeriod: _debtConsumer.currentPeriod,
                    breachTimes: _debtConsumer.breachTimes,
                    lastUnpaid: _debtConsumer.lastUnpaid
                }),
                _newConsumerHash,
                _creditor
            );
        } else {
            _mergeConsumerDebt(
                _newConsumerHash,
                _amount,
                _debtConsumer.lastUnpaid * (_amount / _debtConsumer.amount)
            );
        }

        emit Consume(
            _debtConsumer.creditor,
            _creditor,
            _newConsumerHash,
            _amount
        );
    }

    function authorizeExchange(address _exchange) external onlyOwner {
        allowedExchanges[_exchange] = true;
        emit Authorize(_exchange);
    }

    function unauthorizeExchange(address _exchange) external onlyOwner {
        bool isExist = allowedExchanges[_exchange];

        if (!isExist) {
            revert IllegalArgumentAddress(_exchange);
        }

        delete allowedExchanges[_exchange];
        emit Unauthorize(_exchange);
    }

    // 从未确权债务中扣除份额
    function _splitProducerDebt(
        bytes32 _producerHash,
        uint256 _amount
    ) private {
        DebtProducer storage s_debtProducer = _debtProduced[_producerHash];
        s_debtProducer.amount = s_debtProducer.amount - _amount;
        s_debtProducer.unconfirmedAmount =
            s_debtProducer.unconfirmedAmount -
            _amount;
    }

    // 未确权债务份额合并
    function _mergeProducerDebt(
        bytes32 _producerHash,
        uint256 _amount
    ) private {
        DebtProducer storage s_debtProducer = _debtProduced[_producerHash];
        s_debtProducer.amount = s_debtProducer.amount + _amount;
        s_debtProducer.unconfirmedAmount =
            s_debtProducer.unconfirmedAmount +
            _amount;
    }

    // 创建债务
    function _addProducerDebt(
        DebtProducer memory _debt,
        bytes32 _producerHash,
        address _debtor
    ) private {
        _debtProduced[_producerHash] = _debt;
        _debtorHash[_debtor].push(_producerHash);
    }

    // 移除债务
    function _deleteProducerDebt(bytes32 _producerHash) private {
        DebtProducer memory _debtProducer = _debtProduced[_producerHash];
        address _debtor = _debtProducer.debtor;

        delete _debtProduced[_producerHash];
        _debtorHash[_debtor].remove(_producerHash);
    }

    // 从持有债务中扣除份额
    function _splitConsumerDebt(
        bytes32 _consumerHash,
        uint256 _amount,
        uint256 _lastUnpaid
    ) private {
        DebtConsumer storage s_debtConsumer = _debtConsumed[_consumerHash];
        s_debtConsumer.amount = s_debtConsumer.amount - _amount;
        s_debtConsumer.lastUnpaid = s_debtConsumer.lastUnpaid - _lastUnpaid;
    }

    // 与已持有份额进行合并
    function _mergeConsumerDebt(
        bytes32 _consumerHash,
        uint256 _amount,
        uint256 _lastUnpaid
    ) private {
        DebtConsumer storage s_debtConsumer = _debtConsumed[_consumerHash];
        s_debtConsumer.amount = s_debtConsumer.amount + _amount;
        s_debtConsumer.lastUnpaid = s_debtConsumer.lastUnpaid + _lastUnpaid;
    }

    // 新增债权人持有债务
    function _addConsumerDebt(
        DebtConsumer memory _debt,
        bytes32 _consumerHash,
        address _creditor
    ) private {
        _debtConsumed[_consumerHash] = _debt;
        _creditorHash[_creditor].push(_consumerHash);
    }

    // 移除原债权人持有的债务
    function _deleteConsumerDebt(bytes32 _consumerHash) private {
        DebtConsumer memory _debtConsumer = _debtConsumed[_consumerHash];
        address _creditor = _debtConsumer.creditor;

        delete _debtConsumed[_consumerHash];
        _creditorHash[_creditor].remove(_consumerHash);
    }

    // 扣除交易所债权确认额度
    function _deductDebtorAllowance(
        address debtor,
        address exchange,
        bytes32 hash,
        uint256 amount
    ) private {
        debtorAllowance[debtor][exchange][hash] =
            debtorAllowance[debtor][exchange][hash] -
            amount;
    }

    // 扣除交易所债权转移额度
    function _deductCreditorAllowance(
        address creditor,
        address exchange,
        bytes32 hash,
        uint256 amount
    ) private {
        creditorAllowance[creditor][exchange][hash] =
            creditorAllowance[creditor][exchange][hash] -
            amount;
    }

    // 系统在还款时间从债务人账户转账代币给债权人
    function _repay(bytes32 _consumerHash) private {
        DebtConsumer memory _debtConsumer = _debtConsumed[_consumerHash];
        DebtConsumer storage s_debtConsumer = _debtConsumed[_consumerHash];
        DebtProducer memory _debtProducer = _debtProduced[
            _debtConsumer.producerHash
        ];
        address _debtor = _debtProducer.debtor;
        address _creditor = _debtConsumer.creditor;

        // 债务人账户余额
        uint256 _balanceOfDebtor = _SFT.balanceOf(_debtor);

        // 债务人应偿还的代币数量，由三部分组成
        // 1、每期应还部分：持有份额 * 每期每份应还代币数量
        // 2、上期未还清部分
        // 3、违约金：持有份额 * 每期每份违约金 * 违约次数
        uint256 _totalPenalty = _debtConsumer.amount *
            _debtProducer.instalPenalty *
            _debtConsumer.breachTimes;
        uint256 _shouldRepay = _debtConsumer.amount *
            _debtProducer.instalPayment +
            _debtConsumer.lastUnpaid +
            _totalPenalty;

        if (_balanceOfDebtor < _shouldRepay) {
            // 债务人账户余额不足，全部偿还
            _SFT.transferFrom(_debtor, _creditor, _balanceOfDebtor);

            s_debtConsumer.currentPeriod = _debtConsumer.currentPeriod + 1;
            s_debtConsumer.breachTimes = _debtConsumer.breachTimes + 1;
            s_debtConsumer.lastUnpaid =
                _shouldRepay -
                _balanceOfDebtor -
                _totalPenalty;
        } else {
            // 债务人账户余额充足，偿还应偿还的代币数量
            _SFT.transferFrom(_debtor, _creditor, _shouldRepay);

            if (_debtConsumer.currentPeriod == _debtProducer.instalPeriods) {
                // 债务已全部偿还，进行结算
                _settleDebt(_consumerHash);
            } else {
                s_debtConsumer.currentPeriod = _debtConsumer.currentPeriod + 1;
                s_debtConsumer.lastUnpaid = 0;
            }
        }
    }

    // 债务已全部偿还，进行结算
    function _settleDebt(bytes32 _consumerHash) private {
        DebtConsumer memory _debtConsumer = _debtConsumed[_consumerHash];
        bytes32 _producerHash = _debtConsumer.producerHash;
        DebtProducer memory _debtProducer = _debtProduced[_producerHash];

        _deleteConsumerDebt(_consumerHash);
        _debtProduced[_producerHash].amount =
            _debtProducer.amount -
            _debtConsumer.amount;
    }
}
