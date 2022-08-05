import { assert } from "chai";
import { ethers } from "ethers";

describe('Ethers - Send a Transaction', function () {
  let alice = {
    "address": "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac",
    "pk": "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
  }
  let bob = "0x3Cd0A705a2DC65e5b1E1205896BaA2be8A07c6e0"

  // Define network configurations
  const providerRPC = {
    dev: {
      name: 'moonbeam-development',
      rpc: process.env.RPC_ENDPOINT,
      chainId: 1281, // 0x501 in hex,
    },
  };
  // Create ethers provider
  const provider = new ethers.providers.StaticJsonRpcProvider(
    providerRPC.dev.rpc,
    {
      chainId: providerRPC.dev.chainId,
      name: providerRPC.dev.name,
    }
  );

  describe('Check Balances -  balances.js', async () => {
    it('should return a balance for alice', async () => {
      const balance = ethers.utils.formatEther(await provider.getBalance(alice.address));
      assert.equal(balance > 0, true);
    });
  });

  describe('Send Transaction - transaction.js', async () => {
    it('should send a successful transaction', async () => {
      const value = 10;
      const tx = {
        to: bob,
        value: ethers.utils.parseEther(value.toString()),
      }
      const wallet = new ethers.Wallet(alice.pk, provider);
      const res = await (await wallet.sendTransaction(tx)).wait();

      // the status of a transaction is 1 if successful
      assert.equal(res.status, 1);
    }).timeout(15000);
  });
});