import { assert } from 'chai';
import { ethers } from 'ethers';
import { ApiPromise, WsProvider } from '@polkadot/api';

describe('Consensus & Finality - Finality with Substrate Libraries', () => {
  const alice = {
    address: process.env.MOONBASE_TEST_PUBLIC_KEY,
    pk: process.env.MOONBASE_TEST_PRIVATE_KEY,
  };
  const finalizedTxHash = '0x3ea780d2e53fc265e9d251b5f41794c3d5ec4a32e854ca6562b111ec7002057e';

  /** HELPER FUNCTIONS */
  // Define the API
  let api;

  before(async function () {
    // Construct API provider
    const wsProvider = new WsProvider(process.env.MOONBASE_WSS_RPC_ENDPOINT);
    api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });
    await api.isReady;
  });

  const sendTx = async () => {
    const provider = new ethers.JsonRpcProvider(process.env.MOONBASE_HTTP_RPC_ENDPOINT, {
      chainId: 1287,
      name: 'moonbase',
    });
    const wallet = new ethers.Wallet(alice.pk, provider);
    const bob = ethers.Wallet.createRandom().address;
    const tx = await wallet.sendTransaction({ to: bob });
    await tx.wait();
    return tx.hash;
  };
  const getFinalizedBlockNumber = async (api) => {
    // Get the latest finalized block of the Substrate chain
    const finalizedHeadHash = (await api.rpc.chain.getFinalizedHead()).toJSON();
    // Get finalized block header to retrieve number
    const finalizedBlockHeader = (await api.rpc.chain.getHeader(finalizedHeadHash)).toJSON();
    return finalizedBlockHeader.number;
  };
  const getTransactionBlockNumber = async (api, txHash) => {
    // Get the transaction receipt of the given tx hash
    const txReceipt = (await api.rpc.eth.getTransactionReceipt(txHash)).toJSON();
    return txReceipt.blockNumber;
  };

  describe('Check Transaction Finality with Substrate Libraries - polkadot.js', () => {
    it('should compare the last finalized block number with the transaction block number of a recently sent transaction', async () => {
      // Send a transaction
      const txHash = await sendTx();
      // Get the last finalized block number
      const finalizedBlockNumber = await getFinalizedBlockNumber(api);
      // Get the transaction block number
      const txBlockNumber = await getTransactionBlockNumber(api, txHash);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isFalse(finalizedBlockNumber >= txBlockNumber);
    }).timeout(75000);
    it('should compare the last finalized block number with the transaction block number of a finalized transaction', async () => {
      // Get the last finalized block number
      const finalizedBlockNumber = await getFinalizedBlockNumber(api);
      // Get the transaction block number
      const txBlockNumber = await getTransactionBlockNumber(api, finalizedTxHash);
      // The transaction should not yet be finalized, as the transaction was just sent
      assert.isTrue(finalizedBlockNumber >= txBlockNumber);
    });
  });

  after(async function () {
    api.disconnect();
  });
});
