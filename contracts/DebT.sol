// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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

    string public constant name = "Debt Token";
    string public constant symbol = "DebT";
    address private immutable _owner;

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

    constructor() {
        _owner = msg.sender;
    }

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
            revert IllegalArgumentValue(_amount);
        }

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
            revert IllegalArgumentValue(_amount);
        }

        if (_debtProducer.unconfirmedAmount < _amount) {
            revert InsufficientShares(_debtProducer.unconfirmedAmount, _amount);
        }

        // 若销毁全部，删除债务信息
        // 否则减少总量和未确认债权数量
        if (_debtProducer.amount == _amount) {
            _deleteProducerDebt(_producerHash, msg.sender);
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

    function settleDebt() external onlyExchange(msg.sender) {}

    function transferToken() external onlyExchange(msg.sender) {}

    function confirmCreditor(
        address _creditor,
        bytes32 _producerHash,
        uint256 _amount
    ) external onlyExchange(msg.sender) {
        DebtProducer memory _debtProducer = _debtProduced[_producerHash];

        if (_amount == 0) {
            revert IllegalArgumentValue(_amount);
        }

        if (_debtProducer.unconfirmedAmount < _amount) {
            revert InsufficientShares(_debtProducer.unconfirmedAmount, _amount);
        }

        uint256 _allowance = debtorAllowance[_debtProducer.debtor][msg.sender][
            _producerHash
        ];

        if (_allowance < _amount) {
            revert InsufficientAuthorizedShares(_allowance, _amount);
        }

        // 债权未确认的数量减少
        _setUnconfirmedAmount(
            _producerHash,
            _debtProducer.unconfirmedAmount - _amount
        );

        uint256 _beginTime = block.timestamp;
        uint256 _currentPeriod = 1; // 当前期数
        uint256 _breachTimes = 0; // 违约次数
        uint256 _lastUnpaid = 0; // 上期未还清的数量，不包括违约金部分

        // 生成新的hash，用于对还款信息和债权人的索引，相同hash的债务可以进行合并
        bytes32 _consumerHash = keccak256(
            abi.encodePacked(
                _producerHash,
                _beginTime,
                _currentPeriod,
                _breachTimes,
                _creditor
            )
        );

        // 若存在相同hash的债务，合并
        // 若不存在相同hash的债务，创建并添加到债权人的债务列表
        DebtConsumer memory _debtConsumer = _debtConsumed[_consumerHash];

        if (_debtConsumer.holdAmount == 0) {
            _addConsumerDebt(
                DebtConsumer({
                    creditor: _creditor,
                    holdAmount: _amount,
                    producerHash: _producerHash,
                    beginTime: block.timestamp,
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
    ) external onlyExchange(msg.sender) {
        DebtConsumer memory _debtConsumer = _debtConsumed[_consumerHash];

        if (_amount == 0) {
            revert IllegalArgumentValue(_amount);
        }

        if (_debtConsumer.holdAmount < _amount) {
            revert InsufficientShares(_debtConsumer.holdAmount, _amount);
        }

        uint256 _allowance = creditorAllowance[_debtConsumer.creditor][
            msg.sender
        ][_consumerHash];

        if (_allowance < _amount) {
            revert InsufficientAuthorizedShares(_allowance, _amount);
        }

        // 原债权人持有数量减少
        // 若债务全部转移，删除原债权人持有的债务信息
        if (_debtConsumer.holdAmount == _amount) {
            _deleteConsumerDebt(_consumerHash, _debtConsumer.creditor);
        } else {
            _splitConsumerDebt(
                _consumerHash,
                _amount,
                _debtConsumer.lastUnpaid *
                    ((_debtConsumer.holdAmount - _amount) /
                        _debtConsumer.holdAmount)
            );
        }

        // 生成新的hash，用于对还款信息和债权人的索引，相同hash的债务可以进行合并
        bytes32 _newConsumerHash = keccak256(
            abi.encodePacked(
                _debtConsumer.producerHash,
                _debtConsumer.beginTime,
                _debtConsumer.currentPeriod,
                _debtConsumer.breachTimes,
                _creditor
            )
        );

        // 若存在相同hash的债务，合并债务持有量和未还清的数量
        // 若不存在相同hash的债务，创建并添加到债权人的债务列表
        DebtConsumer memory _debtConsumerNew = _debtConsumed[_newConsumerHash];

        if (_debtConsumerNew.holdAmount == 0) {
            _addConsumerDebt(
                DebtConsumer({
                    creditor: _creditor,
                    holdAmount: _amount,
                    producerHash: _debtConsumer.producerHash,
                    beginTime: _debtConsumer.beginTime,
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
                _debtConsumer.lastUnpaid * (_amount / _debtConsumer.holdAmount)
            );
        }

        emit Consume(
            _debtConsumed[_consumerHash].creditor,
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
        delete allowedExchanges[_exchange];
        emit Unauthorize(_exchange);
    }

    // 从债务人创造的债务中分离出一部分份额
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

    // 与债务人创造的债务进行合并
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

    // 债务人创造债务
    function _addProducerDebt(
        DebtProducer memory _debt,
        bytes32 _producerHash,
        address _debtor
    ) private {
        _debtProduced[_producerHash] = _debt;
        _debtorHash[_debtor].push(_producerHash);
    }

    // 债务人删除债务
    function _deleteProducerDebt(
        bytes32 _producerHash,
        address _debtor
    ) private {
        delete _debtProduced[_producerHash];
        _debtorHash[_debtor].remove(_producerHash);
    }

    // 债务人设置未确认的份额
    function _setUnconfirmedAmount(
        bytes32 _producerHash,
        uint256 _unconfirmedAmount
    ) private {
        _debtProduced[_producerHash].unconfirmedAmount = _unconfirmedAmount;
    }

    // 从债权人持有债务中分离出一些份额
    function _splitConsumerDebt(
        bytes32 _consumerHash,
        uint256 _amount,
        uint256 _lastUnpaid
    ) private {
        DebtConsumer storage s_debtConsumer = _debtConsumed[_consumerHash];
        s_debtConsumer.holdAmount = s_debtConsumer.holdAmount - _amount;
        s_debtConsumer.lastUnpaid = s_debtConsumer.lastUnpaid - _lastUnpaid;
    }

    // 与债权人已有债务进行合并
    function _mergeConsumerDebt(
        bytes32 _consumerHash,
        uint256 _amount,
        uint256 _lastUnpaid
    ) private {
        DebtConsumer storage s_debtConsumer = _debtConsumed[_consumerHash];
        s_debtConsumer.holdAmount = s_debtConsumer.holdAmount + _amount;
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

    // 删除债权人持有债务
    function _deleteConsumerDebt(
        bytes32 _consumerHash,
        address _creditor
    ) private {
        delete _debtConsumed[_consumerHash];
        _creditorHash[_creditor].remove(_consumerHash);
    }
}
