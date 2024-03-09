const { expect, assert } = require("chai");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("SFT Contract", function () {
  let SFTContract, ownerAddress, deployer, addr1, addr2;

  beforeEach(async function () {
    SFTContract = await ethers.deployContract("SFT");
    ownerAddress = await SFTContract.owner();
    [deployer, addr1, addr2, _] = await ethers.getSigners();
  });

  describe("Constructor", function () {
    it("合约拥有者应该是部署者", async function () {
      assert.equal(ownerAddress, deployer.address)
    });
  });

  describe("transfer", function () {
    it("调用者账户余额小于转账金额时失败", async function () {
      const balanceOfCaller = await SFTContract.balanceOf(addr1.address);
      const transferAmount = balanceOfCaller + BigInt(1);

      await expect(SFTContract.connect(addr1).transfer(addr2.address, transferAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InsufficientBalance")
        .withArgs(addr1.address, balanceOfCaller, transferAmount);
    });

    it("转账金额为0时失败", async function () {
      const transferAmount = 0;

      await expect(SFTContract.connect(addr1).transfer(addr2.address, transferAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InvalidSender")
        .withArgs(addr1.address);
    });

    it("调用者账户余额应该减少，接受者账户余额应该增加", async function () {
      const transferAmount = 1;

      await SFTContract.mint(100);
      const balanceOfOwnerBefore = await SFTContract.balanceOf(ownerAddress);
      const balanceOfReceiverBefore = await SFTContract.balanceOf(addr2.address);

      await SFTContract.transfer(addr2.address, transferAmount);
      const balanceOfOwnerAfter = await SFTContract.balanceOf(ownerAddress);
      const balanceOfReceiverAfter = await SFTContract.balanceOf(addr2.address);

      assert.equal(balanceOfOwnerAfter, balanceOfOwnerBefore - BigInt(transferAmount));
      assert.equal(balanceOfReceiverAfter, balanceOfReceiverBefore + BigInt(transferAmount));
    });

    it("应该触发Transfer事件", async function () {
      const transferAmount = 1;

      await SFTContract.mint(100);
      await expect(SFTContract.transfer(addr2.address, transferAmount))
        .to.emit(SFTContract, "Transfer")
        .withArgs(ownerAddress, addr2.address, transferAmount);
    });
  });

  describe("approve", function () {
    it("应该更新调用者账户的授权额度数据", async function () {
      const approveAmount = 1;
      await SFTContract.approve(addr1.address, approveAmount);

      const allowanceAmount = await SFTContract.allowance(deployer.address, addr1.address);
      assert.equal(allowanceAmount, approveAmount);
    });

    it("应该触发Approval事件", async function () {
      const approveAmount = 1;

      await expect(SFTContract.approve(addr1.address, approveAmount))
        .to.emit(SFTContract, "Approval")
        .withArgs(deployer.address, addr1.address, approveAmount);
    });
  });

  describe("transferFrom", function () {
    const initAmount = 100;
    const allowanceAmount = 200;

    beforeEach(async function () {
      await SFTContract.mint(initAmount);
      await SFTContract.approve(addr1.address, allowanceAmount);
    });

    it("调用者被授权额度小于转账金额时失败", async function () {
      const transferAmount = allowanceAmount + 1;

      await expect(SFTContract.connect(addr1).transferFrom(deployer.address, addr2.address, transferAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InsufficientAllowance")
        .withArgs(addr1.address, allowanceAmount, transferAmount);
    });

    it("发送者账户余额小于转账金额时失败", async function () {
      const transferAmount = initAmount + 1;
      const balanceOfSender = await SFTContract.balanceOf(deployer.address);

      await expect(SFTContract.connect(addr1).transferFrom(deployer.address, addr2.address, transferAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InsufficientBalance")
        .withArgs(deployer.address, balanceOfSender, transferAmount);
    });

    it("转账金额为0时失败", async function () {
      const transferAmount = 0;

      await expect(SFTContract.connect(addr1).transferFrom(deployer.address, addr2.address, transferAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InvalidSender")
        .withArgs(addr1.address);
    });

    it("转账成功后，发送者账户余额应该减少，接收者账户余额应该增加，同时发送者账户的授权额度更新", async function () {
      const transferAmount = 50;
      const balanceOfSenderBefore = await SFTContract.balanceOf(deployer.address);
      const balanceOfReceiverBefore = await SFTContract.balanceOf(addr2.address);
      const allowanceOfSenderBefore = await SFTContract.allowance(deployer, addr1.address);

      await SFTContract.connect(addr1).transferFrom(deployer.address, addr2.address, transferAmount);
      const balanceOfSenderAfter = await SFTContract.balanceOf(deployer.address);
      const balanceOfReceiverAfter = await SFTContract.balanceOf(addr2.address);
      const allowanceOfSenderAfter = await SFTContract.allowance(deployer, addr1.address);

      assert.equal(balanceOfSenderBefore, balanceOfSenderAfter + BigInt(transferAmount));
      assert.equal(balanceOfReceiverBefore, balanceOfReceiverAfter - BigInt(transferAmount));
      assert.equal(allowanceOfSenderBefore, allowanceOfSenderAfter + BigInt(transferAmount));
    });

    it("应该触发Transfer事件", async function () {
      const transferAmount = 50;

      await expect(SFTContract.connect(addr1).transferFrom(deployer.address, addr2.address, transferAmount))
        .to.emit(SFTContract, "Transfer")
        .withArgs(deployer.address, addr2.address, transferAmount);
    });
  });

  describe("mint", function () {
    it("合约拥有者账户余额应该增加，总供应量应该增加", async function () {
      const mintAmount = 100;
      const balanceOfOwnerBefore = await SFTContract.balanceOf(ownerAddress);
      const supplyBefore = await SFTContract.totalSupply();

      await SFTContract.mint(mintAmount);
      const balanceOfOwnerAfter = await SFTContract.balanceOf(ownerAddress);
      const supplyAfter = await SFTContract.totalSupply();

      assert.equal(balanceOfOwnerAfter, balanceOfOwnerBefore + BigInt(mintAmount));
      assert.equal(supplyAfter, supplyBefore + BigInt(mintAmount));
    });

    it("应该触发Transfer事件", async function () {
      const mintAmount = 100;

      await expect(SFTContract.mint(mintAmount))
        .to.emit(SFTContract, "Transfer")
        .withArgs(ZERO_ADDRESS, ownerAddress, mintAmount);
    });
  });

  describe("burn", function () {
    const initAmount = 100;

    beforeEach(async function () {
      await SFTContract.mint(initAmount);
    });

    it("合约拥有者账户余额小于销毁数量时失败", async function () {
      const balanceOfOwner = await SFTContract.balanceOf(ownerAddress);
      const burnAmount = initAmount + 1;

      await expect(SFTContract.burn(burnAmount))
        .to.be.revertedWithCustomError(SFTContract, "ERC20InsufficientBalance")
        .withArgs(ownerAddress, balanceOfOwner, burnAmount);
    });

    it("合约拥有者账户余额应该减少，总供应量应该减少", async function () {
      const burnAmount = 1;
      const balanceOfOwnerBefore = await SFTContract.balanceOf(ownerAddress);
      const supplyBefore = await SFTContract.totalSupply();

      await SFTContract.burn(burnAmount);
      const balanceOfOwnerAfter = await SFTContract.balanceOf(ownerAddress);
      const supplyAfter = await SFTContract.totalSupply();

      assert.equal(balanceOfOwnerBefore, balanceOfOwnerAfter + BigInt(burnAmount));
      assert.equal(supplyBefore, supplyAfter + BigInt(burnAmount));
    });

    it("应该触发Transfer事件", async function () {
      const burnAmount = 1;

      await expect(SFTContract.burn(burnAmount))
        .to.emit(SFTContract, "Transfer")
        .withArgs(ownerAddress, ZERO_ADDRESS, burnAmount);
    });
  });
})
