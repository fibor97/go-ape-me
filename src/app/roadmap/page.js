'use client';

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, Zap, Users, Shield, Coins, Globe, Rocket, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Roadmap Data
const roadmapItems = [
  {
    id: 1,
    quarter: 'Q4 2024',
    title: 'Foundation & Core',
    status: 'completed',
    items: [
      { text: 'Smart Contract with Escrow System', completed: true },
      { text: 'Campaign Creation & Management', completed: true },
      { text: 'IPFS Integration for Decentralized Storage', completed: true },
      { text: 'Wallet Connection (MetaMask, WalletConnect)', completed: true },
      { text: 'Basic Donation System', completed: true }
    ]
  },
  {
    id: 2,
    quarter: 'Q1 2025',
    title: 'Platform Enhancement',
    status: 'active',
    items: [
      { text: 'Creator & Backer Dashboard', completed: true },
      { text: 'Campaign Filtering & Sorting', completed: true },
      { text: 'ENS Name Resolution', completed: true },
      { text: 'Campaign Status Management', completed: true },
      { text: 'Responsive Design & Mobile Optimization', completed: true },
      { text: 'Refund Mechanism for Failed Campaigns', completed: false }
    ]
  },
  {
    id: 3,
    quarter: 'Q2 2025',
    title: 'Monetization & Growth',
    status: 'planned',
    items: [
      { text: 'Campaign Promotion System (5 APE/day)', completed: false },
      { text: 'Promoted Campaign Highlighting', completed: false },
      { text: 'Platform Fee Collection System', completed: false },
      { text: 'Advanced Campaign Analytics', completed: false },
      { text: 'Campaign Categories & Discovery', completed: false },
      { text: 'Email Notifications System', completed: false }
    ]
  },
  {
    id: 4,
    quarter: 'Q3 2025',
    title: 'Community & Features',
    status: 'planned',
    items: [
      { text: 'User Profiles & Reputation System', completed: false },
      { text: 'Campaign Comments & Updates', completed: false },
      { text: 'Multi-language Support (EN, DE, ES, FR)', completed: false },
      { text: 'Campaign Templates & Wizard', completed: false },
      { text: 'Social Media Integration', completed: false },
      { text: 'Campaign Video Support', completed: false }
    ]
  },
  {
    id: 5,
    quarter: 'Q4 2025',
    title: 'Advanced & Scaling',
    status: 'planned',
    items: [
      { text: 'Multi-chain Support (Polygon, BSC)', completed: false },
      { text: 'NFT Rewards for Backers', completed: false },
      { text: 'Governance Token (GOAPE) Launch', completed: false },
      { text: 'DAO Voting for Platform Decisions', completed: false },
      { text: 'API for Third-party Integration', completed: false },
      { text: 'Mobile App (iOS & Android)', completed: false }
    ]
  },
  {
    id: 6,
    quarter: 'Q1 2026',
    title: 'Enterprise & Innovation',
    status: 'planned',
    items: [
      { text: 'White-label Solutions for Organizations', completed: false },
      { text: 'AI-powered Campaign Optimization', completed: false },
      { text: 'Institutional Investor Portal', completed: false },
      { text: 'Smart Contract Upgrades & Security Audits', completed: false },
      { text: 'Partnership with Major VCs', completed: false },
      { text: 'Global Expansion & Compliance', completed: false }
    ]
  }
];

const RoadmapItem = ({ item, index }) => {
  const [isExpanded, setIsExpanded] = useState(item.status === 'active');
  
  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'active':
        return <Zap className="w-6 h-6 text-blue-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };
  
  const getStatusColor = () => {
    switch (item.status) {
      case 'completed':
        return 'from-green-500 to-emerald-500';
      case 'active':
        return 'from-blue-500 to-purple-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };
  
  const completedItems = item.items.filter(i => i.completed).length;
  const totalItems = item.items.length;
  const progressPercentage = (completedItems / totalItems) * 100;
  
  return (
    <div className="relative">
      {/* Timeline Line */}
      {index < roadmapItems.length - 1 && (
        <div className="absolute left-6 top-16 w-0.5 h-20 bg-gradient-to-b from-purple-300 to-gray-300 dark:from-purple-600 dark:to-gray-600"></div>
      )}
      
      {/* Roadmap Card */}
      <div 
        className={`
          relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 transition-all duration-500 cursor-pointer
          ${item.status === 'active' 
            ? 'border-blue-300 shadow-blue-100 dark:shadow-blue-900/20' 
            : item.status === 'completed'
            ? 'border-green-300 shadow-green-100 dark:shadow-green-900/20'
            : 'border-gray-200 dark:border-gray-600'
          }
          ${isExpanded ? 'transform scale-105' : 'hover:transform hover:scale-102'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Status Badge */}
        <div className="absolute -top-3 -right-3 z-10">
          <div className={`bg-gradient-to-r ${getStatusColor()} p-2 rounded-full shadow-lg`}>
            {getStatusIcon()}
          </div>
        </div>
        
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400 tracking-wide">
              {item.quarter}
            </span>
            <span className={`
              px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
              ${item.status === 'completed' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : item.status === 'active'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }
            `}>
              {item.status}
            </span>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {item.title}
          </h3>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{completedItems}/{totalItems} completed</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${getStatusColor()} transition-all duration-500`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Expandable Content */}
        <div className={`
          overflow-hidden transition-all duration-500 ease-in-out
          ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="px-6 pb-6">
            <div className="space-y-3">
              {item.items.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`
                    w-5 h-5 rounded-full flex items-center justify-center
                    ${feature.completed 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
                    }
                  `}>
                    {feature.completed && <CheckCircle className="w-3 h-3" />}
                  </div>
                  <span className={`
                    text-sm font-medium
                    ${feature.completed 
                      ? 'text-gray-900 dark:text-gray-100' 
                      : 'text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RoadmapPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
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
                  GoApeMe Roadmap
                </h1>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            >
              Back to Platform
            </button>
          </div>
        </div>
      </header>
      
      {/* Critical Bug Warning */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">!</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Critical Issue - Transaction Bug
                </h3>
                <p className="text-red-700 dark:text-red-300 text-sm mb-3">
                  We are currently experiencing a critical bug with refund transactions that is preventing users from claiming refunds on failed campaigns. This issue has the highest priority and will be resolved before any new feature development continues.
                </p>
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <span className="font-medium">Status:</span>
                  <span>Under Investigation</span>
                  <span>•</span>
                  <span>ETA: Next 48 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-4 py-2 rounded-full mb-6">
            <Rocket className="w-4 h-4" />
            <span className="text-sm font-medium">Building the Future of Crowdfunding</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Our <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Roadmap</span>
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Follow our journey as we build the most innovative decentralized crowdfunding platform on ApeChain. 
            Each milestone brings us closer to revolutionizing how projects get funded.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {roadmapItems.filter(item => item.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Milestones Completed</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {roadmapItems.filter(item => item.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Currently Active</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {roadmapItems.reduce((sum, item) => sum + item.items.length, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Features</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Roadmap Timeline */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-16">
            {roadmapItems.map((item, index) => (
              <RoadmapItem key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white">
            <Star className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              Be part of the revolution. Start your campaign today and help us build the future of decentralized crowdfunding.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Launch Your Campaign
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 text-sm text-gray-400">
            
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
            
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white text-sm transition-colors uppercase tracking-wide"
              >
                DASHBOARD
              </button>
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white text-sm transition-colors uppercase tracking-wide"
              >
                HOME
              </button>
            </div>
            
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
      
    </div>
  );
}