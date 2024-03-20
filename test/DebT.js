const { expect, assert } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function deployFixture() {
  const DebTContract = await ethers.deployContract("DebT");
  const [debtor, exchange, creditor1, creditor2, _] = await ethers.getSigners();

  return { DebTContract, debtor, exchange, creditor1, creditor2 };
}

async function createDebtFixture() {
  const { DebTContract, debtor, exchange, creditor1, creditor2 } = await loadFixture(deployFixture);
  const amount = 1000000000; // 债务人创造债务数量
  const instalPeriods = 10;  // 分期期数
  const instalPayment = 120; // 每期还款金额
  const instalPenalty = 12;  // 每期逾期罚金

  DebTContract.once("Produce", (...data) => {
    console.log(data);
  });

  await DebTContract.connect(debtor).createDebt(amount, instalPeriods, instalPayment, instalPenalty);
}

async function debtorApproveFixture() {

}

async function creditorApproveFixture() {

}

async function confirmCreditorFixture() {

}

async function transferCreditorFixture() {

}

describe("DebT Contract", function () {
  describe("createDebt", function () {
    it ("test", async function () {
      await loadFixture(createDebtFixture);
    });
  });

  describe("revokeDebt", function () {
    it ("", async function () {

    });
  });

  describe("debtorApprove", function () {
    it ("", async function () {

    });
  });

  describe("creditorApprove", function () {
    it ("", async function () {

    });
  });

  describe("confirmCreditor", function () {
    it ("", async function () {

    });
  });

  describe("transferCreditor", function () {
    it ("", async function () {

    });
  });

  describe("addExchange", function () {
    it ("", async function () {

    });
  });

  describe("removeExchange", function () {
    it ("", async function () {

    });
  });

});
