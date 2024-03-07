//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

contract SFT is IERC20 {
    string public name = "SimFi Token";
    string public symbol = "SFT";

    uint256 public totalSupply; // 货币总供应
    mapping(address account => uint256) public balanceOf; // 账户余额
    mapping(address account => mapping(address spender => uint256)) // 账户被另一个账户的授权的转账额度
        public allowance;

    // 调用者转账给另一个账户
    function transfer(address to, uint256 value) external returns (bool) {}

    // 调用者授权另一个账户的转账额度
    function approve(address spender, uint256 value) external returns (bool) {}

    // 从一个账户转账给另一个账户，需要有授权额度
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool) {}

    // 铸造货币
    function mint(uint256 amount) external {}

    // 销毁货币
    function burn(uint256 amount) external {}
}
