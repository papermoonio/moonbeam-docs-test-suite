import { assert } from 'chai';
import { Web3 } from 'web3';

describe('Consensus & Finality - Finality with Ethereum Libraries', () => {
  // Create Web3 provider
  const web3 = new Web3(process.env.MOONBASE_HTTP_RPC_ENDPOINT);

  const alice = {
    address: process.env.MOONBASE_TEST_PUBLIC_KEY,
    pk: process.env.MOONBASE_TEST_PRIVATE_KEY,
  };
  // Create account for bob
  const bob = web3.eth.accounts.create().address;

  const finalizedTxHash = '0x3ea780d2e53fc265e9d251b5f41794c3d5ec4a32e854ca6562b111ec7002057e';

  /** HELPER FUNCTIONS */
  const sendTx = async () => {
    const tx = {
      to: bob,
      gas: 21000,
      gasPrice: await web3.eth.getGasPrice(),
      nonce: await web3.eth.getTransactionCount(alice.address),
    };
    const createTransaction = await web3.eth.accounts.signTransaction(tx, alice.pk);
    const txHash = createTransaction.transactionHash;
    await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    return txHash;
  };
  const getFinalizedBlockNumber = async () => {
    const finalizedBlockHeader = await web3.eth.getBlock('finalized');
    return finalizedBlockHeader.number;
  };
  const getTransactionBlockNumber = async (txHash) => {
    const txReceipt = await web3.eth.getTransactionReceipt(txHash);
    return txReceipt.blockNumber;
  };
  const getTransactionBlockHash = async (txHash) => {
    const txReceipt = await web3.eth.getTransactionReceipt(txHash);
    return txReceipt.blockHash;
  };
  const customWeb3Request = async (web3Provider, method, params) => {
    try {
      return await requestPromise(web3Provider, method, params);
    } catch (error) {
      throw new Error(error);
    }
  };
  const requestPromise = async (web3Provider, method, params) => {
    return new Promise((resolve, reject) => {
      web3Provider.send(
        {
          jsonrpc: '2.0',
          id: 1,
          method,
          params,
        },
        (error, result) => {
          if (error) {
            reject(error.message);
          } else {
            if (result.error) {
              reject(result.error.message);
            }
            resolve(result);
          }
        }
      );
    });
  };

  describe('Check Transaction Finality with Etheruem Libraries - web3.js', async () => {
    it('should compare the last finalized block number with the transaction block number of a recently sent transaction', async () => {
      // Send a transaction
      const txHash = await sendTx();
      // Get the last finalized block number
      const finalizedBlockNumber = await getFinalizedBlockNumber();
      // Get the transaction block number
      const txBlockNumber = getTransactionBlockNumber(txHash);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isFalse(finalizedBlockNumber >= txBlockNumber);
    }).timeout(50000);
    it('should compare the last finalized block number with the transaction block number of a finalized transaction', async () => {
      // Get the last finalized block number
      const finalizedBlockNumber = await getFinalizedBlockNumber();
      // Get the transaction block number
      const txBlockNumber = await getTransactionBlockNumber(finalizedTxHash);
      // The transaction should be finalized, as it is an older transaction hash
      assert.isTrue(finalizedBlockNumber >= txBlockNumber);
    }).timeout(15000);
  });

  describe('Check Transaction Finality with Etheruem Libraries - custom-rpc/block/web3.js', async () => {
    it('should check if the transaction block hash of a recently sent transaction has been finalized using moon_isBlockFinalized', async () => {
      // Send a transaction
      const txHash = await sendTx();
      // Get the block hash of the transaction
      const blockHash = await getTransactionBlockHash(txHash);
      // Use the block hash to check if the block is finalized
      const isFinalized = await customWeb3Request(web3.currentProvider, 'moon_isBlockFinalized', [
        blockHash,
      ]);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isFalse(isFinalized.result);
    }).timeout(50000);
    it('should check if the transaction block hash of a recently sent transaction has been finalized using moon_isBlockFinalized', async () => {
      // Get the block hash of the transaction
      const blockHash = await getTransactionBlockHash(finalizedTxHash);
      // Use the block hash to check if the block is finalized
      const isFinalized = await customWeb3Request(web3.currentProvider, 'moon_isBlockFinalized', [
        blockHash,
      ]);
      // The transaction should not be finalized, as it is an older transaction hash
      assert.isTrue(isFinalized.result);
    }).timeout(50000);
  });

  describe('Check Transaction Finality with Etheruem Libraries - custom-rpc/tx/web3.js', async () => {
    it('should check if the transaction block hash of a recently sent transaction has been finalized using moon_isTxFinalized', async () => {
      // Send a transaction
      const txHash = await sendTx();
      // Use the transaction hash to check if the transaction is finalized
      const isFinalized = await customWeb3Request(web3.currentProvider, 'moon_isTxFinalized', [
        txHash,
      ]);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isFalse(isFinalized.result);
    }).timeout(50000);
    it('should check if the transaction block hash of a recently sent transaction has been finalized using moon_isTxFinalized', async () => {
      // Use the transaction hash to check if the transaction is finalized
      const isFinalized = await customWeb3Request(web3.currentProvider, 'moon_isTxFinalized', [
        finalizedTxHash,
      ]);
      // The transaction should not be finalized, as it is an older transaction hash
      assert.isTrue(isFinalized.result);
    }).timeout(50000);
  });
});
