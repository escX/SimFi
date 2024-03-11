const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("sft_local", (m) => {
  const contract = m.contract("SFT");
  const mintValue = m.getParameter("mint_value", 1_000_000_000n);

  m.call(contract, "mint", [mintValue]);

  return { contract };
});
