const assert = require("assert/strict");
const { ethers, network } = require("hardhat");

async function increaseTime(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

function getWithdrawalEvent(receipt, payroll) {
  const parsed = receipt.logs
    .map((log) => {
      try {
        return payroll.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .find((log) => log.name === "Withdrawal");

  assert(parsed, "Withdrawal event not found");
  return parsed.args;
}

describe("CorePayroll", function () {
  async function deployFixture() {
    const [admin, employer, employee, otherEmployee, taxVault, outsider] = await ethers.getSigners();
    const CorePayroll = await ethers.getContractFactory("CorePayroll", admin);
    const payroll = await CorePayroll.deploy(taxVault.address);
    await payroll.waitForDeployment();

    await admin.sendTransaction({
      to: await payroll.getAddress(),
      value: ethers.parseEther("1"),
    });

    return { payroll, admin, employer, employee, otherEmployee, taxVault, outsider };
  }

  it("starts with deployer as both admin and employer", async function () {
    const { payroll, admin } = await deployFixture();

    assert.equal(await payroll.admin(), admin.address);
    assert.equal(await payroll.employer(), admin.address);
  });

  it("allows only admin to call setEmployer", async function () {
    const { payroll, admin, employer, outsider } = await deployFixture();

    await assert.rejects(
      payroll.connect(employer).setEmployer(employer.address),
      /Only admin can do this/
    );
    await assert.rejects(
      payroll.connect(outsider).setEmployer(outsider.address),
      /Only admin can do this/
    );

    await (await payroll.connect(admin).setEmployer(employer.address)).wait();
    assert.equal(await payroll.employer(), employer.address);
  });

  it("after reassignment, the old employer loses stream-management access", async function () {
    const { payroll, admin, employer, employee, outsider } = await deployFixture();
    const rate = 20n;

    await (await payroll.connect(admin).setEmployer(employer.address)).wait();
    await payroll.connect(employer).startStream(employee.address, rate);
    await (await payroll.connect(admin).setEmployer(outsider.address)).wait();

    await assert.rejects(
      payroll.connect(employer).stopStream(employee.address),
      /Only admin or employer can do this/
    );
    await assert.rejects(
      payroll.connect(employer).cancelStream(employee.address),
      /Only admin or employer can do this/
    );
    await assert.rejects(
      payroll.connect(employer).startStream(employee.address, rate),
      /Only admin or employer can do this/
    );
  });

  it("new employer gains start pause and cancel access", async function () {
    const { payroll, admin, employer, employee } = await deployFixture();
    const rate = 25n;

    await (await payroll.connect(admin).setEmployer(employer.address)).wait();
    await payroll.connect(employer).startStream(employee.address, rate);

    let stream = await payroll.streams(employee.address);
    assert.equal(stream.isActive, true);
    assert.equal(stream.ratePerSecond, rate);

    await increaseTime(5);
    await payroll.connect(employer).stopStream(employee.address);
    stream = await payroll.streams(employee.address);
    assert.equal(stream.isActive, false);
    assert(stream.accruedBalance >= 125n);

    await payroll.connect(employer).cancelStream(employee.address);
    stream = await payroll.streams(employee.address);
    assert.equal(stream.isActive, false);
    assert.equal(stream.ratePerSecond, 0n);
  });

  it("employer cannot call emergencyWithdraw", async function () {
    const { payroll, admin, employer } = await deployFixture();

    await (await payroll.connect(admin).setEmployer(employer.address)).wait();

    await assert.rejects(
      payroll.connect(employer).emergencyWithdraw(),
      /Only admin can do this/
    );
  });

  it("admin can still supervise stream actions after assigning a separate employer", async function () {
    const { payroll, admin, employer, employee } = await deployFixture();
    const rate = 30n;

    await (await payroll.connect(admin).setEmployer(employer.address)).wait();

    await payroll.connect(admin).startStream(employee.address, rate);
    let stream = await payroll.streams(employee.address);
    assert.equal(stream.isActive, true);
    assert.equal(stream.ratePerSecond, rate);

    await increaseTime(3);
    await payroll.connect(admin).stopStream(employee.address);
    stream = await payroll.streams(employee.address);
    assert.equal(stream.isActive, false);

    await payroll.connect(admin).startStream(employee.address, rate);
    await increaseTime(2);
    await payroll.connect(admin).cancelStream(employee.address);
    stream = await payroll.streams(employee.address);
    assert.equal(stream.isActive, false);
    assert.equal(stream.ratePerSecond, 0n);
  });

  it("keeps employee withdraw behavior unchanged across the role split", async function () {
    const { payroll, admin, employer, employee, taxVault, otherEmployee, outsider } = await deployFixture();
    const rate = 10n;

    await (await payroll.connect(admin).setEmployer(employer.address)).wait();
    await payroll.connect(employer).startStream(employee.address, rate);

    await assert.rejects(
      payroll.connect(outsider).startStream(employee.address, rate),
      /Only admin or employer can do this/
    );
    await assert.rejects(
      payroll.connect(otherEmployee).withdraw(),
      /No funds earned yet/
    );

    await increaseTime(100);
    const initialClaimable = await payroll.claimableAmount(employee.address);
    assert(initialClaimable >= 1000n);

    const startingTaxVaultBalance = await ethers.provider.getBalance(taxVault.address);
    const startingContractBalance = await ethers.provider.getBalance(await payroll.getAddress());
    const firstWithdrawReceipt = await (await payroll.connect(employee).withdraw()).wait();
    const firstWithdrawal = getWithdrawalEvent(firstWithdrawReceipt, payroll);
    const firstGross = firstWithdrawal.netAmount + firstWithdrawal.taxAmount;

    assert.equal(await payroll.claimableAmount(employee.address), 0n);
    assert.equal(
      await ethers.provider.getBalance(await payroll.getAddress()),
      startingContractBalance - firstGross
    );
    assert.equal(
      await ethers.provider.getBalance(taxVault.address),
      startingTaxVaultBalance + firstWithdrawal.taxAmount
    );

    await payroll.connect(admin).startStream(employee.address, rate);
    await increaseTime(50);
    await payroll.connect(employer).stopStream(employee.address);

    const pausedClaimable = await payroll.claimableAmount(employee.address);
    assert(pausedClaimable >= 500n);

    await increaseTime(50);
    assert.equal(await payroll.claimableAmount(employee.address), pausedClaimable);

    await payroll.connect(admin).startStream(employee.address, rate);
    await increaseTime(25);
    const resumedClaimable = await payroll.claimableAmount(employee.address);
    assert(resumedClaimable >= pausedClaimable + 250n);

    await payroll.connect(employer).cancelStream(employee.address);
    const cancelledStream = await payroll.streams(employee.address);
    assert.equal(cancelledStream.isActive, false);
    assert.equal(cancelledStream.ratePerSecond, 0n);

    const cancelledClaimable = await payroll.claimableAmount(employee.address);
    assert(cancelledClaimable >= resumedClaimable);

    await increaseTime(25);
    assert.equal(await payroll.claimableAmount(employee.address), cancelledClaimable);

    const contractBalanceBeforeSecondWithdraw = await ethers.provider.getBalance(await payroll.getAddress());
    const secondReceipt = await (await payroll.connect(employee).withdraw()).wait();
    const secondWithdrawal = getWithdrawalEvent(secondReceipt, payroll);

    assert.equal(await payroll.claimableAmount(employee.address), 0n);
    assert.equal(
      await ethers.provider.getBalance(await payroll.getAddress()),
      contractBalanceBeforeSecondWithdraw - (secondWithdrawal.netAmount + secondWithdrawal.taxAmount)
    );

    await assert.rejects(
      payroll.connect(employee).withdraw(),
      /No funds earned yet/
    );
  });
});
