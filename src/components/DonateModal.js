'use client';

import React, { useState, useEffect } from 'react';
import { Heart, X } from 'lucide-react';

const DonateModal = ({ isOpen, campaign, onClose, onDonate, isConnected, isCorrectNetwork, chainName, smartContract }) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Calculate remaining amount needed to reach goal
  const remainingToGoal = Math.max(0, campaign?.target - campaign?.raised || 0);
  const maxDonation = remainingToGoal;
  
  // Preset percentages of remaining amount
  const presets = [
  { label: '50%', value: Math.round(remainingToGoal * 0.5).toString() },
  { label: '75%', value: Math.round(remainingToGoal * 0.75).toString() },
  { label: 'Max', value: Math.round(remainingToGoal).toString() }
];
  
  const handleAmountChange = (newAmount) => {
    // Ensure we don't exceed the remaining goal
    const clampedAmount = Math.min(parseFloat(newAmount) || 0, maxDonation);
    setAmount(clampedAmount.toString());
  };
  
  const handleSliderChange = (e) => {
    const sliderValue = parseFloat(e.target.value);
    const donationAmount = (sliderValue / 100) * maxDonation;
    setAmount(Math.round(donationAmount).toString());
  };
  
  const getCurrentSliderValue = () => {
    const currentAmount = parseFloat(amount) || 0;
    return maxDonation > 0 ? (currentAmount / maxDonation) * 100 : 0;
  };
  
  const handlePresetClick = (presetValue) => {
    setAmount(presetValue);
  };
  
  const handleDonate = async () => {
    const donationAmount = parseFloat(amount);
    
    if (!donationAmount || donationAmount <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    if (donationAmount > maxDonation) {
      alert(`Maximum donation is ${Math.round(maxDonation)} APE (remaining to reach goal)`);
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
      // Process donation
await onDonate(campaign.id, donationAmount);


console.log('✅ Donation completed successfully');
    } catch (error) {
      console.error('Donation failed:', error);
      alert(`Donation failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isOpen || !campaign) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl relative">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Support Campaign</h2>
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-50 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={24} />
        </button>
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
            <div className="flex justify-between items-center">
              <span className="text-gray-800 dark:text-gray-200">Remaining:</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">{Math.round(remainingToGoal)} APE</span>
            </div>
            
          </div>
        </div>

        {/* Goal Reached Warning */}
        {remainingToGoal <= 0 && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              🎉 This campaign has already reached its funding goal!
            </p>
          </div>
        )}

        {/* Wallet Status */}
        {!isConnected && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Please connect your wallet to donate
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
              ✅ Connected to Apechain!
            </p>
          </div>
        )}
        
        {/* Donation Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
            Donation Amount (APE)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0"
            step="1"
            min="1"
            max={maxDonation}
            disabled={isProcessing || remainingToGoal <= 0}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Maximum: {Math.round(maxDonation)} APE (remaining to goal)
          </p>
        </div>

        {/* Slider */}
        {maxDonation > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
              Quick Select
            </label>
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="100"
                value={getCurrentSliderValue()}
                onChange={handleSliderChange}
                disabled={isProcessing}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Preset Buttons */}
        {maxDonation > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
              Quick Amounts
            </label>
            <div className="flex gap-2">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetClick(preset.value)}
                  disabled={isProcessing || parseFloat(preset.value) <= 0}
                  className="flex-1 py-2 px-3 border border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>{preset.label}</div>
                  <div className="text-xs">{Math.round(parseFloat(preset.value))} APE</div>
                </button>
              ))}
            </div>
          </div>
        )}

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
            disabled={!amount || parseFloat(amount) <= 0 || isProcessing || remainingToGoal <= 0 || parseFloat(amount) > maxDonation}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : remainingToGoal <= 0 ? (
              'Goal Reached'
            ) : (
              <>
                <Heart className="w-5 h-5" />
                {isConnected && isCorrectNetwork ? 'Donate APE' : 'Simulate Donation'}
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default DonateModal;