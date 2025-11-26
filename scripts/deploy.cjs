const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting EscrowV1 deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy EscrowV1
  console.log("⏳ Deploying EscrowV1 contract...");
  const EscrowV1 = await hre.ethers.getContractFactory("EscrowV1");
  const escrow = await EscrowV1.deploy();

  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log("✅ EscrowV1 deployed to:", escrowAddress);

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "( ChainID:", network.chainId, ")");

  // Verify contract constants
  const treasury = await escrow.TREASURY();
  const feeClassic = await escrow.FEE_CLASSIC();
  const feeManaged = await escrow.FEE_MANAGED();
  const emergencyTimeout = await escrow.EMERGENCY_TIMEOUT();
  const admin = await escrow.admin();

  console.log("\n📋 Contract Configuration:");
  console.log("   Treasury:", treasury);
  console.log("   Admin:", admin);
  console.log("   Fee Classic:", feeClassic.toString(), "basis points (1.5%)");
  console.log("   Fee Managed:", feeManaged.toString(), "basis points (2.5%)");
  console.log("   Emergency Timeout:", emergencyTimeout.toString(), "seconds (180 days)");

  // Wait for block confirmations before verification
  if (network.chainId !== 31337n && network.chainId !== 1337n) {
    console.log("\n⏳ Waiting for 5 block confirmations...");
    await escrow.deploymentTransaction().wait(5);
    console.log("✅ Block confirmations received");

    // Verify on Basescan/Etherscan
    console.log("\n🔍 Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: escrowAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified successfully");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("   You can verify manually later with:");
      console.log(`   npx hardhat verify --network ${network.name} ${escrowAddress}`);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: escrowAddress,
    deployerAddress: deployer.address,
    treasury: treasury,
    admin: admin,
    feeClassic: feeClassic.toString(),
    feeManaged: feeManaged.toString(),
    deployedAt: new Date().toISOString(),
    blockNumber: (await hre.ethers.provider.getBlockNumber()).toString(),
  };

  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("   1. Save the contract address:", escrowAddress);
  console.log("   2. Update frontend with ABI from artifacts/contracts/EscrowV1.sol/EscrowV1.json");
  console.log("   3. Test escrow creation on testnet");
  console.log("   4. Fund treasury address if needed");
  console.log("\n🎉 Done!\n");

  return escrowAddress;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
