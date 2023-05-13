import { assert, expect } from 'chai';
import { ethers } from 'ethers';
import incrementerAbi from '../../../../../../contracts/incrementer-abi.json' assert { type: 'json' };
import fs from 'fs';
import solc from 'solc';

describe('Ethers - Deploy a Contract', function () {
  const alice = {
    address: '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac',
    pk: '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
  };

  // Define network configurations
  const providerRPC = {
    dev: {
      name: 'moonbeam-development',
      rpc: process.env.HTTP_RPC_ENDPOINT,
      chainId: 1281, // 0x501 in hex,
    },
  };
  // Create ethers provider
  const provider = new ethers.JsonRpcProvider(providerRPC.dev.rpc, {
    chainId: providerRPC.dev.chainId,
    name: providerRPC.dev.name,
  });

  let deployedBytecode;
  const compileContract = () => {
    const source = fs.readFileSync('contracts/Incrementer.sol', 'utf8');
    const input = {
      language: 'Solidity',
      sources: {
        'Incrementer.sol': {
          content: source,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*'],
          },
        },
        evmVersion: 'london',
      },
    };

    const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
    const contractFile = tempFile.contracts['Incrementer.sol']['Incrementer'];

    deployedBytecode = '0x' + contractFile.evm.deployedBytecode.object;

    return contractFile;
  };

  const deployContract = async (abi, bytecode) => {
    let wallet = new ethers.Wallet(alice.pk, provider);

    const incrementer = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await incrementer.deploy(5);
    return contract;
  };

  describe('Compile Contract - compile.js', async () => {
    it('should compile the contract into bytecode', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;

      assert.exists(bytecode);
    });

    it('should return the ABI', async () => {
      const contractFile = compileContract();
      const abi = contractFile.abi;

      expect(abi).to.eql(incrementerAbi.abi);
    });
  });

  describe('Deploy Contract - deploy.js', async () => {
    it('should deploy the contract successfully', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;
      const contract = await deployContract(abi, bytecode);
      const res = await contract.deploymentTransaction().wait();

      assert.equal(res.status, 1);
    }).timeout(15000);

    it('should return the correct deployed bytecode', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;

      const contract = await deployContract(abi, bytecode);
      await contract.deploymentTransaction().wait();
      const deployedCode = await contract.getDeployedCode();

      assert.equal(deployedCode, deployedBytecode);
    }).timeout(15000);
  });

  describe('Get Contract - get.js', async () => {
    it('should return the initial incrementer number', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;

      const contract = await deployContract(abi, bytecode);
      const res = await contract.deploymentTransaction().wait();

      const incrementer = new ethers.Contract(res.contractAddress, abi, provider);

      const data = await incrementer.number();

      assert.equal(data.toString(), '5');
    }).timeout(5000);
  });

  describe('Increment Contract - increment.js', async () => {
    it('should return the incremented number', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;

      const contract = await deployContract(abi, bytecode);
      const res = await contract.deploymentTransaction().wait();

      const wallet = new ethers.Wallet(alice.pk, provider);
      const incrementer = new ethers.Contract(res.contractAddress, abi, wallet);

      await (await incrementer.increment(2)).wait();
      const data = await incrementer.number();

      assert.equal(data.toString(), '7');
    }).timeout(15000);
  });

  describe('Reset Contract - reset.js', async () => {
    it('should return the reset number', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;

      const contract = await deployContract(abi, bytecode);
      const res = await contract.deploymentTransaction().wait();

      const wallet = new ethers.Wallet(alice.pk, provider);
      const incrementer = new ethers.Contract(res.contractAddress, abi, wallet);

      await (await incrementer.reset()).wait();
      const data = await incrementer.number();

      assert.equal(data.toString(), '0');
    }).timeout(15000);
  });
});
