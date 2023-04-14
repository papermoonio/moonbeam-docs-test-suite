import { assert } from 'chai';
import { ethers, Wallet } from 'ethers';

describe('Ethers - Send a Transaction', function () {
  // Define network configurations
  const providerRPC = {
    dev: {
      name: 'moonbeam-development',
      rpc: process.env.HTTP_RPC_ENDPOINT,
      chainId: 1281, // 0x501 in hex,
    },
  };
  // Create ethers provider
  const provider = new ethers.JsonRpcProvider(providerRPC.dev.rpc, {
    chainId: providerRPC.dev.chainId,
    name: providerRPC.dev.name,
  });

  const alice = {
    address: '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac',
    pk: '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
  };
  const bob = ethers.Wallet.createRandom().address;

  describe('Check Balances -  balances.js', async () => {
    it('should return a balance for alice', async () => {
      const balance = ethers.formatEther(await provider.getBalance(alice.address));
      assert.equal(balance > 0, true);
    });
    it('should return a balance for bob', async () => {
      const balance = ethers.formatEther(await provider.getBalance(bob));
      assert.equal(balance, 0);
    });
  });

  describe('Send Transaction - transaction.js', async () => {
    it('should send a successful transaction', async () => {
      const value = 10;
      const tx = {
        to: bob,
        value: ethers.parseEther(value.toString()),
      };
      const wallet = new ethers.Wallet(alice.pk, provider);
      const res = await (await wallet.sendTransaction(tx)).wait();

      // the status of a transaction is 1 if successful
      assert.equal(res.status, 1);
    }).timeout(15000);
    it('should return an updated balance for bob', async () => {
      const balance = ethers.formatEther(await provider.getBalance(bob));
      assert.equal(balance, 10);
    });
  });
});
