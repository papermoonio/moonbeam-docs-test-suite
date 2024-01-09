import { assert } from 'chai';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { ethers } from 'ethers';
import Web3 from 'web3';
import abi from '../../../../../contracts/xcm-utils-abi.js';

describe('Send & Execute XCM Messages - Send', function () {
  const alice = {
    address: '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac',
    pk: '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
  };

  // Construct API provider
  const getApi = async () => {
    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });
    return api;
  };

  // Variables
  const xcmUtilsAddress = '0x000000000000000000000000000000000000080C';

  // Assmeble the XCM message
  const assembleXCM = () => {
    const relayChainMultilocation = { parents: 1, interior: null };
    const amount = BigInt(1 * 10 ** 12); // 1 UNIT
    const bob = '0x0c36e9ba26fa63c60ec728fe75fe57b86a450d94e7fee7f9f9eddd0d3f400d67';
    const instr1 = {
      WithdrawAsset: [
        {
          id: { Concrete: relayChainMultilocation },
          fun: { Fungible: amount },
        },
      ],
    };
    const instr2 = {
      BuyExecution: [
        {
          id: { Concrete: relayChainMultilocation },
          fun: { Fungible: amount },
        },
        { Unlimited: null },
      ],
    };
    const instr3 = {
      DepositAsset: {
        assets: { Wild: 'All' },
        beneficiary: {
          parents: 1,
          interior: { X1: { AccountId32: { id: bob } } },
        },
      },
    };
    // Assemble the parameters for the send extrinsic
    const dest = { V3: { parents: 1, interior: null } };
    const message = { V3: [instr1, instr2, instr3] };
    return { dest, message };
  };

  describe('Send an XCM Message with the Polkadot.js API', async () => {
    it('should send the XCM message', async () => {
      // Create Keyring instance
      const keyring = new Keyring({ type: 'ethereum' });
      const aliceKeyring = keyring.addFromUri(alice.pk);

      // Get API provider
      const api = await getApi();

      // Create the extrinsic
      const { dest, message } = assembleXCM();
      const tx = api.tx.polkadotXcm.send(dest, message);
      const txHash = await tx.signAndSend(aliceKeyring);

      assert.exists(txHash);

      api.disconnect();
    });
  });
  describe('Send an XCM Message with the XCM Utilities Precompile', async () => {
    it('should generate the SCALE encoded calldata', async () => {
      // Get API provider
      const api = await getApi();

      // Get the encoded call data for the XCM message
      const { message } = assembleXCM();
      const tx = api.tx.polkadotXcm.execute(message, { refTime: 0, proofSize: 0 });
      const encodedCall = tx.method.toHex();

      // SCALE encoded calldata from Polkadot.js Apps
      const polkadotAppsEncodedCalldata =
        '0x1c03030c000400010000070010a5d4e81300010000070010a5d4e8000d0100010101000c36e9ba26fa63c60ec728fe75fe57b86a450d94e7fee7f9f9eddd0d3f400d670000';

      assert.equal(polkadotAppsEncodedCalldata, encodedCall);

      api.disconnect();
    });
    it('should send the XCM message using Ethers', async () => {
      // Create ethers provider and signer
      const provider = new ethers.JsonRpcProvider(process.env.HTTP_RPC_ENDPOINT, {
        chainId: 1281,
        name: 'moonbeam-development',
      });
      const signer = new ethers.Wallet(alice.pk, provider);

      // Create contract instance
      const xcmUtils = new ethers.Contract(xcmUtilsAddress, abi, signer);

      // Create and send the extrinsic
      const dest = [
        1, // Parents: 1
        [], // Interior: Here
      ];
      const encodedCalldata =
        '0x020c000400010000070010a5d4e81300010000070010a5d4e8000d010004010101000c36e9ba26fa63c60ec728fe75fe57b86a450d94e7fee7f9f9eddd0d3f400d67';
      const tx = await xcmUtils.xcmSend(dest, encodedCalldata);
      const res = await tx.wait();

      assert.equal(res.status, 1);
    }).timeout(5000);
    it('should send the XCM message using Web3', async () => {
      // Create web3 provider
      const web3 = new Web3(process.env.HTTP_RPC_ENDPOINT);

      // Create contract instance
      const xcmUtils = new web3.eth.Contract(
        abi,
        xcmUtilsAddress,
        { from: web3.eth.accounts.privateKeyToAccount(alice.pk).address } // 'from' is necessary for gas estimation
      );

      // Create and send the extrinsic
      const dest = [
        1, // Parents: 1
        [], // Interior: Here
      ];
      const encodedCalldata =
        '0x020c000400010000070010a5d4e81300010000070010a5d4e8000d010004010101000c36e9ba26fa63c60ec728fe75fe57b86a450d94e7fee7f9f9eddd0d3f400d67';
      const tx = xcmUtils.methods.xcmSend(dest, encodedCalldata);
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

      assert.equal(sendTx.status, true);
    }).timeout(5000);
  });
});
