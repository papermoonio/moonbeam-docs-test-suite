import { assert } from 'chai';
import { ApiPromise, WsProvider } from '@polkadot/api';

describe('Overview of XC-20s - Current List of External XC-20s', function () {
  const getApi = async (wssEndpoint) => {
    const wsProvider = new WsProvider(wssEndpoint);
    const api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });

    return api;
  };

  describe('Retrieve List of External XC-20s and Their Metadata', async () => {
    /** These tests will let us know when we need to update the list of XC-20s.
     * So we are hardcoding in the current number and any time this test fails,
     * we'll know we need to update the docs along with this test.
     */
    it('should return the correct counter for XC-20s on Moonriver', async () => {
      const api = await getApi('wss://wss.api.moonbeam.network');
      const counter = await api.query.evmForeignAssets.counterForAssetsById();
      assert.equal(counter.toNumber(), 54);
      api.disconnect();
    }).timeout(15000);

    it('should return the correct counter for XC-20s on Moonriver', async () => {
      const api = await getApi('wss://wss.api.moonriver.moonbeam.network');
      const counter = await api.query.evmForeignAssets.counterForAssetsById();
      assert.equal(counter.toNumber(), 24);
      api.disconnect();
    }).timeout(15000);

  });
});
