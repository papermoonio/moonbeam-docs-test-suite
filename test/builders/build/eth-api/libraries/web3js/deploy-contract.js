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
      },
    };

    const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
    const contractFile = tempFile.contracts['Incrementer.sol']['Incrementer'];

    deployedBytecode = '0x' + contractFile.evm.deployedBytecode.object

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
      assert.equal(code, deployedBytecode);
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




