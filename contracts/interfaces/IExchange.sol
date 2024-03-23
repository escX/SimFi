// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IExchange {
    enum DebtType {
        Unconfirmed, // 未确权债务
        Confirmed // 确权债务
    }

    enum DebtStatus {
        OnSale, // 出售中
        Locked, // 已锁定
        Revoke, // 已撤销
        Sold // 已售出
    }

    struct Product {
        bytes32 debtHash; // 债务哈希
        address seller; // 卖家
        address buyer; // 买家
        DebtType debtType; // 类型
        DebtStatus debtStatus; // 状态
        uint256 amount; // 出售份额
        uint256 unitPrice; // 每份价格
        uint256 publishTimestamp; // 上架时间
        uint256 soldTimestamp; // 卖出时间
    }

    event Publish();
    event Revoke();
    event Update();
    event Buy();

    function product(bytes32 _hash) external view returns (Product memory);

    // 债务人发布交易
    function publishUnconfirmed(
        bytes32 _debtHash,
        uint256 _amount,
        uint256 _unitPrice
    ) external;

    // 债权人发布交易
    function publishConfirmed(
        bytes32 _debtHash,
        uint256 _amount,
        uint256 _unitPrice
    ) external;

    // 购买债务
    function buy(bytes32 productHash) external;
}
