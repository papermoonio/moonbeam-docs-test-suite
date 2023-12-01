import { assert } from 'chai';
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { moonbaseAlpha } from 'viem/chains';

const fromAddressPrivateKey = "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133"
const fromAddress = "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac"
const toAddress = "0x73328873A6Ac3DFc9455986358F5230cB3B8e92c"
const url = process.env.HTTP_RPC_ENDPOINT

describe('Viem - Send a Transaction', function () {
    const account = privateKeyToAccount(fromAddressPrivateKey);
    const rpcUrl = url;

    // 2. Create a wallet client for writing chain data
    const walletClient = createWalletClient({
        account,
        chain: moonbaseAlpha,
        transport: http(rpcUrl),
    });

    // 3. Create a public client for reading chain data
    const publicClient = createPublicClient({
        chain: moonbaseAlpha,
        transport: http(rpcUrl),
    });

    // 4. Create to address variable
    const addressFrom = fromAddress;
    const addressTo = toAddress;

    var balanceFrom
    var balanceTo

    describe('Check Balances -  balances.js', async () => {
        it('should return a balance for alice', async () => {
            balanceFrom = await publicClient.getBalance({ address: addressFrom })
            assert.equal(balanceFrom > 0, true);
        });
        it('should return a balance for bob', async () => {
            balanceTo = await publicClient.getBalance({ address: addressTo })
            assert.equal(balanceTo > 0, true);
        });
    });

    describe('Send Transaction - transaction.js', async () => {
        it('should send a successful transaction', async () => {
            // 6. Sign and send tx
            const hash = await walletClient.sendTransaction({
                to: addressTo,
                value: parseEther('0.1'),
            });

            // 7. Wait for the transaction receipt
            await publicClient.waitForTransactionReceipt({
                hash,
            });
            assert.exists(hash);
        }).timeout(30000);

        it('should return an updated balance', async () => {
            var newBalanceTo = await publicClient.getBalance({ address: addressTo })
            assert.equal(newBalanceTo - parseEther('0.1'), balanceTo);
        }).timeout(15000);
    });
});
