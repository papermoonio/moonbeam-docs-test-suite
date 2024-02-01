import { assert, expect } from 'chai';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { moonbeamDev } from 'viem/chains';
import incrementerAbi from '../../../../../../contracts/incrementer-abi.json' assert { type: 'json' };
import fs from 'fs';
import solc from 'solc';

const privateKey = '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
const rpcUrl = process.env.HTTP_RPC_ENDPOINT

async function compile (){
  var source = fs.readFileSync('contracts/Incrementer.sol', 'utf8');
  var input = {
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
  var tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
  var contractFile = tempFile.contracts['Incrementer.sol']['Incrementer'];
  return contractFile
}

async function deployContract(){
  const account = privateKeyToAccount(privateKey);
  const rpcUrl = process.env.HTTP_RPC_ENDPOINT;
  const walletClient = createWalletClient({
    account,
    chain: moonbeamDev,
    transport: http(rpcUrl),
  });
  const publicClient = createPublicClient({
    chain: moonbeamDev,
    transport: http(rpcUrl),
  });

  var deploy = async () => {
    var contractFile = await compile()

    const bytecode = contractFile.evm.bytecode.object;
    const abi = contractFile.abi;
    const _initialNumber = 5;

    const contract = await walletClient.deployContract({
      abi,
      account,
      bytecode,
      args: [_initialNumber],
    });

    var transaction = await publicClient.waitForTransactionReceipt({
      hash: contract,
    });
    return transaction.contractAddress
  };
  return deploy()
}

describe('Viem - Deploy a Contract', function () {

  describe('Compile Contract - compile.js', async () => {
    it('should compile the contract into bytecode', async () => {
      var contractFile = await compile();
      const bytecode = contractFile.evm.bytecode.object;
      assert.exists(bytecode);
    });

    it('should return the correct number of ABI inputs', async () => {
      var contractFile = await compile();
      const abi = contractFile.abi;
      expect(abi).to.eql(incrementerAbi.abi);
    });
  });

  describe('Deploy Contract - deploy.js', async () => {
    it('Contract deployed on chain', async()=>{
      var contractAddress = await deployContract()
      var publicClient = createPublicClient({
        chain: moonbeamDev,
        transport: http(rpcUrl),
      });
      var code = await publicClient.getBytecode({
        address: contractAddress,
      });
      assert.exists(code);
    });
  });

  describe('Get Contract - get.js', async () => {
    it('Get current number correctly',async()=>{
      const rpcUrl = process.env.HTTP_RPC_ENDPOINT;
      const client = createPublicClient({
        chain: moonbeamDev,
        transport: http(rpcUrl),
      });

      const contractAddress = await deployContract();
      var contractFile = await compile()
      const abi = contractFile.abi;

        const data = await client.readContract({
          abi,
          functionName: 'number',
          address: contractAddress,
          args: [],
        });

        assert.equal(5,data);
        // console.log(`The current number stored is: ${data}`);
    })
  });

  describe('Increment Contract - increment.js', async () => {
    it('Number increment correctly',async()=>{
      const account = privateKeyToAccount(privateKey);
      const rpcUrl = process.env.HTTP_RPC_ENDPOINT;
      const walletClient = createWalletClient({
        account,
        chain: moonbeamDev,
        transport: http(rpcUrl),
      });

      const publicClient = createPublicClient({
        chain: moonbeamDev,
        transport: http(rpcUrl),
      });

      const contractAddress = await deployContract();
      var contractFile = await compile();
      const abi = contractFile.abi;
      var initValue = await publicClient.readContract({
        abi,
        functionName: 'number',
        address: contractAddress,
        args: [],
      });
      const _value = 3;
      const hash = await walletClient.writeContract({
          abi,
          functionName: 'increment',
          address: contractAddress,
          args: [_value],
      });

      await publicClient.waitForTransactionReceipt({
        hash,
      });

      var currValue = await publicClient.readContract({
        abi,
        functionName: 'number',
        address: contractAddress,
        args: [],
      });

      assert.equal(Number(initValue)+_value, currValue);
    })
  });

  describe('Reset Contract - reset.js', async () => {
    it('Should reset the number', async () => {
      const account = privateKeyToAccount(privateKey);
      const rpcUrl = process.env.HTTP_RPC_ENDPOINT;
      const walletClient = createWalletClient({
        account,
        chain: moonbeamDev,
        transport: http(rpcUrl),
      });
      const publicClient = createPublicClient({
        chain: moonbeamDev,
        transport: http(rpcUrl),
      });

      const contractAddress = await deployContract();
      var contractFile = await compile()
      const abi = contractFile.abi;


      var initValue = await publicClient.readContract({
        abi,
        functionName: 'number',
        address: contractAddress,
        args: [],
      });

      const _value = 3;

      var hash = await walletClient.writeContract({
          abi,
          functionName: 'increment',
          address: contractAddress,
          args: [_value],
      });

      await publicClient.waitForTransactionReceipt({
        hash,
      });

      var secValue = await publicClient.readContract({
        abi,
        functionName: 'number',
        address: contractAddress,
        args: [],
      });
      var hash = await walletClient.writeContract({
          abi,
          functionName: 'reset',
          address: contractAddress,
          args: [],
      });

      await publicClient.waitForTransactionReceipt({
        hash,
      });
      var finalValue = await publicClient.readContract({
        abi,
        functionName: 'number',
        address: contractAddress,
        args: [],
      });
      assert.equal(Number(initValue)+_value, secValue);
      assert.equal(Number(finalValue),0);
    }).timeout(30000);
  });
})