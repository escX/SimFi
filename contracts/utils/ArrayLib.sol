// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library ArrayLib {
    struct Bytes32ArrayMap {
        mapping(bytes32 => uint256) keyToIndex;
        bytes32[] keys;
    }

    function push(Bytes32ArrayMap storage self, bytes32 key) internal {
        require(key != bytes32(0), "ArrayLib: key cannot be 0x0");
        require(self.keyToIndex[key] == 0, "ArrayLib: key already exists");

        self.keys.push(key);
        self.keyToIndex[key] = self.keys.length;
    }

    function remove(Bytes32ArrayMap storage self, bytes32 key) internal {
        require(key != bytes32(0), "ArrayLib: key cannot be 0x0");
        require(self.keyToIndex[key] != 0, "ArrayLib: key does not exist");

        uint256 index = self.keyToIndex[key] - 1;
        uint256 lastIndex = self.keys.length - 1;
        bytes32 lastKey = self.keys[lastIndex];

        self.keys[index] = lastKey;
        self.keyToIndex[lastKey] = index + 1;

        self.keys.pop();
        delete self.keyToIndex[key];
    }
}
