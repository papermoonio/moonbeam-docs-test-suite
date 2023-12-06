import { assert } from 'chai';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { ethers } from 'ethers';
import Web3 from 'web3';
import abi from '../../../../../contracts/xcm-utils-abi.js';

describe('Send & Execute XCM Messages - Execute', function () {
  const alice = {
    address: '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac',
    pk: '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
  };

  // Construct API provider
  const getApi = async () => {
    const wsProvider = new WsProvider('ws://localhost:9944');
    const api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });
    return api;
  };

  // Variables
  const xcmUtilsAddress = '0x000000000000000000000000000000000000080C';
  const amount = BigInt(1 * 10 ** 17); // This example uses 0.1 DEV

  // Assmeble the XCM message
  const assembleXCM = async (bob) => {
    // Get the Polkadot.js API provider
    const api = await getApi();

    const devMultiLocation = { parents: 0, interior: { X1: { PalletInstance: 3 } } };
    const instr1 = {
      WithdrawAsset: [
        {
          id: { Concrete: devMultiLocation },
          fun: { Fungible: amount },
        },
      ],
    };
    const instr2 = {
      DepositAsset: {
        assets: { Wild: { AllCounted: 1 } },
        beneficiary: {
          parents: 0,
          interior: { X1: { AccountKey20: { key: bob } } },
        },
      },
    };
    // Assemble the parameters for the execute extrinsic
    const message = { V3: [instr1, instr2] };
    const maxWeight = { refTime: 400000000n, proofSize: 14484n };
    // Get the encoded call data
    const assembledTx = api.tx.polkadotXcm.execute(message, maxWeight);
    const encodedCalldata = assembledTx.args[0].toHex();

    return { message, maxWeight, encodedCalldata };
  };

  describe('Execute an XCM Message with the Polkadot.js API', async () => {
    it('should execute the XCM message', async () => {
      // Create Keyring instance
      const keyring = new Keyring({ type: 'ethereum' });
      const aliceKeyring = keyring.addFromUri(alice.pk);

      // Get the Polkadot.js API provider
      const api = await getApi();

      // Get the balance of bob before the XCM message is sent
      const bob = ethers.Wallet.createRandom().address;
      const { data: beforeTxBalance } = await api.query.system.account(bob);

      // Send the XCM message
      const { message, maxWeight } = await assembleXCM(bob);
      const tx = api.tx.polkadotXcm.execute(message, maxWeight);
      const txHash = await tx.signAndSend(aliceKeyring);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get the balance of bob after the XCM message is sent
      const { data: afterTxBalance } = await api.query.system.account(bob);

      // Make sure the balance from before sending the transaction is 0 and
      // that the balance afterwards is equal to the transferred amount
      assert.exists(txHash);
      assert.equal(beforeTxBalance.free, 0n );
      assert.equal(amount, afterTxBalance.free);

      api.disconnect();
    });
  });
  describe('Execute an XCM Message with the XCM Utilities Precompile', async () => {
    it('should generate the encoded calldata of an XCM message', async () => {
      // Get the Polkadot.js API provider
      const api = await getApi();

      // Get the encoded call data for the XCM message
      const bob = '0x3cd0a705a2dc65e5b1e1205896baa2be8a07c6e0';
      const { message, maxWeight } = await assembleXCM(bob);
      const tx = api.tx.polkadotXcm.execute(message, maxWeight);
      const encodedCall = tx.method.toHex();

      // SCALE encoded calldata from Polkadot.js Apps
      const polkadotAppsEncodedCalldata =
        '0x1c03030800040000010403001300008a5d784563010d010204000103003cd0a705a2dc65e5b1e1205896baa2be8a07c6e002105e5f51e2';

      assert.equal(polkadotAppsEncodedCalldata, encodedCall);

      api.disconnect();
    });
    it('should execute the XCM message using Ethers', async () => {
      // Create ethers provider and signer
      const provider = new ethers.JsonRpcProvider(process.env.HTTP_RPC_ENDPOINT, {
        chainId: 1281,
        name: 'moonbeam-development',
      });
      const signer = new ethers.Wallet(alice.pk, provider);

      // Create contract instance
      const xcmUtils = new ethers.Contract(xcmUtilsAddress, abi, signer);

      // Get the balance of bob before the XCM message is sent
      const bob = ethers.Wallet.createRandom().address;
      const beforeTxBalance = await provider.getBalance(bob);

      // Create and send the extrinsic
      const { encodedCalldata } = await assembleXCM(bob);
      const maxWeight = '400000000';
      const tx = await xcmUtils.xcmExecute(encodedCalldata, maxWeight);
      const res = await tx.wait();

      // Get the balance of bob after the XCM message is sent
      const afterTxBalance = await provider.getBalance(bob);

      // Make sure the balance from before sending the transaction is 0 and
      // that the balance afterwards is equal to the transferred amount
      assert.equal(res.status, 1);
      assert.equal(beforeTxBalance, 0n);
      assert.equal(amount, afterTxBalance);
    }).timeout(15000);
    it('should execute the XCM message using Web3', async () => {
      // Create web3 provider
      const web3 = new Web3(process.env.HTTP_RPC_ENDPOINT);

      // Create contract instance
      const xcmUtils = new web3.eth.Contract(
        abi,
        xcmUtilsAddress,
        { from: web3.eth.accounts.privateKeyToAccount(alice.pk).address } // 'from' is necessary for gas estimation
      );

      // Get the balance of bob before the XCM message is sent
      const bob = web3.eth.accounts.create().address;
      const beforeTxBalance = await web3.eth.getBalance(bob);

      // Create and send the extrinsic
      const { encodedCalldata } = await assembleXCM(bob);
      const maxWeight = '400000000';
      const tx = xcmUtils.methods.xcmExecute(encodedCalldata, maxWeight);
      const signedTx = await web3.eth.accounts.signTransaction(
        {
          to: xcmUtilsAddress,
          data: tx.encodeABI(),
          gas: await tx.estimateGas(),
          gasPrice: await web3.eth.getGasPrice(),
          nonce: await web3.eth.getTransactionCount(alice.address),
        },
        alice.pk
      );
      const sendTx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      // Get the balance of bob after the XCM message is sent
      const afterTxBalance = await web3.eth.getBalance(bob);

      // Make sure the balance from before sending the transaction is 0 and
      // that the balance afterwards is equal to the transferred amount
      assert.equal(sendTx.status, true);
      assert.equal(beforeTxBalance, 0n);
      assert.equal(amount, afterTxBalance);
    }).timeout(15000);
  });
});
