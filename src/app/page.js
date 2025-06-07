'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Plus, Wallet, Clock, Users, AlertCircle } from 'lucide-react';
import { useWalletConnection } from './hooks/useWalletConnection';

// Mock campaigns data
const mockCampaigns = [
  {
    id: 1,
    title: 'Save the Rainforest 🌳',
    description: 'Help us protect and preserve 1000 hectares of rainforest.',
    creator: '0xABC...DEF',
    target: 50,
    raised: 32.5,
    backers: 127,
    daysLeft: 23,
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    category: 'Environment'
  },
  {
    id: 2,
    title: 'Innovative DeFi App 💡',
    description: 'Development of a revolutionary DeFi application for ApeChain.',
    creator: '0x123...456',
    target: 100,
    raised: 75.8,
    backers: 234,
    daysLeft: 12,
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop',
    category: 'Technology'
  },
  {
    id: 3,
    title: 'Local Animal Shelter Support 🐕',
    description: 'Support our local animal shelter in caring for stray animals.',
    creator: '0x789...ABC',
    target: 25,
    raised: 18.2,
    backers: 89,
    daysLeft: 45,
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop',
    category: 'Social'
  }
];

// Dark Mode Hook (permanent dark)
const useDarkMode = () => {
  useEffect(() => {
    // Dark Mode immer aktiviert
    document.documentElement.classList.add('dark');
  }, []);

  return { isDark: true };
};

const CampaignCard = ({ campaign, onDonate }) => {
  const progressPercentage = (campaign.raised / campaign.target) * 100;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img 
          src={campaign.image} 
          alt={campaign.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {campaign.category}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">{campaign.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{campaign.description}</p>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {campaign.raised} APE
            </span>
            <span className="text-gray-500 dark:text-gray-400">of {campaign.target} APE</span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{campaign.backers} Supporters</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{campaign.daysLeft} Days left</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => onDonate(campaign)}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Heart className="w-5 h-5" />
          Support
        </button>
      </div>
    </div>
  );
};

const CreateCampaignModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target: '',
    category: 'Technology',
  });
  
  const handleSubmit = () => {
    if (formData.title && formData.description && formData.target) {
      onSubmit(formData);
      setFormData({ title: '', description: '', target: '', category: 'Technology' });
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Create New Campaign</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Goal (APE)</label>
            <input
              type="number"
              value={formData.target}
              onChange={(e) => setFormData({...formData, target: e.target.value})}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="Technology">Technology</option>
              <option value="Environment">Environment</option>
              <option value="Social">Social</option>
              <option value="Art">Art</option>
              <option value="Education">Education</option>
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DonateModal = ({ isOpen, campaign, onClose, onDonate }) => {
  const [amount, setAmount] = useState('');
  
  const handleDonate = () => {
    if (amount && parseFloat(amount) > 0) {
      onDonate(campaign.id, parseFloat(amount));
      setAmount('');
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
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Donation Amount (APE)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleDonate}
            disabled={!amount || parseFloat(amount) <= 0}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5" />
            Donate
          </button>
        </div>
      </div>
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
  
  const { isDark } = useDarkMode();
  
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filter, setFilter] = useState('All');
  
  const categories = ['All', 'Technology', 'Environment', 'Social', 'Art', 'Education'];
  
  const filteredCampaigns = filter === 'All' 
    ? campaigns 
    : campaigns.filter(campaign => campaign.category === filter);
  
  const handleCreateCampaign = (campaignData) => {
    const newCampaign = {
      id: campaigns.length + 1,
      ...campaignData,
      creator: address,
      raised: 0,
      backers: 0,
      daysLeft: 30,
      target: parseFloat(campaignData.target),
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop'
    };
    
    setCampaigns([newCampaign, ...campaigns]);
    setIsCreateModalOpen(false);
  };
  
  const handleDonate = (campaignId, amount) => {
    setCampaigns(campaigns.map(campaign => 
      campaign.id === campaignId 
        ? { 
            ...campaign, 
            raised: campaign.raised + amount,
            backers: campaign.backers + 1
          }
        : campaign
    ));
    setIsDonateModalOpen(false);
    setSelectedCampaign(null);
  };
  
  const openDonateModal = (campaign) => {
    setSelectedCampaign(campaign);
    setIsDonateModalOpen(true);
  };
  
  const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.raised, 0);
  const totalBackers = campaigns.reduce((sum, campaign) => sum + campaign.backers, 0);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 min-h-[4rem]">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="text-2xl sm:text-3xl">🦍</div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Go-Ape-Me
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
                onClick={isConnected ? disconnect : connect}
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
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">{totalRaised.toFixed(1)} APE</h3>
              <p className="text-gray-600 dark:text-gray-400">Total Raised</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">{totalBackers}</h3>
              <p className="text-gray-600 dark:text-gray-400">Supporters</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">{campaigns.length}</h3>
              <p className="text-gray-600 dark:text-gray-400">Active Campaigns</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Campaigns Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 md:mb-0">Current Campaigns</h2>
            
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCampaigns.map(campaign => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onDonate={openDonateModal}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-900 text-white py-12 px-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-4xl mb-4">🦍</div>
          <h3 className="text-2xl font-bold mb-4">Go-Ape-Me</h3>
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
      />
    </div>
  );
}