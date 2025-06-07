// Manual deployment trigger
'use client';

import React, { useState } from 'react';
import { Heart, Plus, Wallet, Clock, Users } from 'lucide-react';

// Mock wallet connection hook
const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  
  const connect = () => {
    setIsConnected(true);
    setAddress('0x1234...5678');
  };
  
  const disconnect = () => {
    setIsConnected(false);
    setAddress('');
  };
  
  return { isConnected, address, connect, disconnect };
};

// Mock campaigns data
const mockCampaigns = [
  {
    id: 1,
    title: 'Rettung des Regenwaldes 🌳',
    description: 'Hilf uns dabei, 1000 Hektar Regenwald zu schützen und zu erhalten.',
    creator: '0xABC...DEF',
    target: 50,
    raised: 32.5,
    backers: 127,
    daysLeft: 23,
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    category: 'Umwelt'
  },
  {
    id: 2,
    title: 'Innovative DeFi App 💡',
    description: 'Entwicklung einer revolutionären DeFi-Anwendung für die Apechain.',
    creator: '0x123...456',
    target: 100,
    raised: 75.8,
    backers: 234,
    daysLeft: 12,
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop',
    category: 'Technologie'
  },
  {
    id: 3,
    title: 'Lokales Tierheim Unterstützung 🐕',
    description: 'Unterstütze unser lokales Tierheim bei der Versorgung von Straßentieren.',
    creator: '0x789...ABC',
    target: 25,
    raised: 18.2,
    backers: 89,
    daysLeft: 45,
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop',
    category: 'Soziales'
  }
];

const CampaignCard = ({ campaign, onDonate }) => {
  const progressPercentage = (campaign.raised / campaign.target) * 100;
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
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
        <h3 className="text-xl font-bold text-gray-800 mb-2">{campaign.title}</h3>
        <p className="text-gray-600 mb-4">{campaign.description}</p>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-2xl font-bold text-purple-600">
              {campaign.raised} APE
            </span>
            <span className="text-gray-500">von {campaign.target} APE</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{campaign.backers} Unterstützer</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{campaign.daysLeft} Tage übrig</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => onDonate(campaign)}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Heart className="w-5 h-5" />
          Unterstützen
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
    category: 'Technologie',
  });
  
  const handleSubmit = () => {
    if (formData.title && formData.description && formData.target) {
      onSubmit(formData);
      setFormData({ title: '', description: '', target: '', category: 'Technologie' });
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Neue Kampagne erstellen</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titel</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Ziel (APE)</label>
            <input
              type="number"
              value={formData.target}
              onChange={(e) => setFormData({...formData, target: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Kategorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Technologie">Technologie</option>
              <option value="Umwelt">Umwelt</option>
              <option value="Soziales">Soziales</option>
              <option value="Kunst">Kunst</option>
              <option value="Bildung">Bildung</option>
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            >
              Erstellen
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
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Kampagne unterstützen</h2>
        
        <div className="mb-4">
          <h3 className="font-semibold text-lg">{campaign.title}</h3>
          <p className="text-gray-600 text-sm mt-1">{campaign.description}</p>
        </div>
        
        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bereits gesammelt:</span>
              <span className="font-semibold">{campaign.raised} APE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ziel:</span>
              <span className="font-semibold">{campaign.target} APE</span>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Spendenbetrag (APE)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleDonate}
            disabled={!amount || parseFloat(amount) <= 0}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5" />
            Spenden
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GoApeMe() {
  const { isConnected, address, connect, disconnect } = useWallet();
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filter, setFilter] = useState('Alle');
  
  const categories = ['Alle', 'Technologie', 'Umwelt', 'Soziales', 'Kunst', 'Bildung'];
  
  const filteredCampaigns = filter === 'Alle' 
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 min-h-[4rem]">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="text-2xl sm:text-3xl">🦍</div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Go-Ape-Me
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {isConnected && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="hidden sm:flex bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Kampagne erstellen
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
              
              <button
                onClick={isConnected ? disconnect : connect}
                className="flex items-center gap-2 bg-gray-800 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {isConnected ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Wallet verbinden'}
                </span>
                <span className="sm:hidden">
                  {isConnected ? `${address.slice(0, 4)}...` : 'Connect'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">
            Crowdfunding auf der <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Apechain</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Dezentral, transparent und sicher. Unterstütze innovative Projekte oder starte deine eigene Kampagne.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-2xl font-bold text-purple-600 mb-2">{totalRaised.toFixed(1)} APE</h3>
              <p className="text-gray-600">Gesamt gesammelt</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-purple-600 mb-2">{totalBackers}</h3>
              <p className="text-gray-600">Unterstützer</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-purple-600 mb-2">{campaigns.length}</h3>
              <p className="text-gray-600">Aktive Kampagnen</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Campaigns Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Aktuelle Kampagnen</h2>
            
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    filter === category
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
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
      <footer className="bg-gray-800 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-4xl mb-4">🦍</div>
          <h3 className="text-2xl font-bold mb-4">Go-Ape-Me</h3>
          <p className="text-gray-400 mb-6">
            Die dezentrale Crowdfunding-Plattform auf der Apechain
          </p>
          <div className="flex justify-center gap-6">
            <span className="text-sm text-gray-500">Built with ❤️ on Apechain</span>
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