import { assert } from 'chai';
import { ethers } from 'ethers';

describe('Consensus & Finality - Finality with Ethereum Libraries', function () {
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
  const sendTx = async () => {
    const wallet = new ethers.Wallet(alice.pk, provider);
    const tx = await wallet.sendTransaction({ to: bob });
    await tx.wait();
    return tx.hash;
  };
  const getFinalizedBlockNumber = async () => {
    const finalizedBlockHeader = await provider.getBlock('finalized');
    return finalizedBlockHeader.number;
  };
  const getTransactionBlockNumber = async (txHash) => {
    const txReceipt = await provider.getTransactionReceipt(txHash);
    return txReceipt.blockNumber;
  };
  const getTransactionBlockHash = async (txHash) => {
    const txReceipt = await provider.getTransactionReceipt(txHash);
    return txReceipt.blockHash;
  };
  const customWeb3Request = async (method, params) => {
    try {
      return await provider.send(method, params);
    } catch (error) {
      throw new Error(error.body);
    }
  };

  describe('Check Transaction Finality with Etheruem Libraries -  ethers.js', async () => {
    it('should compare the last finalized block number with the transaction block number of a recently sent transaction', async function () {
      // Send a transaction
      const txHash = await sendTx();
      // Get the last finalized block number
      const finalizedBlockNumber = await getFinalizedBlockNumber();
      // Get the transaction block number
      const txBlockNumber = getTransactionBlockNumber(txHash);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isFalse(finalizedBlockNumber >= txBlockNumber);
    }).timeout(50000);
    it('should compare the last finalized block number with the transaction block number of a finalized transaction', async function () {
      // Get the last finalized block number
      const finalizedBlockNumber = await getFinalizedBlockNumber();
      // Get the transaction block number
      const txBlockNumber = await getTransactionBlockNumber(finalizedTxHash);
      // The transaction should be finalized, as it is an older transaction hash
      assert.isTrue(finalizedBlockNumber >= txBlockNumber);
    }).timeout(15000);
  });

  describe('Check Transaction Finality with Etheruem Libraries -  custom-rpc/ethers.js', async () => {
    it('should check if the transaction block hash of a recently sent transaction has been finalized using moon_isBlockFinalized', async function () {
      // Send a transaction
      const txHash = await sendTx();
      // Get the block hash of the transaction
      const blockHash = await getTransactionBlockHash(txHash);
      // Use the block hash to check if the block is finalized
      const isFinalized = await customWeb3Request('moon_isBlockFinalized', [blockHash]);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isFalse(isFinalized);
    }).timeout(50000);
    it('should check if the transaction block hash of a recently sent transaction has been finalized using moon_isBlockFinalized', async function () {
      // Get the block hash of the transaction
      const blockHash = await getTransactionBlockHash(finalizedTxHash);
      // Use the block hash to check if the block is finalized
      const isFinalized = await customWeb3Request('moon_isBlockFinalized', [blockHash]);
      // The transaction should not be finalized, as it is an older transaction hash
      assert.isTrue(isFinalized);
    }).timeout(50000);
  });
});
