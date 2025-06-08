import { useState, useCallback } from 'react';

export const useStoracha = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Upload campaign data mit detailliertem Progress
  const uploadCampaignData = useCallback(async (campaignData) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress('validating');
    
    try {
      console.log('📤 Starting upload process...');
      
      // Validierung
      if (!campaignData.title || !campaignData.description || !campaignData.target) {
        throw new Error('Bitte füllen Sie alle Pflichtfelder aus');
      }

      if (parseFloat(campaignData.target) <= 0) {
        throw new Error('Das Ziel muss größer als 0 sein');
      }

      setUploadProgress('connecting');
      
      // API Call
      const response = await fetch('/api/upload-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData)
      });

      setUploadProgress('uploading');

      const result = await response.json();
      
      if (!response.ok) {
        // Spezifische Error-Behandlung
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

      setUploadProgress('success');
      console.log('✅ Upload successful!', result.cid);
      
      // Success notification mit Details
      const successResult = {
        ...result,
        uploadTime: Date.now(),
        size: JSON.stringify(campaignData).length
      };
      
      return successResult;
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      setUploadProgress('error');
      
      // User-friendly error messages
      let userMessage = error.message;
      
      if (error.message.includes('Failed to fetch')) {
        userMessage = 'Netzwerk-Fehler. Bitte überprüfen Sie Ihre Internetverbindung.';
      } else if (error.message.includes('space') || error.message.includes('Space')) {
        userMessage = 'IPFS Storage-Konfiguration fehlt. Bitte kontaktieren Sie den Administrator.';
      } else if (error.message.includes('login') || error.message.includes('Login')) {
        userMessage = 'IPFS Authentifizierung fehlgeschlagen. Bitte versuchen Sie es später erneut.';
      } else if (error.message.includes('timeout')) {
        userMessage = 'Upload-Timeout. Das IPFS-Netzwerk ist möglicherweise überlastet. Bitte versuchen Sie es erneut.';
      }
      
      setError(userMessage);
      throw new Error(userMessage);
    } finally {
      setIsLoading(false);
      // Progress nach kurzer Zeit zurücksetzen
      setTimeout(() => {
        setUploadProgress(null);
      }, 3000);
    }
  }, []);

  // Retrieve campaign data from IPFS
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
    setUploadProgress(null);
  }, []);

  // Retry function
  const retryUpload = useCallback(async (campaignData) => {
    console.log('🔄 Retrying upload...');
    clearError();
    return uploadCampaignData(campaignData);
  }, [uploadCampaignData, clearError]);

  // Get upload status message
  const getUploadStatusMessage = useCallback(() => {
    switch (uploadProgress) {
      case 'validating':
        return 'Validating campaign data...';
      case 'connecting':
        return 'Connecting to IPFS network...';
      case 'uploading':
        return 'Uploading to decentralized storage...';
      case 'success':
        return 'Successfully uploaded to IPFS!';
      case 'error':
        return error || 'Upload failed';
      default:
        return null;
    }
  }, [uploadProgress, error]);

  return {
    isLoading,
    error,
    uploadProgress,
    uploadCampaignData,
    getCampaignData,
    clearError,
    retryUpload,
    getUploadStatusMessage,
    isReady: true
  };
};