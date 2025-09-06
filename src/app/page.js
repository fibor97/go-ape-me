'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Plus, Wallet, Clock, Users, AlertCircle, Trash2, Download, Upload } from 'lucide-react';
import { useWalletConnection } from './hooks/useWalletConnection';
import { useCampaignManager } from './hooks/useCampaignManager';
import CreateCampaignModal from '../components/CreateCampaignModal';
import DonateModal from '../components/DonateModal';
import CampaignCard from '../components/CampaignCard';
import WalletModal from '../components/WalletModal';
import { useRouter } from 'next/navigation';
import { BarChart3, Trophy } from 'lucide-react';
import CelebrationFireworks from '../components/CelebrationFireworks';
import { getCampaignStatus, campaignFilters, filterCampaigns } from './hooks/useCampaignManager';
import { ENSName } from './hooks/useENS';
import { useBlockchainStatus } from '../components/BlockchainStatusModal';
import { useSmartContract } from './hooks/useSmartContract';

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

  const smartContract = useSmartContract();
const { showStatus, StatusModal } = useBlockchainStatus();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filter, setFilter] = useState('All');
  const router = useRouter();
const [campaignFilter, setCampaignFilter] = useState('active');
const [showCelebration, setShowCelebration] = useState(false);
const [celebrationCampaign, setCelebrationCampaign] = useState(null);
  
  const categories = ['All', 'Technology', 'Environment', 'Social', 'Art', 'Education'];
  
  const filteredCampaigns = filter === 'All' 
    ? campaigns 
    : campaigns.filter(campaign => campaign.category === filter);
  
  const handleCreateCampaign = async (campaignData) => {
    try {
      console.log('🎯 Starting campaign creation process:', campaignData.title);
      
      // 🚀 NEU: Zeige Blockchain Status Modal
      showStatus({
        transactionType: 'campaign',
        campaignTitle: campaignData.title,
        amount: '0',
        smartContract: smartContract,
        campaignData: {
          ...campaignData,
          target: parseFloat(campaignData.target),
          durationInDays: 30
        },
        onTransactionComplete: async (result) => {
          console.log('✅ Blockchain transaction completed, now creating campaign...');
          
          if (result.success) {
            try {
              // Führe die echte Campaign Creation aus
              await createCampaign(campaignData, address);
              console.log('✅ Campaign created successfully with blockchain integration');
            } catch (campaignError) {
              console.error('❌ Failed to create campaign after blockchain success:', campaignError);
              alert('Blockchain transaction successful, but campaign creation failed: ' + campaignError.message);
            }
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to start campaign creation:', error);
      throw error; // Re-throw für Modal Error Handling
    }
  };
  
const handleDonate = async (campaignId, amount) => {
  if (handleDonate._isRunning) {
    console.log('🚫 handleDonate already running, ignoring call');
    return;
  }
  handleDonate._isRunning = true;

  try {
    console.log('🎯 handleDonate called with:', { campaignId, amount });
    
    // Finde Campaign zuerst
    const campaign = campaigns.find(c => c.id === campaignId);
    console.log('📋 Found campaign:', campaign);
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    // Bestimme echte Campaign ID für Blockchain
    const blockchainCampaignId = campaign.blockchainId || campaign.id;
    console.log('⛓️ Using blockchain campaign ID:', blockchainCampaignId);
    
    // ✅ Schließe Donate Modal sofort (wie gewünscht)
    setIsDonateModalOpen(false);
    setSelectedCampaign(null);

    const debugSessionId = `donation_${Date.now()}_${Math.random()}`;
    console.log('🎯 CALLING showStatus with session:', debugSessionId);

    // Zeige Status Modal
    showStatus({
      transactionType: 'donation',
      campaignTitle: campaign.title,
      amount: amount.toString(),
      smartContract: smartContract,
      campaignId: blockchainCampaignId,
      onTransactionComplete: async (result) => {
        console.log('✅ Blockchain transaction completed:', result);
        
        if (result.success) {
          try {
            // Check if campaign will be completed by this donation
            const oldProgress = campaign.target > 0 ? (campaign.raised / campaign.target) * 100 : 0;
            const newProgress = campaign.target > 0 ? ((campaign.raised + amount) / campaign.target) * 100 : 0;
            const willComplete = oldProgress < 100 && newProgress >= 100;
            
            console.log('💰 Donation completed on blockchain, updating UI...');
            
            // Show celebration if campaign just got completed
            if (willComplete) {
              setCelebrationCampaign(campaign);
              setShowCelebration(true);
            }
            
            console.log('✅ Donation flow completed successfully');
            
          } catch (error) {
            console.error('❌ Failed to update UI after donation:', error);
            alert('Donation successful! Please refresh the page to see updates.');
          }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start donation process:', error);
    alert('Failed to start donation: ' + error.message);
  }finally {
    // Reset lock
    handleDonate._isRunning = false;
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
    GoApeMe
  </h1>
</div>
            
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0 overflow-hidden">
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

              {/* Dashboard Button - NEU */}
{isConnected && (
  <button
    onClick={() => router.push('/dashboard')}
    className="flex bg-gray-600 hover:bg-gray-700 text-white px-2 sm:px-4 py-2 rounded-lg font-medium transition-colors items-center gap-1 sm:gap-2"
  >
    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
    <span className="hidden sm:inline">Dashboard</span>
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
  className="flex items-center gap-1 sm:gap-2 bg-gray-800 dark:bg-gray-700 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-xs sm:text-base whitespace-nowrap min-w-0 max-w-[120px] sm:max-w-none overflow-hidden"
>
  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
  <span className="hidden sm:inline">
    {isConnected ? <ENSName address={address} fallbackLength={6} className="text-white" /> : 'Connect Wallet'}
  </span>
  <span className="sm:hidden">
    {isConnected ? <ENSName address={address} fallbackLength={4} className="text-white" /> : 'Connect'}
  </span>
</button>
            </div>
          </div>
        </div>
      </header>

      {/* Compact Hero Section */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3">
            Crowdfunding on <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">ApeChain</span>
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
            Decentralized, transparent and secure. Support innovative projects or start your own campaign.
          </p>
          
          {/* CTA Buttons - kompakter */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {isConnected ? (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Campaign
              </button>
            ) : (
              <button
                onClick={connect}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              View Dashboard
            </button>
          </div>
        </div>
      </section>
      
      {/* Enhanced Campaigns Section - Split Active/Completed */}
<section className="py-16 px-4">
  <div className="max-w-7xl mx-auto">
    
    {/* ACTIVE CAMPAIGNS SECTION */}
    <div className="mb-16">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 md:mb-0">
  🚀 Active Campaigns
</h2>
        
        {/* Category Filter für Active */}
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

      {/* Active Campaigns Grid */}
      {(() => {
        const activeCampaigns = filterCampaigns(campaigns, 'active');
        const filteredActiveCampaigns = filter === 'All' 
          ? activeCampaigns 
          : activeCampaigns.filter(campaign => campaign.category === filter);
        
        return (
          <>
            {/* Active Stats */}
            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredActiveCampaigns.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {filteredActiveCampaigns.reduce((sum, c) => sum + c.raised, 0).toFixed(1)} APE
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Raised</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {filteredActiveCampaigns.reduce((sum, c) => sum + Number(c.donorCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Supporter</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {filteredActiveCampaigns.reduce((sum, c) => sum + c.target, 0).toFixed(1)} APE
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Goal</div>
                </div>
              </div>
            </div>

            {/* Active Campaigns Display */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : filteredActiveCampaigns.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  No active campaigns
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {campaigns.length === 0 
                    ? 'Be the first to create a campaign!' 
                    : 'All campaigns have been completed or expired.'
                  }
                </p>
                {isConnected && campaigns.length === 0 && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Campaign
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredActiveCampaigns.map(campaign => (
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
          </>
        );
      })()}
    </div>

    {/* COMPLETED CAMPAIGNS SECTION */}
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 md:mb-0">
  🏆 Completed Campaigns
</h2>
        
        {/* Time Filter für Completed */}
        <div className="flex flex-wrap gap-2">
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Completed</option>
            <option value="last30">Last 30 Days</option>
            <option value="last90">Last 90 Days</option>
            <option value="thisYear">This Year</option>
          </select>
        </div>
      </div>

      {/* Completed Campaigns Grid */}
      {(() => {
        const completedCampaigns = filterCampaigns(campaigns, 'completed');
        const filteredCompletedCampaigns = filter === 'All' 
          ? completedCampaigns 
          : completedCampaigns.filter(campaign => campaign.category === filter);
        
        return (
          <>
            {/* Completed Stats */}
            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {filteredCompletedCampaigns.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {filteredCompletedCampaigns.reduce((sum, c) => sum + c.raised, 0).toFixed(1)} APE
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Funded</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {filteredCompletedCampaigns.reduce((sum, c) => sum + Number(c.donorCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Happy Supporter</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {filteredCompletedCampaigns.length > 0 
                      ? (filteredCompletedCampaigns.reduce((sum, c) => sum + (c.raised / c.target), 0) / filteredCompletedCampaigns.length * 100).toFixed(0)
                      : 0
                    }%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Success</div>
                </div>
              </div>
            </div>

            {/* Completed Campaigns Display */}
            {filteredCompletedCampaigns.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  No completed campaigns yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Completed campaigns will appear here once they reach their funding goals.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCompletedCampaigns.map(campaign => (
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
          </>
        );
      })()}
    </div>
  </div>
</section>
      
     {/* Minimal Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 text-sm text-gray-400">
            {/* Left Side - Creator */}
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span>Made by</span>
              <a 
                href="https://x.com/fibordoteth" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-gray-300 font-medium transition-colors"
              >
                Fibor
              </a>
            </div>
            
            {/* Right Side - Powered by ApeChain */}
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <span>Powered by</span>
              <a 
                href="https://apechain.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                {/* ApeChain Logo - kleiner */}
                <img 
                  src="/apechain_logo.png" 
                  alt="ApeChain" 
                  className="h-6 w-auto object-contain hover:scale-105 transition-transform"
                />
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Modals */}
      <CreateCampaignModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCampaign}
        showBlockchainStatus={showStatus}    
        smartContract={smartContract}       
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
  smartContract={smartContract}
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


{/* Celebration Fireworks */}
<CelebrationFireworks
  isVisible={showCelebration}
  campaignTitle={celebrationCampaign?.title}
  onComplete={() => {
    setShowCelebration(false);
    setCelebrationCampaign(null);
  }}
/>

<StatusModal smartContract={smartContract} />

    </div>
    
  );
}