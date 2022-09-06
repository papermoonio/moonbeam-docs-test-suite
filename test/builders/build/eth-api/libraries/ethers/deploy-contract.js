import { assert } from "chai";
import { ethers } from "ethers";
import fs from "fs";
import solc from "solc";

describe('Ethers - Deploy a Contract', function () {
  const alice = {
    "address": "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac",
    "pk": "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
  }

  // Define network configurations
  const providerRPC = {
    dev: {
      name: 'moonbeam-development',
      rpc: process.env.RPC_ENDPOINT,
      chainId: 1281, // 0x501 in hex,
    },
  };
  // Create ethers provider
  const provider = new ethers.providers.StaticJsonRpcProvider(
    providerRPC.dev.rpc,
    {
      chainId: providerRPC.dev.chainId,
      name: providerRPC.dev.name,
    }
  );

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
      },
    };

    const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
    const contractFile = tempFile.contracts['Incrementer.sol']['Incrementer'];

    return contractFile;
  }

  const deployContract = async (abi, bytecode) => {
    let wallet = new ethers.Wallet(alice.pk, provider);

    const incrementer = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await incrementer.deploy([5]);
    
    return contract;
  }

  describe('Compile Contract - compile.js', async () => {
    it('should compile the contract into bytecode', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;

      assert.exists(bytecode);
    });

    it('should return the correct number of ABI inputs', async () => {
      const contractFile = compileContract();
      const abi = contractFile.abi;

      assert.lengthOf(abi, 4);
    })
  });

  describe('Deploy Contract - deploy.js', async () => {
    let contractAddress;
    it('should deploy the contract', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;

      const contract = await deployContract(abi, bytecode);
      const res = await (await contract.deployed()).deployTransaction.wait();

      contractAddress = res.contractAddress;

      assert.equal(res.status, 1);
    }).timeout(15000);
    it('should return the correct contract code', async () => {
      const code = await provider.getCode(contractAddress);
      assert.equal(code, "0x608060405234801561001057600080fd5b50600436106100415760003560e01c80637cf5dab0146100465780638381f58a14610062578063d826f88f14610080575b600080fd5b610060600480360381019061005b91906100eb565b61008a565b005b61006a6100a1565b6040516100779190610127565b60405180910390f35b6100886100a7565b005b806000546100989190610171565b60008190555050565b60005481565b60008081905550565b600080fd5b6000819050919050565b6100c8816100b5565b81146100d357600080fd5b50565b6000813590506100e5816100bf565b92915050565b600060208284031215610101576101006100b0565b5b600061010f848285016100d6565b91505092915050565b610121816100b5565b82525050565b600060208201905061013c6000830184610118565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061017c826100b5565b9150610187836100b5565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156101bc576101bb610142565b5b82820190509291505056fea26469706673582212205630f43904ffe3ce1948f172d4cf9a799186f43bde2c2578b4676a896d11a9b264736f6c634300080f0033");
    }).timeout(15000);
  })

  describe('Get Contract - get.js', async () => {
    it('should return the initial incrementer number', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;

      const contract = await deployContract(abi, bytecode);
      const contractAddress = contract.address;

      const wallet = new ethers.Wallet(alice.pk, provider);
      const incrementer = new ethers.Contract(contractAddress, abi, wallet);

      const data = await incrementer.number();

      assert.equal(data.toString(), "5");
    }).timeout(5000)
  })

  describe('Increment Contract - increment.js', async () => {
    it('should return the incremented number', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;
  
      const contract = await deployContract(abi, bytecode);
      const contractAddress = contract.address;

      const wallet = new ethers.Wallet(alice.pk, provider);
      const incrementer = new ethers.Contract(contractAddress, abi, wallet);

      await (await incrementer.increment(2)).wait();
      const data = await incrementer.number();

      assert.equal(data.toString(), "7");
    }).timeout(15000)
  })

  describe('Reset Contract - reset.js', async () => {
    it('should return the reset number', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;
  
      const contract = await deployContract(abi, bytecode);
      const contractAddress = contract.address;

      const wallet = new ethers.Wallet(alice.pk, provider);
      const incrementer = new ethers.Contract(contractAddress, abi, wallet);

      await (await incrementer.reset()).wait();
      const data = await incrementer.number();

      assert.equal(data.toString(), "0");
    }).timeout(15000)
  })
});