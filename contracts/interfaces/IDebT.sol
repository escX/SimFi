// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDebT {
    struct DebtProducer {
        address debtor; // 债务人账户
        uint256 amount; // 总债务份额：由债务人创建。减少份额通过两种方式：1、撤回未确权债务；2、结算确权债务
        uint256 unconfirmedAmount; // 未确权的份额
        uint256 instalPeriods; // 分期期数，每期固定为1分钟
        uint256 instalPayment; // 每期每份债务应偿还代币数量
        uint256 instalPenalty; // 每期每份债务的违约金
    }

    struct DebtConsumer {
        address creditor; // 债权人账户
        uint256 amount; // 债权人持有债务份额
        bytes32 producerHash; // 债务Hash
        uint256 confirmTime; // 确权时间，基于这个时间，确认每期截止时间
        uint256 currentPeriod; // 当前期数，未确权时为0，确权后为1，每期正常还款后增加1
        uint256 breachTimes; // 违约次数，默认为0，每有一期未正常还款，增加1
        uint256 lastUnpaid; // 上期未还清的代币数量，不包括违约金部分
    }

    // 创建债务
    event Produce(
        address indexed debtor,
        bytes32 indexed hash,
        uint256 amount,
        uint256 instalPeriods,
        uint256 instalPayment,
        uint256 instalPenalty
    );

    // 债权确认或转移
    event Consume(
        address indexed from,
        address indexed to,
        bytes32 indexed hash,
        uint256 amount
    );

    // 撤销未确权债务
    event Revoke(bytes32 indexed hash, uint256 amount);

    // 结算债务
    event Settle(bytes32 indexed hash, uint);

    // 债权确认或转移的授权交易所的额度
    event Approve(
        address indexed authorizer,
        address indexed exchange,
        bytes32 indexed hash,
        uint256 amount
    );

    // 交易所认证
    event Authorize(address exchange);

    // 取消交易所认证
    event Unauthorize(address exchange);

    // 获取债务信息
    function debtProduced(
        bytes32 hash
    ) external view returns (DebtProducer memory);

    // 获取债务偿还信息
    function debtConsumed(
        bytes32 hash
    ) external view returns (DebtConsumer memory);

    // 获取债务人创建的所有债务的Hash
    function debtorHash(
        address debtor
    ) external view returns (bytes32[] memory);

    // 获取债权人持有的所有债务的Hash
    function creditorHash(
        address creditor
    ) external view returns (bytes32[] memory);

    // 获取债务人授权交易所，对于某笔债务，可用于债权确认的额度
    function debtorAllowance(
        address debtor,
        address exchange,
        bytes32 hash
    ) external view returns (uint256);

    // 获取债权人授权交易所，对于某笔债务，可用于债权转移的额度
    function creditorAllowance(
        address creditor,
        address exchange,
        bytes32 hash
    ) external view returns (uint256);

    // 获取认证的交易所
    function allowedExchanges(address exchange) external view returns (bool);

    // 债务人创建债务
    function createDebt(
        uint256 amount,
        uint256 instalPeriods,
        uint256 instalPayment,
        uint256 instalPenalty
    ) external;

    // 债务人撤销未确权债务额度
    function revokeDebt(bytes32 hash, uint256 amount) external;

    // 债务人授权交易所对于某笔债务的确认债权的额度
    function debtorApprove(
        address exchange,
        bytes32 hash,
        uint256 amount
    ) external;

    // 债权人授权交易所对于某笔债务的转移债权的额度
    function creditorApprove(
        address exchange,
        bytes32 hash,
        uint256 amount
    ) external;

    // 债权确认，由交易所调用
    function confirmCreditor(
        address creditor,
        bytes32 hash,
        uint256 amount
    ) external;

    // 债权转移，由交易所调用
    function transferCreditor(
        address creditor,
        bytes32 hash,
        uint256 amount
    ) external;

    // 交易所认证
    function authorizeExchange(address exchange) external;

    // 取消交易所认证
    function unauthorizeExchange(address exchange) external;

    // 设置未确权份额
    function setUnconfirmedAmount(
        bytes32 producerHash,
        uint256 unconfirmedAmount
    ) external;
}
