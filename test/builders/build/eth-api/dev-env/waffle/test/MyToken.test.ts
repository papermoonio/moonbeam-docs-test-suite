import { use, expect } from 'chai';
import { Provider } from '@ethersproject/providers';
import { solidity } from 'ethereum-waffle';
import { ethers, Wallet } from 'ethers';
import { MyToken, MyToken__factory } from '../build/types';
import dotenv from 'dotenv'

dotenv.config({ path:'../../../../../../.env'});

use(solidity);

describe('MyToken', () => {
  let provider: Provider = new ethers.providers.JsonRpcProvider(process.env.HTTP_RPC_ENDPOINT);
  let wallet: Wallet;
  let walletTo: Wallet;
  let token: MyToken;

  beforeEach(async () => {
    const privateKey = '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133';
    wallet = new Wallet(privateKey).connect(provider);
    walletTo = Wallet.createRandom().connect(provider);
    token = await new MyToken__factory(wallet).deploy();
    let contractTransaction = await token.initialize(10);
    await contractTransaction.wait();
  });

  it('Mints the correct initial balance', async () => {
    expect(await token.balanceOf(wallet.address)).to.equal(10);
  });

  it('Should transfer the correct amount of tokens to the destination account', async () => {
    await (await token.transfer(walletTo.address, 7)).wait();
    expect(await token.balanceOf(walletTo.address)).to.equal(7);
  });
});
