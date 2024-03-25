const { expect, assert } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { watchAction } = require("./helper");

const SFTTotalSupply = 1000000;
const debtorBalance = 10000;
const creditor1Balance = 50000;
const creditor1ApproveSFT = 50000;
const creditor2Balance = 50000;
const creditor2ApproveSFT = 50000;

const debtorCreatedDebt = 10000;
const debtorApproveDebt = 10000;
const creditor1ApproveDebt = 100;

const debtorPublishAmount = 100;
const creditor1PublishAmount = 100;

async function deployFixture() {
  const [SFTDeployer, DebTDeployer, ExchangeDeployer, debtor, creditor1, creditor2] = await ethers.getSigners();

  const SFTContract = await ethers.deployContract("SFT", [], SFTDeployer);
  const SFTAddress = SFTContract.getAddress();
  const DebTContract = await ethers.deployContract("DebT", [SFTAddress], DebTDeployer);
  const DebTAddress = DebTContract.getAddress();
  const ExchangeContract = await ethers.deployContract("Exchange", [SFTAddress, DebTAddress], ExchangeDeployer);
  const ExchangeAddress = ExchangeContract.getAddress();

  return { SFTContract, DebTContract, ExchangeContract, SFTAddress, DebTAddress, ExchangeAddress, SFTDeployer, DebTDeployer, ExchangeDeployer, debtor, creditor1, creditor2 };
}

async function SFTPreFixture() {
  const { SFTContract, DebTContract, ExchangeContract, SFTAddress, DebTAddress, ExchangeAddress, SFTDeployer, DebTDeployer, ExchangeDeployer, debtor, creditor1, creditor2 } = await loadFixture(deployFixture);

  // 铸造SFT
  await SFTContract.connect(SFTDeployer).mint(SFTTotalSupply);
  // 为debtor转账
  await SFTContract.connect(SFTDeployer).transfer(debtor, debtorBalance);
  // 为creditor1转账，creditor1为交易所转账进行授权
  await SFTContract.connect(SFTDeployer).transfer(creditor1, creditor1Balance);
  await SFTContract.connect(creditor1).approve(ExchangeAddress, creditor1ApproveSFT);
  // 为creditor2转账，creditor2为交易所转账进行授权
  await SFTContract.connect(SFTDeployer).transfer(creditor2, creditor2Balance);
  await SFTContract.connect(creditor2).approve(ExchangeAddress, creditor2ApproveSFT);

  return { SFTContract, DebTContract, ExchangeContract, SFTAddress, DebTAddress, ExchangeAddress, SFTDeployer, DebTDeployer, ExchangeDeployer, debtor, creditor1, creditor2 };
}

async function DebTPreFixture() {
  const { SFTContract, DebTContract, ExchangeContract, SFTAddress, DebTAddress, ExchangeAddress, SFTDeployer, DebTDeployer, ExchangeDeployer, debtor, creditor1, creditor2 } = await loadFixture(SFTPreFixture);

  // 认证交易所
  await DebTContract.connect(DebTDeployer).authorizeExchange(ExchangeAddress);
  // debtor创造债务
  const listenProduce = async function (resolve) {
    DebTContract.once("Produce", function (...data) {
      resolve(data[1]);
    });
  }
  const createDebtEvent = async function () {
    await DebTContract.connect(debtor).createDebt(debtorCreatedDebt, 1, 1, 1);
  }

  const [unconfirmedDebtHash] = await watchAction([listenProduce], createDebtEvent);
  // debtor为交易所确认债权进行授权
  await DebTContract.connect(debtor).debtorApprove(ExchangeAddress, unconfirmedDebtHash, debtorApproveDebt);

  return { SFTContract, DebTContract, ExchangeContract, SFTAddress, DebTAddress, ExchangeAddress, SFTDeployer, DebTDeployer, ExchangeDeployer, debtor, creditor1, creditor2, unconfirmedDebtHash };
}

describe("Exchange Contract", function () {
  it("Test the entire process", async function () {
    const { SFTContract, DebTContract, ExchangeContract, SFTAddress, DebTAddress, ExchangeAddress, SFTDeployer, DebTDeployer, ExchangeDeployer, debtor, creditor1, creditor2, unconfirmedDebtHash } = await loadFixture(DebTPreFixture);

    // debtor发布未确权债务
    const listenUnconfirmedPublish = async function (resolve) {
      await ExchangeContract.once("Publish", function (...data) {
        resolve(data[0])
      })
    }
    const publishUnconfirmedEvent = async function () {
      await ExchangeContract.connect(debtor).publishUnconfirmed(unconfirmedDebtHash, debtorPublishAmount, 100);
    }
    const [unconfirmedProductHash] = await watchAction([listenUnconfirmedPublish], publishUnconfirmedEvent);

    // creditor1购买
    const listenConsume1 = async function(resolve) {
      await DebTContract.once("Consume", function (...data) {
        resolve(data[2]);
      });
    };
    const buyUnconfirmedEvent = async function() {
      await ExchangeContract.connect(creditor1).buy(unconfirmedProductHash);
    }
    const [confirmedDebtHash1] = await watchAction([listenConsume1], buyUnconfirmedEvent);

    // creditor1为交易所转移债权进行授权
    await DebTContract.connect(creditor1).creditorApprove(ExchangeAddress, confirmedDebtHash1, creditor1ApproveDebt);

    // creditor1发布确权债务
    const listenConfirmedPublish = async function (resolve) {
      await ExchangeContract.once("Publish", function (...data) {
        resolve(data[0])
      })
    }
    const publishConfirmedEvent = async function () {
      await ExchangeContract.connect(creditor1).publishConfirmed(confirmedDebtHash1, creditor1PublishAmount, 100);
    }
    const [confirmedProductHash] = await watchAction([listenConfirmedPublish], publishConfirmedEvent);

    // creditor2购买
    const listenConsume2 = async function(resolve) {
      await DebTContract.once("Consume", function (...data) {
        resolve(data[2]);
      });
    };
    const buyConfirmedEvent = async function() {
      await ExchangeContract.connect(creditor2).buy(confirmedProductHash);
    }
    const [confirmedDebtHash2] = await watchAction([listenConsume2], buyConfirmedEvent);
  })

  describe("product", function () {});

  describe("publishUnconfirmed", function () {});

  describe("publishConfirmed", function () {});

  describe("revokeProduct", function () {});

  describe("updateProductAmount", function () {});

  describe("updateProductUnitPrice", function () {});

  describe("buy", function () {});
});
