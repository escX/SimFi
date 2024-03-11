const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("sft_local", (m) => {
  const sftContract = m.contract("SFT");

  return { sftContract };
});
