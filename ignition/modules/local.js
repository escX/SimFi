const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("local", (m) => {
  const SFTContract = m.contract("SFT");
  const DebTContract = m.contract("DebT", [SFTContract]);
  const ExchangeContract = m.contract("Exchange", [SFTContract, DebTContract]);

  return { SFTContract, DebTContract, ExchangeContract };
});
