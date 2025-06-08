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

// Wagmi Configuration
const config = getDefaultConfig({
  appName: "Go-Ape-Me",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo_project_id",
  chains: [apeChain, mainnet, arbitrum],
  transports: {
    [apeChain.id]: http(),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
  // SSR Kompatibilität
  ssr: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable retries during SSR
      retry: false,
      // Disable refetch on window focus during SSR
      refetchOnWindowFocus: false,
    },
  },
});

export function WalletProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  // Verhindere Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Während SSR/Hydration nur children ohne Wagmi rendern
  if (!mounted) {
    return (
      <div suppressHydrationWarning>
        {children}
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          initialChain={apeChain}
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}