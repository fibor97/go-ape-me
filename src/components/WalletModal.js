import { Wallet, LogOut, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const WalletModal = ({ isOpen, onClose, onDisconnect, address, formattedAddress, chainName, isCorrectNetwork }) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const openInExplorer = () => {
    if (isCorrectNetwork) {
      // ApeChain Explorer
      window.open(`https://apescan.io/address/${address}`, '_blank');
    } else {
      // Fallback zu Etherscan
      window.open(`https://etherscan.io/address/${address}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
            <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Wallet Connected
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {chainName}
            </p>
          </div>
        </div>

        {/* Network Status */}
        {!isCorrectNetwork && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You're on the wrong network. Switch to ApeChain for full functionality.
            </p>
          </div>
        )}

        {/* Address Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Wallet Address
          </label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100">
              {formattedAddress}
            </span>
            <button
              onClick={copyAddress}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title={copied ? 'Copied!' : 'Copy address'}
            >
              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={openInExplorer}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="View in explorer"
            >
              <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Address copied to clipboard!
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => {
              onDisconnect();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Disconnect Wallet
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;