import { Loader2, Check, X, Upload } from 'lucide-react';

// Loading Spinner Komponente
export const LoadingSpinner = ({ className = "w-5 h-5" }) => (
  <Loader2 className={`${className} animate-spin`} />
);

// Status Icon Komponente
export const StatusIcon = ({ status, className = "w-5 h-5" }) => {
  switch (status) {
    case 'loading':
      return <LoadingSpinner className={className} />;
    case 'success':
      return <Check className={`${className} text-green-500`} />;
    case 'error':
      return <X className={`${className} text-red-500`} />;
    case 'uploading':
      return <Upload className={`${className} text-blue-500 animate-pulse`} />;
    default:
      return null;
  }
};

// IPFS Upload Status Komponente
export const IPFSUploadStatus = ({ status, message, onRetry }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'uploading':
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200',
          title: '📤 Uploading to IPFS...',
          showRetry: false
        };
      case 'success':
        return {
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200',
          title: '✅ Successfully uploaded!',
          showRetry: false
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
          title: '❌ Upload failed',
          showRetry: true
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  
  if (!config) return null;

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} ${config.textColor}`}>
      <div className="flex items-center gap-3">
        <StatusIcon status={status} />
        <div className="flex-1">
          <h4 className="font-semibold">{config.title}</h4>
          {message && (
            <p className="text-sm mt-1 opacity-90">{message}</p>
          )}
        </div>
        {config.showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

// Animated Loading Button
export const LoadingButton = ({ 
  isLoading, 
  children, 
  loadingText = "Loading...", 
  className = "",
  disabled = false,
  ...props 
}) => (
  <button
    disabled={isLoading || disabled}
    className={`relative flex items-center justify-center gap-2 transition-all duration-300 ${
      isLoading ? 'opacity-75 cursor-not-allowed' : ''
    } ${className}`}
    {...props}
  >
    {isLoading ? (
      <>
        <LoadingSpinner />
        <span>{loadingText}</span>
      </>
    ) : (
      children
    )}
  </button>
);