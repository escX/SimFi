//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract SFT is IERC20, IERC20Errors {
    string public constant name = "SimFi Token";
    string public constant symbol = "SFT";
    address public immutable owner;

    uint256 public totalSupply; // 货币总供应
    mapping(address account => uint256) public balanceOf; // account账户余额
    mapping(address account => mapping(address spender => uint256))
        public allowance; // account账户授权spender账户的额度

    modifier onlyOwner() {
        if (owner != msg.sender) {
            revert ERC20InvalidSender(msg.sender);
        }
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {
        emit Transfer(msg.sender, address(this), msg.value);
    }

    fallback() external payable {
        emit Transfer(msg.sender, address(this), msg.value);
    }

    // 调用者转账给_to账户
    function transfer(address _to, uint256 _value) external returns (bool) {
        uint256 _fromBalance = balanceOf[msg.sender];
        uint256 _toBalance = balanceOf[_to];

        if (_to == address(0)) {
            revert ERC20InvalidReceiver(_to);
        }
        if (_fromBalance < _value) {
            revert ERC20InsufficientBalance(msg.sender, _fromBalance, _value);
        }
        if (_value == 0) {
            revert ERC20InvalidSender(msg.sender);
        }

        balanceOf[msg.sender] = _fromBalance - _value;
        balanceOf[_to] = _toBalance + _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    // 调用者授权额度给_spender账户
    function approve(address _spender, uint256 _value) external returns (bool) {
        if (_spender == address(0)) {
            revert ERC20InvalidSpender(_spender);
        }

        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    // 从_from账户转账给_to账户，调用者需要有授权额度
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool) {
        uint256 _fromBalance = balanceOf[_from];
        uint256 _toBalance = balanceOf[_to];
        uint256 _allowance = allowance[_from][msg.sender];

        if (_from == address(0)) {
            revert ERC20InvalidSender(_from);
        }
        if (_to == address(0)) {
            revert ERC20InvalidReceiver(_to);
        }
        if (_allowance < _value) {
            revert ERC20InsufficientAllowance(msg.sender, _allowance, _value);
        }
        if (_fromBalance < _value) {
            revert ERC20InsufficientBalance(_from, _fromBalance, _value);
        }
        if (_value == 0) {
            revert ERC20InvalidSender(msg.sender);
        }

        balanceOf[_from] = _fromBalance - _value;
        balanceOf[_to] = _toBalance + _value;
        allowance[_from][msg.sender] = _allowance - _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    // 铸造货币
    function mint(uint256 _value) external onlyOwner {
        uint256 _ownerBalance = balanceOf[msg.sender];
        uint256 _totalSupply = totalSupply;

        balanceOf[msg.sender] = _ownerBalance + _value;
        totalSupply = _totalSupply + _value;

        emit Transfer(address(0), msg.sender, _value);
    }

    // 销毁货币
    function burn(uint256 _value) external onlyOwner {
        uint256 _ownerBalance = balanceOf[msg.sender];
        uint256 _totalSupply = totalSupply;

        if (_ownerBalance < _value) {
            revert ERC20InsufficientBalance(msg.sender, _ownerBalance, _value);
        }

        balanceOf[msg.sender] = _ownerBalance - _value;
        totalSupply = _totalSupply - _value;

        emit Transfer(msg.sender, address(0), _value);
    }
}
