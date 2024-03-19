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
}
