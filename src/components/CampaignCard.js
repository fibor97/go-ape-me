// Updated CampaignCard Component

import { ENSName } from '../app/hooks/useENS';
import { getCampaignStatus } from '../app/hooks/useCampaignManager';
import { Heart, Clock, Users, Trash2, ExternalLink, Copy, Wallet, Trophy } from 'lucide-react';
import { useState } from 'react';

const CampaignCard = ({ 
  campaign, 
  onDonate, 
  onDelete, 
  currentUserAddress, 
  showDeleteButton = true,
  isConnected = false,
  isCorrectNetwork = false,
  onConnectWallet
}) => {
  const status = getCampaignStatus(campaign);
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const progressPercentage = (campaign.raised / campaign.target) * 100;
  const isOwner = currentUserAddress && campaign.creator === currentUserAddress;
  
  // IPFS URL kopieren
  const copyIPFSUrl = async () => {
    if (campaign.ipfsUrl) {
      try {
        await navigator.clipboard.writeText(campaign.ipfsUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  // IPFS in neuem Tab öffnen
  const openIPFS = () => {
    if (campaign.ipfsUrl) {
      window.open(campaign.ipfsUrl, '_blank');
    }
  };

  // Handle Support Button Click
  const handleSupportClick = () => {
    if (!isConnected) {
      // Show connection prompt instead of opening modal
      if (confirm('You need to connect your wallet to make real donations. Connect now?')) {
        onConnectWallet();
      }
      return;
    }

    if (!isCorrectNetwork) {
      alert('Please switch to ApeChain to donate');
      return;
    }

    // Open donation modal
    onDonate(campaign);
  };

  // Formatiere Creator Address
  const formatCreator = (address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Formatiere Datum
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('de-DE');
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img 
          src={campaign.image} 
          alt={campaign.title}
          className="w-full h-48 object-cover"
          onLoad={() => {
            console.log('✅ Image loaded successfully:', campaign.title);
          }}
          onError={(e) => {
            console.log('❌ Image failed to load for:', campaign.title);
            console.log('🔗 Failed URL:', campaign.image);
            console.log('🔗 Image starts with:', campaign.image?.substring(0, 50));
            // Fallback zu einem Standard-Bild bei Fehlern
            e.target.src = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop';
          }}
        />
        
        {/* Status Badge - Links oben */}
<div className="absolute top-4 left-4">
  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
    status.status === 'completed' 
      ? 'bg-green-500 text-white'
      : status.status === 'expired'
      ? 'bg-red-500 text-white'
      : 'bg-blue-500 text-white'
  }`}>
    {status.label}
  </span>
</div>

{/* Category Badge - Darunter */}
<div className="absolute top-14 left-4">
  <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
    {campaign.category}
  </span>
</div>

{/* Completion Badge für funded campaigns - Rechts oben */}
{status.status === 'completed' && (
  <div className="absolute top-4 right-20">
    <div className="bg-green-400 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
      🎉 Funded
    </div>
  </div>
)}

      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex-1">
            {campaign.title}
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {campaign.description}
        </p>

        {/* Campaign Info */}
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Creator: <ENSName address={campaign.creator} /></span>
            <span>Created: {formatDate(campaign.createdAt)}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {campaign.raised.toFixed(1)} APE
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              of {campaign.target} APE
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
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
        
        {/* Support Button with Wallet Check */}
        <button 
          onClick={handleSupportClick}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            isConnected && isCorrectNetwork
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600'
          }`}
        >
          {isConnected && isCorrectNetwork ? (
            <>
              <Heart className="w-5 h-5" />
              Support with APE
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              Connect Wallet to Support
            </>
          )}
        </button>

        {/* Wallet Status Hint */}
        {!isConnected && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Connect wallet for real APE donations
          </p>
        )}
        
        {isConnected && !isCorrectNetwork && (
          <p className="text-xs text-red-500 dark:text-red-400 text-center mt-2">
            Switch to ApeChain to donate
          </p>
        )}
      </div>
    </div>
  );
};

export default CampaignCard;