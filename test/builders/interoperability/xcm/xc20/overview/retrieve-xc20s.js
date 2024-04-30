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
    it('should return the list of XC-20s on Moonbeam', async () => {
      const api = await getApi('wss://wss.api.moonbeam.network');

      const assets = await api.query.assets.asset.entries();
      assert.equal(assets.length, 42n);

      api.disconnect();
    }).timeout(15000);

    it('should return the list of XC-20s on Moonriver', async () => {
      const api = await getApi('wss://wss.api.moonriver.moonbeam.network');

      const assets = await api.query.assets.asset.entries();
      assert.equal(assets.length, 24n);

      api.disconnect();
    }).timeout(15000);

    /** This test is to ensure we can access the metadata as expected */
    it('should return the metadata for an asset', async () => {
      const api = await getApi('wss://wss.api.moonbeam.network');
      const xcDOT = 42259045809535163221576417993425387648n;

      const metadata = (await api.query.assets.metadata(xcDOT)).toHuman();
      assert.equal(metadata.name, 'xcDOT');
      assert.equal(metadata.symbol, 'xcDOT');
      assert.equal(metadata.decimals, '10');

      api.disconnect();
    }).timeout(15000);
  });
});
