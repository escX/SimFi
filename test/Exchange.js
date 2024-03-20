const { expect, assert } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function deployFixture() {
  const ExchangeContract = await ethers.deployContract("Exchange");
  const [deployer, _] = await ethers.getSigners();

  return { ExchangeContract, deployer };
}

describe("Exchange Contract", function () {
  describe("", function () {
    it ("", async function () {

    });
  });
});
