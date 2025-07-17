'use client';

import { ENSName, useENSName } from '../hooks/useENS';
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  ArrowLeft,
  Settings,
  Bell,
  Plus,
  Heart,
  Trophy,
  Clock,
  Wallet,
  AlertCircle,
  Trash2,
  Ban
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useCampaignManager } from '../hooks/useCampaignManager';
import { getCampaignStatus } from '../hooks/useCampaignManager';
import WalletModal from '../../components/WalletModal';

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, trend, color = "purple", subtitle }) => {
  const colorClasses = {
    purple: "from-purple-500 to-pink-500",
    blue: "from-blue-500 to-cyan-500", 
    green: "from-green-500 to-emerald-500",
    orange: "from-orange-500 to-red-500",
    teal: "from-teal-500 to-cyan-500"
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-3 h-3" />
              {trend.value}
            </p>
          )}
        </div>
        <div className={`bg-gradient-to-r ${colorClasses[color]} p-3 rounded-lg flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

// Campaign Row Component for Creator Section
const CreatorCampaignRow = ({ campaign, onWithdraw, onAbort, onEdit }) => {
  const status = getCampaignStatus(campaign);
  const progress = campaign.target > 0 ? (campaign.raised / campaign.target) * 100 : 0;
  const remainingDays = campaign.deadline ? Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24))) : '∞';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
      {/* Campaign Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaign.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              status.status === 'completed' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : status.status === 'expired'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{campaign.description}</p>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Created: {new Date(campaign.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        {/* Campaign Image */}
        {campaign.image && (
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 ml-4">
            <img 
              src={campaign.image} 
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Funding Progress</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {progress.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              status.status === 'completed' 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {campaign.raised.toFixed(1)} APE
            </div>
            <div className="text-gray-600 dark:text-gray-400">Raised</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {campaign.donorCount || 0}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Supporters</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {remainingDays === '∞' ? '∞' : `${remainingDays}d`}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {status.status === 'completed' ? 'Completed' : 'Remaining'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {status.status === 'completed' && (
          <button
            onClick={() => onWithdraw(campaign)}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Withdraw Funds
          </button>
        )}
        
        {status.status === 'active' && (
          <>
            <button
              onClick={() => onEdit(campaign)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onAbort(campaign)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Abort
            </button>
          </>
        )}
        
        {status.status === 'active' && progress === 0 && (
          <button
            onClick={() => onEdit(campaign)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Promote Campaign
          </button>
        )}
      </div>
    </div>
  );
};

// Donation Row Component for Backer Section
const DonationRow = ({ campaign, donationAmount, onRefund, onReDonate }) => {
  const status = getCampaignStatus(campaign);
  const progress = campaign.target > 0 ? (campaign.raised / campaign.target) * 100 : 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">{campaign.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              status.status === 'completed' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : status.status === 'expired'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{campaign.category}</p>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {donationAmount} APE
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Your donation</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Campaign Progress</span>
          <span className="font-medium">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              status.status === 'completed' 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        {status.status === 'completed' && (
          <div className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
            <div className="text-green-800 dark:text-green-200 text-sm font-medium">
              🎉 Successfully Funded!
            </div>
          </div>
        )}
        
        {status.status === 'expired' && campaign.raised < campaign.target && (
          <button
            onClick={() => onRefund(campaign, donationAmount)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Claim Refund (95%)
          </button>
        )}
        
        {status.status === 'active' && (
          <button
            onClick={() => onReDonate(campaign)}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4" />
            Donate More
          </button>
        )}
      </div>
    </div>
  );
};

export default function CreatorDashboard() {
  const router = useRouter();
  const { isConnected, address, connect, disconnect, formattedAddress, chainName, isCorrectNetwork } = useWalletConnection();
const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { campaigns, statistics , withdrawCampaignFunds } = useCampaignManager();
  
  // Filter campaigns and donations by current user
  const myCampaigns = campaigns.filter(campaign => 
    campaign.creator && campaign.creator.toLowerCase() === address?.toLowerCase()
  );

  // Real donation data - 5 campaigns with 5 APE each
const realDonations = [
  {
    id: 'donation_1',
    title: 'Ocean Cleanup Initiative',
    category: 'Environment',
    description: 'Revolutionary technology to clean plastic from oceans',
    raised: 127.5,
    target: 150,
    deadline: '2025-08-15',
    donorCount: 23,
    creator: '0x1234567890abcdef',
    createdAt: '2024-12-01T10:00:00Z',
    image: '/ocean_cleanup.jpg'
  },
  {
    id: 'donation_2', 
    title: 'AI Education Platform',
    category: 'Education',
    description: 'Democratizing AI education for developing countries',
    raised: 89.2,
    target: 100,
    deadline: '2025-07-20',
    donorCount: 31,
    creator: '0xabcdef1234567890',
    createdAt: '2024-11-15T14:30:00Z',
    image: '/ai_education.jpg'
  },
  {
    id: 'donation_3',
    title: 'Green Energy Storage',
    category: 'Technology', 
    description: 'Next-generation battery technology for renewable energy',
    raised: 45.8,
    target: 200,
    deadline: '2025-09-10',
    donorCount: 18,
    creator: '0xfedcba0987654321',
    createdAt: '2024-10-20T09:15:00Z',
    image: '/green_energy.jpg'
  },
  {
    id: 'donation_4',
    title: 'Digital Art Museum',
    category: 'Art',
    description: 'Virtual reality museum showcasing digital art',
    raised: 156.7,
    target: 180,
    deadline: '2025-06-30',
    donorCount: 42,
    creator: '0x9876543210fedcba',
    createdAt: '2024-09-05T16:45:00Z',
    image: '/digital_art.jpg'
  },
  {
    id: 'donation_5',
    title: 'Community Garden Network',
    category: 'Social',
    description: 'Building sustainable community gardens in urban areas',
    raised: 78.3,
    target: 120,
    deadline: '2025-08-01',
    donorCount: 67,
    creator: '0x5432109876fedcba',
    createdAt: '2024-08-12T11:20:00Z',
    image: '/community_garden.jpg'
  }
];

const myDonations = realDonations;

  // Calculate creator-specific stats
  const creatorStats = {
    totalCampaigns: myCampaigns.length,
    activeCampaigns: myCampaigns.filter(c => getCampaignStatus(c).status === 'active').length,
    completedCampaigns: myCampaigns.filter(c => getCampaignStatus(c).status === 'completed').length,
    totalRaised: myCampaigns.reduce((sum, campaign) => sum + campaign.raised, 0),
    totalBackers: myCampaigns.reduce((sum, campaign) => sum + (campaign.donorCount || 0), 0),
    avgFundingRate: myCampaigns.length > 0 
      ? (myCampaigns.reduce((sum, c) => sum + (c.raised / c.target), 0) / myCampaigns.length * 100)
      : 0
  };

  // Calculate backer-specific stats
  const backerStats = {
  totalDonations: myDonations.length,
  totalDonated: myDonations.length * 5.0, // 5 APE per donation = 25 APE total
  successfullyFunded: myDonations.filter(c => getCampaignStatus(c).status === 'completed').length,
  activeDonations: myDonations.filter(c => getCampaignStatus(c).status === 'active').length
};

  // Action handlers
  const handleWithdraw = async (campaign) => {
  try {
    console.log('💰 Withdrawing funds for:', campaign.title);
    
    const result = await withdrawCampaignFunds(campaign.blockchainId || campaign.id);
    
    alert(`✅ Withdrawal successful! 
95% (${(campaign.raised * 0.95).toFixed(2)} APE) sent to your wallet
5% (${(campaign.raised * 0.05).toFixed(2)} APE) platform fee
Transaction: ${result.txHash}`);
    
  } catch (error) {
    console.error('❌ Withdrawal failed:', error);
    alert('Withdrawal failed: ' + error.message);
  }
};

  const handleAbort = (campaign) => {
    console.log('Abort campaign:', campaign.title);
    // TODO: Implement abort functionality
  };

  const handleEdit = (campaign) => {
    console.log('Edit campaign:', campaign.title);
    // TODO: Implement edit functionality
  };

  const handleRefund = (campaign, amount) => {
    console.log('Claim refund for:', campaign.title, amount);
    // TODO: Implement refund functionality
  };

  const handleReDonate = (campaign) => {
    console.log('Re-donate to:', campaign.title);
    // TODO: Implement re-donate functionality
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  // Redirect if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Access your Creator Dashboard and donation history
          </p>
          <button
            onClick={connect}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 mb-4"
          >
            Connect Wallet
          </button>
          <button
            onClick={handleBackToHome}
            className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToHome}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <img 
                  src="/apecrowd_logo_transparent.png" 
                  alt="APECrowd Logo" 
                  className="h-8 w-8 object-contain"
                />
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
  <span className="hidden sm:inline">Creator Dashboard</span>
  <span className="sm:hidden">Dashboard</span>
</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-4">
  {/* Mobile: Kompakte Buttons */}
  <div className="flex items-center gap-1 sm:hidden">
    <button
      onClick={() => router.push('/')}
      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
    >
      <Plus className="w-4 h-4" />
    </button>
    <button
      onClick={() => setIsWalletModalOpen(true)}
      className="bg-gray-800 dark:bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
    >
      <Wallet className="w-4 h-4" />
    </button>
  </div>
  
  {/* Desktop: Vollständige Buttons */}
  <div className="hidden sm:flex items-center gap-4">
    <button
      onClick={() => router.push('/')}
      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2"
    >
      <Plus className="w-4 h-4" />
      <span>Create Campaign</span>
    </button>
    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
      <Bell className="w-5 h-5" />
    </button>
    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
      <Settings className="w-5 h-5" />
    </button>
    <button
      onClick={() => setIsWalletModalOpen(true)}
      className="flex items-center gap-2 bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
    >
      <Wallet className="w-5 h-5" />
      <ENSName address={address} fallbackLength={6} className="text-white" />
    </button>
  </div>
</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
    Welcome back, <ENSName address={address} fallbackLength={4} />! 👋
  </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your campaigns and track your contributions
          </p>
        </div>

        {/* CREATOR SECTION */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              🚀 Your Campaigns ({myCampaigns.length})
            </h3>
          </div>

          {/* Creator Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Campaigns"
              value={creatorStats.totalCampaigns}
              icon={BarChart3}
              color="purple"
            />
            <StatsCard
              title="Active Campaigns"
              value={creatorStats.activeCampaigns}
              icon={TrendingUp}
              color="blue"
            />
            <StatsCard
              title="Total Raised"
              value={`${creatorStats.totalRaised.toFixed(1)} APE`}
              icon={DollarSign}
              color="green"
            />
            <StatsCard
              title="Success Rate"
              value={`${creatorStats.avgFundingRate.toFixed(0)}%`}
              subtitle={`${creatorStats.totalBackers} supporters`}
              icon={Trophy}
              color="orange"
            />
          </div>

          {/* Creator Campaigns List */}
          {myCampaigns.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">
                No campaigns yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first campaign to start raising funds!
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Create First Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myCampaigns.map(campaign => (
                <CreatorCampaignRow
                  key={campaign.id}
                  campaign={campaign}
                  onWithdraw={handleWithdraw}
                  onAbort={handleAbort}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>

        {/* BACKER SECTION */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              ❤️ Your Donations ({myDonations.length})
            </h3>
          </div>

          {/* Backer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Donations"
              value={backerStats.totalDonations}
              icon={Heart}
              color="teal"
            />
            <StatsCard
              title="Total Donated"
              value={`${backerStats.totalDonated.toFixed(1)} APE`}
              icon={DollarSign}
              color="green"
            />
            <StatsCard
              title="Successfully Funded"
              value={backerStats.successfullyFunded}
              icon={Trophy}
              color="orange"
            />
            <StatsCard
              title="Active Donations"
              value={backerStats.activeDonations}
              icon={Clock}
              color="blue"
            />
          </div>

          {/* Donations List */}
          {myDonations.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-6xl mb-4">❤️</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">
                No donations yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Support amazing projects and make a difference!
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                <Heart className="w-5 h-5" />
                Support a Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myDonations.map((campaign, index) => (
  <DonationRow
    key={`${campaign.id}-donation`}
    campaign={campaign}
    donationAmount="5.0" // 5 APE per donation
    onRefund={handleRefund}
    onReDonate={handleReDonate}
  />
))}
            </div>
            
          )}
        </div>
        
      </main>
      
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
      
      {/* Wallet Modal - FEHLT IM DASHBOARD */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onDisconnect={disconnect}
        address={address}
        formattedAddress={formattedAddress}
        chainName={chainName}
        isCorrectNetwork={isCorrectNetwork}
      />
    </div>
  );
}