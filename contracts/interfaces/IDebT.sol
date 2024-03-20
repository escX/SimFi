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

    // 创造债务
    event Produce(
        address indexed debtor,
        bytes32 indexed hash,
        uint256 amount,
        uint256 instalPeriods,
        uint256 instalPayment,
        uint256 instalPenalty
    );

    // 消费债务
    event Consume(
        address indexed from,
        address indexed to,
        bytes32 indexed hash,
        uint256 amount
    );

    // 撤销未确认债权人的债务
    event Revoke(bytes32 indexed hash, uint256 amount);

    // 结算已偿清债务
    event Settle(bytes32 indexed hash, uint);

    // 授权债务转移额度
    event Approve(
        address indexed authorizer,
        address indexed exchange,
        bytes32 indexed hash,
        uint256 amount
    );

    // 新增交易所授权
    event Authorize(address exchange);

    // 移除交易所授权
    event Unauthorize(address exchange);

    // 债务人创建的债务信息
    function debtProduced(
        bytes32 hash
    ) external view returns (DebtProducer memory);

    // 债权人持有债务的还款信息
    function debtConsumed(
        bytes32 hash
    ) external view returns (DebtConsumer memory);

    // 债务人创建的所有债务
    function debtorHash(
        address debtor
    ) external view returns (bytes32[] memory);

    // 债权人持有的所有债务
    function creditorHash(
        address creditor
    ) external view returns (bytes32[] memory);

    // 债务人授权交易所，对于某笔债务，可用于确认债权的债务额度
    function debtorAllowance(
        address debtor,
        address exchange,
        bytes32 hash
    ) external view returns (uint256);

    // 债权人授权交易所，对于某笔债务，可用于转移债权的债务额度
    function creditorAllowance(
        address creditor,
        address exchange,
        bytes32 hash
    ) external view returns (uint256);

    // 合约授权的交易所
    function allowedExchanges(address exchange) external view returns (bool);

    // 债务人创造债务
    function createDebt(
        uint256 amount,
        uint256 instalPeriods,
        uint256 instalPayment,
        uint256 instalPenalty
    ) external;

    // 债务人撤销未确认债权的债务
    function revokeDebt(bytes32 hash, uint256 amount) external;

    // 债务人授权第三方交易所对于某笔债务的额度
    function debtorApprove(
        address exchange,
        bytes32 hash,
        uint256 amount
    ) external;

    // 债权人授权第三方交易所对于某笔债务的额度
    function creditorApprove(
        address exchange,
        bytes32 hash,
        uint256 amount
    ) external;

    // 系统清算已结清的债务，由交易所调用
    function settleDebt() external;

    // 系统在还款日转账给债权人，由交易所调用
    function transferToken() external;

    // 从债务人账户购入债务，即债权的确认，由交易所调用
    function confirmCreditor(
        address creditor,
        bytes32 hash,
        uint256 amount
    ) external;

    // 从债权人账户购入债务，即债权的转移，由交易所调用
    function transferCreditor(
        address creditor,
        bytes32 hash,
        uint256 amount
    ) external;

    // 增加授权的交易所
    function addExchange(address exchange) external;

    // 移除授权的交易所
    function removeExchange(address exchange) external;
}
