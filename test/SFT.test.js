const { expect, assert } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const INIT_AMOUNT = 100;
const ALLOWANCE_AMOUNT = 200;

async function initFixture() {
  const SFTContract = await ethers.deployContract("SFT");
  const ownerAddress = await SFTContract.owner();
  const [deployer, addr1, addr2, _] = await ethers.getSigners();

  await SFTContract.mint(INIT_AMOUNT);
  await SFTContract.approve(addr1.address, ALLOWANCE_AMOUNT);

  return { SFTContract, ownerAddress, deployer, addr1, addr2 };
}

describe("SFT Contract", function () {
  describe("Constructor", function () {
    it("合约拥有者应该是部署者", async function () {
      const { ownerAddress, deployer } = await loadFixture(initFixture);

      assert.equal(ownerAddress, deployer.address);
    });
  });

  describe("transfer", function () {
    it("调用者账户余额小于转账金额时失败", async function () {
      const { SFTContract, addr1, addr2 } = await loadFixture(initFixture);
      const balanceOfCaller = await SFTContract.balanceOf(addr1.address);
      const transferAmount = balanceOfCaller + BigInt(1);

      await expect(SFTContract.connect(addr1).transfer(addr2.address, transferAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InsufficientBalance")
        .withArgs(addr1.address, balanceOfCaller, transferAmount);
    });

    it("转账金额为0时失败", async function () {
      const { SFTContract, addr1, addr2 } = await loadFixture(initFixture);
      const transferAmount = 0;

      await expect(SFTContract.connect(addr1).transfer(addr2.address, transferAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InvalidSender")
        .withArgs(addr1.address);
    });

    it("调用者账户余额应该减少，接受者账户余额应该增加", async function () {
      const { SFTContract, ownerAddress, addr2 } = await loadFixture(initFixture);
      const transferAmount = 1;

      await expect(SFTContract.transfer(addr2.address, transferAmount))
        .to.changeTokenBalances(
          SFTContract,
          [ownerAddress, addr2.address],
          [-transferAmount, transferAmount]
        );
    });

    it("应该触发Transfer事件", async function () {
      const { SFTContract, ownerAddress, addr2 } = await loadFixture(initFixture);
      const transferAmount = 1;

      await expect(SFTContract.transfer(addr2.address, transferAmount))
        .to.emit(SFTContract, "Transfer")
        .withArgs(ownerAddress, addr2.address, transferAmount);
    });
  });

  describe("approve", function () {
    it("应该更新调用者账户的授权额度数据", async function () {
      const { SFTContract, deployer, addr1 } = await loadFixture(initFixture);
      const approveAmount = 1;
      await SFTContract.approve(addr1.address, approveAmount);

      const allowanceAmount = await SFTContract.allowance(deployer.address, addr1.address);
      assert.equal(allowanceAmount, approveAmount);
    });

    it("应该触发Approval事件", async function () {
      const { SFTContract, deployer, addr1 } = await loadFixture(initFixture);
      const approveAmount = 1;

      await expect(SFTContract.approve(addr1.address, approveAmount))
        .to.emit(SFTContract, "Approval")
        .withArgs(deployer.address, addr1.address, approveAmount);
    });
  });

  describe("transferFrom", function () {
    it("调用者被授权额度小于转账金额时失败", async function () {
      const { SFTContract, deployer, addr1, addr2 } = await loadFixture(initFixture);
      const transferAmount = ALLOWANCE_AMOUNT + 1;

      await expect(SFTContract.connect(addr1).transferFrom(deployer.address, addr2.address, transferAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InsufficientAllowance")
        .withArgs(addr1.address, ALLOWANCE_AMOUNT, transferAmount);
    });

    it("发送者账户余额小于转账金额时失败", async function () {
      const { SFTContract, deployer, addr1, addr2 } = await loadFixture(initFixture);
      const transferAmount = INIT_AMOUNT + 1;
      const balanceOfSender = await SFTContract.balanceOf(deployer.address);

      await expect(SFTContract.connect(addr1).transferFrom(deployer.address, addr2.address, transferAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InsufficientBalance")
        .withArgs(deployer.address, balanceOfSender, transferAmount);
    });

    it("转账金额为0时失败", async function () {
      const { SFTContract, deployer, addr1, addr2 } = await loadFixture(initFixture);
      const transferAmount = 0;

      await expect(SFTContract.connect(addr1).transferFrom(deployer.address, addr2.address, transferAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InvalidSender")
        .withArgs(addr1.address);
    });

    it("转账成功后，发送者账户余额应该减少，接收者账户余额应该增加，同时发送者账户的授权额度更新", async function () {
      const { SFTContract, deployer, addr1, addr2 } = await loadFixture(initFixture);
      const transferAmount = 50;
      const allowanceOfSenderBefore = await SFTContract.allowance(deployer, addr1.address);

      await expect(SFTContract.connect(addr1).transferFrom(deployer.address, addr2.address, transferAmount))
        .to.changeTokenBalances(
          SFTContract,
          [deployer.address, addr2.address],
          [-transferAmount, transferAmount]
        );

      const allowanceOfSenderAfter = await SFTContract.allowance(deployer, addr1.address);

      assert.equal(allowanceOfSenderBefore, allowanceOfSenderAfter + BigInt(transferAmount));
    });

    it("应该触发Transfer事件", async function () {
      const { SFTContract, deployer, addr1, addr2 } = await loadFixture(initFixture);
      const transferAmount = 50;

      await expect(SFTContract.connect(addr1).transferFrom(deployer.address, addr2.address, transferAmount))
        .to.emit(SFTContract, "Transfer")
        .withArgs(deployer.address, addr2.address, transferAmount);
    });
  });

  describe("mint", function () {
    it("合约拥有者账户余额应该增加，总供应量应该增加", async function () {
      const { SFTContract, ownerAddress } = await loadFixture(initFixture);
      const mintAmount = 100;
      const supplyBefore = await SFTContract.totalSupply();

      await expect(SFTContract.mint(mintAmount))
        .to.changeTokenBalance(SFTContract, ownerAddress, mintAmount);

      const supplyAfter = await SFTContract.totalSupply();

      assert.equal(supplyAfter, supplyBefore + BigInt(mintAmount));
    });

    it("应该触发Transfer事件", async function () {
      const { SFTContract, ownerAddress } = await loadFixture(initFixture);
      const mintAmount = 100;

      await expect(SFTContract.mint(mintAmount))
        .to.emit(SFTContract, "Transfer")
        .withArgs(ZERO_ADDRESS, ownerAddress, mintAmount);
    });
  });

  describe("burn", function () {
    it("合约拥有者账户余额小于销毁数量时失败", async function () {
      const { SFTContract, ownerAddress } = await loadFixture(initFixture);
      const balanceOfOwner = await SFTContract.balanceOf(ownerAddress);
      const burnAmount = INIT_AMOUNT + 1;

      await expect(SFTContract.burn(burnAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InsufficientBalance")
        .withArgs(ownerAddress, balanceOfOwner, burnAmount);
    });

    it("合约拥有者账户余额应该减少，总供应量应该减少", async function () {
      const { SFTContract, ownerAddress } = await loadFixture(initFixture);
      const burnAmount = 1;
      const supplyBefore = await SFTContract.totalSupply();

      await expect(SFTContract.burn(burnAmount))
        .to.changeTokenBalance(SFTContract, ownerAddress, -burnAmount);

      const supplyAfter = await SFTContract.totalSupply();

      assert.equal(supplyBefore, supplyAfter + BigInt(burnAmount));
    });

    it("应该触发Transfer事件", async function () {
      const { SFTContract, ownerAddress } = await loadFixture(initFixture);
      const burnAmount = 1;

      await expect(SFTContract.burn(burnAmount))
        .to.emit(SFTContract, "Transfer")
        .withArgs(ownerAddress, ZERO_ADDRESS, burnAmount);
    });
  });
})
