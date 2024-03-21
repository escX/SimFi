const { expect, assert } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const hre = require("hardhat");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const initCreatedAmount = 1000000000; // 债务人创造债务数量
const initInstalPeriods = 10;  // 分期期数
const initInstalPayment = 120; // 每期还款金额
const initInstalPenalty = 12;  // 每期逾期罚金
const initDebtorApproveAmount = 10000; // 债务人授权交易所份额
const initConfirmAmount = 10000; // 从债务人购买的份额
const initCreditorApproveAmount = 1000; // 债权人授权交易所份额
const initTransferAmount = 1000; // 从债权人购买的份额

async function setFixedBlockTimestamp() {
  // 设置固定时间戳，需要在配置文件中设置，allowBlocksWithSameTimestamp: true
  const TIMESTAMP = 9000000000;
  await hre.network.provider.send("evm_setNextBlockTimestamp", [TIMESTAMP]);
}

// 1、部署合约
async function deployFixture() {
  const DebTContract = await ethers.deployContract("DebT");
  const [debtor, exchange, creditor1, creditor2, _] = await ethers.getSigners();

  return { DebTContract, debtor, exchange, creditor1, creditor2 };
}

// 2、债务人debtor创建债务，并授权交易所exchange
async function createDebtFixture() {
  const { DebTContract, debtor, exchange, creditor1, creditor2 } = await loadFixture(deployFixture);

  await DebTContract.authorizeExchange(exchange);

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

  await setFixedBlockTimestamp();

  return new Promise((resolve, reject) => {
    DebTContract.once("Consume", (...data) => {
      resolve({ DebTContract, debtor, exchange, creditor1, creditor2, producerHash, consumerHash: data[2] });
    });

    DebTContract.connect(exchange).confirmCreditor(creditor1, producerHash, initConfirmAmount);
  });
}

// 创建第二笔相同的交易
async function confirmAnthorCreditorFixture() {
  const { DebTContract, debtor, exchange, creditor1, creditor2, producerHash } = await loadFixture(debtorApproveFixture);

  return new Promise((resolve, reject) => {
    DebTContract.once("Consume", (...data) => {
      resolve({ DebTContract, debtor, exchange, creditor1, creditor2, producerHash, consumerHash: data[2] });
    });

    DebTContract.connect(exchange).confirmCreditor(creditor1, producerHash, initConfirmAmount);
  });
}

