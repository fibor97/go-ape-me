// hooks/useENS.js
import { useState, useEffect, useCallback } from 'react';

// ENS Cache to avoid repeated lookups
const ensCache = new Map();

// Main ENS hook
export const useENS = () => {
  const [cache, setCache] = useState(ensCache);

  // Resolve address to ENS name
  const resolveENS = useCallback(async (address) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    // Normalize address
    const normalizedAddress = address.toLowerCase();
    
    // Check cache first
    if (ensCache.has(normalizedAddress)) {
      return ensCache.get(normalizedAddress);
    }

    try {
      // Method 1: Try ENS Labs API (most reliable)
      const ensLabsResponse = await fetch(`https://api.ensideas.com/ens/resolve/${address}`);
      if (ensLabsResponse.ok) {
        const data = await ensLabsResponse.json();
        if (data.name && data.name !== address) {
          ensCache.set(normalizedAddress, data.name);
          return data.name;
        }
      }
    } catch (error) {
      console.log('ENS Labs API failed, trying alternative...');
    }

    try {
      // Method 2: Try alternative ENS service
      const response = await fetch(`https://api.web3.bio/profile/${address}`);
      if (response.ok) {
        const data = await response.json();
        if (data.identity && data.identity.endsWith('.eth')) {
          ensCache.set(normalizedAddress, data.identity);
          return data.identity;
        }
      }
    } catch (error) {
      console.log('Alternative ENS service failed');
    }

    try {
      // Method 3: Direct ENS resolution (if ethers is available)
      if (typeof window !== 'undefined' && window.ethereum && window.ethers) {
        const provider = new window.ethers.providers.Web3Provider(window.ethereum);
        const ensName = await provider.lookupAddress(address);
        if (ensName) {
          ensCache.set(normalizedAddress, ensName);
          return ensName;
        }
      }
    } catch (error) {
      console.log('Direct ENS resolution failed');
    }

    // Cache negative result to avoid repeated lookups
    ensCache.set(normalizedAddress, null);
    return null;
  }, []);

  // Resolve ENS name to address (reverse lookup)
  const resolveAddress = useCallback(async (ensName) => {
    if (!ensName || !ensName.endsWith('.eth')) {
      return null;
    }

    try {
      if (typeof window !== 'undefined' && window.ethereum && window.ethers) {
        const provider = new window.ethers.providers.Web3Provider(window.ethereum);
        const address = await provider.resolveName(ensName);
        return address;
      }
    } catch (error) {
      console.log('ENS name resolution failed:', error);
    }

    return null;
  }, []);

  return {
    resolveENS,
    resolveAddress,
    clearCache: () => {
      ensCache.clear();
      setCache(new Map());
    }
  };
};

// Hook for single address ENS resolution
export const useENSName = (address) => {
  const [ensName, setEnsName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { resolveENS } = useENS();

  useEffect(() => {
    if (!address) {
      setEnsName(null);
      return;
    }

    setIsLoading(true);
    resolveENS(address)
      .then(name => {
        setEnsName(name);
      })
      .catch(error => {
        console.error('ENS resolution error:', error);
        setEnsName(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [address, resolveENS]);

  return { ensName, isLoading };
};

// Utility component for displaying address with ENS fallback
export const ENSName = ({ 
  address, 
  className = "", 
  showFullAddress = false,
  fallbackLength = 6 
}) => {
  const { ensName, isLoading } = useENSName(address);

  if (!address) return <span className={className}>Unknown</span>;

  if (isLoading) {
    return (
      <span className={`${className} animate-pulse`}>
        Loading...
      </span>
    );
  }

  if (ensName) {
    return (
      <span className={`${className} text-blue-600 dark:text-blue-400 font-medium`} title={address}>
        {ensName}
      </span>
    );
  }

  // Fallback to shortened address
  const formatted = showFullAddress 
    ? address 
    : `${address.slice(0, fallbackLength)}...${address.slice(-4)}`;

  return (
    <span className={`${className} font-mono text-gray-600 dark:text-gray-400`} title={address}>
      {formatted}
    </span>
  );
};

// Hook for batch ENS resolution (for lists)
export const useBatchENS = (addresses) => {
  const [ensNames, setEnsNames] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { resolveENS } = useENS();

  useEffect(() => {
    if (!addresses || addresses.length === 0) {
      setEnsNames({});
      return;
    }

    setIsLoading(true);
    
    const resolveAll = async () => {
      const results = {};
      
      // Resolve in batches to avoid rate limiting
      for (let i = 0; i < addresses.length; i += 5) {
        const batch = addresses.slice(i, i + 5);
        const batchPromises = batch.map(async (address) => {
          if (!address) return [address, null];
          const ensName = await resolveENS(address);
          return [address, ensName];
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(([address, ensName]) => {
          results[address] = ensName;
        });
        
        // Small delay between batches
        if (i + 5 < addresses.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setEnsNames(results);
      setIsLoading(false);
    };

    resolveAll().catch(error => {
      console.error('Batch ENS resolution error:', error);
      setIsLoading(false);
    });
  }, [addresses, resolveENS]);

  return { ensNames, isLoading };
};

export default useENS;