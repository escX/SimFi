require("@chainlink/hardhat-chainlink"); // 该依赖放在最前面，否则可能会影响测试运行
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-ignition-ethers");
require("hardhat-gas-reporter");
require("./tasks/write");
require("dotenv").config();

const { REPORT_GAS } = process.env;

module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      allowBlocksWithSameTimestamp: true, // 为在Debt.js中测试债务合并，需要允许相同时间戳的交易
    }
  },
  gasReporter: {
    enabled: REPORT_GAS === "1" ? true : false
  }
};
