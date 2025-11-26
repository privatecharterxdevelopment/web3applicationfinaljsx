const hre = require("hardhat");

/**
 * Deploy EscrowV1 to Base Network
 *
 * Prerequisites:
 * 1. Set PRIVATE_KEY in .env (deployer wallet private key)
 * 2. Set BASE_MAINNET_RPC in .env (optional, defaults to public RPC)
 * 3. Set BASESCAN_API_KEY in .env (for contract verification)
 * 4. Ensure deployer has enough ETH on Base for gas fees
 *
 * Usage:
 *   Testnet: npx hardhat run scripts/deploy-base.cjs --network baseSepolia
 *   Mainnet: npx hardhat run scripts/deploy-base.cjs --network base
 */

async function main() {
  const network = await hre.ethers.provider.getNetwork();

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🚀 BASE NETWORK DEPLOYMENT - EscrowV1");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Network validation
  if (network.chainId !== 8453n && network.chainId !== 84532n) {
    console.error("❌ Error: This script is for Base networks only!");
    console.error("   Base Mainnet: chainId 8453");
    console.error("   Base Sepolia: chainId 84532");
    console.error("   Current network:", network.name, "chainId:", network.chainId.toString());
    process.exit(1);
  }

  const isMainnet = network.chainId === 8453n;
  const networkName = isMainnet ? "Base Mainnet" : "Base Sepolia Testnet";

  console.log("🌐 Target Network:", networkName);
  console.log("🆔 Chain ID:", network.chainId.toString());

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n📝 Deployer Account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInEth = hre.ethers.formatEther(balance);
  console.log("💰 Balance:", balanceInEth, "ETH");

  // Estimate deployment cost
  const estimatedGas = 2000000n; // ~2M gas for deployment
  const gasPrice = await hre.ethers.provider.getFeeData();
  const estimatedCost = estimatedGas * (gasPrice.gasPrice || 1000000000n);
  const estimatedCostEth = hre.ethers.formatEther(estimatedCost);

  console.log("⛽ Estimated Gas:", estimatedGas.toString());
  console.log("💸 Estimated Cost:", estimatedCostEth, "ETH");

  if (balance < estimatedCost) {
    console.error("\n❌ Error: Insufficient balance for deployment");
    console.error("   Required:", estimatedCostEth, "ETH");
    console.error("   Available:", balanceInEth, "ETH");
    process.exit(1);
  }

  // Mainnet safety check
  if (isMainnet) {
    console.log("\n⚠️  WARNING: You are about to deploy to MAINNET!");
    console.log("   This will cost real ETH.");
    console.log("   Make sure you have reviewed the contract thoroughly.");
    console.log("\n   Press Ctrl+C to cancel, or wait 10 seconds to continue...\n");

    // 10 second countdown
    for (let i = 10; i > 0; i--) {
      process.stdout.write(`   Deploying in ${i}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.stdout.write('\r\x1b[K'); // Clear line
    }
    console.log("   Proceeding with deployment...\n");
  }

  // Deploy contract
  console.log("⏳ Deploying EscrowV1...\n");
  const EscrowV1 = await hre.ethers.getContractFactory("EscrowV1");
  const escrow = await EscrowV1.deploy();

  console.log("   Transaction sent, waiting for confirmation...");
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  const deployTx = escrow.deploymentTransaction();

  console.log("\n✅ Deployment Successful!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📍 Contract Address:", escrowAddress);
  console.log("🔗 Transaction Hash:", deployTx.hash);
  console.log("⛽ Gas Used:", deployTx.gasLimit.toString());
  console.log("═══════════════════════════════════════════════════════════\n");

  // Verify configuration
  const treasury = await escrow.TREASURY();
  const admin = await escrow.admin();
  const feeClassic = await escrow.FEE_CLASSIC();
  const feeManaged = await escrow.FEE_MANAGED();

  console.log("📋 Contract Configuration:");
  console.log("   Treasury Address:", treasury);
  console.log("   Admin Address:", admin);
  console.log("   Classic Fee:", feeClassic.toString(), "bp (1.5%)");
  console.log("   Managed Fee:", feeManaged.toString(), "bp (2.5%)");

  // Block explorer links
  const explorerBase = isMainnet
    ? "https://basescan.org"
    : "https://sepolia.basescan.org";

  console.log("\n🔍 Block Explorer:");
  console.log("   Contract:", `${explorerBase}/address/${escrowAddress}`);
  console.log("   Transaction:", `${explorerBase}/tx/${deployTx.hash}`);

  // Wait for confirmations
  console.log("\n⏳ Waiting for 5 confirmations...");
  await deployTx.wait(5);
  console.log("✅ 5 confirmations received\n");

  // Verify contract
  if (process.env.BASESCAN_API_KEY) {
    console.log("🔍 Verifying contract on Basescan...");
    try {
      await hre.run("verify:verify", {
        address: escrowAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Basescan");
      console.log("   View source:", `${explorerBase}/address/${escrowAddress}#code`);
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Contract already verified");
      } else {
        console.log("⚠️  Auto-verification failed:", error.message);
        console.log("\n   Manual verification command:");
        console.log(`   npx hardhat verify --network ${isMainnet ? 'base' : 'baseSepolia'} ${escrowAddress}`);
      }
    }
  } else {
    console.log("⚠️  Skipping verification (BASESCAN_API_KEY not set)");
    console.log("   Manual verification command:");
    console.log(`   npx hardhat verify --network ${isMainnet ? 'base' : 'baseSepolia'} ${escrowAddress}`);
  }

  // Save deployment info to file
  const fs = require('fs');
  const deploymentData = {
    network: networkName,
    chainId: network.chainId.toString(),
    contractAddress: escrowAddress,
    deployerAddress: deployer.address,
    treasury: treasury,
    admin: admin,
    transactionHash: deployTx.hash,
    blockNumber: deployTx.blockNumber?.toString(),
    deployedAt: new Date().toISOString(),
    explorerUrl: `${explorerBase}/address/${escrowAddress}`,
  };

  const filename = `deployment-${isMainnet ? 'mainnet' : 'testnet'}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
  console.log(`\n💾 Deployment info saved to: ${filename}`);

  // Next steps
  console.log("\n✅ DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📝 Next Steps:");
  console.log("   1. Update .env with:");
  console.log(`      VITE_ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
  console.log(`      VITE_ESCROW_NETWORK=${isMainnet ? 'base' : 'baseSepolia'}`);
  console.log("\n   2. Copy ABI to frontend:");
  console.log("      artifacts/contracts/EscrowV1.sol/EscrowV1.json");
  console.log("\n   3. Test escrow creation:");
  console.log("      - Create test booking");
  console.log("      - Verify fees calculated on-chain");
  console.log("      - Test dispute flow");
  console.log("\n   4. Monitor treasury address:");
  console.log(`      ${explorerBase}/address/${treasury}`);
  console.log("═══════════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED");
    console.error("═══════════════════════════════════════════════════════════");
    console.error(error);
    console.error("═══════════════════════════════════════════════════════════\n");
    process.exit(1);
  });
