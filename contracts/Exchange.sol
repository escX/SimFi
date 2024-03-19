// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IDebT} from "./interfaces/IDebT.sol";

contract Exchange {
    IERC20 private immutable _STF;
    IDebT private immutable _DebT;

    constructor(address _sftAddress, address _debtAddress) {
        _STF = IERC20(_sftAddress);
        _DebT = IDebT(_debtAddress);
    }

    // 债务人发布交易
    // 债务人撤销交易
    // 债务人修改交易份额
    // 债务人修改交易价格

    // 债权人发布交易
    // 债权务人撤销交易
    // 债权务人修改交易份额
    // 债权务人修改交易价格
    // 购买债务
}
