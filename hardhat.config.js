// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    
    // ApeChain Mainnet
    apechain: {
      url: "https://apechain.calderachain.xyz/http",
      chainId: 33139,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    
    // ApeChain Testnet (Curtis)
    curtis: {
      url: "https://curtis.apechain.com/http", 
      chainId: 33111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    }
  },
  
  // Verification for ApeScan
  etherscan: {
    apiKey: {
      apechain: "abc", // ApeScan doesn't require API key yet
      curtis: "abc"
    },
    customChains: [
      {
        network: "apechain",
        chainId: 33139,
        urls: {
          apiURL: "https://api.apescan.io/api",
          browserURL: "https://apescan.io"
        }
      },
      {
        network: "curtis",
        chainId: 33111,
        urls: {
          apiURL: "https://api-curtis.apechain.com/api", 
          browserURL: "https://curtis.apescan.io"
        }
      }
    ]
  },
  
  // Gas Reporter
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};