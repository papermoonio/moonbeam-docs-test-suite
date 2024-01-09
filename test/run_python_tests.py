import unittest
import sys
import os

loader = unittest.TestLoader()
dir_path = os.path.dirname(os.path.realpath(__file__))

web3py_tests = loader.discover(
    "test/builders/build/eth-api/libraries/web3py", top_level_dir=dir_path
)
web3py_xc20_overview_local_xc20_tests = loader.discover(
    "test/builders/interoperability/xcm/xc20/overview/local-xc20s",
    top_level_dir=dir_path,
)
web3py_finality_tests = loader.discover(
    "test/builders/get-started/eth-compare/consensus-finality/ethereum-libraries",
    top_level_dir=dir_path,
)
pysubstrateinterface_finality_tests = loader.discover(
    "test/builders/get-started/eth-compare/consensus-finality/substrate-libraries",
    top_level_dir=dir_path,
)


def suite():
    testSuite = unittest.TestSuite()
    testSuite.addTest(web3py_tests)
    testSuite.addTest(web3py_xc20_overview_local_xc20_tests)
    testSuite.addTest(web3py_finality_tests)
    testSuite.addTest(pysubstrateinterface_finality_tests)
    return testSuite


if __name__ == "__main__":
    result = unittest.TextTestRunner(verbosity=2).run(suite())
