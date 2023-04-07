import { assert } from "chai";
import Web3 from "web3";
import abi from "../../../../../contracts/xcm-utils-abi.js";

describe("Web3 - Send & Execute XCM Messages", function () {
  const alice = {
    address: "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac",
    pk: "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
  };

  const xcmUtilsAddress = "0x000000000000000000000000000000000000080C";

  const web3 = new Web3("http://127.0.0.1:9944"); // Change to network of choice
  const xcmUtils = new web3.eth.Contract(
    abi,
    xcmUtilsAddress,
    { from: web3.eth.accounts.privateKeyToAccount(alice.pk).address } // 'from' is necessary for gas estimation
  );

  describe("Execute an XCM Message with the XCM Utilities Precompile", async () => {
    it("should execute the SCALE encoded XCM message", async () => {
      const beforeTxBalance = web3.utils.fromWei(await web3.eth.getBalance(alice.address), 'ether');

      // This encoded calldata is different from example on docs site as it sends 10 DEV
      const encodedCalldata =
        "0x02080004000001040300130000e8890423c78a0d010004000103003cd0a705a2dc65e5b1e1205896baa2be8a07c6e0";
      const maxWeight = "1000000000";

      const tx = await xcmUtils.methods.xcmExecute(encodedCalldata, maxWeight);
      const signedTx = await web3.eth.accounts.signTransaction(
        {
          to: xcmUtilsAddress,
          data: tx.encodeABI(),
          gas: await tx.estimateGas(),
        },
        alice.pk
      );

      const sendTx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      const afterTxBalance = web3.utils.fromWei(await web3.eth.getBalance(alice.address), 'ether');

      // Test that the before balance - the amount sent is approximately the same
      // as the after balance. Using Math.round() instead of using exact gas fees
      assert.equal(Math.round(beforeTxBalance) - 10, Math.round(afterTxBalance));
      assert.equal(sendTx.status, true);
    });
  });
  describe("Send an XCM Message with the XCM Utilities Precompile", async () => {
    it("should send the SCALE encoded XCM message", async () => {
      // Define parameters required for the xcmSend function
      const encodedCalldata =
        "0x020c000400010000070010a5d4e81300010000070010a5d4e8000d010004010101000c36e9ba26fa63c60ec728fe75fe57b86a450d94e7fee7f9f9eddd0d3f400d67";
      const dest = [
        1, // Parents: 1
        [], // Interior: Here
      ];

      // Create transaction
      const tx = await xcmUtils.methods.xcmSend(dest, encodedCalldata);

      // Sign transaction
      const signedTx = await web3.eth.accounts.signTransaction(
        {
          to: xcmUtilsAddress,
          data: tx.encodeABI(),
          gas: await tx.estimateGas(),
        },
        alice.pk
      );

      // Send the signed transaction
      const sendTx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      assert.equal(sendTx.status, true);
    }).timeout(5000);
  });
});
