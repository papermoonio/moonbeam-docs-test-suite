// scripts/deploy.js
async function main() {
  // 1. Get the contract to deploy
  const Box = await ethers.getContractFactory('Box');
  // 2. Instantiating a new Box smart contract
  const box = await Box.deploy();
  // 3. Waiting for the deployment to resolve
  await box.waitForDeployment();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
