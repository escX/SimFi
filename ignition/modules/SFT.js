const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SFTContract", (m) => {
  const SFTContract = m.contract("SFT");

  m.call(SFTContract, "mint", [1_000_000_000n]);

  return { SFTContract };
});
