// src/components/BlockchainStatusModal.js
import React, { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, Share2, Copy, Clock, Zap, Linkedin } from 'lucide-react';

const BlockchainStatusModal = ({ 
  isOpen, 
  onClose, 
  transactionType = 'donation', 
  campaignTitle = 'Amazing Campaign',
  amount = '0',
  campaignId = null,
  campaignData = null,
  onTransactionComplete,
  smartContract = null
}) => {
  const [status, setStatus] = useState('pending');
  const [transactionHash, setTransactionHash] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // 🔗 ECHTE BLOCKCHAIN INTEGRATION
  useEffect(() => {
    if (isOpen && status === 'pending') {
      processRealBlockchainTransaction();
    }
  }, [isOpen, status]);

  const processRealBlockchainTransaction = async () => {
    try {
      setDebugInfo('Checking wallet and blockchain connection...');
      
      // 🚀 NEU: Verwende Smart Contract von Props
      if (!smartContract) {
        throw new Error('Smart contract not provided. Please connect your wallet.');
      }
      
      const smartContractHook = smartContract;

      

      const { 
        donateToChain, 
        createCampaignOnChain, 
        withdrawFunds,
        isConnected, 
        isCorrectNetwork,
        isClient 
      } = smartContractHook;

      console.log('🔍 Wallet Status:', {
        isConnected,
        isCorrectNetwork,
        isClient
      });

      // Validate blockchain dependencies
      if (!isClient) {
        throw new Error('Blockchain dependencies not loaded. Please refresh the page.');
      }

      if (!isConnected) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      if (!isCorrectNetwork) {
        throw new Error('Wrong network. Please switch to ApeChain.');
      }

      setDebugInfo(`Processing ${transactionType} on ApeChain blockchain...`);

      let result;
      switch (transactionType) {
        case 'donation':
          if (!campaignId) {
            throw new Error('Campaign ID is required for donation');
          }
          if (!amount || parseFloat(amount) <= 0) {
            throw new Error('Valid donation amount is required');
          }
          
          console.log('💰 Processing donation:', { campaignId, amount });
          result = await donateToChain(campaignId, parseFloat(amount));
          break;

        case 'campaign':
          if (!campaignData) {
            throw new Error('Campaign data is required for creation');
          }
          if (!campaignData.title || !campaignData.description || !campaignData.target) {
            throw new Error('Campaign title, description, and target are required');
          }
          
          console.log('🚀 Creating campaign:', campaignData);
          result = await createCampaignOnChain({
            title: campaignData.title,
            description: campaignData.description,
            category: campaignData.category || 'Technology',
            ipfsCid: campaignData.ipfsCid || '',
            goalInAPE: campaignData.target,
            durationInDays: campaignData.durationInDays || 30
          });
          break;

        case 'withdrawal':
          if (!campaignId) {
            throw new Error('Campaign ID is required for withdrawal');
          }
          
          console.log('💸 Processing withdrawal:', { campaignId });
          result = await withdrawFunds(campaignId);
          break;

        default:
          throw new Error(`Unknown transaction type: ${transactionType}`);
      }

      // ✅ SUCCESS - Real blockchain transaction completed
      console.log('✅ Blockchain transaction successful:', result);
      
      setStatus('success');
      setTransactionHash(result.txHash);
      setShowShare(true);
      setDebugInfo('Transaction confirmed on ApeChain');
      
      if (onTransactionComplete) {
        onTransactionComplete({
          txHash: result.txHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
          success: true,
          result: result
        });
      }

    } catch (error) {
      console.error('❌ Blockchain transaction failed:', error);
      
      // Handle user cancellation gracefully
      if (error.message === 'CANCELLED_BY_USER' || 
          error.message?.includes('user rejected') ||
          error.message?.includes('User denied') ||
          error.code === 4001) {
        console.log('🚫 User cancelled transaction');
        onClose();
        return;
      }
      
      // Map technical errors to user-friendly messages
      let userMessage = error.message;
      
      if (error.message?.includes('insufficient funds')) {
        userMessage = 'Insufficient APE balance for this transaction';
      } else if (error.message?.includes('gas')) {
        userMessage = 'Transaction failed due to gas issues. Please try with a higher gas limit.';
      } else if (error.message?.includes('Wallet not connected')) {
        userMessage = 'Please connect your wallet and try again';
      } else if (error.message?.includes('Wrong network')) {
        userMessage = 'Please switch to ApeChain network and try again';
      } else if (error.message?.includes('Campaign not found')) {
        userMessage = 'Campaign not found. Please refresh the page and try again.';
      } else if (error.message?.includes('Goal must be greater than 0')) {
        userMessage = 'Campaign goal must be greater than 0 APE';
      } else if (error.message?.includes('Only creator allowed')) {
        userMessage = 'Only the campaign creator can perform this action';
      } else if (error.message?.includes('Campaign not successful')) {
        userMessage = 'Campaign must reach its goal before withdrawal';
      } else if (error.message?.includes('Smart contract integration not available')) {
        userMessage = 'Blockchain integration error. Please refresh the page and try again.';
      }
      
      setStatus('error');
      setError(userMessage);
      setDebugInfo(`Error: ${error.message}`);
    }
  };

  // Reset beim Schließen
  useEffect(() => {
    if (!isOpen) {
      setStatus('pending');
      setShowShare(false);
      setTransactionHash('');
      setCopySuccess(false);
      setError(null);
      setDebugInfo('');
    }
  }, [isOpen]);

  const shareTexts = {
    donation: `🦍 Gerade ${amount} APE für "${campaignTitle}" auf GoApeMe gespendet! Gemeinsam machen wir einen Unterschied für innovative Projekte. 🌍✨ #GoApeMe #Crowdfunding #ApeChain`,
    campaign: `🚀 Neue Kampagne "${campaignTitle}" auf GoApeMe gestartet! Helft mir dabei, meine Vision zu verwirklichen und die Zukunft zu gestalten. 🦍💚 #GoApeMe #Innovation #Crowdfunding`,
    withdrawal: `💰 Erfolgreich ${amount} APE von meiner GoApeMe Kampagne "${campaignTitle}" abgehoben! Danke an alle Unterstützer! 🙏 #GoApeMe #Success #ApeChain`
  };

  // ✅ UPDATED: Share Handler mit X (Twitter) und modernen Plattformen
  const handleShare = (platform) => {
    try {
      const text = shareTexts[transactionType] || shareTexts.donation;
      const url = `https://goape.me/campaign/${campaignTitle.toLowerCase().replace(/\s+/g, '-')}?tx=${transactionHash}`;
      
      console.log('🔗 Sharing on:', platform, { text, url });
      
      switch (platform) {
        case 'x':
          const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
          console.log('🐦 Opening X (Twitter):', xUrl);
          window.open(xUrl, '_blank', 'width=550,height=420,scrollbars=yes,resizable=yes');
          break;
          
        case 'linkedin':
          const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(campaignTitle)}&summary=${encodeURIComponent(text)}`;
          console.log('💼 Opening LinkedIn:', linkedinUrl);
          window.open(linkedinUrl, '_blank', 'width=550,height=420,scrollbars=yes,resizable=yes');
          break;
          
        case 'copy':
          const fullText = `${text}\n\n🔗 ${url}\n\n📊 Transaction: ${transactionHash}`;
          handleCopyToClipboard(fullText);
          break;
          
        default:
          console.warn('Unknown sharing platform:', platform);
      }
    } catch (error) {
      console.error('❌ Share failed:', error);
      alert('Sharing failed. Please try again.');
    }
  };

  // ✅ FIXED: Copy to Clipboard mit fallback
  const handleCopyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        console.log('✅ Text copied to clipboard');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        fallbackCopy(text);
      }
    } catch (error) {
      console.error('❌ Failed to copy text:', error);
      fallbackCopy(text);
    }
  };

  // ✅ FIXED: Fallback Copy Function
  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        console.log('✅ Fallback copy successful');
      } else {
        throw new Error('Fallback copy failed');
      }
    } catch (error) {
      console.error('❌ Fallback copy failed:', error);
      // Show manual copy prompt
      prompt('Copy this text manually:', text);
    }
  };

  // ✅ FIXED: ApeScan Link Handler
  const handleViewOnApeScan = () => {
    try {
      if (transactionHash) {
        const apeScanUrl = `https://apescan.io/tx/${transactionHash}`;
        console.log('🔍 Opening ApeScan:', apeScanUrl);
        window.open(apeScanUrl, '_blank', 'noopener,noreferrer');
      } else {
        console.warn('⚠️ No transaction hash available');
        alert('Transaction hash not available yet. Please wait for the transaction to complete.');
      }
    } catch (error) {
      console.error('❌ Failed to open ApeScan:', error);
      alert('Failed to open ApeScan. Please copy the transaction hash manually.');
    }
  };

  // ✅ FIXED: Retry Handler
  const handleRetry = () => {
    try {
      console.log('🔄 Retrying transaction...');
      setStatus('pending');
      setError(null);
      setDebugInfo('');
      setTransactionHash('');
      setShowShare(false);
      setCopySuccess(false);
      
      // Restart the transaction process
      processRealBlockchainTransaction();
    } catch (error) {
      console.error('❌ Retry failed:', error);
      setError('Failed to retry. Please close and try again.');
    }
  };

  // ✅ FIXED: Close Handler
  const handleClose = () => {
    try {
      console.log('📴 Closing blockchain status modal');
      
      // Reset all states
      setStatus('pending');
      setShowShare(false);
      setTransactionHash('');
      setCopySuccess(false);
      setError(null);
      setDebugInfo('');
      
      // Call parent close handler
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('❌ Failed to close modal:', error);
      // Force close anyway
      if (onClose) {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden z-[9999]">
      

        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500 rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-pink-500 rounded-full translate-x-12 translate-y-12 animate-pulse delay-1000"></div>
        </div>

        {/* ✅ FIXED: Close Button */}
        <button 
          type="button" // ✅ FIX: Verhindert Form-Submission
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={24} />
        </button>

        {/* Status Circle */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full border-4 relative ${
              status === 'pending' 
                ? 'border-blue-200 dark:border-blue-800' 
                : status === 'success'
                ? 'border-green-200 dark:border-green-800'
                : 'border-red-200 dark:border-red-800'
            }`}>
              {/* Animierter Ring */}
              {status === 'pending' && (
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
              )}
              
              {/* Pulsierender Ring für Pending */}
              {status === 'pending' && (
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
              )}

              {/* Erfolgs-Animation */}
              {status === 'success' && (
                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse"></div>
              )}

              {/* Error Animation */}
              {status === 'error' && (
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse"></div>
              )}

              {/* Icon im Zentrum */}
              <div className="absolute inset-0 flex items-center justify-center">
                {status === 'pending' ? (
                  <div className="relative">
                    <Zap className="w-12 h-12 text-blue-500 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                ) : status === 'success' ? (
                  <CheckCircle className="w-12 h-12 text-green-500" />
                ) : (
                  <X className="w-12 h-12 text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Status Text */}
          <div className="mt-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {status === 'pending' ? (
                <>
                  <Loader className="w-5 h-5 inline animate-spin mr-2" />
                  Processing on ApeChain
                </>
              ) : status === 'success' ? (
                '🎉 Transaction Successful!'
              ) : (
                '❌ Transaction Failed'
              )}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {status === 'pending' 
                ? 'Processing on blockchain...'
                : status === 'success'
                ? `${transactionType} successful!`
                : error || 'Please connect wallet and try again.'
              }
            </p>

            {/* Transaction Details */}
            {status === 'success' && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm space-y-1">
                  {amount !== '0' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">{amount} APE</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Campaign:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate ml-2 max-w-32">
                      {campaignTitle}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">TX Hash:</span>
                    <button
                      type="button" // ✅ FIX: Verhindert Form-Submission
                      onClick={() => handleCopyToClipboard(transactionHash)}
                      className="font-mono text-xs text-gray-700 dark:text-gray-300 hover:text-purple-600 cursor-pointer transition-colors"
                      title="Click to copy transaction hash"
                    >
                      {transactionHash.slice(0, 8)}...{transactionHash.slice(-6)}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        {status === 'pending' && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Blockchain Status</span>
              <span>Confirming...</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '65%'}}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Pending</span>
              <span>Awaiting confirmation</span>
            </div>
          </div>
        )}

        {/* Share Section */}
        {showShare && status === 'success' && (
          <div className="animate-fadeIn">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
              🎊 Share Your Success!
            </h4>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {/* ✅ FIXED: X (Twitter) Button */}
              <button
                type="button" // ✅ FIX: Verhindert Form-Submission
                onClick={() => handleShare('x')}
                className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-900/20 hover:bg-gray-100 dark:hover:bg-gray-900/30 rounded-lg transition-colors group cursor-pointer"
              >
                <div className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform flex items-center justify-center">
                  {/* X Logo SVG */}
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-gray-900 dark:text-gray-100">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">X</span>
              </button>
              
              {/* ✅ FIXED: LinkedIn Button */}
              <button
                type="button" // ✅ FIX: Verhindert Form-Submission
                onClick={() => handleShare('linkedin')}
                className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group cursor-pointer"
              >
                <Linkedin className="w-6 h-6 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">LinkedIn</span>
              </button>
              
              {/* ✅ FIXED: Copy Button */}
              <button
                type="button" // ✅ FIX: Verhindert Form-Submission
                onClick={() => handleShare('copy')}
                className="copy-button flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group cursor-pointer"
              >
                <Copy className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className={`text-xs font-medium transition-colors ${
                  copySuccess 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {copySuccess ? '✓ Copied!' : 'Copy'}
                </span>
              </button>
            </div>
          </div>
        )}

{/* ✅ FIXED: Action Buttons - Complete Version */}
<div className="flex gap-3 relative z-10">
  {status === 'success' ? (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleViewOnApeScan();
        }}
        style={{ 
          pointerEvents: 'auto',
          cursor: 'pointer',
          zIndex: 10
        }}
        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
      >
        View on ApeScan
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
        style={{ 
          pointerEvents: 'auto',
          cursor: 'pointer',
          zIndex: 10
        }}
        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
      >
        Continue
      </button>
    </>
  ) : status === 'error' ? (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
        style={{ 
          pointerEvents: 'auto',
          cursor: 'pointer',
          zIndex: 10
        }}
        className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        Close
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔄 Retry clicked');
          handleRetry();
        }}
        style={{ 
          pointerEvents: 'auto',
          cursor: 'pointer',
          zIndex: 10
        }}
        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </>
  ) : (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }}
      disabled={status === 'pending'}
      style={{ 
        pointerEvents: 'auto',
        cursor: status === 'pending' ? 'not-allowed' : 'pointer',
        zIndex: 10
      }}
      className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {status === 'pending' ? 'Processing...' : 'Close'}
    </button>
  )}
</div>

        {/* Blockchain Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Powered by ApeChain • Decentralized & Transparent
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

// Hook für die Modal-Integration
export const useBlockchainStatus = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState({});

  const showStatus = (props) => {
    console.log('🚀 Showing blockchain status modal with props:', props);
    setModalProps(props);
    setIsModalOpen(true);
  };

  const hideStatus = () => {
    console.log('📴 Hiding blockchain status modal');
    setIsModalOpen(false);
    setModalProps({});
  };

  return {
    isModalOpen,
    modalProps,
    showStatus,
    hideStatus,
    StatusModal: ({ smartContract }) => (
  <BlockchainStatusModal
    isOpen={isModalOpen}
    onClose={hideStatus}
    smartContract={smartContract}
    {...modalProps}
  />
)
  };
};

export default BlockchainStatusModal;