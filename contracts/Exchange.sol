// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IDebT} from "./interfaces/IDebT.sol";
import {IExchange} from "./interfaces/IExchange.sol";
import {IExchangeErrors} from "./interfaces/IExchangeErrors.sol";

contract Exchange is IExchange, IExchangeErrors {
    modifier onlySeller(bytes32 _productHash) {
        address seller = _product[_productHash].seller;

        if (msg.sender != seller) {
            revert IllegalCaller(msg.sender, seller);
        }
        _;
    }

    IERC20 private immutable _STF;
    IDebT private immutable _DebT;
    address private immutable _owner;

    constructor(address _sftAddress, address _debtAddress) {
        _STF = IERC20(_sftAddress);
        _DebT = IDebT(_debtAddress);
        _owner = msg.sender;
    }

    mapping(bytes32 _hash => Product) private _product;

    function product(bytes32 _hash) external view returns (Product memory) {
        return _product[_hash];
    }

    function publishUnconfirmed(
        bytes32 _debtHash,
        uint256 _amount,
        uint256 _unitPrice
    ) external {
        IDebT.DebtProducer memory _debtProducer = _DebT.debtProduced(_debtHash);
        uint256 _unconfirmedAmount = _debtProducer.unconfirmedAmount;

        if (_debtProducer.debtor != msg.sender) {
            revert IllegalCaller(msg.sender, _debtProducer.debtor);
        }

        if (_unconfirmedAmount < _amount) {
            revert InsufficientShares(_unconfirmedAmount, _amount);
        }

        uint256 _allowance = _DebT.debtorAllowance(
            msg.sender,
            address(this),
            _debtHash
        );

        if (_allowance < _amount) {
            revert InsufficientAllowedShares(_allowance, _amount);
        }

        // 产品hash，由debtHash，seller，timestamp生成
        bytes32 _productHash = keccak256(
            abi.encodePacked(_debtHash, msg.sender, block.timestamp)
        );

        // 生成产品信息
        _product[_productHash] = Product({
            debtHash: _debtHash,
            seller: msg.sender,
            buyer: address(0),
            debtType: DebtType.Unconfirmed,
            debtStatus: DebtStatus.OnSale,
            amount: _amount,
            unitPrice: _unitPrice,
            publishTimestamp: block.timestamp,
            soldTimestamp: uint256(0)
        });

        // 扣除未确认份额，防止被债务人撤销
        _DebT.setUnconfirmedAmount(_debtHash, _unconfirmedAmount - _amount);

        emit Publish(_productHash);
    }

    function publishConfirmed(
        bytes32 _debtHash,
        uint256 _amount,
        uint256 _unitPrice
    ) external {
        IDebT.DebtConsumer memory _debtConsumer = _DebT.debtConsumed(_debtHash);

        if (_debtConsumer.creditor != msg.sender) {
            revert IllegalCaller(msg.sender, _debtConsumer.creditor);
        }

        if (_debtConsumer.amount < _amount) {
            revert InsufficientShares(_debtConsumer.amount, _amount);
        }

        uint256 _allowance = _DebT.creditorAllowance(
            msg.sender,
            address(this),
            _debtHash
        );

        if (_allowance < _amount) {
            revert InsufficientAllowedShares(_allowance, _amount);
        }

        // 产品hash，由debtHash，seller，timestamp生成
        bytes32 _productHash = keccak256(
            abi.encodePacked(_debtHash, msg.sender, block.timestamp)
        );

        // 生成产品信息
        _product[_productHash] = Product({
            debtHash: _debtHash,
            seller: msg.sender,
            buyer: address(0),
            debtType: DebtType.Confirmed,
            debtStatus: DebtStatus.OnSale,
            amount: _amount,
            unitPrice: _unitPrice,
            publishTimestamp: block.timestamp,
            soldTimestamp: uint256(0)
        });

        emit Publish(_productHash);
    }

    function revokeProduct(
        bytes32 _productHash
    ) external onlySeller(_productHash) {
        Product memory _p = _product[_productHash];

        if (
            _p.debtType == DebtType.Unconfirmed &&
            _p.debtStatus == DebtStatus.OnSale
        ) {
            uint256 _unconfirmedAmount = _DebT
                .debtProduced(_p.debtHash)
                .unconfirmedAmount;

            _product[_productHash].debtStatus = DebtStatus.Revoke;

            // 恢复未确认份额
            _DebT.setUnconfirmedAmount(
                _p.debtHash,
                _unconfirmedAmount + _p.amount
            );

            emit Revoke();
        }
    }

    function updateProductAmount(
        bytes32 _productHash,
        uint256 _amount
    ) external onlySeller(_productHash) {
        Product memory _p = _product[_productHash];

        if (_p.debtStatus == DebtStatus.OnSale) {
            _product[_productHash].amount = _amount;

            emit Update();
        }
    }

    function updateProductUnitPrice(
        bytes32 _productHash,
        uint256 _unitPrice
    ) external onlySeller(_productHash) {
        Product memory _p = _product[_productHash];

        if (_p.debtStatus == DebtStatus.OnSale) {
            _product[_productHash].unitPrice = _unitPrice;

            emit Update();
        }
    }

    function buy(bytes32 _productHash) external {
        Product memory _p = _product[_productHash];

        if (_p.debtStatus == DebtStatus.OnSale) {
            uint256 _allowance = _STF.allowance(msg.sender, address(this));

            if (_allowance < _p.amount) {
                revert InsufficientAllowedShares(_allowance, _p.amount);
            }

            // 代币转账
            _STF.transferFrom(msg.sender, _p.seller, _p.amount * _p.unitPrice);

            // 债权确认或转移
            if (_p.debtType == DebtType.Unconfirmed) {
                _DebT.confirmCreditor(msg.sender, _p.debtHash, _p.amount);
            }

            if (_p.debtType == DebtType.Confirmed) {
                _DebT.transferCreditor(msg.sender, _p.debtHash, _p.amount);
            }

            // 状态改变
            _product[_productHash].buyer = msg.sender;
            _product[_productHash].debtStatus = DebtStatus.Sold;
            _product[_productHash].soldTimestamp = block.timestamp;

            emit Buy();
        }
    }
}
