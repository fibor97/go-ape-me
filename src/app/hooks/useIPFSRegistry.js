// src/app/hooks/useIPFSRegistry.js
import { useState, useCallback } from 'react';

// Aktuelle Registry CID - wird bei Updates geändert
const CURRENT_REGISTRY_CID = 'QmStartRegistry123'; // Initial placeholder

export const useIPFSRegistry = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // IPFS Gateways für Registry-Zugriff
  const gateways = [
    'https://tomato-petite-butterfly-553.mypinata.cloud/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/'
  ];

  // Lade Registry von IPFS
  const loadRegistry = useCallback(async (registryCid = CURRENT_REGISTRY_CID) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('📋 Loading campaigns registry from IPFS...');
      
      let registry = null;
      let lastError = null;

      // Versuche alle Gateways
      for (const gateway of gateways) {
        try {
          const url = `${gateway}${registryCid}`;
          console.log('🔗 Trying registry gateway:', url);
          
          const response = await fetch(url);
          if (response.ok) {
            registry = await response.json();
            console.log('✅ Registry loaded successfully:', registry);
            break;
          } else {
            lastError = new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.warn('❌ Gateway failed:', error.message);
          lastError = error;
          continue;
        }
      }

      if (!registry) {
        // Fallback: Erstelle leere Registry
        console.log('📝 Creating new empty registry...');
        registry = {
          campaigns: [],
          version: '1.0',
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          totalCampaigns: 0
        };
      }

      return registry;
      
    } catch (error) {
      console.error('❌ Failed to load registry:', error);
      setError(error.message);
      
      // Fallback zu leerer Registry
      return {
        campaigns: [],
        version: '1.0',
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalCampaigns: 0
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Lade alle Kampagnen aus der Registry
  const loadAllCampaigns = useCallback(async () => {
    try {
      const registry = await loadRegistry();
      console.log(`📊 Found ${registry.campaigns.length} campaigns in registry`);
      
      if (registry.campaigns.length === 0) {
        return [];
      }

      // Lade alle Kampagnen parallel
      const campaignPromises = registry.campaigns.map(async (cid, index) => {
        try {
          console.log(`📥 Loading campaign ${index + 1}/${registry.campaigns.length}: ${cid}`);
          
          // Versuche alle Gateways für diese Kampagne
          for (const gateway of gateways) {
            try {
              const url = `${gateway}${cid}`;
              const response = await fetch(url);
              
              if (response.ok) {
                const campaignData = await response.json();
                return {
                  id: Date.now() + index, // Unique ID
                  ...campaignData,
                  ipfsCid: cid,
                  ipfsUrl: url,
                  isValid: true,
                  fromRegistry: true,
                  // Default values für UI
                  raised: 0,
                  backers: 0,
                  daysLeft: 30,
                  image: getRandomImage()
                };
              }
            } catch (error) {
              continue;
            }
          }
          
          console.warn('❌ Could not load campaign:', cid);
          return null;
        } catch (error) {
          console.error('❌ Error loading campaign:', cid, error);
          return null;
        }
      });

      const results = await Promise.allSettled(campaignPromises);
      const loadedCampaigns = results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);

      console.log(`✅ Successfully loaded ${loadedCampaigns.length}/${registry.campaigns.length} campaigns`);
      return loadedCampaigns;
      
    } catch (error) {
      console.error('❌ Failed to load campaigns from registry:', error);
      setError(error.message);
      return [];
    }
  }, [loadRegistry]);

  // Füge Kampagne zur Registry hinzu
  const addCampaignToRegistry = useCallback(async (campaignCid) => {
    try {
      console.log('📝 Adding campaign to registry:', campaignCid);
      
      // Lade aktuelle Registry
      const currentRegistry = await loadRegistry();
      
      // Prüfe ob bereits vorhanden
      if (currentRegistry.campaigns.includes(campaignCid)) {
        console.log('ℹ️ Campaign already in registry');
        return { success: true, alreadyExists: true };
      }

      // Erstelle neue Registry
      const updatedRegistry = {
        ...currentRegistry,
        campaigns: [campaignCid, ...currentRegistry.campaigns],
        lastUpdated: new Date().toISOString(),
        totalCampaigns: currentRegistry.campaigns.length + 1
      };

      // Upload neue Registry zu IPFS
      const response = await fetch('/api/upload-registry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRegistry)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update registry');
      }

      console.log('✅ Registry updated! New CID:', result.cid);
      
      // TODO: In production würde man hier die neue Registry-CID irgendwo persistent speichern
      // Für Demo-Zwecke loggen wir sie nur
      console.log('🆕 New Registry CID:', result.cid);
      console.log('🔗 Registry URL:', result.url);
      
      return { 
        success: true, 
        registryCid: result.cid,
        registryUrl: result.url
      };
      
    } catch (error) {
      console.error('❌ Failed to add campaign to registry:', error);
      setError(error.message);
      throw error;
    }
  }, [loadRegistry]);

  return {
    isLoading,
    error,
    loadRegistry,
    loadAllCampaigns,
    addCampaignToRegistry,
    clearError: () => setError(null)
  };
};

// Helper: Zufällige Bilder
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