//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DebT {
    struct DebtProducer {
        address debtor; // 债务人账户
        uint256 amount; // 债务数量：由债务人创造，通过两种方式消费：1、债务人撤销未确认债权人的债务；2、自动清算已结清的债务
        uint256 unconfirmedAmount; // 未确认债权的数量
        uint256 instalPeriods; // 分期期数，每期固定为1分钟
        uint256 instalPayment; // 每期每份债务应还款数量
        uint256 instalPenalty; // 每期每份债务增加违约金
    }

    struct DebtConsumer {
        address creditor; // 债权人账户
        uint256 holdAmount; // 债权人持有数量
        bytes32 producerHash; // 债务人创建的债务的hash
        uint256 beginTime; // 该笔债务首次确认债权人的时间，基于这个时间，确认每期截止时间
        uint256 currentPeriod; // 当前期数，未确认债权时为0，首次确认债权人后为1，每期正常还款后增加1
        uint256 breachTimes; // 违约次数，默认为0，每有一期未正常还款，增加1
        uint256 lastUnpaid; // 上期未还清的数量，不包括违约金部分
    }

    modifier onlyOwner() {
        if (_owner != msg.sender) {
            revert();
        }
        _;
    }

    modifier onlyDebtor(bytes32 _producerHash) {
        if (debtProduced[_producerHash].debtor != msg.sender) {
            revert();
        }
        _;
    }

    modifier onlyCreditor(bytes32 _consumerHash) {
        if (debtConsumed[_consumerHash].creditor != msg.sender) {
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
    mapping(bytes32 _producerHash => DebtProducer) public debtProduced;
    // 债权人持有债务的还款信息
    mapping(bytes32 _consumerHash => DebtConsumer) public debtConsumed;
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

        DebtProducer memory _debt = debtProduced[_producerHash];

        if (_debt.amount == 0) {
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
    ) external onlyDebtor(_producerHash) {
        DebtProducer memory _debt = debtProduced[_producerHash];

        if (_debt.unconfirmedAmount == 0) {
            revert();
        }

        if (_amount == 0) {
            revert();
        }

        if (_debt.unconfirmedAmount < _amount) {
            revert();
        }

        // 若销毁全部，删除债务信息
        // 否则减少总量和未确认债权数量
        if (_debt.amount == _amount) {
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
    ) external onlyExchange(_exchange) onlyDebtor(_producerHash) {
        debtorAllowance[msg.sender][_exchange][_producerHash] = _amount;
    }

    // 债权人授权第三方交易所对于某笔债务的额度
    function creditorApprove(
        address _exchange,
        bytes32 _consumerHash,
        uint256 _amount
    ) external onlyExchange(_exchange) onlyCreditor(_consumerHash) {
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
        DebtProducer memory _debt = debtProduced[_producerHash];

        if (_debt.unconfirmedAmount == 0) {
            revert();
        }

        if (_amount == 0) {
            revert();
        }

        if (_debt.unconfirmedAmount < _amount) {
            revert();
        }

        uint256 allowance = debtorAllowance[_debt.debtor][msg.sender][
            _producerHash
        ];

        if (allowance < _amount) {
            revert();
        }

        // 债权未确认的数量减少
        debtProduced[_producerHash].unconfirmedAmount =
            _debt.unconfirmedAmount -
            _amount;

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
        uint256 _holdAmount = debtConsumed[_consumerHash].holdAmount;

        if (_holdAmount == 0) {
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
            debtConsumed[_consumerHash].holdAmount = _holdAmount + _amount;
            _mergeConsumerDebt(_consumerHash, _amount, 0);
        }
    }

    // 从债权人账户购入债务，即债权的转移，由交易所调用
    function transferCreditor(
        address _creditor,
        bytes32 _consumerHash,
        uint256 _amount
    ) external onlyExchange(msg.sender) {
        DebtConsumer memory _debt = debtConsumed[_consumerHash];

        if (_debt.holdAmount == 0) {
            revert();
        }

        if (_amount == 0) {
            revert();
        }

        if (_debt.holdAmount < _amount) {
            revert();
        }

        uint256 allowance = creditorAllowance[_debt.creditor][msg.sender][
            _consumerHash
        ];

        if (allowance < _amount) {
            revert();
        }

        // 原债权人持有数量减少
        // 若债务全部转移，删除原债权人持有的债务信息
        if (_debt.holdAmount == _amount) {
            _deleteConsumerDebt(_consumerHash, _debt.creditor);
        } else {
            _splitConsumerDebt(
                _consumerHash,
                _amount,
                _debt.lastUnpaid *
                    ((_debt.holdAmount - _amount) / _debt.holdAmount)
            );
        }

        // 生成新的hash，用于对还款信息和债权人的索引，相同hash的债务可以进行合并
        bytes32 _newConsumerHash = keccak256(
            abi.encodePacked(
                _debt.producerHash,
                _debt.beginTime,
                _debt.currentPeriod,
                _debt.breachTimes,
                _creditor
            )
        );

        // 若存在相同hash的债务，合并债务持有量和未还清的数量
        // 若不存在相同hash的债务，创建并添加到债权人的债务列表
        if (debtConsumed[_newConsumerHash].holdAmount == 0) {
            _addConsumerDebt(
                DebtConsumer({
                    creditor: _creditor,
                    holdAmount: _amount,
                    producerHash: _debt.producerHash,
                    beginTime: _debt.beginTime,
                    currentPeriod: _debt.currentPeriod,
                    breachTimes: _debt.breachTimes,
                    lastUnpaid: _debt.breachTimes
                }),
                _newConsumerHash,
                _creditor
            );
        } else {
            _mergeConsumerDebt(
                _newConsumerHash,
                _amount,
                _debt.lastUnpaid * (_amount / _debt.holdAmount)
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

    function _splitProducerDebt(
        bytes32 _producerHash,
        uint256 _amount
    ) private {
        DebtProducer storage s_debt = debtProduced[_producerHash];
        s_debt.amount = s_debt.amount - _amount;
        s_debt.unconfirmedAmount = s_debt.unconfirmedAmount - _amount;
    }

    function _mergeProducerDebt(
        bytes32 _producerHash,
        uint256 _amount
    ) private {
        DebtProducer storage s_debt = debtProduced[_producerHash];
        s_debt.amount = s_debt.amount + _amount;
        s_debt.unconfirmedAmount = s_debt.unconfirmedAmount + _amount;
    }

    function _addProducerDebt(
        DebtProducer memory _debt,
        bytes32 _producerHash,
        address _debtor
    ) private {
        debtProduced[_producerHash] = _debt;
        debtorHash[_debtor][_producerHash] = true;
    }

    function _deleteProducerDebt(
        bytes32 _producerHash,
        address _debtor
    ) private {
        delete debtProduced[_producerHash];
        delete debtorHash[_debtor][_producerHash];
    }

    function _splitConsumerDebt(
        bytes32 _consumerHash,
        uint256 _amount,
        uint256 _lastUnpaid
    ) private {
        DebtConsumer storage s_debt = debtConsumed[_consumerHash];
        s_debt.holdAmount = s_debt.holdAmount - _amount;
        s_debt.lastUnpaid = s_debt.lastUnpaid - _lastUnpaid;
    }

    function _mergeConsumerDebt(
        bytes32 _consumerHash,
        uint256 _amount,
        uint256 _lastUnpaid
    ) private {
        DebtConsumer storage s_debt = debtConsumed[_consumerHash];
        s_debt.holdAmount = s_debt.holdAmount + _amount;
        s_debt.lastUnpaid = s_debt.lastUnpaid + _lastUnpaid;
    }

    function _addConsumerDebt(
        DebtConsumer memory _debt,
        bytes32 _consumerHash,
        address _creditor
    ) private {
        debtConsumed[_consumerHash] = _debt;
        creditorHash[_creditor][_consumerHash] = true;
    }

    function _deleteConsumerDebt(
        bytes32 _consumerHash,
        address _creditor
    ) private {
        delete debtConsumed[_consumerHash];
        delete creditorHash[_creditor][_consumerHash];
    }
}
