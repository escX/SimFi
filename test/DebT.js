const { expect, assert } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const initCreatedAmount = 1000000000; // 债务人创造债务数量
const initInstalPeriods = 10;  // 分期期数
const initInstalPayment = 120; // 每期还款金额
const initInstalPenalty = 12;  // 每期逾期罚金
const initDebtorApproveAmount = 10000; // 债务人授权交易所份额
const initCreditorApproveAmount = 10000; // 债权人授权交易所份额
const initConfirmAmount = 10000; // 从债务人购买的份额
const iniTransferAmount = 10000; // 从债权人购买的份额

// 1、部署，并认证交易所
async function deployFixture() {
  const DebTContract = await ethers.deployContract("DebT");
  const [debtor, exchange, creditor1, creditor2, _] = await ethers.getSigners();

  await DebTContract.authorizeExchange(exchange);

  return { DebTContract, debtor, exchange, creditor1, creditor2 };
}

// 2、债务人debtor创建债务
async function createDebtFixture() {
  const { DebTContract, debtor, exchange, creditor1, creditor2 } = await loadFixture(deployFixture);

  return new Promise(async (resolve) => {
    DebTContract.once("Produce", (...data) => {
      resolve({ DebTContract, debtor, exchange, creditor1, creditor2, producerHash: data[1] });
    });

    DebTContract.connect(debtor).createDebt(initCreatedAmount, initInstalPeriods, initInstalPayment, initInstalPenalty);
  });
}

// 3、债务人debtor给交易所exchange授权
async function debtorApproveFixture() {
  const { DebTContract, debtor, exchange, creditor1, creditor2, producerHash } = await loadFixture(createDebtFixture);

  await DebTContract.connect(debtor).debtorApprove(exchange, producerHash, initDebtorApproveAmount);

  return { DebTContract, debtor, exchange, creditor1, creditor2, producerHash };
}

// 4、债权人creditor1通过交易所exchange，从债务人debtor那里获取债权
async function confirmCreditorFixture() {
  const { DebTContract, debtor, exchange, creditor1, creditor2, producerHash } = await loadFixture(debtorApproveFixture);

  return new Promise((resolve, reject) => {
    DebTContract.once("Consume", (...data) => {
      resolve({ DebTContract, debtor, exchange, creditor1, creditor2, consumerHash: data[2] });
    });

    DebTContract.connect(exchange).transferCreditor(creditor1, producerHash, initConfirmAmount);
  });
}

// 5、债权人creditor1给交易所exchange授权
async function creditorApproveFixture() {
  const { DebTContract, debtor, exchange, creditor1, creditor2, consumerHash } = await loadFixture(confirmCreditorFixture);

  await DebTContract.connect(creditor1).debtorApprove(exchange, consumerHash, initCreditorApproveAmount);

  return { DebTContract, debtor, exchange, creditor1, creditor2, consumerHash };
}

// 6、债权人creditor2通过交易所exchange，从债权人creditor1那里获取债权
async function transferCreditorFixture() {

}

