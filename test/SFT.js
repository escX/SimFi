const { expect, assert } = require("chai");

describe("SFT contract", function() {
  let SFToken, owner, addr1, addr2;

  beforeEach(async function() {
    SFToken = await ethers.deployContract("SFT");
    [owner, addr1, addr2, _] = await ethers.getSigners();
    console.log(`STF deployed: `, SFToken);
    console.log(`owner: `, owner);
  })

  it("合约拥有者应该是部署者", async function() {

  });

  it("transfer", async function () {

  });

  it("approve", async function () {

  });

  it("transferFrom", async function () {

  });

  it("mint", async function () {

  });

  it("burn", async function () {

  });
})
