import { useState, useCallback } from 'react';

export const useStoracha = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Upload campaign data via backend API mit verbessertem Error Handling
  const uploadCampaignData = useCallback(async (campaignData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📤 Uploading via backend API...');
      
      // Validierung vor dem Upload
      if (!campaignData.title || !campaignData.description || !campaignData.target) {
        throw new Error('Bitte füllen Sie alle Pflichtfelder aus');
      }

      if (parseFloat(campaignData.target) <= 0) {
        throw new Error('Das Ziel muss größer als 0 sein');
      }
      
      const response = await fetch('/api/upload-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Spezifische Error-Behandlung für verschiedene HTTP Status Codes
        if (response.status === 400) {
          throw new Error(result.error || 'Ungültige Eingabedaten');
        } else if (response.status === 500) {
          throw new Error(result.error || 'Server-Fehler beim Upload zu IPFS');
        } else {
          throw new Error(`HTTP ${response.status}: ${result.error || 'Unbekannter Fehler'}`);
        }
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Upload fehlgeschlagen');
      }

      console.log('✅ Backend upload successful!', result.cid);
      return result;
      
    } catch (error) {
      console.error('❌ Backend upload failed:', error);
      
      // User-friendly error messages
      let userMessage = error.message;
      
      if (error.message.includes('Failed to fetch')) {
        userMessage = 'Netzwerk-Fehler. Bitte überprüfen Sie Ihre Internetverbindung.';
      } else if (error.message.includes('space') || error.message.includes('Space')) {
        userMessage = 'IPFS Storage-Konfiguration fehlt. Bitte kontaktieren Sie den Administrator.';
      } else if (error.message.includes('login') || error.message.includes('Login')) {
        userMessage = 'IPFS Authentifizierung fehlgeschlagen. Bitte versuchen Sie es später erneut.';
      }
      
      setError(userMessage);
      throw new Error(userMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Retrieve campaign data from IPFS mit Error Handling
  const getCampaignData = useCallback(async (cid) => {
    try {
      if (!cid) {
        throw new Error('CID ist erforderlich');
      }

      console.log('📥 Fetching campaign data from IPFS:', cid);
      
      const response = await fetch(`https://${cid}.ipfs.w3s.link`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Campaign-Daten nicht gefunden');
        } else {
          throw new Error(`Fehler beim Laden: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Campaign data retrieved:', data.title);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to retrieve campaign data:', error);
      
      let userMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        userMessage = 'Netzwerk-Fehler beim Laden der Campaign-Daten.';
      }
      
      setError(userMessage);
      throw new Error(userMessage);
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Retry function für failed uploads
  const retryUpload = useCallback(async (campaignData) => {
    console.log('🔄 Retrying upload...');
    return uploadCampaignData(campaignData);
  }, [uploadCampaignData]);

  return {
    isLoading,
    error,
    uploadCampaignData,
    getCampaignData,
    clearError,
    retryUpload,
    isReady: true // Backend ist immer ready
  };
};