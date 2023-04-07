import unittest
import sys

loader = unittest.TestLoader()
web3py_tests = loader.discover("test/builders/build/eth-api/libraries/web3py", pattern="test_*.py")
send_execute_xcm_messages_tests = loader.discover("test/builders/interoperability/xcm/send-execute-xcm-messages", pattern="test_*.py")

def suite():
    testSuite = unittest.TestSuite()
    testSuite.addTest(web3py_tests)
    testSuite.addTest(send_execute_xcm_messages_tests)
    return testSuite

if __name__ == "__main__":
    result = unittest.TextTestRunner(verbosity=2).run(suite())
    sys.exit(not result.wasSuccessful())