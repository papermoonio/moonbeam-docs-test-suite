import os
import secrets
import unittest
from dotenv import load_dotenv
from eth_account import Account
from web3 import Web3
from web3.gas_strategies.rpc import rpc_gas_price_strategy

load_dotenv()


class TestConsensysFinalityWeb3py(unittest.TestCase):
    def setUp(self):
        self.web3 = Web3(Web3.HTTPProvider(os.getenv("MOONBASE_HTTP_RPC_ENDPOINT")))

        # Use default account for Alice
        self.alice = os.getenv("MOONBASE_TEST_PUBLIC_KEY")
        self.alice_pk = os.getenv("MOONBASE_TEST_PRIVATE_KEY")

        # Create randomly generated account for Bob
        random = secrets.token_hex(32)
        self.bob = Account.from_key("0x" + random).address

        self.finalized_tx = (
            "0x3ea780d2e53fc265e9d251b5f41794c3d5ec4a32e854ca6562b111ec7002057e"
        )

    ### HELPER FUNCTIONS ###
    def send_tx(self):
        self.web3.eth.set_gas_price_strategy(rpc_gas_price_strategy)

        tx_create = self.web3.eth.account.sign_transaction(
            {
                "nonce": self.web3.eth.get_transaction_count(self.alice),
                "gasPrice": self.web3.eth.generate_gas_price(),
                "gas": 21000,
                "to": self.bob,
            },
            self.alice_pk,
        )
        tx_hash = self.web3.eth.send_raw_transaction(tx_create.rawTransaction)
        self.web3.eth.wait_for_transaction_receipt(tx_hash)
        return tx_hash

    def get_finalized_block_number(self):
        finalized_block_header = self.web3.eth.get_block("finalized")
        return finalized_block_header.number

    def get_transation_block_number(self, tx_hash):
        tx_receipt = self.web3.eth.get_transaction_receipt(tx_hash)
        return tx_receipt.blockNumber

    def get_transaction_block_hash(self, tx_hash):
        tx_receipt = self.web3.eth.get_transaction_receipt(tx_hash)
        return self.web3.to_hex(tx_receipt.blockHash)

    def custom_web3_request(self, method, params):
        response = self.web3.provider.make_request(method, params)
        return response

    ### TESTS ###
    def test_compare_blocks_recently_sent_tx(self):
        # Send a transaction
        tx_hash = self.send_tx()
        # Get the last finalized block number
        finalized_block_number = self.get_finalized_block_number()
        # Get the transaction block number
        tx_block_number = self.get_transation_block_number(tx_hash)
        # The transaction should not yet be finalized, as the transaction was just sent
        self.assertFalse(finalized_block_number >= tx_block_number)

    def test_compare_blocks_finalized_tx(self):
        # Get the last finalized block number
        finalized_block_number = self.get_finalized_block_number()
        # Get the transaction block number
        tx_block_number = self.get_transation_block_number(self.finalized_tx)
        # The transaction should be finalized, as it is an older transaction
        self.assertTrue(finalized_block_number >= tx_block_number)

    def test_moon_isBlockFinalized_recently_sent_tx(self):
        # Send a transaction
        tx_hash = self.send_tx()
        # Get the block hash of the transaction
        block_hash = self.get_transaction_block_hash(tx_hash)
        # Use the block hash to check if the block is finalized
        is_finalized = self.custom_web3_request("moon_isBlockFinalized", [block_hash])
        # The transaction should not yet be finalized, as the transaction was just sent
        self.assertFalse(is_finalized["result"])

    def test_moon_isBlockFinalized_finalized_tx(self):
        # Get the block hash of the transaction
        block_hash = self.get_transaction_block_hash(self.finalized_tx)
        # Use the block hash to check if the block is finalized
        is_finalized = self.custom_web3_request("moon_isBlockFinalized", [block_hash])
        # The transaction should be finalized, as it is an older transaction
        self.assertTrue(is_finalized["result"])
    
    def test_moon_isTxFinalized_recently_sent_tx(self):
        # Send a transaction
        tx_hash = self.send_tx()
        # Use the transaction hash to check if the transaction is finalized
        is_finalized = self.custom_web3_request("moon_isTxFinalized", [tx_hash])
        # The transaction should not yet be finalized, as the transaction was just sent
        self.assertFalse(is_finalized["result"])

    def test_moon_isTxFinalized_finalized_tx(self):
        # Use the transaction hash to check if the transaction is finalized
        is_finalized = self.custom_web3_request("moon_isTxFinalized", [self.finalized_tx])
        # The transaction should be finalized, as it is an older transaction
        self.assertTrue(is_finalized["result"])

    def tearDown(self) -> None:
        return super().tearDown()


if __name__ == "__main__":
    unittest.main()
