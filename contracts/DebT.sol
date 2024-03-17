//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

enum DebtChangeType {
    Create,
    Destory
}

contract DebT {
    struct DebtChangeRecord {
        DebtChangeType changeType;
    }

    struct DebtData {
        uint256 amount; // 铸造总量
        address debtor; // 债务人
        uint256 numberOfInstalments; // 分期期数
        uint256 installmentPayment; // 每期偿还数量
        uint256 penalty; // 每期增加违约金
        bytes32 hash; // 由debtor、numberOfInstalments、installmentPayment、penalty的值生成的哈希值
        DebtChangeRecord[] record;
    }

    struct RepayData {
        address creditor;
    }

    string public constant name = "Debt Token";
    string public constant symbol = "DebT";

    mapping(bytes32 hash => DebtData) public debtBy;
    mapping(address creditor => mapping(bytes32 debt => uint256)) public holdOf;
    mapping(address debtor => mapping(bytes32 debt => RepayData[]))
        public repayOf;

    function createDebt(
        uint256 _amount,
        uint256 _numberOfInstalments,
        uint256 _installmentPayment,
        uint256 _penalty
    ) external {}

    function destoryDebt(bytes32 _hash, uint256 amount) external {}

    function repay(bytes32 _hash, address creditor) external {}
}
