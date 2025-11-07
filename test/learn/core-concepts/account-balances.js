import { assert } from 'chai';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ethers } from 'ethers';

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

  describe('Moonbeam Account Balances - Retrieve Your Balance', () => {
    it('should return the balance of a new account as 0', async () => {
      const bob = ethers.Wallet.createRandom().address; // H160 works on Moonbeam
      const { free } = await api.query.balances.account(bob);
      assert.isTrue(free.isZero(), 'New accounts should start with 0 free balance');
    });
  
    it('should show a ParachainStaking::StakingCollator freeze for Alice', async () => {
      const freezes = await api.query.balances.freezes(alice.address); // Vec<BalanceFreeze>
      assert.isAtLeast(freezes.length, 1, 'Alice should have at least one freeze');
  
      const hasCollatorFreeze = freezes.some(
        f => f.id.isParachainStaking && f.id.asParachainStaking.isStakingCollator
      );
      assert.isTrue(hasCollatorFreeze, 'Expected a ParachainStaking::StakingCollator freeze');
    });
  });

  after(async function () {
    api.disconnect();
  });
});
