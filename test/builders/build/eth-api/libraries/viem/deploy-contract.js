import { assert, expect } from 'chai';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { moonbaseAlpha } from 'viem/chains';
import incrementerAbi from '../../../../../../contracts/incrementer-abi.json' assert { type: 'json' };
import fs from 'fs';
import solc from 'solc';

const account = privateKeyToAccount('0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133');
const rpcUrl = process.env.HTTP_RPC_ENDPOINT
let contractAddress

describe('Viem - Deploy a Contract', function () {
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

    deployedBytecode = '0x' + contractFile.evm.deployedBytecode.object;

    return contractFile;
  };
  // 2. Create a wallet client for writing chain data
  const walletClient = createWalletClient({
    account,
    chain: moonbaseAlpha,
    transport: http(rpcUrl),
  });
  // 3. Create a public client for reading chain data
  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(rpcUrl),
  });

  // 4. Load contract information
  const bytecode = deployedBytecode;
  const abi = incrementerAbi;
  const _initialNumber = 5;

  describe('Compile Contract - compile.js', async () => {
    it('should compile the contract into bytecode', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      assert.exists(bytecode);
    });

    it('should return the correct number of ABI inputs', async () => {
      const contractFile = compileContract();
      const abi = contractFile.abi;
      expect(abi).to.eql(incrementerAbi.abi);
    });
  });

  describe('Deploy Contract - deploy.js', async () => {
    it('should deploy the contract', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;

      // 6. Send tx (initial value set to 5)
      const contract = await walletClient.deployContract({
        abi,
        account,
        bytecode,
        args: [_initialNumber],
      });

      const transaction = await publicClient.waitForTransactionReceipt({
        hash: contract,
      });

      contractAddress = transaction.contractAddress
      assert.exists(transaction.contractAddress);
    }).timeout(30000);

    it('should return the correct contract code', async () => {
      const code = await publicClient.getBytecode({
        address: contractAddress,
      });
      assert.equal(code, deployedBytecode);
    }).timeout(15000);
  });


  describe('Get Contract - get.js', async () => {
    it('should return the initial incrementer number', async () => {
      const contractFile = compileContract();
      const abi = contractFile.abi;
      // 5. Call contract
      const data = await publicClient.readContract({
        abi,
        functionName: 'number',
        address: contractAddress,
        args: [],
      });
      assert.equal(data.toString(), _initialNumber);
    }).timeout(5000);
  });

  describe('Increment Contract - increment.js', async () => {
    it('should return the incremented number', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;
      const _value = 3;

      // 6. Call contract
      const hash = await walletClient.writeContract({
        abi,
        functionName: 'increment',
        address: contractAddress,
        args: [_value],
      });

      // 7. Wait for the transaction receipt
      await publicClient.waitForTransactionReceipt({
        hash,
      });

      const data = await publicClient.readContract({
        abi,
        functionName: 'number',
        address: contractAddress,
        args: [],
      });

      assert.equal(data.toString(), _value + _initialNumber);
    }).timeout(30000);
  });

  describe('Reset Contract - reset.js', async () => {
    it('should return the reset number', async () => {
      const contractFile = compileContract();
      const bytecode = contractFile.evm.bytecode.object;
      const abi = contractFile.abi;

      // 6. Call contract
      const hash = await walletClient.writeContract({
        abi,
        functionName: 'reset',
        address: contractAddress,
        args: [],
      });

      // 7. Wait for the transaction receipt
      await publicClient.waitForTransactionReceipt({
        hash,
      });


      const data = await publicClient.readContract({
        abi,
        functionName: 'number',
        address: contractAddress,
        args: [],
      });

      assert.equal(data.toString(), 0);
    }).timeout(30000);
  });
});
