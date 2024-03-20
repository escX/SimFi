// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDebTErrors {
    // 非法调用者
    error IllegalCaller(address caller, address shouldBe);

    // 非法交易所
    error IllegalExchange(address exchange);

    // 非法参数值
    error IllegalArgumentValue(uint256 value);

    // 份额不足
    error InsufficientShares(uint256 shares, uint256 needed);

    // 授权份额不足
    error InsufficientAuthorizedShares(uint256 shares, uint256 needed);
}
