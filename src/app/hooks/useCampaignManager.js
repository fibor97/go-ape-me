import { useState, useCallback, useEffect } from 'react';
import { useStoracha } from './useStoracha';
import { useSmartContract } from './useSmartContract'; // ← Das muss da sein!
import { useIPFSRegistry } from './useIPFSRegistry';

const CAMPAIGNS_STORAGE_KEY = 'go-ape-me-campaigns';

export const useCampaignManager = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { uploadCampaignData, getCampaignData } = useStoracha();
  const { loadAllCampaigns, addCampaignToRegistry } = useIPFSRegistry();

  // Lade Kampagnen beim Start: Kombiniere lokale + Registry
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        console.log('🚀 Loading campaigns: Local + IPFS Registry...');
        
        // 1. Lade lokale Kampagnen
        const localCampaigns = await loadLocalCampaigns();
        console.log(`📱 Loaded ${localCampaigns.length} local campaigns`);
        
        // 2. Lade Registry-Kampagnen
        const registryCampaigns = await loadAllCampaigns();
        console.log(`🌐 Loaded ${registryCampaigns.length} registry campaigns`);
        
        // 3. Kombiniere und dedupliziere
        const allCampaigns = combineAndDeduplicateCampaigns(localCampaigns, registryCampaigns);
        console.log(`✅ Total campaigns: ${allCampaigns.length}`);
        
        setCampaigns(allCampaigns);
        
      } catch (error) {
        console.error('❌ Failed to load campaigns:', error);
        // Fallback: Nur lokale Kampagnen
        const localCampaigns = await loadLocalCampaigns();
        setCampaigns(localCampaigns);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaigns();
  }, [loadAllCampaigns]);

  // Lade lokale Kampagnen aus localStorage
  const loadLocalCampaigns = async () => {
    try {
      const storedCampaigns = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      if (storedCampaigns) {
        const parsedCampaigns = JSON.parse(storedCampaigns);
        
        // Validiere IPFS-Daten für lokale Kampagnen
        const validatedCampaigns = await Promise.allSettled(
          parsedCampaigns.map(async (campaign) => {
            if (campaign.ipfsCid) {
              try {
                const ipfsData = await getCampaignData(campaign.ipfsCid);
                return { ...campaign, ipfsData, isValid: true, isLocal: true };
              } catch (error) {
                console.warn(`Failed to load IPFS data for local campaign ${campaign.id}:`, error);
                return { ...campaign, isValid: false, isLocal: true };
              }
            }
            return { ...campaign, isLocal: true };
          })
        );

        return validatedCampaigns
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value)
          .filter(campaign => campaign.isValid !== false);
      }
      return [];
    } catch (error) {
      console.error('Failed to load local campaigns:', error);
      return [];
    }
  };

  // Kombiniere lokale und Registry-Kampagnen (ohne Duplikate)
  const combineAndDeduplicateCampaigns = (localCampaigns, registryCampaigns) => {
    const combined = [...localCampaigns];
    
    // Füge Registry-Kampagnen hinzu, die nicht bereits lokal vorhanden sind
    registryCampaigns.forEach(registryCampaign => {
      const existsLocally = localCampaigns.some(local => 
        local.ipfsCid === registryCampaign.ipfsCid ||
        (local.title === registryCampaign.title && local.creator === registryCampaign.creator)
      );
      
      if (!existsLocally) {
        combined.push({
          ...registryCampaign,
          isFromRegistry: true
        });
      }
    });
    
    // Sortiere nach Erstellungsdatum (neueste zuerst)
    return combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Speichere Kampagnen in localStorage
  const saveCampaigns = useCallback((campaignsToSave) => {
    try {
      // Speichere nur lokale Kampagnen (nicht Registry-Kampagnen)
      const localCampaigns = campaignsToSave.filter(campaign => !campaign.isFromRegistry);
      const dataToSave = JSON.stringify(localCampaigns);
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY, dataToSave);
      console.log('💾 Local campaigns saved:', localCampaigns.length);
    } catch (error) {
      console.error('❌ Failed to save campaigns:', error);
    }
  }, []);

  // Erstelle neue Kampagne (mit Registry-Integration)
  const createCampaign = useCallback(async (campaignData, creatorAddress) => {
    try {
      console.log('📝 Creating campaign with registry integration...');
      
      // 1. Upload zu IPFS
      const ipfsResult = await uploadCampaignData({
        ...campaignData,
        creator: creatorAddress
      });

      console.log('✅ IPFS Upload successful:', ipfsResult);

      // 2. Erstelle lokale Kampagne
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
        ipfsCid: ipfsResult.cid,
        ipfsUrl: ipfsResult.url,
        ipfsData: ipfsResult.metadata,
        image: campaignData.hasCustomImage && campaignData.image ? campaignData.image : getRandomImage(),
        hasCustomImage: campaignData.hasCustomImage && campaignData.image ? true : false,
        isValid: true,
        isLocal: true
      };

      // 3. Füge zur lokalen Liste hinzu
      const updatedCampaigns = [newCampaign, ...campaigns];
      setCampaigns(updatedCampaigns);
      saveCampaigns(updatedCampaigns);

      // 4. Füge zur Registry hinzu (asynchron, Fehler nicht blockierend)
      try {
        console.log('📋 Adding to global registry...');
        const registryResult = await addCampaignToRegistry(ipfsResult.cid);
        console.log('✅ Campaign added to registry:', registryResult);
      } catch (registryError) {
        console.warn('⚠️ Failed to add to registry (not critical):', registryError.message);
        // Nicht blockierend - Kampagne ist trotzdem erstellt
      }

      console.log('✅ Campaign created successfully!');
      
      return { success: true, campaign: newCampaign, ipfsResult };
    } catch (error) {
      console.error('❌ Failed to create campaign:', error);
      throw error;
    }
  }, [campaigns, uploadCampaignData, saveCampaigns, addCampaignToRegistry]);

  // Lösche Kampagne (nur lokale)
  const deleteCampaign = useCallback((campaignId) => {
    const campaignToDelete = campaigns.find(c => c.id === campaignId);
    
    if (campaignToDelete && campaignToDelete.isFromRegistry) {
      throw new Error('Cannot delete campaigns from registry. This campaign exists on IPFS.');
    }
    
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
        ipfsUrl: `https://tomato-petite-butterfly-553.mypinata.cloud/ipfs/${cid}`,
        ipfsData: ipfsData,
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
      console.error('Failed to load campaign from IPFS:', error);
      throw error;
    }
  }, [campaigns, getCampaignData, saveCampaigns]);

  // Refresh Registry (manuell alle Registry-Kampagnen neu laden)
  const refreshFromRegistry = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Refreshing campaigns from registry...');
      
      const localCampaigns = await loadLocalCampaigns();
      const registryCampaigns = await loadAllCampaigns();
      const allCampaigns = combineAndDeduplicateCampaigns(localCampaigns, registryCampaigns);
      
      setCampaigns(allCampaigns);
      console.log(`✅ Refreshed: ${allCampaigns.length} total campaigns`);
      
      return { success: true, total: allCampaigns.length };
    } catch (error) {
      console.error('❌ Failed to refresh from registry:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadAllCampaigns]);

  // Clear alle LOKALEN Kampagnen (Registry bleibt)
  const clearAllCampaigns = useCallback(() => {
    const registryCampaigns = campaigns.filter(campaign => campaign.isFromRegistry);
    setCampaigns(registryCampaigns);
    localStorage.removeItem(CAMPAIGNS_STORAGE_KEY);
    return { success: true };
  }, [campaigns]);

  // Statistiken
  const statistics = {
    totalCampaigns: campaigns.length,
    localCampaigns: campaigns.filter(c => c.isLocal && !c.isFromRegistry).length,
    registryCampaigns: campaigns.filter(c => c.isFromRegistry).length,
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
    clearAllCampaigns,
    refreshFromRegistry
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