// 5、债权人creditor1给交易所exchange授权
async function creditorApproveFixture() {
  const { DebTContract, debtor, exchange, creditor1, creditor2, consumerHash } = await loadFixture(confirmCreditorFixture);

  await DebTContract.connect(creditor1).creditorApprove(exchange, consumerHash, initCreditorApproveAmount);

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

      await expect(DebTContract.connect(debtor).createDebt(amount, initInstalPeriods, initInstalPayment, initInstalPenalty))
        .to.be.revertedWithCustomError(DebTContract, "IllegalArgumentValue")
        .withArgs(amount);
    });

    it("债务哈希不存在时，新建债务", async function () {
      const { DebTContract, debtor, producerHash } = await loadFixture(createDebtFixture);

      const { debtor: _debtor, amount, unconfirmedAmount } = await DebTContract.connect(debtor).debtProduced(producerHash);
      const debtorHash = await DebTContract.connect(debtor).debtorHash(_debtor);
      const isExistHash = debtorHash.includes(producerHash);

      assert.equal(_debtor, debtor.address);
      assert.equal(amount, initCreatedAmount);
      assert.equal(unconfirmedAmount, initCreatedAmount);
      assert.equal(isExistHash, true);
    });

    it("债务哈希存在时，合并债务", async function () {
      const { DebTContract, debtor, producerHash } = await loadFixture(createDebtFixture);

      await DebTContract.connect(debtor).createDebt(initCreatedAmount, initInstalPeriods, initInstalPayment, initInstalPenalty);

      const { debtor: _debtor, amount, unconfirmedAmount } = await DebTContract.connect(debtor).debtProduced(producerHash);

      assert.equal(amount, initCreatedAmount * 2);
      assert.equal(unconfirmedAmount, initCreatedAmount * 2);
    });

    it("触发Produce事件", async function () {
      const { DebTContract, debtor } = await loadFixture(deployFixture);

      await expect(DebTContract.connect(debtor).createDebt(initCreatedAmount, initInstalPeriods, initInstalPayment, initInstalPenalty))
        .to.emit(DebTContract, "Produce")
        .withArgs(debtor, anyValue, initCreatedAmount, initInstalPeriods, initInstalPayment, initInstalPenalty);
    });
  });

  describe("revokeDebt", function () {
    const initRevokeAmount = 10000; // 销毁债务份额

    it("非债务创建者调用方法时失败", async function () {
      const { DebTContract, debtor, exchange, producerHash } = await loadFixture(createDebtFixture);

      await expect(DebTContract.connect(exchange).revokeDebt(producerHash, initRevokeAmount))
        .to.be.revertedWithCustomError(DebTContract, "IllegalCaller")
        .withArgs(exchange, debtor);
    });

    it("销毁份额为0时失败", async function () {
      const { DebTContract, debtor, producerHash } = await loadFixture(createDebtFixture);
      const amount = 0;

      await expect(DebTContract.connect(debtor).revokeDebt(producerHash, amount))
        .to.be.revertedWithCustomError(DebTContract, "IllegalArgumentValue")
        .withArgs(amount);
    });

    it("销毁份额大于未确认份额时失败", async function () {
      const { DebTContract, debtor, producerHash } = await loadFixture(createDebtFixture);
      const amount = initCreatedAmount + 1;

      await expect(DebTContract.connect(debtor).revokeDebt(producerHash, amount))
        .to.be.revertedWithCustomError(DebTContract, "InsufficientShares")
        .withArgs(initCreatedAmount, amount);
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

    it("触发Revoke事件", async function() {
      const { DebTContract, debtor, producerHash } = await loadFixture(createDebtFixture);

      await expect(DebTContract.connect(debtor).revokeDebt(producerHash, initRevokeAmount))
        .to.emit(DebTContract, "Revoke")
        .withArgs(producerHash, initRevokeAmount);
    });
  });

  describe("debtorApprove", function () {
    it("为未认证交易所授权时失败", async function () {
      const { DebTContract, debtor, creditor1, producerHash } = await loadFixture(createDebtFixture);

      await expect(DebTContract.connect(debtor).debtorApprove(creditor1, producerHash, initDebtorApproveAmount))
        .to.be.revertedWithCustomError(DebTContract, "IllegalExchange")
        .withArgs(creditor1);
    });

    it("非债务创建者调用方法时失败", async function () {
      const { DebTContract, debtor, exchange, creditor1, producerHash } = await loadFixture(createDebtFixture);

      await expect(DebTContract.connect(creditor1).debtorApprove(exchange, producerHash, initDebtorApproveAmount))
        .to.be.revertedWithCustomError(DebTContract, "IllegalCaller")
        .withArgs(creditor1, debtor);
    });

    it("应该更新授权数据", async function () {
      const { DebTContract, debtor, exchange, producerHash } = await loadFixture(debtorApproveFixture);

      const approveAmount = await DebTContract.connect(debtor).debtorAllowance(debtor, exchange, producerHash);

      assert.equal(approveAmount, initDebtorApproveAmount);
    });

    it("触发Approve事件", async function () {
      const { DebTContract, debtor, exchange, producerHash } = await loadFixture(createDebtFixture);

      await expect(DebTContract.connect(debtor).debtorApprove(exchange, producerHash, initDebtorApproveAmount))
        .to.emit(DebTContract, "Approve")
        .withArgs(debtor, exchange, producerHash, initDebtorApproveAmount);
    });
  });

  describe("creditorApprove", function () {
    it("为未认证交易所授权时失败", async function () {
      const { DebTContract, creditor1, creditor2, consumerHash } = await loadFixture(confirmCreditorFixture);

      await expect(DebTContract.connect(creditor1).creditorApprove(creditor2, consumerHash, initCreditorApproveAmount))
        .to.be.revertedWithCustomError(DebTContract, "IllegalExchange")
        .withArgs(creditor2);
    });

    it("非债权所有者调用方法时失败", async function () {
      const { DebTContract, exchange, creditor1, creditor2, consumerHash } = await loadFixture(confirmCreditorFixture);

      await expect(DebTContract.connect(creditor2).creditorApprove(exchange, consumerHash, initCreditorApproveAmount))
        .to.be.revertedWithCustomError(DebTContract, "IllegalCaller")
        .withArgs(creditor2, creditor1);
    });

    it("应该更新授权数据", async function () {
      const { DebTContract, exchange, creditor1, consumerHash } = await loadFixture(creditorApproveFixture);

      const approveAmount = await DebTContract.connect(creditor1).creditorAllowance(creditor1, exchange, consumerHash);

      assert.equal(approveAmount, initCreditorApproveAmount);
    });

    it("触发Consumer事件", async function () {
      const { DebTContract, exchange, creditor1, consumerHash } = await loadFixture(confirmCreditorFixture);

      await expect(DebTContract.connect(creditor1).creditorApprove(exchange, consumerHash, initCreditorApproveAmount))
        .to.emit(DebTContract, "Approve")
        .withArgs(creditor1, exchange, consumerHash, initCreditorApproveAmount);
    });
  });

  describe("confirmCreditor", function () {
    it("确认债权份额为0时失败", async function () {
      const { DebTContract, exchange, creditor1, producerHash } = await loadFixture(debtorApproveFixture);
      const amount = 0;

      await expect(DebTContract.connect(exchange).confirmCreditor(creditor1, producerHash, amount))
        .to.be.revertedWithCustomError(DebTContract, "IllegalArgumentValue")
        .withArgs(amount);
    });

    it("未确认份额小于确认份额时失败", async function () {
      const { DebTContract, exchange, creditor1, producerHash } = await loadFixture(debtorApproveFixture);
      const amount = initCreatedAmount + 1;

      await expect(DebTContract.connect(exchange).confirmCreditor(creditor1, producerHash, amount))
        .to.be.revertedWithCustomError(DebTContract, "InsufficientShares")
        .withArgs(initCreatedAmount, amount);
    });

    it("授权份额小于确认份额时失败", async function () {
      const { DebTContract, exchange, creditor1, producerHash } = await loadFixture(debtorApproveFixture);
      const amount = initDebtorApproveAmount + 1;

      await expect(DebTContract.connect(exchange).confirmCreditor(creditor1, producerHash, amount))
        .to.be.revertedWithCustomError(DebTContract, "InsufficientAuthorizedShares")
        .withArgs(initDebtorApproveAmount, amount);
    });

    it("更新未确认份额", async function () {
      const { DebTContract, debtor, producerHash } = await loadFixture(confirmCreditorFixture);
      const { unconfirmedAmount } = await DebTContract.connect(debtor).debtProduced(producerHash);

      assert.equal(unconfirmedAmount, initCreatedAmount - initConfirmAmount);
    });

    it("确认债务哈希存在时，合并债务", async function () {
      const { DebTContract, exchange, creditor1, consumerHash, producerHash } = await loadFixture(confirmCreditorFixture);

      await setFixedBlockTimestamp();
      await DebTContract.connect(exchange).confirmCreditor(creditor1, producerHash, initConfirmAmount);

      const { holdAmount, lastUnpaid } = await DebTContract.connect(exchange).debtConsumed(consumerHash);

      assert.equal(holdAmount, initConfirmAmount * 2);
      assert.equal(lastUnpaid, 0);
    });

    it("确认债务哈希不存在时，新建债务", async function () {
      await loadFixture(confirmCreditorFixture);
      const { DebTContract, creditor1, producerHash, consumerHash } = await loadFixture(confirmAnthorCreditorFixture);

      const {creditor, holdAmount, producerHash: _producerHash} = await DebTContract.connect(creditor1).debtConsumed(consumerHash);

      const creditorHash = await DebTContract.connect(creditor1).creditorHash(creditor1);
      const isExistHash = creditorHash.includes(consumerHash);

      assert.equal(creditor, creditor1.address);
      assert.equal(holdAmount, initConfirmAmount);
      assert.equal(_producerHash, producerHash);
      assert.equal(isExistHash, true);
    });

    it("触发Consume事件", async function () {
      const { DebTContract, debtor, exchange, creditor1, producerHash, consumerHash } = await loadFixture(debtorApproveFixture);

      expect(DebTContract.connect(exchange).confirmCreditor(creditor1, producerHash, initConfirmAmount))
        .to.emit(DebTContract, "Consume")
        .withArgs(debtor, creditor1, consumerHash, initConfirmAmount);
    });
  });

  describe("transferCreditor", function () {
    it("转移债权份额为0时失败", async function () {
      const { DebTContract, exchange, creditor2, consumerHash } = await loadFixture(creditorApproveFixture);
      const amount = 0;

      await expect(DebTContract.connect(exchange).transferCreditor(creditor2, consumerHash, amount))
        .to.be.revertedWithCustomError(DebTContract, "IllegalArgumentValue")
        .withArgs(amount);
    });

    it("原债权份额小于转移份额时失败", async function () {
      const { DebTContract, exchange, creditor2, consumerHash } = await loadFixture(creditorApproveFixture);
      const amount = initConfirmAmount + 1;

      await expect(DebTContract.connect(exchange).transferCreditor(creditor2, consumerHash, amount))
        .to.be.revertedWithCustomError(DebTContract, "InsufficientShares")
        .withArgs(initConfirmAmount, amount);
    });

    it("授权份额小于转移份额时失败", async function () {
      const { DebTContract, exchange, creditor2, consumerHash } = await loadFixture(creditorApproveFixture);
      const amount = initCreditorApproveAmount + 1;

      await expect(DebTContract.connect(exchange).transferCreditor(creditor2, consumerHash, amount))
        .to.be.revertedWithCustomError(DebTContract, "InsufficientAuthorizedShares")
        .withArgs(initCreditorApproveAmount, amount);
    });

    it("若转移全部债权，删除原有债权信息", async function () {

    });

    it("若转移部分债权，分割原有债权份额", async function () {

    });

    it("确认债务哈希存在时，合并债务", async function () {

    });

    it("确认债务哈希存在时，新建债务", async function () {

    });

    it("触发Consume事件", async function () {
      const { DebTContract, exchange, creditor1, creditor2, consumerHash } = await loadFixture(creditorApproveFixture);

      expect(DebTContract.connect(exchange).transferCreditor(creditor2, consumerHash, initTransferAmount))
        .to.emit(DebTContract, "Consume")
        .withArgs(creditor1, creditor2, consumerHash, initTransferAmount);
    });
  });

  describe("authorizeExchange", function () {
    it("增加交易所的授权", async function () {
      const { DebTContract, debtor, exchange } = await loadFixture(deployFixture);

      await DebTContract.connect(debtor).authorizeExchange(exchange);

      expect(await DebTContract.connect(debtor).allowedExchanges(exchange)).to.equal(true);
    });

    it("触发Authorize事件", async function () {
      const { DebTContract, debtor, exchange } = await loadFixture(deployFixture);

      await expect(DebTContract.connect(debtor).authorizeExchange(exchange))
        .to.emit(DebTContract, "Authorize")
        .withArgs(exchange);
    });
  });

  describe("unauthorizeExchange", function () {
    it("移除交易所的授权", async function () {
      const { DebTContract, debtor, exchange } = await loadFixture(deployFixture);

      await DebTContract.connect(debtor).authorizeExchange(exchange);
      await DebTContract.connect(debtor).unauthorizeExchange(exchange);

      expect(await DebTContract.connect(debtor).allowedExchanges(exchange)).to.equal(false);
    });

    it("触发Unauthorize事件", async function () {
      const { DebTContract, debtor, exchange } = await loadFixture(deployFixture);

      await expect(DebTContract.connect(debtor).unauthorizeExchange(exchange))
        .to.emit(DebTContract, "Unauthorize")
        .withArgs(exchange);
    });
  });

});
