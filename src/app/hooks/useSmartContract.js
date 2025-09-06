// src/app/hooks/useSmartContract.js
'use client';

import { useState, useCallback, useEffect } from 'react';

// Contract Configuration
const CONTRACT_ADDRESS = '0x18f3b0210BE24c1b3bcFAEA5e113B30521033d6C';
const APECHAIN_ID = 33139;

// Contract ABI (Application Binary Interface)
const CONTRACT_ABI = [
  "function createCampaign(string title, string description, string category, string ipfsCid, uint256 goalInAPE, uint256 durationInDays) external returns (uint256)",
  "function donate(uint256 campaignId) external payable",
  "function withdrawFunds(uint256 campaignId) external",
  "function getAllCampaigns() external view returns (tuple(uint256 id, address creator, string title, string description, string category, string ipfsCid, uint256 goal, uint256 raised, uint256 deadline, uint8 status, uint256 createdAt, uint256 donorCount)[])",
  "function getContractStats() external view returns (uint256 totalCampaigns, uint256 activeCampaigns, uint256 successfulCampaigns, uint256 totalEscrowAmount, uint256 platformFeesAccumulated)",
  "function campaignCounter() external view returns (uint256)",
  "function getRefundableAmount(uint256 _campaignId, address _donor) external view returns (uint256 refundAmount, uint256 platformFee)",
  "function claimRefund(uint256 _campaignId) external",
  "function markCampaignFailed(uint256 _campaignId) external",
  "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goal, uint256 deadline)",
  "event DonationMade(uint256 indexed campaignId, address indexed donor, uint256 amount, uint256 newTotal)",
  "event RefundClaimed(uint256 indexed campaignId, address indexed donor, uint256 refundAmount, uint256 platformFee)"
];

// Campaign Status Enum
const CampaignStatus = {
  0: 'Active',
  1: 'Successful', 
  2: 'Failed',
  3: 'Withdrawn'
};

