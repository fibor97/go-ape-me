// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying GoApeMeCrowdfundingEscrow to ApeChain...");
  
  // Platform-Adresse für 5% Fees
  const PLATFORM_ADDRESS = "0x79e91D282fC853b1fEFaEDB7334a591633c2a877";
  
  // Get deployer account FIRST
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("🏢 Platform Address Set:", PLATFORM_ADDRESS);
  
  // Verify deployer matches platform address
  if (deployer.address.toLowerCase() !== PLATFORM_ADDRESS.toLowerCase()) {
    console.log("⚠️  WARNING: Deployer address doesn't match platform address!");
    console.log("🔑 Make sure you're using the private key for:", PLATFORM_ADDRESS);
  }
  console.log("📝 Deploying with account:", deployer.address);
  console.log("🏢 Platform address:", PLATFORM_ADDRESS);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "APE");
  
  if (balance < hre.ethers.parseEther("0.01")) {
    console.log("⚠️  Warning: Low balance. You might need more APE for deployment.");
  }
  
  // Deploy contract with platform address
  console.log("\n📦 Deploying contract...");
  const GoApeMeCrowdfundingEscrow = await hre.ethers.getContractFactory("GoApeMeCrowdfundingEscrow");
  const contract = await GoApeMeCrowdfundingEscrow.deploy(PLATFORM_ADDRESS);
  
  // Wait for deployment
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log("✅ GoApeMeCrowdfundingEscrow deployed to:", contractAddress);
  console.log("🔗 ApeScan URL: https://apescan.io/address/" + contractAddress);
  
  // Verify platform address is set correctly
  const setPlatformAddress = await contract.PLATFORM_ADDRESS();
  console.log("🏢 Platform address in contract:", setPlatformAddress);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    platformAddress: PLATFORM_ADDRESS,
    network: hre.network.name,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: contract.deploymentTransaction()?.hash,
    blockNumber: contract.deploymentTransaction()?.blockNumber,
    features: {
      escrowSystem: true,
      platformFee: "5%",
      creatorShare: "95%",
      maxCampaignDuration: "30 days",
      refundSystem: true
    }
  };
  
  console.log("\n📋 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Test contract functionality
  console.log("\n🧪 Testing contract...");
  
  try {
    // Test getContractStats
    const stats = await contract.getContractStats();
    console.log("📊 Initial contract stats:");
    console.log("- Total campaigns:", stats[0].toString());
    console.log("- Active campaigns:", stats[1].toString());
    console.log("- Successful campaigns:", stats[2].toString());
    console.log("- Total escrow amount:", hre.ethers.formatEther(stats[3]), "APE");
    console.log("- Platform fees accumulated:", hre.ethers.formatEther(stats[4]), "APE");
    
    // Test platform fee constants
    const platformFee = await contract.PLATFORM_FEE();
    const creatorShare = await contract.CREATOR_SHARE();
    console.log("💰 Fee structure:");
    console.log("- Platform fee:", platformFee.toString() + "%");
    console.log("- Creator share:", creatorShare.toString() + "%");
    
    console.log("\n✅ Contract deployment and testing successful!");
    
  } catch (error) {
    console.error("❌ Error testing contract:", error.message);
  }
  
  // Instructions for frontend integration
  console.log("\n📝 Next Steps:");
  console.log("1. Copy contract address:", contractAddress);
  console.log("2. Update frontend configuration with contract address");
  console.log("3. Test campaign creation with small amounts");
  console.log("4. Test donation and escrow functionality");
  console.log("5. Verify contract on ApeScan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress} ${PLATFORM_ADDRESS}`);
  
  console.log("\n🏢 Platform Features:");
  console.log("- ✅ Escrow system (funds held until goal reached)");
  console.log("- ✅ 95/5 fee split (creator/platform)"); 
  console.log("- ✅ Automatic refunds if campaign fails");
  console.log("- ✅ Batch refund processing (platform pays gas)");
  console.log("- ✅ Maximum 30-day campaign duration");
  
  return {
    contractAddress,
    contract,
    deploymentInfo
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });