'use client';


import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

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
});

const queryClient = new QueryClient();

export function WalletProvider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
       <RainbowKitProvider
          initialChain={apeChain}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}