describe("DebT Contract", function () {
  describe("createDebt", function () {
    it("债务数量为0时失败", async function () {
      const { DebTContract, debtor } = await loadFixture(deployFixture);
      const amount = 0; // 债务人创造债务数量

      await expect(DebTContract.connect(debtor).createDebt(amount, initInstalPeriods, initInstalPayment, initInstalPenalty)).to.be.revertedWithCustomError(DebTContract, "IllegalArgumentValue").withArgs(amount);
    });

    it("触发Produce事件", async function () {
      const { DebTContract, debtor } = await loadFixture(deployFixture);

      await expect(DebTContract.connect(debtor).createDebt(initCreatedAmount, initInstalPeriods, initInstalPayment, initInstalPenalty)).to.emit(DebTContract, "Produce").withArgs(debtor, anyValue, initCreatedAmount, initInstalPeriods, initInstalPayment, initInstalPenalty);
    });

    it("债务哈希不存在时，应该新建债务", async function () {
      const { DebTContract, debtor, producerHash } = await loadFixture(createDebtFixture);

      const { debtor: _debtor, amount, unconfirmedAmount, instalPeriods, instalPayment, instalPenalty } = await DebTContract.connect(debtor).debtProduced(producerHash);
      const debtorHash = await DebTContract.connect(debtor).debtorHash(_debtor);
      const isExistHash = debtorHash.includes(producerHash);

      assert.equal(_debtor, debtor.address);
      assert.equal(amount, initCreatedAmount);
      assert.equal(unconfirmedAmount, initCreatedAmount);
      assert.equal(instalPeriods, initInstalPeriods);
      assert.equal(instalPayment, initInstalPayment);
      assert.equal(instalPenalty, initInstalPenalty);
      assert.equal(isExistHash, true);
    });

    it("债务哈希存在时，应该合并债务", async function () {
      const { DebTContract, debtor, producerHash } = await loadFixture(createDebtFixture);

      await DebTContract.connect(debtor).createDebt(initCreatedAmount, initInstalPeriods, initInstalPayment, initInstalPenalty);

      const { debtor: _debtor, amount, unconfirmedAmount, instalPeriods, instalPayment, instalPenalty } = await DebTContract.connect(debtor).debtProduced(producerHash);

      assert.equal(_debtor, debtor.address);
      assert.equal(amount, initCreatedAmount * 2);
      assert.equal(unconfirmedAmount, initCreatedAmount * 2);
      assert.equal(instalPeriods, initInstalPeriods);
      assert.equal(instalPayment, initInstalPayment);
      assert.equal(instalPenalty, initInstalPenalty);
    });
  });

  describe("revokeDebt", function () {
    const initRevokeAmount = 10000; // 销毁债务份额

    it("其他账户调用方法时失败", async function () {
      const { DebTContract, debtor, exchange, producerHash } = await loadFixture(createDebtFixture);

      await expect(DebTContract.connect(exchange).revokeDebt(producerHash, initRevokeAmount)).to.be.revertedWithCustomError(DebTContract, "IllegalCaller").withArgs(exchange.address, debtor.address);
    });

    it("销毁份额为0时失败", async function () {
      const { DebTContract, debtor, producerHash } = await loadFixture(createDebtFixture);
      const amount = 0;

      await expect(DebTContract.connect(debtor).revokeDebt(producerHash, amount)).to.be.revertedWithCustomError(DebTContract, "IllegalArgumentValue").withArgs(amount);
    });

    it("销毁份额大于未确认份额时失败", async function () {
      const { DebTContract, debtor, producerHash } = await loadFixture(createDebtFixture);
      const amount = initCreatedAmount + 1;

      await expect(DebTContract.connect(debtor).revokeDebt(producerHash, amount)).to.be.revertedWithCustomError(DebTContract, "InsufficientShares").withArgs(initCreatedAmount, amount);
    });

    it("销毁全部债务时，删除债务信息", async function () {
      const { DebTContract, debtor, producerHash } = await loadFixture(createDebtFixture);

      await DebTContract.connect(debtor).revokeDebt(producerHash, initCreatedAmount);

      const { debtor: _debtor, amount } = await DebTContract.connect(debtor).debtProduced(producerHash);
      const debtorHash = await DebTContract.connect(debtor).debtorHash(debtor);
      const isExistHash = debtorHash.includes(producerHash);

      assert.equal(_debtor, ZERO_ADDRESS);
      assert.equal(amount, 0);
      assert.equal(isExistHash, false);
    });

    it("销毁全部债务时，减少债务总量和未确认份额", async function () {
      const { DebTContract, debtor, producerHash } = await loadFixture(createDebtFixture);

      await DebTContract.connect(debtor).revokeDebt(producerHash, initRevokeAmount);

      const { debtor: _debtor, amount, unconfirmedAmount } = await DebTContract.connect(debtor).debtProduced(producerHash);

      assert.equal(amount, initCreatedAmount - initRevokeAmount);
      assert.equal(unconfirmedAmount, initCreatedAmount - initRevokeAmount);
    });
  });

  describe("debtorApprove", function () {
    it("", async function () {

    });
  });

  describe("creditorApprove", function () {
    it("", async function () {

    });
  });

  describe("confirmCreditor", function () {
    it("", async function () {

    });
  });

  describe("transferCreditor", function () {
    it("", async function () {

    });
  });

  describe("addExchange", function () {
    it("", async function () {

    });
  });

  describe("removeExchange", function () {
    it("", async function () {

    });
  });

});
