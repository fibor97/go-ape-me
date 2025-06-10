import { useState, useCallback, useEffect } from 'react';
import { useStoracha } from './useStoracha';
import { useSmartContract } from './useSmartContract';

const CAMPAIGNS_STORAGE_KEY = 'go-ape-me-campaigns';

export const useCampaignManager = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { uploadCampaignData } = useStoracha();
  const { 
    createCampaignOnChain, 
    donateToChain, 
    loadCampaignsFromChain,
    getContractStats,
    isConnected,
    isCorrectNetwork,
    isClient
  } = useSmartContract();

  // Load campaigns on startup: Blockchain first, then local backup
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        console.log('🚀 Loading campaigns...');
        setIsLoading(true);
        
        let allCampaigns = [];
        
        // Try blockchain first (if available)
        if (isClient) {
          try {
            const blockchainCampaigns = await loadCampaignsFromChain();
            console.log(`⛓️ Loaded ${blockchainCampaigns.length} campaigns from blockchain`);
            allCampaigns = [...blockchainCampaigns];
          } catch (error) {
            console.warn('⚠️ Could not load from blockchain:', error.message);
          }
        }
        
        // Add local campaigns as backup
        const localCampaigns = loadLocalCampaigns();
        console.log(`📱 Found ${localCampaigns.length} local campaigns`);
        
        // Add local campaigns that aren't on blockchain
        localCampaigns.forEach(localCampaign => {
          const existsOnBlockchain = allCampaigns.some(
            bc => bc.title === localCampaign.title && bc.creator === localCampaign.creator
          );
          if (!existsOnBlockchain) {
            allCampaigns.push({
              ...localCampaign,
              isLocalOnly: true
            });
          }
        });
        
        console.log(`✅ Total campaigns loaded: ${allCampaigns.length}`);
        setCampaigns(allCampaigns);
        
      } catch (error) {
        console.error('❌ Failed to load campaigns:', error);
        // Fallback to local only
        const localCampaigns = loadLocalCampaigns();
        setCampaigns(localCampaigns);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaigns();
  }, [loadCampaignsFromChain, isClient]);

  // Load local campaigns from localStorage
  const loadLocalCampaigns = () => {
    try {
      const storedCampaigns = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      if (storedCampaigns) {
        const parsedCampaigns = JSON.parse(storedCampaigns);
        return parsedCampaigns.map(campaign => ({
          ...campaign,
          isLocal: true
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to load local campaigns:', error);
      return [];
    }
  };

  // Save campaigns to localStorage (local campaigns only)
  const saveCampaigns = useCallback((campaignsToSave) => {
    try {
      const localCampaigns = campaignsToSave.filter(campaign => 
        campaign.isLocal && !campaign.isFromBlockchain
      );
      const dataToSave = JSON.stringify(localCampaigns);
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY, dataToSave);
      console.log('💾 Local campaigns saved:', localCampaigns.length);
    } catch (error) {
      console.error('❌ Failed to save campaigns:', error);
    }
  }, []);

  // Create campaign - Blockchain + IPFS integration
  const createCampaign = useCallback(async (campaignData, creatorAddress) => {
    try {
      console.log('📝 Creating campaign...');
      
      // Check if blockchain is available and user is connected
      const useBlockchain = isClient && isConnected && isCorrectNetwork;
      
      if (useBlockchain) {
        console.log('⛓️ Using blockchain for campaign creation');
        
        // 1. Upload metadata to IPFS first
        let ipfsResult = null;
        try {
          console.log('📤 Uploading metadata to IPFS...');
          ipfsResult = await uploadCampaignData({
            ...campaignData,
            creator: creatorAddress
          });
          console.log('✅ IPFS Upload successful:', ipfsResult.cid);
        } catch (ipfsError) {
          console.warn('⚠️ IPFS upload failed, continuing without metadata:', ipfsError.message);
        }

        // 2. Create campaign on blockchain
        const blockchainResult = await createCampaignOnChain({
          ...campaignData,
          ipfsCid: ipfsResult?.cid || '',
          durationInDays: campaignData.durationInDays || 30
        });

        console.log('✅ Blockchain campaign created:', blockchainResult);

        // 3. Create local representation for immediate UI update
        const newCampaign = {
          id: Date.now(),
          blockchainId: blockchainResult.campaignId,
          title: campaignData.title,
          description: campaignData.description,
          category: campaignData.category,
          target: parseFloat(campaignData.target),
          creator: creatorAddress,
          raised: 0,
          backers: 0,
          daysLeft: campaignData.durationInDays || 30,
          createdAt: new Date().toISOString(),
          ipfsCid: ipfsResult?.cid || '',
          ipfsUrl: ipfsResult?.url || '',
          ipfsData: ipfsResult?.metadata || null,
          txHash: blockchainResult.txHash,
          blockNumber: blockchainResult.blockNumber,
          status: 'Active',
          isFromBlockchain: true,
          isValid: true,
          image: campaignData.hasCustomImage && campaignData.image ? campaignData.image : getRandomImage(),
          hasCustomImage: campaignData.hasCustomImage && campaignData.image ? true : false
        };

        // 4. Update UI immediately
        const updatedCampaigns = [newCampaign, ...campaigns];
        setCampaigns(updatedCampaigns);

        // 5. Refresh from blockchain after delay
        setTimeout(async () => {
          try {
            const refreshedCampaigns = await loadCampaignsFromChain();
            setCampaigns(prevCampaigns => {
              const localCampaigns = prevCampaigns.filter(c => c.isLocal && !c.isFromBlockchain);
              return [...refreshedCampaigns, ...localCampaigns];
            });
          } catch (error) {
            console.warn('Could not refresh from blockchain:', error);
          }
        }, 3000);

        return { 
          success: true, 
          campaign: newCampaign, 
          ipfsResult, 
          blockchainResult 
        };
        
      } else {
        console.log('📱 Using local storage for campaign creation');
        
        // Fallback: Local campaign creation (old system)
        let ipfsResult = null;
        try {
          ipfsResult = await uploadCampaignData({
            ...campaignData,
            creator: creatorAddress
          });
        } catch (ipfsError) {
          console.warn('IPFS upload failed:', ipfsError.message);
        }

        const newCampaign = {
          id: Date.now(),
          title: campaignData.title,
          description: campaignData.description,
          category: campaignData.category,
          target: parseFloat(campaignData.target),
          creator: creatorAddress,
          raised: 0,
          backers: 0,
          daysLeft: 30,
          createdAt: new Date().toISOString(),
          ipfsCid: ipfsResult?.cid || '',
          ipfsUrl: ipfsResult?.url || '',
          ipfsData: ipfsResult?.metadata || null,
          image: campaignData.hasCustomImage && campaignData.image ? campaignData.image : getRandomImage(),
          hasCustomImage: campaignData.hasCustomImage && campaignData.image ? true : false,
          isValid: true,
          isLocal: true
        };

        const updatedCampaigns = [newCampaign, ...campaigns];
        setCampaigns(updatedCampaigns);
        saveCampaigns(updatedCampaigns);

        return { success: true, campaign: newCampaign, ipfsResult };
      }
      
    } catch (error) {
      console.error('❌ Failed to create campaign:', error);
      throw error;
    }
  }, [campaigns, uploadCampaignData, createCampaignOnChain, loadCampaignsFromChain, isConnected, isCorrectNetwork, isClient, saveCampaigns]);

  // Donate to campaign
  const addDonation = useCallback(async (campaignId, amount) => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId || c.blockchainId === campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // If blockchain campaign and user is connected, use blockchain
      if (campaign.isFromBlockchain && isConnected && isCorrectNetwork && isClient) {
        const blockchainId = campaign.blockchainId || campaign.id;
        console.log('💰 Donating to blockchain campaign:', blockchainId, amount, 'APE');

        const result = await donateToChain(blockchainId, amount);
        console.log('✅ Donation successful:', result);

        // Update local state immediately
        const updatedCampaigns = campaigns.map(c => 
          (c.id === campaignId || c.blockchainId === campaignId) 
            ? { 
                ...c, 
                raised: c.raised + amount, 
                backers: c.backers + 1,
                lastDonation: {
                  amount,
                  timestamp: new Date().toISOString(),
                  txHash: result.txHash
                }
              }
            : c
        );
        setCampaigns(updatedCampaigns);

        // Refresh from blockchain after delay
        setTimeout(async () => {
          try {
            const refreshedCampaigns = await loadCampaignsFromChain();
            setCampaigns(prevCampaigns => {
              const localCampaigns = prevCampaigns.filter(c => c.isLocal && !c.isFromBlockchain);
              return [...refreshedCampaigns, ...localCampaigns];
            });
          } catch (error) {
            console.warn('Could not refresh from blockchain:', error);
          }
        }, 3000);

        return { success: true, txHash: result.txHash };
      } else {
        // Local donation (simulation)
        console.log('📱 Local donation simulation');
        const updatedCampaigns = campaigns.map(c => 
          c.id === campaignId 
            ? { 
                ...c, 
                raised: c.raised + amount, 
                backers: c.backers + 1,
                lastDonation: {
                  amount,
                  timestamp: new Date().toISOString()
                }
              }
            : c
        );
        setCampaigns(updatedCampaigns);
        saveCampaigns(updatedCampaigns);

        return { success: true };
      }

    } catch (error) {
      console.error('❌ Failed to process donation:', error);
      throw error;
    }
  }, [campaigns, donateToChain, loadCampaignsFromChain, isConnected, isCorrectNetwork, isClient, saveCampaigns]);

  // Delete campaign (only local campaigns)
  const deleteCampaign = useCallback((campaignId) => {
    const campaignToDelete = campaigns.find(c => c.id === campaignId);
    
    if (campaignToDelete && campaignToDelete.isFromBlockchain) {
      throw new Error('Cannot delete blockchain campaigns. They exist permanently on ApeChain.');
    }
    
    const updatedCampaigns = campaigns.filter(campaign => campaign.id !== campaignId);
    setCampaigns(updatedCampaigns);
    saveCampaigns(updatedCampaigns);
    
    return { success: true, deletedId: campaignId };
  }, [campaigns, saveCampaigns]);

  // Import campaign from IPFS CID
  const loadCampaignFromIPFS = useCallback(async (cid) => {
    try {
      // This is mainly for the admin panel import function
      // For now, just add it as local campaign
      const existingCampaign = campaigns.find(campaign => campaign.ipfsCid === cid);
      if (existingCampaign) {
        return { success: true, campaign: existingCampaign, alreadyExists: true };
      }

      // Create placeholder campaign that will be populated from IPFS
      const importedCampaign = {
        id: Date.now(),
        title: `Imported Campaign ${cid.slice(0, 8)}`,
        description: 'Loading from IPFS...',
        category: 'Technology',
        target: 100,
        creator: 'Unknown',
        raised: 0,
        backers: 0,
        daysLeft: 30,
        createdAt: new Date().toISOString(),
        ipfsCid: cid,
        image: getRandomImage(),
        isValid: true,
        imported: true,
        isLocal: true
      };

      const updatedCampaigns = [importedCampaign, ...campaigns];
      setCampaigns(updatedCampaigns);
      saveCampaigns(updatedCampaigns);

      return { success: true, campaign: importedCampaign };
    } catch (error) {
      console.error('Failed to import campaign from IPFS:', error);
      throw error;
    }
  }, [campaigns, saveCampaigns]);

  // Refresh campaigns from blockchain
  const refreshFromBlockchain = useCallback(async () => {
    if (!isClient) {
      throw new Error('Blockchain not available');
    }

    try {
      setIsLoading(true);
      console.log('🔄 Refreshing campaigns from blockchain...');
      
      const blockchainCampaigns = await loadCampaignsFromChain();
      const localCampaigns = loadLocalCampaigns();
      
      // Combine blockchain + local (non-blockchain) campaigns
      const allCampaigns = [...blockchainCampaigns];
      localCampaigns.forEach(local => {
        const existsOnBlockchain = blockchainCampaigns.some(
          bc => bc.title === local.title && bc.creator === local.creator
        );
        if (!existsOnBlockchain) {
          allCampaigns.push({
            ...local,
            isLocalOnly: true
          });
        }
      });
      
      setCampaigns(allCampaigns);
      console.log(`✅ Refreshed: ${allCampaigns.length} total campaigns`);
      
      return { success: true, total: allCampaigns.length };
    } catch (error) {
      console.error('❌ Failed to refresh from blockchain:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadCampaignsFromChain, isClient]);

  // Clear local campaigns only
  const clearAllCampaigns = useCallback(() => {
    const blockchainCampaigns = campaigns.filter(campaign => campaign.isFromBlockchain);
    setCampaigns(blockchainCampaigns);
    localStorage.removeItem(CAMPAIGNS_STORAGE_KEY);
    return { success: true };
  }, [campaigns]);

  // Enhanced statistics
  const getStatistics = useCallback(async () => {
    try {
      // Get blockchain stats if available
      let blockchainStats = null;
      if (isClient && getContractStats) {
        try {
          blockchainStats = await getContractStats();
        } catch (error) {
          console.warn('Could not get blockchain stats:', error);
        }
      }
      
      // Calculate local stats
      const localStats = {
        totalCampaigns: campaigns.length,
        blockchainCampaigns: campaigns.filter(c => c.isFromBlockchain).length,
        localCampaigns: campaigns.filter(c => c.isLocal && !c.isFromBlockchain).length,
        totalRaised: campaigns.reduce((sum, campaign) => sum + campaign.raised, 0),
        totalBackers: campaigns.reduce((sum, campaign) => sum + campaign.backers, 0),
        totalIPFSCampaigns: campaigns.filter(campaign => campaign.ipfsCid).length
      };

      return {
        ...localStats,
        blockchain: blockchainStats
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        totalCampaigns: campaigns.length,
        blockchainCampaigns: campaigns.filter(c => c.isFromBlockchain).length,
        localCampaigns: campaigns.filter(c => c.isLocal && !c.isFromBlockchain).length,
        totalRaised: campaigns.reduce((sum, campaign) => sum + campaign.raised, 0),
        totalBackers: campaigns.reduce((sum, campaign) => sum + campaign.backers, 0),
        totalIPFSCampaigns: campaigns.filter(campaign => campaign.ipfsCid).length,
        blockchain: null
      };
    }
  }, [campaigns, getContractStats, isClient]);

  // Get current statistics
  const [statistics, setStatistics] = useState({});
  useEffect(() => {
    getStatistics().then(setStatistics);
  }, [campaigns, getStatistics]);

  return {
    campaigns,
    isLoading,
    statistics,
    createCampaign,
    deleteCampaign,
    addDonation,
    loadCampaignFromIPFS, // For admin panel
    clearAllCampaigns,
    refreshFromBlockchain, // Instead of refreshFromRegistry
    
    // Blockchain specific
    isConnected,
    isCorrectNetwork,
    isClient
  };
};

// Helper: Random images for campaigns
const getRandomImage = () => {
  const images = [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518134080730-a8ce4ff50e0b?w=400&h=300&fit=crop'
  ];
  return images[Math.floor(Math.random() * images.length)];
};