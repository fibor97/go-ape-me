'use client';

import { WagmiProvider, http } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { useState, useEffect } from 'react';

// ApeChain Configuration
const apeChain = {
  id: 33139,
  name: 'ApeChain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: { http: ['https://apechain.calderachain.xyz/http'] },
  },
  blockExplorers: {
    default: { name: 'ApeScan', url: 'https://apescan.io' },
  },
  testnet: false,
};

// Sichere Wagmi Configuration für SSR
let config;
let queryClient;

// Initialisierung nur einmal ausführen
const initializeWagmi = () => {
  if (!config) {
    config = getDefaultConfig({
      appName: "Go-Ape-Me",
      projectId: 'affcc49c4772c84584747c5cf31be853', 
      chains: [apeChain, mainnet, arbitrum],
      transports: {
        [apeChain.id]: http(),
        [mainnet.id]: http(),
        [arbitrum.id]: http(),
      },
      ssr: false,
    });
  }

  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: false,
          staleTime: 1000 * 60 * 5,
        },
      },
    });
  }
};

export function WalletProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  // ✅ FIX: useEffect mit leeren Dependencies
  useEffect(() => {
    initializeWagmi();
    setMounted(true);
  }, []); // ✅ Leeres dependency array!

  // ✅ FIX: Gleicher Content für SSR und CSR
  if (!mounted) {
    return <div>{children}</div>;
  }

  // Client-side Wallet Provider
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          initialChain={apeChain}
          showRecentTransactions={false}
          coolMode={false}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}