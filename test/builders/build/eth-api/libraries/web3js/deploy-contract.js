import { assert } from "chai";
import Web3 from "web3";
import fs from "fs";
import solc from "solc";

describe('Web3 - Deploy a Contract', function () {
  const alice = {
    "address": "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac",
    "pk": "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
  }

  // Define network configurations
  const providerRPC = {
      development: 'http://localhost:9933',
  };
  // Create Web3 provider
  const web3 = new Web3(providerRPC.development)

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
    const incrementer = new web3.eth.Contract(abi);
    const incrementerTx = incrementer.deploy({
      data: bytecode,
      arguments: [5]
    })
    const createTransaction = await web3.eth.accounts.signTransaction(
      {
        data: incrementerTx.encodeABI(),
        gas: await incrementerTx.estimateGas()
      },
      alice.pk
    );

    const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    return createReceipt;
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
      contractAddress = contract.contractAddress;

      assert.equal(contract.status, true);
    }).timeout(15000);
    it('should return the correct contract code', async () => {
      const code = await web3.eth.getCode(contractAddress);
      assert.equal(code, "0x608060405234801561001057600080fd5b50600436106100415760003560e01c80637cf5dab0146100465780638381f58a14610062578063d826f88f14610080575b600080fd5b610060600480360381019061005b91906100eb565b61008a565b005b61006a6100a1565b6040516100779190610127565b60405180910390f35b6100886100a7565b005b806000546100989190610171565b60008190555050565b60005481565b60008081905550565b600080fd5b6000819050919050565b6100c8816100b5565b81146100d357600080fd5b50565b6000813590506100e5816100bf565b92915050565b600060208284031215610101576101006100b0565b5b600061010f848285016100d6565b91505092915050565b610121816100b5565b82525050565b600060208201905061013c6000830184610118565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061017c826100b5565b9150610187836100b5565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156101bc576101bb610142565b5b82820190509291505056fea26469706673582212205630f43904ffe3ce1948f172d4cf9a799186f43bde2c2578b4676a896d11a9b264736f6c634300080f0033");
    }).timeout(15000);
  })

  describe('Get Contract - get.js', async () => {
    it('should return the initial incrementer number', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;

      const contract = await deployContract(abi, bytecode);
      const contractAddress = contract.contractAddress;

      const incrementer = new web3.eth.Contract(abi, contractAddress);
      const data = await incrementer.methods.number().call()

      assert.equal(data.toString(), "5");
    }).timeout(5000)
  })

  describe('Increment Contract - increment.js', async () => {
    it('should return the incremented number', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;

      const contract = await deployContract(abi, bytecode);
      const contractAddress = contract.contractAddress;

      const incrementer = new web3.eth.Contract(abi, contractAddress);

      const incrementTx = incrementer.methods.increment(3);
      const createTransaction = await web3.eth.accounts.signTransaction(
        {
          to: contractAddress,
          data: incrementTx.encodeABI(),
          gas: await incrementTx.estimateGas()
        },
        alice.pk
      )

      await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
      const data = await incrementer.methods.number().call()

      assert.equal(data.toString(), "8");
    }).timeout(15000)
  })

  describe('Reset Contract - reset.js', async () => {
    it('should return the reset number', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;

      const contract = await deployContract(abi, bytecode);
      const contractAddress = contract.contractAddress;

      const incrementer = new web3.eth.Contract(abi, contractAddress);

      const incrementTx = incrementer.methods.reset();
      const createTransaction = await web3.eth.accounts.signTransaction(
        {
          to: contractAddress,
          data: incrementTx.encodeABI(),
          gas: await incrementTx.estimateGas()
        },
        alice.pk
      )

      await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
      const data = await incrementer.methods.number().call()

      assert.equal(data.toString(), "0");
    }).timeout(15000)
  })
});