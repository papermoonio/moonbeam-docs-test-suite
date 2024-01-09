import { assert } from 'chai';

describe('Using Hardhat to Deploy to Moonbeam', () => {
  describe('Interact with the Contract', () => {
    const deployContract = async (contract) => {
      const box = await contract.deploy();
      await box.waitForDeployment();
      return box.target;
    };
    it('should set the contract value successfully', async () => {
      // Deploy the contract
      const Box = await ethers.getContractFactory('Box');
      const deployedAddress = await deployContract(Box);
      const box = await Box.attach(deployedAddress);

      const value = 2;
      // Store a new value
      await box.store(value);

      // Retrieve the value
      const storedValue = await box.retrieve();

      assert.equal(value, storedValue);
    });
  });
});
