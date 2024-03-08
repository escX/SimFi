const { expect, assert } = require("chai");

describe("SFT contract", function() {
  let SFToken, owner, caller, sender, receiver;

  beforeEach(async function() {
    SFToken = await ethers.deployContract("SFT");
    [owner, caller, sender, receiver, _] = await ethers.getSigners();
  })

  describe("Debug", function () {
    it("", async function() {
      console.log(`STF deployed: `, SFToken);
      console.log(`owner: `, owner);
    });
  });

  describe("Constructor", function () {
    it("合约拥有者应该是部署者", async function() {

    });
  });

  describe("transfer", function () {
    it("调用者账户余额小于转账金额时失败", async function() {

    });

    it("调用者账户余额应该减少", async function() {

    });

    it("接受者账户余额应该增加", async function() {

    });

    it("应该触发Transfer事件", async function() {

    });
  });

  describe("approve", function () {
    it("应该更新调用者账户的授权额度数据", async function() {

    });

    it("应该触发Approval事件", async function() {

    });
  });

  describe("transferFrom", function () {
    it("调用者被授权额度小于转账金额时失败", async function() {

    });

    it("发送者账户余额小于转账金额时失败", async function() {

    });

    it("转账成功后，发送者账户余额应该减少", async function() {

    });

    it("转账成功后，接收者账户余额应该增加", async function() {

    });

    it("转账成功后，应该更新发送者账户的授权额度数据", async function() {

    });

    it("应该触发Transfer事件", async function() {

    });
  });

  describe("mint", function () {
    it("合约拥有者账户余额应该增加", async function() {

    });

    it("总供应量应该增加", async function() {

    });

    it("应该触发Transfer事件", async function() {

    });
  });

  describe("burn", function () {
    it("合约拥有者账户余额小于销毁数量时失败", async function() {

    });

    it("合约拥有者账户余额应该减少", async function() {

    });

    it("总供应量应该减少", async function() {

    });

    it("应该触发Transfer事件", async function() {

    });
  });
})
