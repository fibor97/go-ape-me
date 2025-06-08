import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { LoadingButton, IPFSUploadStatus } from './LoadingStates';
import ImageUpload from './ImageUpload';

const CreateCampaignModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target: '',
    category: 'Technology',
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.target) {
      setUploadStatus('error');
      setUploadMessage('Please fill all required fields');
      return;
    }

    if (parseFloat(formData.target) <= 0) {
      setUploadStatus('error');
      setUploadMessage('Goal must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setUploadStatus('uploading');
    setUploadMessage('Preparing campaign data...');
    
    try {
      setUploadMessage('Processing image...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadMessage('Connecting to IPFS network...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setUploadMessage('Uploading metadata to decentralized storage...');
      
      // Füge Bild-Daten hinzu falls vorhanden
      const campaignWithImage = {
        ...formData,
        image: imagePreview,
        hasCustomImage: !!selectedImage && !!imagePreview
      };
      
      // Debug Log
      console.log('📸 Campaign with image data:', {
        hasImage: !!imagePreview,
        hasCustomImage: campaignWithImage.hasCustomImage,
        imagePreviewLength: imagePreview ? imagePreview.length : 0
      });
      
      await onSubmit(campaignWithImage);
      
      setUploadStatus('success');
      setUploadMessage('Campaign successfully created and stored on IPFS!');
      
      // Sofort schließen nach Erfolg (keine 2s Verzögerung)
      setTimeout(() => {
        handleClose();
      }, 1000);
      
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error.message || 'Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ title: '', description: '', target: '', category: 'Technology' });
      setSelectedImage(null);
      setImagePreview(null);
      setUploadStatus(null);
      setUploadMessage('');
      setIsSubmitting(false);
      onClose();
    }
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
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
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
          <ImageUpload 
            onImageSelect={handleImageSelect}
            currentImage={imagePreview}
            disabled={isSubmitting}
          />
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              disabled={isSubmitting}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              placeholder="Enter campaign title..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              disabled={isSubmitting}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 resize-none"
              placeholder="Describe your campaign..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Goal (APE) *
            </label>
            <input
              type="number"
              value={formData.target}
              onChange={(e) => setFormData({...formData, target: e.target.value})}
              disabled={isSubmitting}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              placeholder="100"
              min="0"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
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
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Cancel'}
            </button>
            
            <LoadingButton
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText="Creating..."
              disabled={uploadStatus === 'success'}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              Create Campaign
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignModal;