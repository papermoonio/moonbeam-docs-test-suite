from web3 import Web3
from eth_account import Account
import unittest
import secrets
from web3.gas_strategies.rpc import rpc_gas_price_strategy

class TestSendTransaction(unittest.TestCase):
    def setUp(self):
        self.web3 = Web3(Web3.HTTPProvider('http://127.0.0.1:9933'))

        # Use default account for Alice
        self.alice = "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac"
        self.alice_pk = "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133"
        
        # Create randomly generated account for Bob
        random = secrets.token_hex(32)
        self.bob = Account.from_key("0x" + random).address

    def test_alices_balance(self):
        alices_balance = self.web3.fromWei(self.web3.eth.get_balance(self.alice), "ether")
        self.assertGreater(alices_balance, 0)

    def test_bobs_balance(self):
        bobs_balance = self.web3.fromWei(self.web3.eth.get_balance(self.bob), "ether")
        self.assertEqual(bobs_balance, 0)
        
    def test_send_successful_tx(self):
        self.web3.eth.set_gas_price_strategy(rpc_gas_price_strategy)

        tx_create = self.web3.eth.account.sign_transaction(
            {
                "nonce": self.web3.eth.get_transaction_count(self.alice),
                "gasPrice": self.web3.eth.generate_gas_price(),
                "gas": 21000,
                "to": self.bob,
                "value": self.web3.toWei("1", "ether"),
            },
            self.alice_pk,
        )
        tx_hash = self.web3.eth.send_raw_transaction(tx_create.rawTransaction)
        tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)

        self.assertEqual(tx_receipt["status"], 1)

        bobs_balance = self.web3.fromWei(self.web3.eth.get_balance(self.bob), "ether")
        self.assertEqual(bobs_balance, 1)

    def tearDown(self) -> None:
        return super().tearDown()

if __name__ == '__main__':
    unittest.main()

