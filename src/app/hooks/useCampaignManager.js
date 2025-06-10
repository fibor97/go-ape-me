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

  // Load campaigns on startup: ONLY Blockchain campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        console.log('🚀 Loading campaigns from ApeChain...');
        setIsLoading(true);
        
        // ONLY load from blockchain - no local fallback
        if (isClient) {
          try {
            const blockchainCampaigns = await loadCampaignsFromChain();
            console.log(`⛓️ Loaded ${blockchainCampaigns.length} campaigns from ApeChain`);
            setCampaigns(blockchainCampaigns);
          } catch (error) {
            console.error('❌ Could not load from blockchain:', error);
            setCampaigns([]); // Empty if blockchain fails
          }
        } else {
          console.log('⏳ Waiting for blockchain dependencies...');
          setCampaigns([]);
        }
        
      } catch (error) {
        console.error('❌ Failed to load campaigns:', error);
        setCampaigns([]);
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

  // Create campaign - ALWAYS on Blockchain
  const createCampaign = useCallback(async (campaignData, creatorAddress) => {
    try {
      console.log('📝 Creating campaign on ApeChain...');
      
      // ENFORCE: Campaigns MUST be on blockchain
      if (!isClient) {
        throw new Error('Blockchain dependencies not loaded. Please refresh the page.');
      }
      
      if (!isConnected) {
        throw new Error('Please connect your wallet to create campaigns on ApeChain.');
      }
      
      if (!isCorrectNetwork) {
        throw new Error('Please switch to ApeChain to create campaigns.');
      }

      console.log('⛓️ Creating campaign on ApeChain blockchain...');
      
      // 1. Upload metadata to IPFS first
      let ipfsResult = null;
      try {
        console.log('📤 Uploading metadata to IPFS...');

// Debug: Log what we're uploading
const metadataToUpload = {
  ...campaignData,
  creator: creatorAddress
};
console.log('🔍 Metadata being uploaded:', metadataToUpload);
console.log('🖼️ Has custom image?', campaignData.hasCustomImage);
console.log('🖼️ Image data length:', campaignData.image?.length || 0);
console.log('🖼️ Image starts with:', campaignData.image?.substring(0, 50) || 'No image');

ipfsResult = await uploadCampaignData(metadataToUpload);
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

      // 5. Refresh from blockchain after delay to get accurate data
      setTimeout(async () => {
        try {
          const refreshedCampaigns = await loadCampaignsFromChain();
          setCampaigns(refreshedCampaigns);
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
      
    } catch (error) {
      console.error('❌ Failed to create campaign:', error);
      throw error;
    }
  }, [campaigns, uploadCampaignData, createCampaignOnChain, loadCampaignsFromChain, isConnected, isCorrectNetwork, isClient, saveCampaigns]);

  // Donate to campaign - ALWAYS on Blockchain
  const addDonation = useCallback(async (campaignId, amount) => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId || c.blockchainId === campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // ENFORCE: Donations MUST be on blockchain
      if (!isClient) {
        throw new Error('Blockchain dependencies not loaded. Please refresh the page.');
      }
      
      if (!isConnected) {
        throw new Error('Please connect your wallet to donate with real APE.');
      }
      
      if (!isCorrectNetwork) {
        throw new Error('Please switch to ApeChain to donate.');
      }

      // All donations go through blockchain
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
          setCampaigns(refreshedCampaigns);
        } catch (error) {
          console.warn('Could not refresh from blockchain:', error);
        }
      }, 3000);

      return { success: true, txHash: result.txHash };

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