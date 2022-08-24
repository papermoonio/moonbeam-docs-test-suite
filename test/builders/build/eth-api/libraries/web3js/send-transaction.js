import { assert } from "chai";
import Web3 from "web3";

describe('Web3 - Send a Transaction', function () {
  let alice = {
    "address": "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac",
    "pk": "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
  }
  let bob = "0x3Cd0A705a2DC65e5b1E1205896BaA2be8A07c6e0"

  // Define network configurations
  const providerRPC = {
    development: 'http://localhost:9933',
  };
  // Create Web3 provider
  const web3 = new Web3(providerRPC.development);

  describe('Check Balances -  balances.js', async () => {
    it('should return a balance for alice', async () => {
      const balance = web3.utils.fromWei(await web3.eth.getBalance(alice.address), 'ether');
      assert.equal(balance > 0, true);
    });
    it('should return a balance for bob', async () => {
      const balance = web3.utils.fromWei(await web3.eth.getBalance(bob), 'ether');
      assert.equal(balance > 0, true);
    });
  });

  describe('Send Transaction - transaction.js', async () => {
    it('should send a successful transaction', async () => {
      const value = 10;
      const tx = {
        to: bob,
        value: web3.utils.toWei('1', 'ether'),
        gas: 21000
      }

      const createTransaction = await web3.eth.accounts.signTransaction(tx, alice.pk);
      const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);

      // the status of a transaction is 1 if successful
      assert.equal(createReceipt.status, true);
    }).timeout(15000);
  });
});