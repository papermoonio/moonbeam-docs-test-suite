import { assert } from 'chai';
import { Web3 } from 'web3';

describe('Web3 - Send a Transaction', function () {
  // Define network configurations
  const providerRPC = {
    development: process.env.HTTP_RPC_ENDPOINT,
  };
  // Create Web3 provider
  const web3 = new Web3(providerRPC.development);

  // Create account for bob
  const bob = web3.eth.accounts.create().address;
  const alice = {
    address: '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac',
    pk: '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
  };

  describe('Check Balances -  balances.js', async () => {
    it('should return a balance for alice', async () => {
      const balance = web3.utils.fromWei(await web3.eth.getBalance(alice.address), 'ether');
      assert.equal(balance > 0, true);
    });
    it('should return a balance for bob', async () => {
      const balance = web3.utils.fromWei(await web3.eth.getBalance(bob), 'ether');
      assert.equal(balance, 0);
    });
  });

  describe('Send Transaction - transaction.js', async () => {
    it('should send a successful transaction', async () => {
      const tx = {
        to: bob,
        value: web3.utils.toWei('1', 'ether'),
        gas: 21000,
        gasPrice: await web3.eth.getGasPrice(),
        nonce: await web3.eth.getTransactionCount(alice.address),
      };

      const createTransaction = await web3.eth.accounts.signTransaction(tx, alice.pk);
      const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);

      // the status of a transaction is 1 if successful
      assert.equal(createReceipt.status, 1n);
    }).timeout(15000);
    it('should return an updated balance for bob', async () => {
      const balance = web3.utils.fromWei(await web3.eth.getBalance(bob), 'ether');
      assert.equal(balance, 1);
    }).timeout(15000);
  });
});
