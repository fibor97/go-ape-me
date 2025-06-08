import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useState, useCallback, useEffect } from 'react';

const APECHAIN_ID = 33139;

export function useWalletConnection() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

  useEffect(() => {
    setIsCorrectNetwork(chain?.id === APECHAIN_ID);
  }, [chain]);

  const connect = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal]);

  const switchToApeChain = useCallback(async () => {
    try {
      await switchChain({ chainId: APECHAIN_ID });
    } catch (error) {
      console.error('Failed to switch to ApeChain:', error);
    }
  }, [switchChain]);

  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const formattedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const mobileAddress = address 
    ? `${address.slice(0, 4)}...`
    : '';

  return {
  isConnected: mounted ? isConnected : false,
  address: mounted ? address : undefined,
  formattedAddress,
  mobileAddress,
  chain,
  isCorrectNetwork: mounted ? isCorrectNetwork : false,
  connect,
  disconnect: disconnectWallet,
  switchToApeChain,
  chainName: chain?.name || 'Unknown',
  chainId: chain?.id,
  isApeChain: chain?.id === APECHAIN_ID,
};
}