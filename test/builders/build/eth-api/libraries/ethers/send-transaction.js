import { assert } from 'chai';
import { ethers } from 'ethers';

describe('Ethers – Send a Transaction', function () {
  // ---- provider ----------------------------------------------------------
  const providerRPC = {
    dev: {
      name: 'moonbeam-development',
      rpc: process.env.HTTP_RPC_ENDPOINT,
      chainId: 1281, // 0x501
    },
  };
  if (!providerRPC.dev.rpc) {
    throw new Error('HTTP_RPC_ENDPOINT env var not set');
  }

  const provider = new ethers.JsonRpcProvider(providerRPC.dev.rpc, {
    chainId: providerRPC.dev.chainId,
    name: providerRPC.dev.name,
  });

  // ---- test accounts -----------------------------------------------------
  const alice = {
    address: '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac',
    pk: '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
  };
  const bob = ethers.Wallet.createRandom().address;

  // ---- balance sanity checks --------------------------------------------
  describe('Initial balances', () => {
    it('Alice should have a positive balance', async () => {
      const balWei = await provider.getBalance(alice.address);
      assert.isTrue(balWei > 0n, 'Alice should be funded');
    });

    it('Bob should start at 0', async () => {
      const balWei = await provider.getBalance(bob);
      assert.equal(balWei, 0n);
    });
  });

  // ---- transaction test --------------------------------------------------
  describe('Send transaction', () => {
    it('sends 10 GLMR to Bob and updates his balance', async function () {
      this.timeout(15000);

      const wallet = new ethers.Wallet(alice.pk, provider);

      const tx = await wallet.sendTransaction({
        to: bob,
        value: ethers.parseEther('10'),
      });
      const receipt = await tx.wait();
      assert.equal(receipt.status, 1, 'Tx should succeed');

      const bobBalWei = await provider.getBalance(bob);
      assert.equal(
        bobBalWei,
        ethers.parseEther('10'),
        'Bob should have exactly 10 GLMR',
      );
    });
  });
});