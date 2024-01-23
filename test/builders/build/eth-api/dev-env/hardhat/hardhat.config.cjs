/** @type import('hardhat/config').HardhatUserConfig */
require('@nomicfoundation/hardhat-ethers');

const privateKey =
  '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133';

module.exports = {
  solidity: '0.8.19',
  dev: {
    url: process.env.HTTP_RPC_ENDPOINT,
    chainId: 1281, // (hex: 0x501),
    accounts: [privateKey],
  },
};
