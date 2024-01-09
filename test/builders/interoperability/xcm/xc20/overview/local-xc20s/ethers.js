import { assert } from 'chai';
import { ethers } from 'ethers';

describe('Overview of XC-20s - Retrieve Local XC-20 Metadata', function () {
  const provider = new ethers.JsonRpcProvider('https://rpc.api.moonbase.moonbeam.network', {
    chainId: 1287,
    name: 'moonbase',
  });

  // Jupiter token
  const tokenAddress = '0x9Aac6FB41773af877a2Be73c99897F3DdFACf576';
  const tokenABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
  ];

  describe('Retrieve Local XC-20 Metadata - Ethers.js', async () => {
    it('should return the metadata for a local xc-20', async () => {
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);

      assert.equal(name, 'Jupiter');
      assert.equal(symbol, 'JUP');
      assert.equal(decimals, 18n);
    });
  });
});
