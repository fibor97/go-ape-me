import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useState, useCallback, useEffect } from 'react';

const APECHAIN_ID = 33139;

export function useWalletConnection() {
  const [mounted, setMounted] = useState(false);
  
  // Safe Wagmi Hooks mit Fallbacks
  let account, disconnect, switchChain, openConnectModal;
  
  try {
    account = useAccount();
    const disconnectHook = useDisconnect();
    const switchChainHook = useSwitchChain();
    const connectModalHook = useConnectModal();
    
    disconnect = disconnectHook.disconnect;
    switchChain = switchChainHook.switchChain;
    openConnectModal = connectModalHook.openConnectModal;
  } catch (error) {
    // Falls WagmiProvider noch nicht ready ist
    console.warn('Wagmi hooks not ready yet:', error.message);
    account = { address: undefined, isConnected: false, chain: undefined };
    disconnect = () => {};
    switchChain = () => {};
    openConnectModal = () => {};
  }
  
  const { address, isConnected, chain } = account;
  
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && chain) {
      setIsCorrectNetwork(chain.id === APECHAIN_ID);
    }
  }, [chain, mounted]);

  const connect = useCallback(() => {
    if (mounted && openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal, mounted]);

  const switchToApeChain = useCallback(async () => {
    if (!mounted || !switchChain) return;
    
    try {
      await switchChain({ chainId: APECHAIN_ID });
    } catch (error) {
      console.error('Failed to switch to ApeChain:', error);
    }
  }, [switchChain, mounted]);

  const disconnectWallet = useCallback(() => {
    if (mounted && disconnect) {
      disconnect();
    }
  }, [disconnect, mounted]);

  const formattedAddress = address && mounted
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const mobileAddress = address && mounted
    ? `${address.slice(0, 4)}...`
    : '';

  return {
    isConnected: mounted ? isConnected : false,
    address: mounted ? address : undefined,
    formattedAddress,
    mobileAddress,
    chain: mounted ? chain : undefined,
    isCorrectNetwork: mounted ? isCorrectNetwork : false,
    connect,
    disconnect: disconnectWallet,
    switchToApeChain,
    chainName: chain?.name || 'Unknown',
    chainId: chain?.id,
    isApeChain: chain?.id === APECHAIN_ID,
    mounted, // Export mounted state für weitere Checks
  };
}