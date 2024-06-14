import { assert, expect } from 'chai';
import { ethers } from 'ethers';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { mnemonicToLegacySeed, hdEthereum } from '@polkadot/util-crypto';
import Keyring from '@polkadot/keyring';

/* These tests don't rely on the output of the calls, just that the calls
continue to work as expected */

describe('Polkadot.js API', function () {
  const alice = {
    address: '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac',
    pk: '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
    mnemonic: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
  };

  // Define index of the derivation path and the derivation path
  const index = 0;
  const ethDerPath = "m/44'/60'/0'/0/" + index;

  // Define the API
  let api;

  before(async function () {
    // Construct API provider
    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });
    await api.isReady;
  });

  describe('Querying for Information - State Queries', async () => {
    it('should return the account balance and nonce', async () => {
      const bob = ethers.Wallet.createRandom().address;
      const { nonce, data: balance } = await api.query.system.account(bob);

      assert.equal(nonce, 0n);
      assert.equal(balance.free, 0n);
    });
  });

  describe('Querying for Information - RPC Queries', async () => {
    it('should return the chain name', async () => {
      const chain = await api.rpc.system.chain();

      assert.equal(chain, 'Moonbase Development Testnet');
    });
    it('should return the last block number and hash', async () => {
      const lastHeader = await api.rpc.chain.getHeader();

      // Cannot predict the hash or block number but we can test that a value is returned
      assert.exists(lastHeader.number);
      assert.exists(lastHeader.hash);
    });
  });

  describe('Keyrings - Adding Accounts', async () => {
    it('should extract the ethereum address from the mnemonic', async () => {
      // Create a keyring instance
      const keyringECDSA = new Keyring({ type: 'ethereum' });

      // Extract Ethereum address from mnemonic
      const newPairEth = keyringECDSA.addFromUri(`${alice.mnemonic}/${ethDerPath}`);

      assert.equal(newPairEth.address, alice.address);
    });
    it('should extract the private key from the mnemonic', async () => {
      // Extract private key from mnemonic
      const privateKey = u8aToHex(
        hdEthereum(mnemonicToLegacySeed(alice.mnemonic, '', false, 64), ethDerPath).secretKey
      );

      assert.equal(privateKey, alice.pk);
    });
    it('should extract the address from the private key', async () => {
      // Create a keyring instance
      const keyringECDSA = new Keyring({ type: 'ethereum' });

      // Extract address from private key
      const otherPair = keyringECDSA.addFromUri(alice.pk);

      assert.equal(otherPair.address, alice.address);
    });
  });

  describe('Transactions - Sending Basic Transactions', async () => {
    it('should sign and send a transaction successfully', async () => {
      // Create a keyring instance
      const keyring = new Keyring({ type: 'ethereum' });

      // Initialize wallet key pairs
      const aliceFromUri = keyring.addFromUri(alice.pk);
      const bob = ethers.Wallet.createRandom().address;

      // Form the transaction
      const tx = api.tx.balances.transferAllowDeath(bob, 12345n);

      // Sign and send the transaction
      const txHash = await tx.signAndSend(aliceFromUri);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: balance } = await api.query.system.account(bob);

      assert.exists(txHash);
      assert.equal(balance.free, 12345n);
    });
  });

  describe('Transactions - Batching Transactions', async () => {
    it('should estimate the fees for a batch transaction', async () => {
      // Create a keyring instance
      const keyring = new Keyring({ type: 'ethereum' });

      // Initialize wallet key pairs
      const aliceFromUri = keyring.addFromUri(alice.pk);
      const bob = ethers.Wallet.createRandom().address;
      const charlie = ethers.Wallet.createRandom().address;

      // Construct a list of transactions to batch
      const txs = [
        api.tx.balances.transferAllowDeath(bob, 12345n),
        api.tx.balances.transferAllowDeath(charlie, 12345n),
      ];

      // Estimate the fees as RuntimeDispatchInfo, using the signer (either
      // address or locked/unlocked keypair)
      const info = await api.tx.utility.batch(txs).paymentInfo(aliceFromUri);

      expect(info.weight.refTime.toNumber()).to.be.greaterThan(0);
    });
    it('should sign and send a batch transaction successfully', async () => {
      // Create a keyring instance
      const keyring = new Keyring({ type: 'ethereum' });

      // Initialize wallet key pairs
      const aliceFromUri = keyring.addFromUri(alice.pk);
      const bob = ethers.Wallet.createRandom().address;
      const charlie = ethers.Wallet.createRandom().address;

      // Construct a list of transactions to batch
      const txs = [
        api.tx.balances.transferAllowDeath(bob, 12345n),
        api.tx.balances.transferAllowDeath(charlie, 12345n),
      ];

      // Construct the batch and send the transactions
      const txHash = await api.tx.utility.batch(txs).signAndSend(aliceFromUri);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: bobBalance } = await api.query.system.account(bob);
      const { data: charlieBalance } = await api.query.system.account(charlie);

      assert.exists(txHash);
      assert.equal(bobBalance.free, 12345n);
      assert.equal(charlieBalance.free, 12345n);
    });
  });

  after(async function () {
    api.disconnect();
  });
});
