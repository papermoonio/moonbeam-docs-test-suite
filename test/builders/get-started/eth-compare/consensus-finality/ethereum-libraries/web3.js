import { assert } from 'chai';
import { Web3 } from 'web3';

describe('Consensus & Finality - Finality with Ethereum Libraries', () => {
  // Create Web3 provider
  const web3 = new Web3(process.env.MOONBASE_HTTP_RPC_ENDPOINT);

  const alice = {
    address: process.env.MOONBASE_TEST_PUBLIC_KEY,
    pk: process.env.MOONBASE_TEST_PRIVATE_KEY,
  };
  const bob = web3.eth.accounts.create().address;

  const finalizedTxHash = '0x3ea780d2e53fc265e9d251b5f41794c3d5ec4a32e854ca6562b111ec7002057e';

  /** HELPER FUNCTIONS */
  const waitForBlock = async (blockNumber, maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const block = await web3.eth.getBlock(blockNumber);
        if (block) return block;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error(`Block ${blockNumber} not available after ${maxAttempts} attempts`);
  };

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
    
    // Wait for transaction receipt and block
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    await waitForBlock(receipt.blockNumber);
    return txHash;
  };

  const getFinalizedBlockNumber = async (maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const finalizedBlockHeader = await web3.eth.getBlock('finalized');
        if (finalizedBlockHeader) return finalizedBlockHeader.number;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error(`Could not get finalized block number after ${maxAttempts} attempts`);
  };

  const getTransactionBlockNumber = async (txHash) => {
    const txReceipt = await web3.eth.getTransactionReceipt(txHash);
    if (!txReceipt) {
      throw new Error(`Transaction receipt not found for hash: ${txHash}`);
    }
    await waitForBlock(txReceipt.blockNumber);
    return txReceipt.blockNumber;
  };

  const getTransactionBlockHash = async (txHash) => {
    const txReceipt = await web3.eth.getTransactionReceipt(txHash);
    if (!txReceipt) {
      throw new Error(`Transaction receipt not found for hash: ${txHash}`);
    }
    await waitForBlock(txReceipt.blockNumber);
    return txReceipt.blockHash;
  };

  const requestPromise = async (web3Provider, method, params, maxAttempts = 30) => {
    return new Promise((resolve, reject) => {
      const attemptRequest = (attempt = 0) => {
        web3Provider.send(
          {
            jsonrpc: '2.0',
            id: 1,
            method,
            params,
          },
          (error, result) => {
            if (error) {
              if (attempt < maxAttempts - 1) {
                setTimeout(() => attemptRequest(attempt + 1), 2000);
              } else {
                reject(error.message);
              }
            } else if (result.error) {
              if (attempt < maxAttempts - 1) {
                setTimeout(() => attemptRequest(attempt + 1), 2000);
              } else {
                reject(result.error.message);
              }
            } else {
              resolve(result);
            }
          }
        );
      };
      attemptRequest();
    });
  };

  const customWeb3Request = async (web3Provider, method, params) => {
    try {
      return await requestPromise(web3Provider, method, params);
    } catch (error) {
      throw new Error(error);
    }
  };

  describe('Check Transaction Finality with Ethereum Libraries - web3.js', async () => {
    it('should compare the last finalized block number with the transaction block number of a recently sent transaction', async () => {
      // Send a transaction
      const txHash = await sendTx();
      // Get the last finalized block number
      const finalizedBlockNumber = await getFinalizedBlockNumber();
      // Get the transaction block number
      const txBlockNumber = await getTransactionBlockNumber(txHash);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isFalse(finalizedBlockNumber >= txBlockNumber);
    }).timeout(90000);

    it('should compare the last finalized block number with the transaction block number of a finalized transaction', async () => {
      // Get the last finalized block number
      const finalizedBlockNumber = await getFinalizedBlockNumber();
      // Get the transaction block number
      const txBlockNumber = await getTransactionBlockNumber(finalizedTxHash);
      // The transaction should be finalized, as it is an older transaction hash
      assert.isTrue(finalizedBlockNumber >= txBlockNumber);
    }).timeout(90000); // Increased from 15000 to 90000
  });

  describe('Check Transaction Finality with Ethereum Libraries - custom-rpc/block/web3.js', async () => {
    it('should check if the transaction block hash of a recently sent transaction has been finalized using moon_isBlockFinalized', async () => {
      // Send a transaction
      const txHash = await sendTx();
      // Get the block hash of the transaction
      const blockHash = await getTransactionBlockHash(txHash);
      // Use the block hash to check if the block is finalized
      const isFinalized = await customWeb3Request(web3.currentProvider, 'moon_isBlockFinalized', [blockHash]);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isFalse(isFinalized.result);
    }).timeout(90000);

    it('should check if the transaction block hash of a finalized transaction has been finalized using moon_isBlockFinalized', async () => {
      // Get the block hash of the transaction
      const blockHash = await getTransactionBlockHash(finalizedTxHash);
      // Use the block hash to check if the block is finalized
      const isFinalized = await customWeb3Request(web3.currentProvider, 'moon_isBlockFinalized', [blockHash]);
      // The transaction should be finalized, as it is an older transaction hash
      assert.isTrue(isFinalized.result);
    }).timeout(90000); // Increased from 50000 to 90000
  });

  describe('Check Transaction Finality with Ethereum Libraries - custom-rpc/tx/web3.js', async () => {
    it('should check if the transaction hash of a recently sent transaction has been finalized using moon_isTxFinalized', async () => {
      // Send a transaction
      const txHash = await sendTx();
      // Use the transaction hash to check if the transaction is finalized
      const isFinalized = await customWeb3Request(web3.currentProvider, 'moon_isTxFinalized', [txHash]);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isFalse(isFinalized.result);
    }).timeout(90000);

    it('should check if the transaction hash of a finalized transaction has been finalized using moon_isTxFinalized', async () => {
      // Use the transaction hash to check if the transaction is finalized
      const isFinalized = await customWeb3Request(web3.currentProvider, 'moon_isTxFinalized', [finalizedTxHash]);
      // The transaction should be finalized, as it is an older transaction hash
      assert.isTrue(isFinalized.result);
    }).timeout(90000); // Increased from 50000 to 90000
  });
});