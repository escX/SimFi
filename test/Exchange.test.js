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
const creditor1ConfirmDebt = 10000;
const creditor1ApproveDebt = 10000;
const creditor2TransferAmount = 10000;

const unconfirmedProduct = 100;
const confirmedProduct = 100;

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
  it("all", async function () {
    const { SFTContract, DebTContract, ExchangeContract, SFTAddress, DebTAddress, ExchangeAddress, SFTDeployer, DebTDeployer, ExchangeDeployer, debtor, creditor1, creditor2, unconfirmedDebtHash } = await loadFixture(DebTPreFixture);

    // debtor发布未确权债务
    const listenPublish = async function (resolve) {
      await ExchangeContract.once("Publish", function (...data) {
        resolve(data[0])
      })
    }
    const publishUnconfirmedEvent = async function () {
      await ExchangeContract.connect(debtor).publishUnconfirmed(unconfirmedDebtHash, unconfirmedProduct, 100);
    }
    const [unconfirmedProductHash] = await watchAction([listenPublish], publishUnconfirmedEvent);
    // creditor1购买
    await ExchangeContract.connect(creditor1).buy(unconfirmedProductHash);
    // // creditor1发布确权债务
    // const [confirmedProductHash] = await watchAction([async function (resolve) {
    //   await ExchangeContract.once("Publish", function (...data) {
    //     resolve(data[0])
    //   })
    // }], async function () {
    //   await ExchangeContract.connect(creditor1).publishConfirmed(confirmedDebtHash, confirmedProduct, 100);
    // });
    // // creditor2购买
    // await ExchangeContract.connect(creditor2).buy(confirmedProductHash);
  })

  describe("product", function () {
    it("", async function () {

    });
  });

  describe("publishUnconfirmed", function () {

  });

  describe("publishConfirmed", function () {
    it("", async function () {

    });
  });

  describe("revokeProduct", function () {
    it("", async function () {

    });
  });

  describe("updateProductAmount", function () {
    it("", async function () {

    });
  });

  describe("updateProductUnitPrice", function () {
    it("", async function () {

    });
  });

  describe("buy", function () {
    it("", async function () {

    });
  });
});
