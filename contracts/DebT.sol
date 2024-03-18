//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DebT {
    struct DebtProducer {
        address debtor; // 债务人账户
        uint256 amount; // 债务总量：由债务人创造，通过两种方式消费：1、债务人撤销未确认债权人的债务；2、自动清算已结清的债务
        uint256 unconfirmedAmount; // 未确认债权的数量
        uint256 instalPeriods; // 分期期数，每期固定为1分钟
        uint256 instalPayment; // 每期应还款数量
        uint256 instalPenalty; // 每期增加违约金
    }

    struct DebtConsumer {
        uint256 holdAmount; // 债权人持有数量
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
    mapping(bytes32 _debtHash => DebtProducer) public debtProduced;
    // 债权人持有债务的偿还信息
    mapping(bytes32 _debtHash => mapping(address _creditor => DebtConsumer))
        public debtConsumed;
    // 债务人创建的所有债务
    mapping(address _debtor => bytes32[]) public debtBurdened;
    // 债权人持有的所有债务
    mapping(address _creditor => bytes32[]) public debtHolded;
    // 债务人授权交易所，对于某笔债务，可用于确认债权的债务额度
    mapping(address _debtor => mapping(address _exchange => mapping(bytes32 _debtHash => uint256)))
        public debtorAllowance;
    // 债权人授权交易所，对于某笔债务，可用于转移债权的债务额度
    mapping(address _creditor => mapping(address _exchange => mapping(bytes32 _debtHash => uint256)))
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
        bytes32 _debtHash = keccak256(
            abi.encodePacked(
                msg.sender,
                _amount,
                _instalPeriods,
                _instalPayment,
                _instalPenalty
            )
        );

        uint256 _debtAmount = debtProduced[_debtHash].amount;

        if (_debtAmount == 0) {
            debtProduced[_debtHash] = DebtProducer({
                debtor: msg.sender,
                amount: _amount,
                unconfirmedAmount: _amount,
                instalPeriods: _instalPeriods,
                instalPayment: _instalPayment,
                instalPenalty: _instalPenalty
            });
            debtBurdened[msg.sender].push(_debtHash);
        } else {
            debtProduced[_debtHash].amount = _debtAmount + _amount;
        }
    }

    // 债务人撤销未确认债权的债务
    function revokeDebt(bytes32 _debtHash, uint256 _amount) external {
        DebtProducer memory _debt = debtProduced[_debtHash];

        if (_debt.unconfirmedAmount == 0) {
            revert();
        }

        if (_amount == 0) {
            revert();
        }

        if (_debt.unconfirmedAmount < _amount) {
            revert();
        }

        debtProduced[_debtHash].unconfirmedAmount =
            _debt.unconfirmedAmount -
            _amount;
        debtProduced[_debtHash].amount = _debt.amount - _amount;
    }

    // 债务人授权第三方交易所对于某笔债务的额度
    function debtorApprove(
        address _exchange,
        bytes32 _debtHash,
        uint256 _amount
    ) external onlyExchange(_exchange) {
        debtorAllowance[msg.sender][_exchange][_debtHash] = _amount;
    }

    // 债权人授权第三方交易所对于某笔债务的额度
    function creditorApprove(
        address _exchange,
        bytes32 _debtHash,
        uint256 _amount
    ) external onlyExchange(_exchange) {
        creditorAllowance[msg.sender][_exchange][_debtHash] = _amount;
    }

    // 系统清算已结清的债务，由交易所调用
    function settleDebt() external {}

    // 系统在还款日转账给债权人，由交易所调用
    function transferToken() external {}

    // 从债务人账户购入债务，即债权的确认
    function confirmCreditor(
        address _to,
        bytes32 _debtHash,
        uint256 _amount
    ) external {
        DebtProducer memory _debt = debtProduced[_debtHash];

        if (_debt.unconfirmedAmount == 0) {
            revert();
        }

        if (_amount == 0) {
            revert();
        }

        if (_debt.unconfirmedAmount < _amount) {
            revert();
        }

        debtProduced[_debtHash].unconfirmedAmount =
            _debt.unconfirmedAmount -
            _amount;
        // todo: consumerHash
        debtConsumed[_debtHash][_to] = DebtConsumer({
            holdAmount: _amount,
            beginTime: block.timestamp,
            currentPeriod: 1,
            breachTimes: 0,
            lastUnpaid: 0
        });
        debtHolded[_to].push(_debtHash);
    }

    // 从债权人账户购入债务，即债权的转移
    function transferCreditor(
        address _from,
        address _to,
        bytes32 _debtHash,
        uint256 _amount
    ) external {}

    // 增加授权的交易所
    function addExchange(address _exchange) external onlyOwner {
        allowedExchanges[_exchange] = true;
    }

    // 移除授权的交易所
    function removeExchange(address _exchange) external onlyOwner {
        delete allowedExchanges[_exchange];
    }
}
