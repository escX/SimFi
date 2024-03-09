require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("hardhat-gas-reporter");
require("dotenv").config();

const { REPORT_GAS } = process.env;

module.exports = {
  solidity: "0.8.24",
  gasReporter: {
    enabled: REPORT_GAS === "1" ? true : false
  }
};
