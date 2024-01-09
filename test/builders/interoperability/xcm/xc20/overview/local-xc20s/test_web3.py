from web3 import Web3
import unittest


class TestRetrieveLocalXC20Metadata(unittest.TestCase):
    def setUp(self):
        self.web3 = Web3(Web3.HTTPProvider("https://rpc.api.moonbase.moonbeam.network"))

        self.token_address = "0x9Aac6FB41773af877a2Be73c99897F3DdFACf576"
        self.token_abi = [  # ERC-20 ABI
            {
                "constant": True,
                "inputs": [],
                "name": "name",
                "outputs": [{"name": "", "type": "string"}],
                "payable": False,
                "stateMutability": "view",
                "type": "function",
            },
            {
                "constant": True,
                "inputs": [],
                "name": "symbol",
                "outputs": [{"name": "", "type": "string"}],
                "payable": False,
                "stateMutability": "view",
                "type": "function",
            },
            {
                "constant": True,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "payable": False,
                "stateMutability": "view",
                "type": "function",
            },
        ]

    def test_retrieve_local_xc20_metadata(self):
        token_contract = self.web3.eth.contract(
            address=self.token_address, abi=self.token_abi
        )
        name = token_contract.functions.name().call()
        symbol = token_contract.functions.symbol().call()
        decimals = token_contract.functions.decimals().call()

        self.assertEqual(name, "Jupiter")
        self.assertEqual(symbol, "JUP")
        self.assertEqual(decimals, 18)
