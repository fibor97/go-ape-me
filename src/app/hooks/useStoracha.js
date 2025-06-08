import { useState, useCallback } from 'react';

export const useStoracha = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Upload campaign data via backend API
  const uploadCampaignData = useCallback(async (campaignData) => {
    setIsLoading(true);
    try {
      console.log('📤 Uploading via backend API...');
      
      const response = await fetch('/api/upload-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('✅ Backend upload successful!', result.cid);
      return result;
      
    } catch (error) {
      console.error('❌ Backend upload failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Retrieve campaign data from IPFS (bleibt gleich)
  const getCampaignData = useCallback(async (cid) => {
    try {
      const response = await fetch(`https://${cid}.ipfs.w3s.link`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to retrieve campaign data:', error);
      throw error;
    }
  }, []);

  return {
    isLoading,
    uploadCampaignData,
    getCampaignData,
    isReady: true // Backend ist immer ready
  };
};