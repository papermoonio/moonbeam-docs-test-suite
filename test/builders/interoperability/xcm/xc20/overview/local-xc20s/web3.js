import { assert } from 'chai';
import { Web3 } from 'web3';

describe('Overview of XC-20s - Retrieve Local XC-20 Metadata', function () {
  const web3 = new Web3('https://rpc.api.moonbase.moonbeam.network');

  // Jupiter token
  const tokenAddress = '0x9Aac6FB41773af877a2Be73c99897F3DdFACf576';
  const tokenABI = [
    {
      constant: true,
      inputs: [],
      name: 'name',
      outputs: [{ name: '', type: 'string' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'symbol',
      outputs: [{ name: '', type: 'string' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
  ];

  describe('Retrieve Local XC-20 Metadata - Ethers.js', async () => {
    it('should return the metadata for a local xc-20', async () => {
      const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.methods.name().call(),
        tokenContract.methods.symbol().call(),
        tokenContract.methods.decimals().call(),
      ]);

      assert.equal(name, 'Jupiter');
      assert.equal(symbol, 'JUP');
      assert.equal(decimals, 18n);
    });
  });
});
