import { assert } from 'chai';
import { ethers } from 'ethers';
import { ApiPromise, WsProvider } from '@polkadot/api';

describe('Encoded Calldata - Send & Execute XCM Messages', function () {
  // Create polkadot signer
  const getApi = async () => {
    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider: wsProvider });
    return api;
  };

  describe('Execute an XCM Message with the XCM Utilities Precompile', async () => {
    it('should generate the SCALE encoded calldata', async () => {
      const devMultiLocation = { parents: 0, interior: { X1: { PalletInstance: 3 } } };
      const amountToWithdraw = BigInt(1 * 10 ** 17); // This example uses 0.1 DEV
      const maxWeight = { refTime: 400000000n, proofSize: 14484n };
      const bob = '0x3Cd0A705a2DC65e5b1E1205896BaA2be8A07c6e0';

      const instr1 = {
        WithdrawAsset: [
          {
            id: { Concrete: devMultiLocation },
            fun: { Fungible: amountToWithdraw },
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

      const xcmMessage = { V3: [instr1, instr2] };

      const api = await getApi();
      const tx = api.tx.polkadotXcm.execute(xcmMessage, maxWeight);
      const encodedCall = tx.method.toHex();

      // SCALE encoded calldata from Polkadot.js Apps
      const polkadotAppsEncodedCalldata =
        '0x1c03030800040000010403001300008a5d784563010d010204000103003cd0a705a2dc65e5b1e1205896baa2be8a07c6e002105e5f51e2';
      assert.equal(polkadotAppsEncodedCalldata, encodedCall);

      api.disconnect();
    });
  });
  describe('Send an XCM Message with the XCM Utilities Precompile', async () => {
    it('should generate the SCALE encoded calldata', async () => {
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

      const xcmMessage = { V3: [instr1, instr2, instr3] };
      const api = await getApi();

      const tx = api.tx.polkadotXcm.execute(xcmMessage, { refTime: 0, proofSize: 0 });
      const encodedCall = tx.method.toHex();
      // SCALE encoded calldata from Polkadot.js Apps
      const polkadotAppsEncodedCalldata =
        '0x1c03030c000400010000070010a5d4e81300010000070010a5d4e8000d0100010101000c36e9ba26fa63c60ec728fe75fe57b86a450d94e7fee7f9f9eddd0d3f400d670000';
      assert.equal(polkadotAppsEncodedCalldata, encodedCall);

      api.disconnect();
    });
  });
});
