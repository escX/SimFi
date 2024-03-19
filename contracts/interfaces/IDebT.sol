// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDebT {
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

    function debtProduced(
        bytes32 hash
    ) external view returns (DebtProducer memory);

    function debtConsumed(
        bytes32 hash
    ) external view returns (DebtConsumer memory);

    function debtorHash(
        address debtor,
        bytes32 hash
    ) external view returns (bool);

    function creditorHash(
        address creditor,
        bytes32 hash
    ) external view returns (bool);

    function debtorAllowance(
        address debtor,
        address exchange,
        bytes32 hash
    ) external view returns (uint256);

    function creditorAllowance(
        address creditor,
        address exchange,
        bytes32 hash
    ) external view returns (uint256);

    function allowedExchanges(address exchange) external view returns (bool);

    function createDebt(
        uint256 amount,
        uint256 instalPeriods,
        uint256 instalPayment,
        uint256 instalPenalty
    ) external;

    function revokeDebt(bytes32 hash, uint256 amount) external;

    function debtorApprove(
        address exchange,
        bytes32 hash,
        uint256 amount
    ) external;

    function creditorApprove(
        address exchange,
        bytes32 hash,
        uint256 amount
    ) external;

    function settleDebt() external;

    function transferToken() external;

    function confirmCreditor(
        address creditor,
        bytes32 hash,
        uint256 amount
    ) external;

    function transferCreditor(
        address creditor,
        bytes32 hash,
        uint256 amount
    ) external;

    function addExchange(address exchange) external;

    function removeExchange(address exchange) external;
}
