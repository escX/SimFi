//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

contract SFT is IERC20 {
    string public name = "SimFi Token";
    string public symbol = "SFT";
    address private immutable _owner;

    uint256 public totalSupply; // 货币总供应
    mapping(address account => uint256) public balanceOf; // 账户余额
    mapping(address account => mapping(address spender => uint256)) // 账户被另一个账户的授权的转账额度
        public allowance;

    modifier onlyOwner() {
        require(_owner == msg.sender, "");
        _;
    }

    constructor() {
        _owner = msg.sender;
    }

    // 调用者转账给另一个账户
    function transfer(address _to, uint256 _value) external returns (bool) {
        uint256 _fromBalance = balanceOf[msg.sender];
        uint256 _toBalance = balanceOf[_to];

        require(_fromBalance >= _value, "");

        balanceOf[msg.sender] = _fromBalance - _value;
        balanceOf[_to] = _toBalance + _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    // 调用者授权另一个账户的转账额度
    function approve(
        address _spender,
        uint256 _value
    ) external returns (bool) {}

    // 从一个账户转账给另一个账户，需要有授权额度
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool) {}

    // 铸造货币
    function mint(uint256 _value) external onlyOwner {
        uint256 _ownerBalance = balanceOf[msg.sender];
        uint256 _totalSupply = totalSupply;

        totalSupply = _totalSupply + _value;
        balanceOf[msg.sender] = _ownerBalance + _value;

        emit Transfer(address(0), msg.sender, _value);
    }

    // 销毁货币
    function burn(uint256 _value) external onlyOwner {
        uint256 _ownerBalance = balanceOf[msg.sender];
        uint256 _totalSupply = totalSupply;

        require(_ownerBalance >= _value, "");

        totalSupply = _totalSupply - _value;
        balanceOf[msg.sender] = _ownerBalance - _value;

        emit Transfer(msg.sender, address(0), _value);
    }
}
