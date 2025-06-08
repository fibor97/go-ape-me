import { useState, useCallback, useEffect } from 'react';
import { useStoracha } from './useStoracha';

const CAMPAIGNS_STORAGE_KEY = 'go-ape-me-campaigns';

export const useCampaignManager = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { uploadCampaignData, getCampaignData } = useStoracha();

  // Lade Kampagnen aus localStorage beim Start
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const storedCampaigns = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
        if (storedCampaigns) {
          const parsedCampaigns = JSON.parse(storedCampaigns);
          
          // Validiere und lade IPFS-Daten für gespeicherte Kampagnen
          const validatedCampaigns = await Promise.allSettled(
            parsedCampaigns.map(async (campaign) => {
              if (campaign.ipfsCid) {
                try {
                  // Versuche IPFS-Daten zu laden um zu validieren
                  const ipfsData = await getCampaignData(campaign.ipfsCid);
                  return { ...campaign, ipfsData, isValid: true };
                } catch (error) {
                  console.warn(`Failed to load IPFS data for campaign ${campaign.id}:`, error);
                  return { ...campaign, isValid: false };
                }
              }
              return campaign;
            })
          );

          const loadedCampaigns = validatedCampaigns
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value)
            .filter(campaign => campaign.isValid !== false);

          setCampaigns(loadedCampaigns);
        }
      } catch (error) {
        console.error('Failed to load campaigns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaigns();
  }, [getCampaignData]);

  // Speichere Kampagnen in localStorage
  const saveCampaigns = useCallback((campaignsToSave) => {
    try {
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaignsToSave));
    } catch (error) {
      console.error('Failed to save campaigns:', error);
    }
  }, []);

  // Erstelle neue Kampagne
  const createCampaign = useCallback(async (campaignData, creatorAddress) => {
    try {
      // Upload zu IPFS
      const ipfsResult = await uploadCampaignData({
        ...campaignData,
        creator: creatorAddress
      });

      // Erstelle lokale Kampagne
      const newCampaign = {
        id: Date.now(), // Unique ID basierend auf Timestamp
        title: campaignData.title,
        description: campaignData.description,
        category: campaignData.category,
        target: parseFloat(campaignData.target),
        creator: creatorAddress,
        raised: 0,
        backers: 0,
        daysLeft: 30,
        createdAt: new Date().toISOString(),
        // IPFS Integration
        ipfsCid: ipfsResult.cid,
        ipfsUrl: ipfsResult.url,
        ipfsData: ipfsResult.metadata,
        // Bild: Verwende Custom Image oder zufälliges Bild
        image: campaignData.hasCustomImage && campaignData.image ? campaignData.image : getRandomImage(),
        hasCustomImage: campaignData.hasCustomImage && campaignData.image ? true : false,
        isValid: true
      };

      const updatedCampaigns = [newCampaign, ...campaigns];
      setCampaigns(updatedCampaigns);
      saveCampaigns(updatedCampaigns);

      return { success: true, campaign: newCampaign, ipfsResult };
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error;
    }
  }, [campaigns, uploadCampaignData, saveCampaigns]);

  // Lösche Kampagne
  const deleteCampaign = useCallback((campaignId) => {
    const updatedCampaigns = campaigns.filter(campaign => campaign.id !== campaignId);
    setCampaigns(updatedCampaigns);
    saveCampaigns(updatedCampaigns);
    
    return { success: true, deletedId: campaignId };
  }, [campaigns, saveCampaigns]);

  // Update Kampagne (für Donations)
  const updateCampaign = useCallback((campaignId, updates) => {
    const updatedCampaigns = campaigns.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, ...updates }
        : campaign
    );
    setCampaigns(updatedCampaigns);
    saveCampaigns(updatedCampaigns);
    
    return { success: true };
  }, [campaigns, saveCampaigns]);

  // Spende zu Kampagne hinzufügen
  const addDonation = useCallback((campaignId, amount) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const updates = {
      raised: campaign.raised + amount,
      backers: campaign.backers + 1,
      lastDonation: {
        amount,
        timestamp: new Date().toISOString()
      }
    };

    return updateCampaign(campaignId, updates);
  }, [campaigns, updateCampaign]);

  // Lade Kampagne von IPFS (für externe CIDs)
  const loadCampaignFromIPFS = useCallback(async (cid) => {
    try {
      const ipfsData = await getCampaignData(cid);
      
      // Prüfe ob Kampagne bereits existiert
      const existingCampaign = campaigns.find(campaign => campaign.ipfsCid === cid);
      if (existingCampaign) {
        return { success: true, campaign: existingCampaign, alreadyExists: true };
      }

      // Erstelle neue Kampagne aus IPFS-Daten
      const importedCampaign = {
        id: Date.now(),
        title: ipfsData.title,
        description: ipfsData.description,
        category: ipfsData.category || 'Technology',
        target: ipfsData.target,
        creator: ipfsData.creator,
        raised: 0,
        backers: 0,
        daysLeft: 30,
        createdAt: ipfsData.createdAt || new Date().toISOString(),
        ipfsCid: cid,
        ipfsUrl: `https://${cid}.ipfs.w3s.link`,
        ipfsData: ipfsData,
        image: getRandomImage(),
        isValid: true,
        imported: true
      };

      const updatedCampaigns = [importedCampaign, ...campaigns];
      setCampaigns(updatedCampaigns);
      saveCampaigns(updatedCampaigns);

      return { success: true, campaign: importedCampaign };
    } catch (error) {
      console.error('Failed to load campaign from IPFS:', error);
      throw error;
    }
  }, [campaigns, getCampaignData, saveCampaigns]);

  // Clear alle Kampagnen (für Reset)
  const clearAllCampaigns = useCallback(() => {
    setCampaigns([]);
    localStorage.removeItem(CAMPAIGNS_STORAGE_KEY);
    return { success: true };
  }, []);

  // Statistiken
  const statistics = {
    totalCampaigns: campaigns.length,
    totalRaised: campaigns.reduce((sum, campaign) => sum + campaign.raised, 0),
    totalBackers: campaigns.reduce((sum, campaign) => sum + campaign.backers, 0),
    totalIPFSCampaigns: campaigns.filter(campaign => campaign.ipfsCid).length
  };

  return {
    campaigns,
    isLoading,
    statistics,
    createCampaign,
    deleteCampaign,
    updateCampaign,
    addDonation,
    loadCampaignFromIPFS,
    clearAllCampaigns
  };
};

// Helper: Zufällige Bilder für Kampagnen
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