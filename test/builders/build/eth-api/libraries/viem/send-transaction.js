import { assert } from 'chai';
import { createPublicClient, createWalletClient, http, formatEther, parseEther } from 'viem';
import { privateKeyToAccount,generatePrivateKey } from 'viem/accounts';
import { moonbeamDev } from 'viem/chains';

describe('Viem - Send a Transaction', function () {
  const fromAddressPrivateKey =
    '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133';
  const addressFrom = '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac';
  const toAddressPrivateKey = generatePrivateKey()
  const addressTo = privateKeyToAccount(toAddressPrivateKey).address;
  const rpcUrl = process.env.HTTP_RPC_ENDPOINT;

  describe('Check Balances -  balances.js', async () => {
    const publicClient = createPublicClient({
      chain: moonbeamDev,
      transport: http(rpcUrl),
    });

    const balances = async () => {
      const balanceFrom = formatEther(await publicClient.getBalance({ address: addressFrom }));
      const balanceTo = formatEther(await publicClient.getBalance({ address: addressTo }));

      assert.equal(balanceFrom >= 0, true);
      assert.equal(balanceTo >= 0, true);
    };

    it('should check the balance', balances);
  });

  describe('Send Transaction - transaction.js', async () => {
    const account = privateKeyToAccount(fromAddressPrivateKey);

    const walletClient = createWalletClient({
      account,
      chain: moonbeamDev,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain: moonbeamDev,
      transport: http(rpcUrl),
    });
    
    it('shold call the transaction function', async () => {

        const balanceTo = await publicClient.getBalance({ address: addressTo });
  
        const hash = await walletClient.sendTransaction({
          to: addressTo,
          value: parseEther('1'),
        });
  
        await publicClient.waitForTransactionReceipt({
          hash,
        });
        assert.exists(hash);
  
        const newBalanceTo = await publicClient.getBalance({ address: addressTo });
        assert.equal(newBalanceTo - parseEther('1'), balanceTo);
      });
  });
});
