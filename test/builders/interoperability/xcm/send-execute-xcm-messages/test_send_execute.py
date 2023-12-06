from web3 import Web3
import unittest
import json
import secrets
from eth_account import Account


class TestSendExecuteXcmMessages(unittest.TestCase):
    def setUp(self):
        self.web3 = Web3(Web3.HTTPProvider("http://127.0.0.1:9944"))

        # Use default account for Alice
        self.alice = "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac"
        self.alice_pk = (
            "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133"
        )

        json_file = open("contracts/xcm-utils-abi.json")
        abi_json = json.load(json_file)

        self.xcm_utils = self.web3.eth.contract(
            # XCM Utilities Precompile address
            address="0x000000000000000000000000000000000000080C",
            abi=abi_json["abi"],
        )

        self.execute_amount = 1 * 10 ** 17

    def test_execute_xcm_message(self):
        # Create randomly generated account for Bob
        random = secrets.token_hex(32)
        bob = Account.from_key("0x" + random).address
        # Get the balance of bob before the XCM message is sent
        before_tx_balance = self.web3.eth.get_balance(bob)

        # Create and send the extrinsic
        encoded_calldata = "0x02080004000001040300130000e8890423c78a0d010004000103003cd0a705a2dc65e5b1e1205896baa2be8a07c6e0"
        # Modify the calldata to use the randomly generated account as the destination account instead
        address_from_docs_example = "3cd0a705a2dc65e5b1e1205896baa2be8a07c6e0"
        encoded_calldata = encoded_calldata.replace(
            address_from_docs_example, bob.lstrip("0x")
        )
        max_weight = 400000000
        tx = self.xcm_utils.functions.xcmExecute(
            encoded_calldata, max_weight
        ).build_transaction(
            {
                "from": self.alice,
                "nonce": self.web3.eth.get_transaction_count(self.alice),
            }
        )
        signed_tx = self.web3.eth.account.sign_transaction(tx, self.alice_pk)
        hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = self.web3.eth.wait_for_transaction_receipt(hash)

        # Get the balance of bob after the XCM message is sent
        after_tx_balance = self.web3.eth.get_balance(bob)

        # Make sure the balance from before sending the transaction is 0 and
        # that the balance afterwards is equal to the transferred amount
        self.assertEqual(receipt["status"], 1)
        self.assertEqual(before_tx_balance, 0)
        self.assertEqual(after_tx_balance, self.execute_amount)

    def test_send_xcm_message(self):
        # Create and send the extrinsic
        encodedCalldata = "0x020c0004000100000f0000c16ff2862313000100000f0000c16ff28623000d010004010101000c36e9ba26fa63c60ec728fe75fe57b86a450d94e7fee7f9f9eddd0d3f400d67"
        dest = [1, []]  # Parents: 1  # Interior: Here
        tx = self.xcm_utils.functions.xcmSend(dest, encodedCalldata).build_transaction(
            {
                "from": self.alice,
                "nonce": self.web3.eth.get_transaction_count(self.alice),
            }
        )
        signedTx = self.web3.eth.account.sign_transaction(tx, self.alice_pk)
        hash = self.web3.eth.send_raw_transaction(signedTx.rawTransaction)
        receipt = self.web3.eth.wait_for_transaction_receipt(hash)

        self.assertEqual(receipt["status"], 1)

    def tearDown(self) -> None:
        return super().tearDown()


if __name__ == "__main__":
    unittest.main()
