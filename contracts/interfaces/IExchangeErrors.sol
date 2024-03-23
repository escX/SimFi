// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IExchangeErrors {
    // 非法调用者
    error IllegalCaller(address caller, address shouldBe);

    // 份额不足
    error InsufficientShares(uint256 shares, uint256 needed);

    // 授权份额不足
    error InsufficientAllowedShares(uint256 shares, uint256 needed);
}
