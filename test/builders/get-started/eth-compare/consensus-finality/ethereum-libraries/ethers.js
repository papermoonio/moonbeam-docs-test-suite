import { assert } from 'chai';
import { ethers } from 'ethers';

describe('Consensus & Finality - Finality with Ethereum Libraries', () => {
  // Create ethers provider
  const provider = new ethers.JsonRpcProvider(process.env.MOONBASE_HTTP_RPC_ENDPOINT, {
    chainId: 1287,
    name: 'moonbase',
  });

  const alice = {
    address: process.env.MOONBASE_TEST_PUBLIC_KEY,
    pk: process.env.MOONBASE_TEST_PRIVATE_KEY,
  };
  const bob = ethers.Wallet.createRandom().address;

  const finalizedTxHash = '0x3ea780d2e53fc265e9d251b5f41794c3d5ec4a32e854ca6562b111ec7002057e';

  /** HELPER FUNCTIONS */
  const waitForBlock = async (blockNumber, maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const block = await provider.getBlock(blockNumber);
        if (block) return block;
      } catch (error) {
        // If block not found, wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }
    throw new Error(`Block ${blockNumber} not available after ${maxAttempts} attempts`);
  };

  const sendTx = async () => {
    const wallet = new ethers.Wallet(alice.pk, provider);
    const tx = await wallet.sendTransaction({ to: bob });
    const receipt = await tx.wait();
    // Wait for the block to be available
    await waitForBlock(receipt.blockNumber);
    return tx.hash;
  };

  const getFinalizedBlockNumber = async (maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const finalizedBlockHeader = await provider.getBlock('finalized');
        if (finalizedBlockHeader) return finalizedBlockHeader.number;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error(`Could not get finalized block number after ${maxAttempts} attempts`);
  };

  const getTransactionBlockNumber = async (txHash) => {
    const txReceipt = await provider.getTransactionReceipt(txHash);
    if (!txReceipt) {
      throw new Error(`Transaction receipt not found for hash: ${txHash}`);
    }
    // Ensure block is available before returning
    await waitForBlock(txReceipt.blockNumber);
    return txReceipt.blockNumber;
  };

  const getTransactionBlockHash = async (txHash) => {
    const txReceipt = await provider.getTransactionReceipt(txHash);
    if (!txReceipt) {
      throw new Error(`Transaction receipt not found for hash: ${txHash}`);
    }
    // Ensure block is available before returning
    await waitForBlock(txReceipt.blockNumber);
    return txReceipt.blockHash;
  };

  const customWeb3Request = async (method, params, maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        return await provider.send(method, params);
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error(error.body || error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  describe('Check Transaction Finality with Ethereum Libraries - ethers.js', async () => {
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

  describe('Check Transaction Finality with Ethereum Libraries - custom-rpc/block/ethers.js', async () => {
    it('should check if the transaction block hash of a recently sent transaction has been finalized using moon_isBlockFinalized', async () => {
      // Send a transaction
      const txHash = await sendTx();
      // Get the block hash of the transaction
      const blockHash = await getTransactionBlockHash(txHash);
      // Use the block hash to check if the block is finalized
      const isFinalized = await customWeb3Request('moon_isBlockFinalized', [blockHash]);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isFalse(isFinalized);
    }).timeout(90000);

    it('should check if the transaction block hash of a finalized transaction has been finalized using moon_isBlockFinalized', async () => {
      // Get the block hash of the transaction
      const blockHash = await getTransactionBlockHash(finalizedTxHash);
      // Use the block hash to check if the block is finalized
      const isFinalized = await customWeb3Request('moon_isBlockFinalized', [blockHash]);
      // The transaction should be finalized, as it is an older transaction hash
      assert.isTrue(isFinalized);
    }).timeout(90000); // Increased from 50000 to 90000
  });

  describe('Check Transaction Finality with Ethereum Libraries - custom-rpc/tx/ethers.js', async () => {
    it('should check if the transaction hash of a recently sent transaction has been finalized using moon_isTxFinalized', async () => {
      // Send a transaction
      const txHash = await sendTx();
      // Use the transaction hash to check if the transaction is finalized
      const isFinalized = await customWeb3Request('moon_isTxFinalized', [txHash]);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isFalse(isFinalized);
    }).timeout(90000);

    it('should check if the transaction hash of a finalized transaction has been finalized using moon_isTxFinalized', async () => {
      // Use the transaction hash to check if the transaction is finalized
      const isFinalized = await customWeb3Request('moon_isTxFinalized', [finalizedTxHash]);
      // The transaction should be finalized, as it is an older transaction hash
      assert.isTrue(isFinalized);
    }).timeout(90000); // Increased from 50000 to 90000
  });
});