import { assert } from 'chai';
import { ApiPromise, WsProvider } from '@polkadot/api';

describe('Runtime Upgrades', () => {
  const getApi = async (url) => {
    // Construct API provider
    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });
    return api;
  };

  describe('Runtime Upgrades by Block', async () => {
    it('should return the latest runtime version for Moonbase Alpha', async () => {
      const api = await getApi('wss://wss.api.moonbase.moonbeam.network');
      const runtime = await api.query.system.lastRuntimeUpgrade();
      // Assert the runtime is equal to the latest version we have on the docs
      assert.equal(runtime.toJSON().specVersion, 2700);
      api.disconnect();
    });
    it('should return the latest runtime version for Moonriver', async () => {
      const api = await getApi('wss://wss.api.moonriver.moonbeam.network');
      const runtime = await api.query.system.lastRuntimeUpgrade();
      // Assert the runtime is equal to the latest version we have on the docs
      assert.equal(runtime.toJSON().specVersion, 2700);
      api.disconnect();
    });
    it('should return the latest runtime version for Moonbeam', async () => {
      const api = await getApi('wss://wss.api.moonbeam.network');
      const runtime = await api.query.system.lastRuntimeUpgrade();
      // Assert the runtime is equal to the latest version we have on the docs
      assert.equal(runtime.toJSON().specVersion, 2700);
      api.disconnect();
    });
  });
});
