import { assert } from "chai";
import { ethers } from "ethers";
import abi from "../../../../contracts/xcm-utils-abi.js";

describe("Ethers - Send & Execute XCM Messages", function () {
  const alice = {
    address: "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac",
    pk: "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
  };

  // Define network configurations
  const providerRPC = {
    dev: {
      name: "moonbeam-development",
      rpc: "http://127.0.0.1:9944",
      chainId: 1281, // 0x501 in hex
    },
  };
  // Create ethers provider
  const provider = new ethers.JsonRpcProvider(providerRPC.dev.rpc, {
    chainId: providerRPC.dev.chainId,
    name: providerRPC.dev.name,
  });
  // Create signer
  const signer = new ethers.Wallet(alice.pk, provider);

  describe("Execute an XCM Message with the XCM Utilities Precompile", async () => {
    it("should execute the SCALE encoded XCM message", async () => {
      const xcmUtils = new ethers.Contract(
        "0x000000000000000000000000000000000000080C",
        abi,
        signer
      );

      const beforeTxBalance = ethers.formatEther(await provider.getBalance(alice.address));

      // This encoded calldata is different from example on docs site as it sends 10 DEV
      const encodedCalldata =
        "0x02080004000001040300130000e8890423c78a0d010004000103003cd0a705a2dc65e5b1e1205896baa2be8a07c6e0";
      const maxWeight = "1000000000";

      const tx = await xcmUtils.xcmExecute(encodedCalldata, maxWeight);
      const res = await tx.wait();

      const afterTxBalance = ethers.formatEther(await provider.getBalance(alice.address));

      // Test that the before balance - the amount sent is approximately the same
      // as the after balance. Using Math.round() instead of using exact gas fees
      assert.equal(Math.round(beforeTxBalance) - 10, Math.round(afterTxBalance));
      assert.equal(res.status, 1);
    }).timeout(5000);
  });
  describe("Send an XCM Message with the XCM Utilities Precompile", async () => {
    it("should send the SCALE encoded XCM message", async () => {
      const xcmUtils = new ethers.Contract(
        "0x000000000000000000000000000000000000080C",
        abi,
        signer
      );

      // This encoded calldata is different from example on docs site as it sends 10 DEV
      const encodedCalldata =
        "0x020c000400010000070010a5d4e81300010000070010a5d4e8000d010004010101000c36e9ba26fa63c60ec728fe75fe57b86a450d94e7fee7f9f9eddd0d3f400d67";
      const dest = [
        1, // Parents: 1
        [], // Interior: Here
      ];
      const tx = await xcmUtils.xcmSend(dest, encodedCalldata);
      const res = await tx.wait();

      assert.equal(res.status, 1);
    }).timeout(5000);
  });
});