export const useSmartContract = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ethers, setEthers] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Safe Wagmi hooks - only call on client side
  let account, publicClient, walletClient;
  
  if (typeof window !== 'undefined') {
    try {
      // Dynamic import of wagmi hooks
      const { useAccount, usePublicClient, useWalletClient } = require('wagmi');
      account = useAccount();
      publicClient = usePublicClient();
      const walletHook = useWalletClient();
      walletClient = walletHook.data;
    } catch (error) {
      // Wagmi not available - use fallbacks
      account = { address: undefined, isConnected: false, chain: undefined };
      publicClient = null;
      walletClient = null;
    }
  } else {
    // Server side - use fallbacks
    account = { address: undefined, isConnected: false, chain: undefined };
    publicClient = null;
    walletClient = null;
  }

  const { address, isConnected, chain } = account;

  // Check if on correct network
  const isCorrectNetwork = chain?.id === APECHAIN_ID;

  // Load ethers dynamically (client-side only)
  useEffect(() => {
    const loadEthers = async () => {
      if (typeof window !== 'undefined') {
        try {
          const ethersModule = await import('ethers');
          setEthers(ethersModule);
          setIsClient(true);
          console.log('✅ Ethers loaded successfully');
        } catch (error) {
          console.error('❌ Failed to load ethers:', error);
          setError('Failed to load blockchain dependencies');
        }
      }
    };

    loadEthers();
  }, []);

  // Get read-only contract instance
  const getReadContract = useCallback(() => {
    if (!ethers || !isClient) return null;
    
    try {
      return new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        new ethers.JsonRpcProvider('https://apechain.calderachain.xyz/http')
      );
    } catch (error) {
      console.error('Failed to create read contract:', error);
      return null;
    }
  }, [ethers, isClient]);

  // Get write contract instance
  const getWriteContract = useCallback(async () => {
    if (!ethers || !walletClient || !isConnected || !isCorrectNetwork || !isClient) return null;

    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    } catch (error) {
      console.error('Failed to get write contract:', error);
      return null;
    }
  }, [ethers, walletClient, isConnected, isCorrectNetwork, isClient]);

  // Create campaign on blockchain
  const createCampaignOnChain = useCallback(async (campaignData) => {
    if (!ethers || !isClient) {
      throw new Error('Blockchain dependencies not loaded');
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!isConnected) throw new Error('Wallet not connected');
      if (!isCorrectNetwork) throw new Error('Please switch to ApeChain');

      const contract = await getWriteContract();
      if (!contract) throw new Error('Could not get contract instance');

      console.log('📝 Creating campaign on blockchain...', campaignData);

      const ipfsCid = campaignData.ipfsCid || '';
      
      const tx = await contract.createCampaign(
        campaignData.title,
        campaignData.description,
        campaignData.category || 'Technology',
        ipfsCid,
        campaignData.goalInAPE,
        campaignData.durationInDays || 30
      );

      console.log('⏳ Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      const campaignCreatedEvent = receipt.logs.find(
        log => log.topics[0] === contract.interface.getEvent('CampaignCreated').topicHash
      );

      let campaignId = null;
      if (campaignCreatedEvent) {
        const parsedEvent = contract.interface.parseLog(campaignCreatedEvent);
        campaignId = parsedEvent.args.campaignId.toString();
      }

      return {
        success: true,
        campaignId,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        ipfsCid: ipfsCid
      };

    } catch (error) {
      console.error('❌ Smart contract error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [ethers, isClient, isConnected, isCorrectNetwork, getWriteContract]);

  // Donate to campaign
  const donateToChain = useCallback(async (campaignId, amountInAPE) => {
    if (!ethers || !isClient) {
      throw new Error('Blockchain dependencies not loaded');
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!isConnected) throw new Error('Wallet not connected');
      if (!isCorrectNetwork) throw new Error('Please switch to ApeChain');

      const contract = await getWriteContract();
      if (!contract) throw new Error('Could not get contract instance');


const amountInWei = ethers.parseEther(parseFloat(amountInAPE).toString());

      console.log('💰 Donating to campaign:', campaignId, 'Amount:', amountInAPE, 'APE');

      const tx = await contract.donate(campaignId, { value: amountInWei });
      console.log('⏳ Donation transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Donation confirmed:', receipt);

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Donation failed:', error);
      
      // Enhanced error handling for user cancellation
      let userMessage = error.message;
      
      if (error.code === 4001 || 
          error.message?.includes('user rejected') ||
          error.message?.includes('User denied') ||
          error.message?.includes('cancelled') ||
          error.message?.includes('rejected')) {
        console.log('🚫 User cancelled transaction');
        throw new Error('CANCELLED_BY_USER');
      } else if (error.message?.includes('insufficient funds')) {
        userMessage = 'Insufficient APE balance for this donation';
      } else if (error.message?.includes('gas')) {
        userMessage = 'Transaction failed due to gas issues. Please try again.';
      }
      
      setError(userMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [ethers, isClient, isConnected, isCorrectNetwork, getWriteContract]);

// Withdraw funds from campaign
const withdrawFunds = useCallback(async (campaignId) => {
  if (!ethers || !isClient) {
    throw new Error('Blockchain dependencies not loaded');
  }

  setIsLoading(true);
  setError(null);

  try {
    if (!isConnected) throw new Error('Wallet not connected');
    if (!isCorrectNetwork) throw new Error('Please switch to ApeChain');

    const contract = await getWriteContract();
    if (!contract) throw new Error('Could not get contract instance');

    console.log('💰 Withdrawing funds for campaign:', campaignId);

    const tx = await contract.withdrawFunds(campaignId);
    console.log('⏳ Withdrawal transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('✅ Withdrawal confirmed:', receipt);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };

  } catch (error) {
    console.error('❌ Withdrawal failed:', error);
    
    let userMessage = error.message;
    
    if (error.code === 4001 || 
        error.message?.includes('user rejected') ||
        error.message?.includes('User denied')) {
      throw new Error('CANCELLED_BY_USER');
    } else if (error.message?.includes('Only creator allowed')) {
      userMessage = 'Only the campaign creator can withdraw funds';
    } else if (error.message?.includes('Campaign not successful')) {
      userMessage = 'Campaign must reach its goal before withdrawal';
    }
    
    setError(userMessage);
    throw error;
  } finally {
    setIsLoading(false);
  }
}, [ethers, isClient, isConnected, isCorrectNetwork, getWriteContract]);

// 🔧 FÜGE DIESEN CODE NACH der withdrawFunds Funktion ein:

// Get refundable amount for a user
const getRefundableAmount = useCallback(async (campaignId, userAddress) => {
  if (!ethers || !isClient) {
    throw new Error('Blockchain dependencies not loaded');
  }

  try {
    const contract = getReadContract();
    if (!contract) throw new Error('Could not get contract instance');

    console.log('🔍 Checking refundable amount for:', campaignId, userAddress);

    const result = await contract.getRefundableAmount(campaignId, userAddress);
    
    return {
      refundAmount: result.refundAmount.toString(),
      platformFee: result.platformFee.toString(),
      refundAmountAPE: parseFloat(ethers.formatEther(result.refundAmount)),
      platformFeeAPE: parseFloat(ethers.formatEther(result.platformFee))
    };

  } catch (error) {
    console.error('❌ Failed to get refundable amount:', error);
    throw error;
  }
}, [ethers, isClient, getReadContract]);

// Claim refund from failed campaign
const claimRefund = useCallback(async (campaignId) => {
  if (!ethers || !isClient) {
    throw new Error('Blockchain dependencies not loaded');
  }

  setIsLoading(true);
  setError(null);

  try {
    if (!isConnected) throw new Error('Wallet not connected');
    if (!isCorrectNetwork) throw new Error('Please switch to ApeChain');

    const contract = await getWriteContract();
    if (!contract) throw new Error('Could not get contract instance');

    console.log('💰 Claiming refund for campaign:', campaignId);

    const tx = await contract.claimRefund(campaignId);
    console.log('⏳ Refund transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('✅ Refund confirmed:', receipt);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };

  } catch (error) {
    console.error('❌ Refund claim failed:', error);
    
    let userMessage = error.message;
    
    if (error.code === 4001) {
      throw new Error('CANCELLED_BY_USER');
    } else if (error.message?.includes('No donation found')) {
      userMessage = 'No donation found for this campaign';
    } else if (error.message?.includes('Campaign not failed')) {
      userMessage = 'Campaign must be marked as failed before refunds';
    }
    
    setError(userMessage);
    throw error;
  } finally {
    setIsLoading(false);
  }
}, [ethers, isClient, isConnected, isCorrectNetwork, getWriteContract]);

// Mark campaign as failed
const markCampaignFailed = useCallback(async (campaignId) => {
  if (!ethers || !isClient) {
    throw new Error('Blockchain dependencies not loaded');
  }

  setIsLoading(true);
  setError(null);

  try {
    if (!isConnected) throw new Error('Wallet not connected');
    if (!isCorrectNetwork) throw new Error('Please switch to ApeChain');

    const contract = await getWriteContract();
    if (!contract) throw new Error('Could not get contract instance');

    console.log('⏰ Marking campaign as failed:', campaignId);

    const tx = await contract.markCampaignFailed(campaignId);
    console.log('⏳ Mark failed transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('✅ Campaign marked as failed:', receipt);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };

  } catch (error) {
    console.error('❌ Mark failed transaction failed:', error);
    
    let userMessage = error.message;
    
    if (error.code === 4001) {
      throw new Error('CANCELLED_BY_USER');
    } else if (error.message?.includes('Campaign not ended')) {
      userMessage = 'Campaign deadline has not passed yet';
    } else if (error.message?.includes('Campaign reached goal')) {
      userMessage = 'Campaign was successful, cannot mark as failed';
    }
    
    setError(userMessage);
    throw error;
  } finally {
    setIsLoading(false);
  }
}, [ethers, isClient, isConnected, isCorrectNetwork, getWriteContract]);

  // Load all campaigns from blockchain with IPFS data
  const loadCampaignsFromChain = useCallback(async () => {
    if (!ethers || !isClient) {
      console.log('⚠️ Blockchain dependencies not loaded, skipping blockchain load');
      return [];
    }

    try {
      const contract = getReadContract();
      if (!contract) return [];

      console.log('📥 Loading campaigns from blockchain...');
      const campaigns = await contract.getAllCampaigns();

      console.log(`⛓️ Found ${campaigns.length} campaigns on blockchain`);

      // IPFS Gateways for fallback
      const ipfsGateways = [
        'https://tomato-petite-butterfly-553.mypinata.cloud/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://dweb.link/ipfs/'
      ];

      // Helper function to load IPFS data
      const loadIPFSData = async (cid) => {
        if (!cid || cid.trim() === '') return null;

        for (const gateway of ipfsGateways) {
          try {
            const url = `${gateway}${cid}`;
            const response = await fetch(url, { 
              timeout: 5000
            });
            
            if (response.ok) {
              const data = await response.json();
              return {
                ...data,
                loadedFrom: gateway
              };
            }
          } catch (error) {
            console.warn(`Failed to load from ${gateway}${cid}:`, error.message);
            continue;
          }
        }
        
        console.warn(`Could not load IPFS data for CID: ${cid}`);
        return null;
      };

      // Process campaigns with IPFS data loading
      const formattedCampaigns = await Promise.allSettled(
        campaigns.map(async (campaign, index) => {
          console.log(`📊 Processing campaign ${index + 1}/${campaigns.length}: ${campaign.title}`);

          // Extract blockchain data first
          const blockchainData = {
            id: campaign.id.toString(),
            blockchainId: campaign.id.toString(),
            creator: campaign.creator,
            title: campaign.title,
            description: campaign.description,
            category: campaign.category,
            target: parseFloat(ethers.formatEther(campaign.goal)),
            raised: parseFloat(ethers.formatEther(campaign.raised)),
            deadline: new Date(Number(campaign.deadline) * 1000).toISOString(),
            status: CampaignStatus[Number(campaign.status)],
            blockchainStatusRaw: campaign.status, // Für Debug
            createdAt: new Date(Number(campaign.createdAt) * 1000).toISOString(),
            donorCount: campaign.donorCount.toString(),
            backers: parseInt(campaign.donorCount.toString()),
            daysLeft: Math.max(0, Math.ceil((Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24))),
            ipfsCid: campaign.ipfsCid,
            isFromBlockchain: true,
            isValid: true
          };

          // Try to load IPFS data if CID exists
          let ipfsData = null;
          let campaignImage = getRandomImage(); // Fallback
          
          if (campaign.ipfsCid && campaign.ipfsCid.trim() !== '') {
            try {
              console.log(`📦 Loading IPFS data for: ${campaign.ipfsCid}`);
              ipfsData = await loadIPFSData(campaign.ipfsCid);
              
              if (ipfsData) {
                console.log(`✅ IPFS data loaded for: ${campaign.title}`);
                console.log('🖼️ IPFS Data Keys:', Object.keys(ipfsData));
                console.log('🖼️ Full IPFS Data:', ipfsData);
                
                // Check all possible image fields with detailed logging
                if (ipfsData.image) {
                  console.log('✅ Found image field');
                  console.log('📏 Image data length:', ipfsData.image.length);
                  console.log('🔤 Image starts with:', ipfsData.image.substring(0, 50));
                  campaignImage = ipfsData.image;
                } else if (ipfsData.campaignImage) {
                  console.log('✅ Found campaignImage field');
                  campaignImage = ipfsData.campaignImage;
                } else if (ipfsData.img) {
                  console.log('✅ Found img field');
                  campaignImage = ipfsData.img;
                } else {
                  console.log('❌ No image found in IPFS data');
                  console.log('📋 Available fields:', Object.keys(ipfsData));
                  console.log('🔍 Checking for base64 patterns...');
                  
                  // Check if any field contains base64 image data
                  Object.keys(ipfsData).forEach(key => {
                    const value = ipfsData[key];
                    if (typeof value === 'string' && value.startsWith('data:image/')) {
                      console.log(`🎯 Found base64 image in field: ${key}`);
                      campaignImage = value;
                    }
                  });
                }
                
                // Enhance blockchain data with IPFS data
                if (ipfsData.description && ipfsData.description !== blockchainData.description) {
                  blockchainData.fullDescription = ipfsData.description;
                }
              }
            } catch (ipfsError) {
              console.warn(`Failed to load IPFS data for ${campaign.title}:`, ipfsError.message);
            }
          }

          // Return complete campaign object
          return {
            ...blockchainData,
            image: campaignImage,
            ipfsData: ipfsData,
            ipfsLoaded: !!ipfsData,
            hasCustomImage: !!ipfsData?.image,
            loadingSource: {
              blockchain: true,
              ipfs: !!ipfsData,
              ipfsGateway: ipfsData?.loadedFrom || null
            }
          };
        })
      );

      // Filter successful results
      const successfulCampaigns = formattedCampaigns
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      console.log(`✅ Successfully processed ${successfulCampaigns.length}/${campaigns.length} campaigns`);

      return successfulCampaigns;

    } catch (error) {
      console.error('❌ Failed to load campaigns from blockchain:', error);
      setError(error.message);
      return [];
    }
  }, [ethers, isClient, getReadContract]);

  // Get contract statistics
  const getContractStats = useCallback(async () => {
    if (!ethers || !isClient) return null;

    try {
      const contract = getReadContract();
      if (!contract) return null;

      const stats = await contract.getContractStats();
      
      return {
        totalCampaigns: stats[0].toString(),
        activeCampaigns: stats[1].toString(),
        successfulCampaigns: stats[2].toString(),
        totalEscrowAmount: parseFloat(ethers.formatEther(stats[3])),
        platformFeesAccumulated: parseFloat(ethers.formatEther(stats[4]))
      };

    } catch (error) {
      console.error('❌ Failed to get contract stats:', error);
      return null;
    }
  }, [ethers, isClient, getReadContract]);

  return {
    // State
    isLoading,
    error,
    isConnected,
    isCorrectNetwork,
    contractAddress: CONTRACT_ADDRESS,
    isClient,
    
    // Wallet data
    address,
    chain,
    
    // Functions
    createCampaignOnChain: isClient ? createCampaignOnChain : async () => { throw new Error('Blockchain not available server-side'); },
    donateToChain: isClient ? donateToChain : async () => { throw new Error('Blockchain not available server-side'); },
    withdrawFunds: isClient ? withdrawFunds : async () => { throw new Error('Blockchain not available server-side'); },
    getRefundableAmount: isClient ? getRefundableAmount : async () => { throw new Error('Blockchain not available server-side'); },
    claimRefund: isClient ? claimRefund : async () => { throw new Error('Blockchain not available server-side'); },
    markCampaignFailed: isClient ? markCampaignFailed : async () => { throw new Error('Blockchain not available server-side'); },
    loadCampaignsFromChain: isClient ? loadCampaignsFromChain : async () => [],
    getContractStats: isClient ? getContractStats : async () => null,
    
    // Utils
    clearError: () => setError(null)
  };
};

// Helper function for random images
// Helper function for ApeChain fallback image
const getRandomImage = () => {
  // ApeChain branded fallback image
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB4PSI0MCIgeT0iODAiIHdpZHRoPSIzMjAiIGhlaWdodD0iMTQwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjgiLz48dGV4dCB4PSIyMDAiIHk9IjE3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGxldHRlci1zcGFjaW5nPSIzcHgiPkFQRUNIQUlOPC90ZXh0Pjwvc3ZnPg==";
};