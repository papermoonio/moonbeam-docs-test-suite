from turtle import bye
from web3 import Web3
import unittest
import solcx
import os
import json


def compile_contract():
    ROOT_DIR = os.path.abspath(os.curdir)
    solcx.install_solc()
    solcx.set_solc_version_pragma("pragma solidity ^0.8.0")

    temp_file = solcx.compile_files(
        [ROOT_DIR + '/contracts/Incrementer.sol'], output_values=["abi", "bin"])

    abi = temp_file['contracts/Incrementer.sol:Incrementer']['abi']
    bytecode = temp_file['contracts/Incrementer.sol:Incrementer']['bin']

    return {"abi": abi, "bytecode": bytecode}


def deploy_contract(abi, bytecode, web3, alice, alice_pk):
    Incrementer = web3.eth.contract(abi=abi, bytecode=bytecode)

    construct_txn = Incrementer.constructor(5).buildTransaction(
        {
            'from': alice,
            'nonce': web3.eth.get_transaction_count(alice),
        }
    )
    tx_create = web3.eth.account.sign_transaction(construct_txn, alice_pk)
    tx_hash = web3.eth.send_raw_transaction(tx_create.rawTransaction)
    tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

    return tx_receipt


class TestDeployContract(unittest.TestCase):
    def setUp(self):
        self.web3 = Web3(Web3.HTTPProvider(process.env.HTTP_RPC_ENDPOINT))

        # Use default account for Alice
        self.alice = "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac"
        self.alice_pk = "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133"

    def test_compile_to_bytecode(self):
        bytecode = compile_contract()["bytecode"]
        self.assertNotEqual(bytecode, '')

    def test_compile_correct_no_ABI_inputs(self):
        abi = compile_contract()["abi"]
        json_file = open("contracts/incrementer-abi.json")
        abi_json = json.load(json_file)
        self.assertEqual(abi, abi_json["abi"])

    def test_contract_is_deployed(self):
        contract = compile_contract()
        abi = contract["abi"]
        bytecode = contract["bytecode"]

        deployed = deploy_contract(
            abi, bytecode, self.web3, self.alice, self.alice_pk)
        self.assertEqual(deployed['status'], 1)

    def test_deployed_contract_code(self):
        contract = compile_contract()
        abi = contract["abi"]
        bytecode = contract["bytecode"]

        deployed = deploy_contract(
            abi, bytecode, self.web3, self.alice, self.alice_pk)
        contract_address = deployed["contractAddress"]

        code = self.web3.eth.get_code(contract_address).hex().replace("0x", "")
        hex_bytecode = hex(int(bytecode, 16))

        self.assertIn(code, hex_bytecode)

    def test_get_initial_incrementer_number(self):
        contract = compile_contract()
        abi = contract["abi"]
        bytecode = contract["bytecode"]

        deployed = deploy_contract(
            abi, bytecode, self.web3, self.alice, self.alice_pk)
        contract_address = deployed["contractAddress"]

        incrementer = self.web3.eth.contract(address=contract_address, abi=abi)
        data = incrementer.functions.number().call()

        self.assertEqual(data, 5)

    def test_get_incremented_number(self):
        contract = compile_contract()
        abi = contract["abi"]
        bytecode = contract["bytecode"]

        deployed = deploy_contract(
            abi, bytecode, self.web3, self.alice, self.alice_pk)
        
        contract_address = deployed["contractAddress"]
        incrementer = self.web3.eth.contract(address=contract_address, abi=abi)

        value = 3
        increment_tx = incrementer.functions.increment(value).buildTransaction(
            {
                'from': self.alice,
                'nonce': self.web3.eth.get_transaction_count(self.alice),
            }
        )

        tx_create = self.web3.eth.account.sign_transaction(
            increment_tx, self.alice_pk)
        tx_hash = self.web3.eth.send_raw_transaction(tx_create.rawTransaction)
        self.web3.eth.wait_for_transaction_receipt(tx_hash)

        data = incrementer.functions.number().call()
        self.assertEqual(data, 8)

    def test_reset_incrementer_number(self):
        contract = compile_contract()
        abi = contract["abi"]
        bytecode = contract["bytecode"]

        deployed = deploy_contract(
            abi, bytecode, self.web3, self.alice, self.alice_pk)
        contract_address = deployed["contractAddress"]

        incrementer = self.web3.eth.contract(address=contract_address, abi=abi)

        increment_tx = incrementer.functions.reset().buildTransaction(
            {
                'from': self.alice,
                'nonce': self.web3.eth.get_transaction_count(self.alice),
            }
        )
        tx_create = self.web3.eth.account.sign_transaction(
            increment_tx, self.alice_pk)

        tx_hash = self.web3.eth.send_raw_transaction(tx_create.rawTransaction)
        self.web3.eth.wait_for_transaction_receipt(tx_hash)

        data = incrementer.functions.number().call()

        self.assertEqual(data, 0)

    def tearDown(self) -> None:
        return super().tearDown()


if __name__ == '__main__':
    unittest.main()
