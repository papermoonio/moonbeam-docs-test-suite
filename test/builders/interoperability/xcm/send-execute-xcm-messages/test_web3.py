from web3 import Web3
import unittest
import json


class TestDeployContract(unittest.TestCase):
    def setUp(self):
        self.web3 = Web3(Web3.HTTPProvider("http://127.0.0.1:9944"))

        # Use default account for Alice
        self.alice = "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac"
        self.alice_pk = "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133"

        json_file = open("contracts/xcm-utils-abi.json")
        abi_json = json.load(json_file)

        self.xcm_utils = self.web3.eth.contract(
            # XCM Utilities Precompile address
            address="0x000000000000000000000000000000000000080C",
            abi=abi_json["abi"]
        )

    def test_execute_xcm_message(self):
        # This encoded calldata is different from example on docs site as it sends 10 DEV
        encodedCalldata = "0x02080004000001040300130000e8890423c78a0d010004000103003cd0a705a2dc65e5b1e1205896baa2be8a07c6e0"
        maxWeight = 1000000000

        before_tx_balance = self.web3.fromWei(
            self.web3.eth.get_balance(self.alice), "ether")

        tx = self.xcm_utils.functions.xcmExecute(
            encodedCalldata,
            maxWeight
        ).buildTransaction(
            {
                "from": self.alice,
                "nonce": self.web3.eth.get_transaction_count(self.alice),
            }
        )

        signedTx = self.web3.eth.account.sign_transaction(tx, self.alice_pk)
        hash = self.web3.eth.send_raw_transaction(signedTx.rawTransaction)
        receipt = self.web3.eth.wait_for_transaction_receipt(hash)

        after_tx_balance = self.web3.fromWei(
            self.web3.eth.get_balance(self.alice), "ether")

        # Test that the before balance - the amount sent is approximately the same
        # as the after balance. Using Math.round() instead of using exact gas fees
        self.assertEqual(round(before_tx_balance) -
                         10, round(after_tx_balance))
        self.assertEqual(receipt["status"], 1)

    def test_send_xcm_message(self):
        encodedCalldata = '0x020c0004000100000f0000c16ff2862313000100000f0000c16ff28623000d010004010101000c36e9ba26fa63c60ec728fe75fe57b86a450d94e7fee7f9f9eddd0d3f400d67'
        dest = [
            1,  # Parents: 1
            []  # Interior: Here
        ]

        tx = self.xcm_utils.functions.xcmSend(
            dest,
            encodedCalldata
        ).buildTransaction(
            {
                'from': self.alice,
                'nonce': self.web3.eth.get_transaction_count(self.alice),
            }
        )
        signedTx = self.web3.eth.account.sign_transaction(tx, self.alice_pk)
        hash = self.web3.eth.send_raw_transaction(signedTx.rawTransaction)
        receipt = self.web3.eth.wait_for_transaction_receipt(hash)

        self.assertEqual(receipt["status"], 1)

    def tearDown(self) -> None:
        return super().tearDown()


if __name__ == '__main__':
    unittest.main()
