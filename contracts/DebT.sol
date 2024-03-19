// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IDebT} from "./interfaces/IDebT.sol";

contract DebT is IDebT {
    modifier onlyOwner() {
        if (_owner != msg.sender) {
            revert();
        }
        _;
    }

    modifier onlyDebtorHash(bytes32 _producerHash) {
        if (_debtProduced[_producerHash].debtor != msg.sender) {
            revert();
        }
        _;
    }

    modifier onlyCreditorHash(bytes32 _consumerHash) {
        if (_debtConsumed[_consumerHash].creditor != msg.sender) {
            revert();
        }
        _;
    }

    modifier onlyExchange(address _exchange) {
        if (allowedExchanges[_exchange] == false) {
            revert();
        }
        _;
    }

    string public constant name = "Debt Token";
    string public constant symbol = "DebT";
    address private immutable _owner;

    // 债务人创建的债务信息
    mapping(bytes32 _producerHash => DebtProducer) private _debtProduced;
    // 债权人持有债务的还款信息
    mapping(bytes32 _consumerHash => DebtConsumer) private _debtConsumed;
    // 债务人创建的所有债务
    mapping(address _debtor => mapping(bytes32 _producerHash => bool))
        public debtorHash;
    // 债权人持有的所有债务
    mapping(address _creditor => mapping(bytes32 _consumerHash => bool))
        public creditorHash;
    // 债务人授权交易所，对于某笔债务，可用于确认债权的债务额度
    mapping(address _debtor => mapping(address _exchange => mapping(bytes32 _producerHash => uint256)))
        public debtorAllowance;
    // 债权人授权交易所，对于某笔债务，可用于转移债权的债务额度
    mapping(address _creditor => mapping(address _exchange => mapping(bytes32 _consumerHash => uint256)))
        public creditorAllowance;
    // 合约授权的交易所
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

    // 债务人创造债务
    function createDebt(
        uint256 _amount,
        uint256 _instalPeriods,
        uint256 _instalPayment,
        uint256 _instalPenalty
    ) external {
        if (_amount == 0) {
            revert();
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
    }

    // 债务人撤销未确认债权的债务
    function revokeDebt(
        bytes32 _producerHash,
        uint256 _amount
    ) external onlyDebtorHash(_producerHash) {
        DebtProducer memory _debtProducer = _debtProduced[_producerHash];

        if (_debtProducer.unconfirmedAmount == 0) {
            revert();
        }

        if (_amount == 0) {
            revert();
        }

        if (_debtProducer.unconfirmedAmount < _amount) {
            revert();
        }

        // 若销毁全部，删除债务信息
        // 否则减少总量和未确认债权数量
        if (_debtProducer.amount == _amount) {
            _deleteProducerDebt(_producerHash, msg.sender);
        } else {
            _splitProducerDebt(_producerHash, _amount);
        }
    }

    // 债务人授权第三方交易所对于某笔债务的额度
    function debtorApprove(
        address _exchange,
        bytes32 _producerHash,
        uint256 _amount
    ) external onlyExchange(_exchange) onlyDebtorHash(_producerHash) {
        debtorAllowance[msg.sender][_exchange][_producerHash] = _amount;
    }

    // 债权人授权第三方交易所对于某笔债务的额度
    function creditorApprove(
        address _exchange,
        bytes32 _consumerHash,
        uint256 _amount
    ) external onlyExchange(_exchange) onlyCreditorHash(_consumerHash) {
        creditorAllowance[msg.sender][_exchange][_consumerHash] = _amount;
    }

    // 系统清算已结清的债务，由交易所调用
    function settleDebt() external onlyExchange(msg.sender) {}

    // 系统在还款日转账给债权人，由交易所调用
    function transferToken() external onlyExchange(msg.sender) {}

    // 从债务人账户购入债务，即债权的确认，由交易所调用
    function confirmCreditor(
        address _creditor,
        bytes32 _producerHash,
        uint256 _amount
    ) external onlyExchange(msg.sender) {
        DebtProducer memory _debtProducer = _debtProduced[_producerHash];

        if (_debtProducer.unconfirmedAmount == 0) {
            revert();
        }

        if (_amount == 0) {
            revert();
        }

        if (_debtProducer.unconfirmedAmount < _amount) {
            revert();
        }

        uint256 _allowance = debtorAllowance[_debtProducer.debtor][msg.sender][
            _producerHash
        ];

        if (_allowance < _amount) {
            revert();
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
    }

    // 从债权人账户购入债务，即债权的转移，由交易所调用
    function transferCreditor(
        address _creditor,
        bytes32 _consumerHash,
        uint256 _amount
    ) external onlyExchange(msg.sender) {
        DebtConsumer memory _debtConsumer = _debtConsumed[_consumerHash];

        if (_debtConsumer.holdAmount == 0) {
            revert();
        }

        if (_amount == 0) {
            revert();
        }

        if (_debtConsumer.holdAmount < _amount) {
            revert();
        }

        uint256 _allowance = creditorAllowance[_debtConsumer.creditor][
            msg.sender
        ][_consumerHash];

        if (_allowance < _amount) {
            revert();
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
    }

    // 增加授权的交易所
    function addExchange(address _exchange) external onlyOwner {
        allowedExchanges[_exchange] = true;
    }

    // 移除授权的交易所
    function removeExchange(address _exchange) external onlyOwner {
        delete allowedExchanges[_exchange];
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
        debtorHash[_debtor][_producerHash] = true;
    }

    // 债务人删除债务
    function _deleteProducerDebt(
        bytes32 _producerHash,
        address _debtor
    ) private {
        delete _debtProduced[_producerHash];
        delete debtorHash[_debtor][_producerHash];
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
        creditorHash[_creditor][_consumerHash] = true;
    }

    // 删除债权人持有债务
    function _deleteConsumerDebt(
        bytes32 _consumerHash,
        address _creditor
    ) private {
        delete _debtConsumed[_consumerHash];
        delete creditorHash[_creditor][_consumerHash];
    }
}
