//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DebT {
    struct DebtConsumer {
        uint256 holdAmount; // 债权人持有数量
        uint256 beginTime; // 该笔债务首次确认债权人的时间，基于这个时间，确认每期截止时间
        uint256 currentPeriod; // 当前期数，未确认债权人时为0，首次确认债权人后为1，每期正常还款后增加1
        uint256 breachTimes; // 违约次数，默认为0，每有一期未正常还款，增加1
        uint256 lastUnpaid; // 上期未还清的数量，不包括违约金部分
    }

    struct DebtProducer {
        uint256 amount; // 铸造总量：由债务人生成，通过两种方式消费：1、债务人销毁未确认债权人的债务；2、自动销毁已结清的债务
        uint256 unconfirmedAmount; // 未确认债权人的数量
        address debtor; // 债务人
        uint256 instalPeriods; // 分期期数
        uint256 instalPayment; // 每期应还款数量
        uint256 instalPenalty; // 每期增加违约金
    }

    string public constant name = "Debt Token";
    string public constant symbol = "DebT";

    mapping(bytes32 hash => DebtProducer) private _debtProduced;
    mapping(bytes32 hash => mapping(address creditor => DebtConsumer))
        private _debtConsumed;
    mapping(address creditor => bytes32[]) private _debtHolded;
    mapping(address debtor => bytes32[]) private _debtBurdened;

    /**
     * 根据债务hash，获取债务人创建的债务信息
     */
    function debtInfo(
        bytes32 _hash
    )
        external
        view
        returns (
            uint256 _amount,
            uint256 _unconfirmedAmount,
            address _debtor,
            uint256 _instalPeriods,
            uint256 _instalPayment,
            uint256 _instalPenalty
        )
    {
        DebtProducer memory debt = _debtProduced[_hash];

        _amount = debt.amount;
        _unconfirmedAmount = debt.unconfirmedAmount;
        _debtor = debt.debtor;
        _instalPeriods = debt.instalPeriods;
        _instalPayment = debt.instalPayment;
        _instalPenalty = debt.instalPenalty;
    }

    /**
     * 根据债务hash和债权人地址，获取债权人该笔债务的还款信息
     */
    function repaidInfo(
        bytes32 _hash,
        address _creditor
    )
        external
        view
        returns (
            uint256 _holdAmount,
            uint256 _beginTime,
            uint256 _currentPeriod,
            uint256 _breachTimes,
            uint256 _lastUnpaid
        )
    {
        DebtConsumer memory repayment = _debtConsumed[_hash][_creditor];

        _holdAmount = repayment.holdAmount;
        _beginTime = repayment.beginTime;
        _currentPeriod = repayment.currentPeriod;
        _breachTimes = repayment.breachTimes;
        _lastUnpaid = repayment.lastUnpaid;
    }

    /**
     * 债权人所持有的所有的债务hash
     */
    function creditorHolded(
        address _creditor
    ) external view returns (bytes32[] memory) {
        return _debtHolded[_creditor];
    }

    /**
     * 债务人所承担的所有的债务hash
     */
    function debtorBurdened(
        address _debtor
    ) external view returns (bytes32[] memory) {
        return _debtBurdened[_debtor];
    }
}
