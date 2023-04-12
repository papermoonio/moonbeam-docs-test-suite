import unittest
import sys
import os

loader = unittest.TestLoader()

dir_path = os.path.dirname(os.path.realpath(__file__))

web3py_tests = loader.discover("test/builders/build/eth-api/libraries/web3py", top_level_dir=dir_path)
send_execute_xcm_messages_tests = loader.discover("test/builders/interoperability/xcm/send-execute-xcm-messages", top_level_dir=dir_path)

def suite():
    testSuite = unittest.TestSuite()
    testSuite.addTest(web3py_tests)
    testSuite.addTest(send_execute_xcm_messages_tests)
    return testSuite

if __name__ == "__main__":
    result = unittest.TextTestRunner(verbosity=2).run(suite())
    sys.exit(not result.wasSuccessful())