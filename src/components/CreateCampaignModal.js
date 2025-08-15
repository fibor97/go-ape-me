import React, { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { LoadingButton, IPFSUploadStatus } from './LoadingStates';
import ImageUpload from './ImageUpload';
import { useBlockchainStatus } from './BlockchainStatusModal';

const CreateCampaignModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target: '',
    category: 'Technology',
    termsAccepted: false // ✅ NEU: Terms Checkbox
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({}); // ✅ NEU: Error Handling

  const { showStatus, StatusModal } = useBlockchainStatus();
  
  // ✅ NEU: Validation Function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Campaign description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    const target = parseFloat(formData.target);
    if (!formData.target) {
      newErrors.target = 'Funding target is required';
    } else if (isNaN(target) || target <= 0) {
      newErrors.target = 'Target must be a positive number';
    } else if (target < 1) {
      newErrors.target = 'Minimum target is 1 APE';
    }

    // ✅ NEU: Terms Validation
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the Smart Contract terms to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // ✅ NEU: Validation vor Submit
    if (!validateForm()) {
      setUploadStatus('error');
      setUploadMessage('Please fix the errors above and try again');
      return;
    }

    console.log('🎯 Starting campaign creation with blockchain status:', formData.title);

    setIsSubmitting(true);
    setUploadStatus('uploading');
    setUploadMessage('Preparing campaign data...');
    
    try {
      // Kurze Vorbereitung anzeigen
      setUploadMessage('Processing image...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadMessage('Connecting to IPFS network...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 🚀 NEU: Schließe Create Modal und zeige Status Modal
      handleClose();
      
      // Bereite Campaign-Daten vor
      const campaignWithImage = {
        ...formData,
        image: imagePreview,
        hasCustomImage: !!selectedImage && !!imagePreview
      };
      
      console.log('📸 Campaign with image data:', {
        hasImage: !!imagePreview,
        hasCustomImage: campaignWithImage.hasCustomImage,
        imagePreviewLength: imagePreview ? imagePreview.length : 0
      });
      
      // 🚀 NEU: Zeige Blockchain Status Modal
      showStatus({
        transactionType: 'campaign',
        campaignTitle: formData.title,
        amount: '0',
        onTransactionComplete: async (result) => {
          console.log('✅ Blockchain transaction completed, now creating campaign...');
          
          if (result.success) {
            try {
              // Führe die echte Campaign Creation aus
              await onSubmit(campaignWithImage);
              console.log('✅ Campaign created successfully with blockchain integration');
            } catch (campaignError) {
              console.error('❌ Failed to create campaign after blockchain success:', campaignError);
              alert('Blockchain transaction successful, but campaign creation failed: ' + campaignError.message);
            }
          } else {
            console.error('❌ Blockchain transaction failed');
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to start campaign creation process:', error);
      setUploadStatus('error');
      setUploadMessage(error.message || 'Failed to create campaign. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    // Cancel immer erlauben - auch während Upload
    setFormData({ 
      title: '', 
      description: '', 
      target: '', 
      category: 'Technology',
      termsAccepted: false // ✅ NEU: Reset Terms
    });
    setSelectedImage(null);
    setImagePreview(null);
    setUploadStatus(null);
    setUploadMessage('');
    setIsSubmitting(false);
    setErrors({}); // ✅ NEU: Reset Errors
    onClose();
  };

  const handleRetry = () => {
    setUploadStatus(null);
    setUploadMessage('');
    handleSubmit();
  };

  const handleImageSelect = (file, preview) => {
    setSelectedImage(file);
    setImagePreview(preview);
  };

  // ✅ NEU: Input Change Handler mit Error Clearing
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  if (!isOpen) return <StatusModal />;
  
  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Create New Campaign
        </h2>
        
        {/* Upload Status */}
        {uploadStatus && (
          <div className="mb-4">
            <IPFSUploadStatus 
              status={uploadStatus}
              message={uploadMessage}
              onRetry={uploadStatus === 'error' ? handleRetry : null}
            />
          </div>
        )}
        
        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <ImageUpload 
              onImageSelect={handleImageSelect}
              currentImage={imagePreview}
              disabled={isSubmitting}
            />
            {/* ✅ NEU: 2MB File Size Notice */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              📁 Maximum file size: 2MB | Supported formats: PNG, JPG, GIF
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={isSubmitting}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 ${
                errors.title 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter campaign title..."
            />
            {/* ✅ NEU: Error Message */}
            {errors.title && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.title}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isSubmitting}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 resize-none ${
                errors.description 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Describe your campaign..."
            />
            {/* ✅ NEU: Error Message */}
            {errors.description && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.description}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Goal (APE) *
            </label>
            <input
              type="number"
              value={formData.target}
              onChange={(e) => handleInputChange('target', e.target.value)}
              placeholder="100"
              min="1"
              step="1"
              disabled={isSubmitting}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 ${
                errors.target 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {/* ✅ NEU: Error Message */}
            {errors.target && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.target}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            >
              <option value="Technology">Technology</option>
              <option value="Environment">Environment</option>
              <option value="Social">Social</option>
              <option value="Art">Art</option>
              <option value="Education">Education</option>
            </select>
          </div>

          {/* ✅ NEU: Smart Contract Terms & Agreement */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="termsAccepted"
                checked={formData.termsAccepted}
                onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                disabled={isSubmitting}
                className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded disabled:opacity-50"
              />
              <div className="flex-1">
                <label htmlFor="termsAccepted" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                  I understand and agree to the Smart Contract terms *
                </label>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p><strong>📋 How the Smart Contract works:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• <strong>Escrow System:</strong> All donations held securely until goal reached</li>
                    <li>• <strong>Success:</strong> You receive 95% of funds, 5% platform fee</li>
                    <li>• <strong>Failure:</strong> Contributors get 95% refunded automatically</li>
                    <li>• <strong>Duration:</strong> Maximum 30 days campaign length</li>
                    <li>• <strong>Transparency:</strong> All transactions visible on ApeChain</li>
                    <li>• <strong>Final:</strong> No reversals once goal reached and withdrawn</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* ✅ NEU: Terms Error Message */}
            {errors.termsAccepted && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2 ml-7">{errors.termsAccepted}</p>
            )}
          </div>

          {/* ✅ NEU: Contract Info Box */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-purple-800 dark:text-purple-200">
                <p className="font-semibold mb-1">🔒 Decentralized & Secure</p>
                <p className="leading-relaxed">
                  Your campaign runs on ApeChain's smart contract. No central authority can manipulate funds. 
                  <a 
                    href="https://apescan.io/address/0x18f3b0210BE24c1b3bcFAEA5e113B30521033d6C"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 underline hover:no-underline transition-colors"
                    title="View contract on ApeScan"
                  >
                    Contract: 0x18f3...3d6C ↗
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            
            <LoadingButton
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText="Creating..."
              disabled={uploadStatus === 'success' || !formData.termsAccepted} // ✅ NEU: Disabled ohne Terms
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              Create Campaign
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
    <StatusModal />
  </>
  );
};

export default CreateCampaignModal;