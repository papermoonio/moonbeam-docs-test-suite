const { expect } = require('chai');

describe('Using Hardhat to Deploy to Moonbeam', () => {
  describe('Deploying the Contract', () => {
    it('should deploy the contract successfully', async () => {
      // Deploy the contract
      const Box = await ethers.getContractFactory('Box');
      const box = await Box.deploy();
      await box.waitForDeployment();

      // Save the contract address
      const targetContractAddress = box.target;

      // Make sure that the contract has been deployed by using eth_getCode
      // and the contract address
      const code = await ethers.provider.getCode(targetContractAddress);
      expect(code).to.not.equal('0x');
    });
  });
});
