import { assert, expect } from 'chai';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ethers } from 'ethers';
import { stringToHex } from '@polkadot/util';

describe('Account Balances', () => {
  const alice = {
    address: '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac',
    pk: '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
  };

  // Define the API
  let api;

  before(async function () {
    // Construct API provider
    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });
    await api.isReady;
  });

  describe('Moonbeam Account Balances - Retrieve Your Balance', async () => {
    it('should return the balance of an account', async () => {
      // Create new account
      const bob = ethers.Wallet.createRandom().address;
      // Get the balance of the new account
      const balanceData = await api.query.balances.account(bob);
      // Bob's initial balance should be 0
      const freeBalance = balanceData.toJSON().free;
      assert.equal(freeBalance, 0);
    });
    it('should return the balance locks of an account', async () => {
      // Get the balance locks for Alice
      const locksData = await api.query.balances.locks(alice.address);
      // Alice should have one balance lock since she is the default collator on dev nodes
      const collatorLock = locksData[0];
      const lockId = stringToHex('stkngcol');
      // Assert that she has a balance lock for collating
      assert.equal(lockId, collatorLock.id);
    });
  });

  after(async function () {
    api.disconnect();
  });
});
