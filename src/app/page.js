'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Plus, Wallet, Clock, Users, AlertCircle, Trash2, Download, Upload } from 'lucide-react';
import { useWalletConnection } from './hooks/useWalletConnection';
import { useCampaignManager } from './hooks/useCampaignManager';
import CreateCampaignModal from '../components/CreateCampaignModal';
import CampaignCard from '../components/CampaignCard';
import WalletModal from '../components/WalletModal';

// Dark Mode Hook (permanent dark)
const useDarkMode = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  return { isDark: true };
};

// Updated DonateModal in page.js

const DonateModal = ({ isOpen, campaign, onClose, onDonate, isConnected, isCorrectNetwork, chainName }) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!isCorrectNetwork) {
      alert(`Please switch to ApeChain. Currently on: ${chainName}`);
      return;
    }

    setIsProcessing(true);
    try {
      await onDonate(campaign.id, parseFloat(amount));
      setAmount('');
      alert(`Successfully donated ${amount} APE! 🎉`);
    } catch (error) {
      console.error('Donation failed:', error);
      alert(`Donation failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isOpen || !campaign) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Support Campaign</h2>
        
        <div className="mb-4">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{campaign.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{campaign.description}</p>
        </div>
        
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-800 dark:text-gray-200">Already raised:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{campaign.raised} APE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-800 dark:text-gray-200">Goal:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{campaign.target} APE</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-800 dark:text-gray-200">Campaign Type:</span>
              <span className="text-sm px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {campaign.isFromBlockchain ? '⛓️ Blockchain' : '📱 Local'}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        {!isConnected && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Please connect your wallet to donate with real APE tokens
            </p>
          </div>
        )}

        {isConnected && !isCorrectNetwork && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              ❌ Please switch to ApeChain. Currently on: {chainName}
            </p>
          </div>
        )}

        {isConnected && isCorrectNetwork && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ Ready to donate with real APE tokens on ApeChain!
            </p>
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
            Donation Amount (APE)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.01"
            min="0"
            disabled={isProcessing}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isConnected && isCorrectNetwork 
              ? 'This will be a real blockchain transaction' 
              : 'Connect your wallet for real donations'
            }
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDonate}
            disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                {isConnected && isCorrectNetwork ? 'Donate APE' : 'Simulate Donation'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced AdminPanel component für page.js

const AdminPanel = ({ onClearAll, onImportIPFS, onRefreshRegistry, statistics }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [importCid, setImportCid] = useState('');
  const [registryCid, setRegistryCid] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingToRegistry, setIsAddingToRegistry] = useState(false);

  const handleImport = async () => {
    if (!importCid.trim()) return;
    
    setIsImporting(true);
    try {
      await onImportIPFS(importCid.trim());
      setImportCid('');
      alert('Campaign imported successfully!');
    } catch (error) {
      alert('Failed to import campaign: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRefreshRegistry = async () => {
    setIsRefreshing(true);
    try {
      const result = await onRefreshRegistry();
      alert(`Registry refreshed! Found ${result.total} campaigns.`);
    } catch (error) {
      alert('Failed to refresh registry: ' + error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddToRegistry = async () => {
    if (!registryCid.trim()) return;
    
    setIsAddingToRegistry(true);
    try {
      // Import campaign first, then add to registry
      await onImportIPFS(registryCid.trim());
      setRegistryCid('');
      alert('Campaign added to registry successfully!');
    } catch (error) {
      alert('Failed to add to registry: ' + error.message);
    } finally {
      setIsAddingToRegistry(false);
    }
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 right-4 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Admin Panel"
      >
        ⚙️
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[350px] max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Admin Panel</h3>
        <button 
          onClick={() => setShowPanel(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Statistics */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
        <div className="font-semibold mb-1">📊 Statistics</div>
        <div>Total Campaigns: {statistics.totalCampaigns}</div>
        <div>Local Campaigns: {statistics.localCampaigns || 0}</div>
        <div>Registry Campaigns: {statistics.registryCampaigns || 0}</div>
        <div>IPFS Campaigns: {statistics.totalIPFSCampaigns}</div>
        <div>Total Raised: {statistics.totalRaised.toFixed(1)} APE</div>
      </div>

      {/* Registry Management */}
      <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
        <label className="block text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">
          🌐 Registry Management
        </label>
        
        {/* Refresh Registry */}
        <button
          onClick={handleRefreshRegistry}
          disabled={isRefreshing}
          className="w-full mb-2 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isRefreshing ? 'Refreshing...' : 'Refresh from Registry'}
        </button>

        {/* Add to Registry */}
        <div className="flex gap-2">
          <input
            type="text"
            value={registryCid}
            onChange={(e) => setRegistryCid(e.target.value)}
            placeholder="CID to add to registry..."
            className="flex-1 p-2 text-sm border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={handleAddToRegistry}
            disabled={!registryCid.trim() || isAddingToRegistry}
            className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {isAddingToRegistry ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Import from IPFS */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
          📥 Import Campaign from IPFS
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={importCid}
            onChange={(e) => setImportCid(e.target.value)}
            placeholder="IPFS CID..."
            className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={handleImport}
            disabled={!importCid.trim() || isImporting}
            className="px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>

      {/* Known CIDs */}
      <div className="mb-4 bg-green-50 dark:bg-green-900/20 p-3 rounded">
        <div className="font-semibold text-sm text-green-800 dark:text-green-200 mb-2">
          🗂️ Known Campaign CIDs
        </div>
        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
          <div className="font-mono bg-white dark:bg-gray-800 p-1 rounded">
            QmdeW3reDJKoHqLXpcMgBjPGn6gQ2s8iSkBxFKEEfRvZPH
          </div>
          <div className="text-xs text-gray-500">
            Copy this CID to test the import/registry functions
          </div>
        </div>
      </div>

      {/* Clear All */}
      <button
        onClick={() => {
          if (confirm('Are you sure you want to delete all LOCAL campaigns? Registry campaigns will remain.')) {
            onClearAll();
            setShowPanel(false);
          }
        }}
        className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center justify-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Clear Local Campaigns
      </button>
    </div>
  );
};

export default function GoApeMe() {
  const { 
    isConnected, 
    address, 
    formattedAddress, 
    mobileAddress, 
    connect, 
    disconnect, 
    isCorrectNetwork, 
    switchToApeChain,
    chainName 
  } = useWalletConnection();

  const {
    campaigns,
    isLoading,
    statistics,
    createCampaign,
    deleteCampaign,
    addDonation,
    loadCampaignFromIPFS,
    clearAllCampaigns
  } = useCampaignManager();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filter, setFilter] = useState('All');
  
  const categories = ['All', 'Technology', 'Environment', 'Social', 'Art', 'Education'];
  
  const filteredCampaigns = filter === 'All' 
    ? campaigns 
    : campaigns.filter(campaign => campaign.category === filter);
  
  const handleCreateCampaign = async (campaignData) => {
    try {
      const result = await createCampaign(campaignData, address);
      
      // Modal schließt sich automatisch über das Modal selbst
      console.log('Campaign created successfully:', result);
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error; // Re-throw für Modal Error Handling
    }
  };
  
  const handleDonate = async (campaignId, amount) => {
  try {
    setIsDonateModalOpen(false);
    setSelectedCampaign(null);
    
    // This will now trigger real smart contract donation
    await addDonation(campaignId, amount);
    
    console.log('✅ Donation completed successfully');
  } catch (error) {
    console.error('❌ Failed to process donation:', error);
    alert('Failed to process donation: ' + error.message);
  }
};

  const handleDeleteCampaign = (campaignId) => {
    try {
      deleteCampaign(campaignId);
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      alert('Failed to delete campaign: ' + error.message);
    }
  };
  
  const openDonateModal = (campaign) => {
    setSelectedCampaign(campaign);
    setIsDonateModalOpen(true);
  };

  const handleImportFromIPFS = async (cid) => {
    return loadCampaignFromIPFS(cid);
  };

  const handleClearAll = () => {
    clearAllCampaigns();
  };

  const handleRefreshRegistry = async () => {
  return refreshFromRegistry();
};
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 min-h-[4rem]">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
  <img 
    src="/apecrowd_logo_transparent.png" 
    alt="APECrowd Logo" 
    className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
  />
  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
    APECrowd
  </h1>
</div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Network Warning */}
              {isConnected && !isCorrectNetwork && (
                <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Wrong Network ({chainName})</span>
                  <span className="sm:hidden">⚠️</span>
                </div>
              )}
              
              {isConnected && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="hidden sm:flex bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Campaign
                </button>
              )}
              
              {isConnected && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="sm:hidden bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
              
              {/* Network Switch Button */}
              {isConnected && !isCorrectNetwork && (
                <button
                  onClick={switchToApeChain}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Switch to ApeChain
                </button>
              )}
              
              <button
                onClick={isConnected ? () => setIsWalletModalOpen(true) : connect}
                className="flex items-center gap-2 bg-gray-800 dark:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {isConnected ? formattedAddress : 'Connect Wallet'}
                </span>
                <span className="sm:hidden">
                  {isConnected ? mobileAddress : 'Connect'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            Crowdfunding on <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">ApeChain</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Decentralized, transparent and secure. Support innovative projects or start your own campaign.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {(statistics.totalRaised || 0).toFixed(1)} APE
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Total Raised</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {statistics.totalBackers}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Supporters</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {statistics.totalCampaigns}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Active Campaigns</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Campaigns Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 md:mb-0">
              {isLoading ? 'Loading Campaigns...' : 'Current Campaigns'}
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    filter === category
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          )}

          {/* No Campaigns State */}
          {!isLoading && campaigns.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🦍</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                No campaigns yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isConnected ? 'Be the first to create a campaign!' : 'Connect your wallet to create the first campaign!'}
              </p>
              {isConnected && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Create First Campaign
                </button>
              )}
            </div>
          )}

          {/* Campaigns Grid */}
          {!isLoading && filteredCampaigns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCampaigns.map(campaign => (
  <CampaignCard 
    key={campaign.id} 
    campaign={campaign} 
    onDonate={openDonateModal}
    onDelete={handleDeleteCampaign}
    currentUserAddress={address}
    isConnected={isConnected}
    isCorrectNetwork={isCorrectNetwork}
    onConnectWallet={connect}
  />
))}
            </div>
          )}

          {/* Filtered Empty State */}
          {!isLoading && campaigns.length > 0 && filteredCampaigns.length === 0 && (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                No campaigns in "{filter}" category
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try selecting a different category or create a new campaign.
              </p>
            </div>
          )}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-900 text-white py-12 px-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-4">
  <img 
    src="/apecrowd_logo_transparent.png" 
    alt="APECrowd Logo" 
    className="h-16 w-16 object-contain"
  />
</div>
          <h3 className="text-2xl font-bold mb-4">APECrowd sponsored by Rida</h3>
          <p className="text-gray-400 mb-6">
            The decentralized crowdfunding platform on ApeChain
          </p>
          <div className="flex justify-center gap-6">
            <span className="text-sm text-gray-500">Built with ❤️ on ApeChain</span>
          </div>
        </div>
      </footer>
      
      {/* Modals */}
      <CreateCampaignModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCampaign}
      />
      
      <DonateModal
  isOpen={isDonateModalOpen}
  campaign={selectedCampaign}
  onClose={() => {
    setIsDonateModalOpen(false);
    setSelectedCampaign(null);
  }}
  onDonate={handleDonate}
  isConnected={isConnected}
  isCorrectNetwork={isCorrectNetwork}
  chainName={chainName}
/>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onDisconnect={disconnect}
        address={address}
        formattedAddress={formattedAddress}
        chainName={chainName}
        isCorrectNetwork={isCorrectNetwork}
      />

      {/* Admin Panel */}
      <AdminPanel 
  onClearAll={handleClearAll}
  onImportIPFS={handleImportFromIPFS}
  onRefreshRegistry={handleRefreshRegistry}
  statistics={statistics}
/>
    </div>
  );
}