async function main() {
  const SFT = await ethers.deployContract("SFT");
  await SFT.waitForDeployment();

  console.log('deployed to:', SFT.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
