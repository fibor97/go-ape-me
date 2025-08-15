// src/app/hooks/useWalletConnection.js - COMPLETE REWRITE
'use client';

import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useState, useCallback, useEffect, useRef } from 'react';

const APECHAIN_ID = 33139;

export function useWalletConnection() {
  // Core state
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastConnectAttempt, setLastConnectAttempt] = useState(0);
  
  // Refs to prevent multiple rapid calls
  const connectingRef = useRef(false);
  const switchingRef = useRef(false);
  
  // ✅ SAFE WAGMI HOOKS - Mit Error Handling
  let account = { address: undefined, isConnected: false, chain: undefined };
  let disconnect = () => console.warn('Disconnect not available');
  let switchChain = () => console.warn('Switch chain not available');
  let openConnectModal = () => console.warn('Connect modal not available');
  
  try {
    const accountHook = useAccount();
    const disconnectHook = useDisconnect();
    const switchChainHook = useSwitchChain();
    const connectModalHook = useConnectModal();
    
    account = accountHook;
    disconnect = disconnectHook?.disconnect || disconnect;
    switchChain = switchChainHook?.switchChain || switchChain;
    openConnectModal = connectModalHook?.openConnectModal || openConnectModal;
  } catch (error) {
    console.warn('⚠️ Wagmi hooks not ready:', error.message);
  }
  
  const { address, isConnected, chain } = account;

  // ✅ MOUNTED STATE - Verhindert SSR Issues
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      console.log('✅ Wallet connection hook mounted');
    }, 50); // Kleine Verzögerung für bessere Stabilität

    return () => clearTimeout(timer);
  }, []);

  // ✅ NETWORK VALIDATION
  const isCorrectNetwork = mounted && chain?.id === APECHAIN_ID;
  const isApeChain = isCorrectNetwork;
  const chainName = chain?.name || 'Unknown Network';

  // ✅ CONNECT FUNCTION - Fixed für Doppel-Click Problem
  const connect = useCallback(async () => {
    if (!mounted) {
      console.warn('⚠️ Hook not mounted yet, ignoring connect attempt');
      return;
    }

    // Verhindere mehrfache parallele Connection-Versuche
    if (connectingRef.current || isConnecting) {
      console.log('🔄 Connection already in progress, ignoring...');
      return;
    }

    // Rate limiting - verhindere spam clicks
    const now = Date.now();
    if (now - lastConnectAttempt < 1500) {
      console.log('⚠️ Too many connection attempts, please wait...');
      return;
    }

    try {
      console.log('🔗 Starting wallet connection...');
      connectingRef.current = true;
      setIsConnecting(true);
      setConnectionError(null);
      setLastConnectAttempt(now);

      // ✅ SOLUTION: Verwende RainbowKit Modal direkt
      if (openConnectModal && typeof openConnectModal === 'function') {
        console.log('🌈 Opening RainbowKit connect modal...');
        
        // Kleine Verzögerung um UI-Race-Conditions zu vermeiden
        await new Promise(resolve => setTimeout(resolve, 100));
        
        openConnectModal();
        
        console.log('✅ Connect modal opened successfully');
      } else {
        throw new Error('Connect modal not available');
      }

    } catch (error) {
      console.error('❌ Connection failed:', error);
      setConnectionError(error.message);
      
      // Fallback: Browser-native Ethereum Request
      if (window.ethereum) {
        try {
          console.log('🔄 Trying fallback connection...');
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (fallbackError) {
          console.error('❌ Fallback connection also failed:', fallbackError);
        }
      }
    } finally {
      // Reset states nach kurzer Verzögerung
      setTimeout(() => {
        connectingRef.current = false;
        setIsConnecting(false);
      }, 1000);
    }
  }, [mounted, openConnectModal, isConnecting, lastConnectAttempt]);

  // ✅ SWITCH TO APECHAIN - Fixed
  const switchToApeChain = useCallback(async () => {
    if (!mounted) {
      console.warn('⚠️ Hook not mounted, cannot switch network');
      return;
    }

    if (switchingRef.current) {
      console.log('🔄 Network switch already in progress...');
      return;
    }

    try {
      console.log('🔄 Switching to ApeChain...');
      switchingRef.current = true;

      if (switchChain && typeof switchChain === 'function') {
        await switchChain({ chainId: APECHAIN_ID });
        console.log('✅ Successfully switched to ApeChain');
      } else {
        // Manual network switch fallback
        console.log('🔄 Using manual network switch...');
        
        if (window.ethereum) {
          // Versuche zu ApeChain zu wechseln
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${APECHAIN_ID.toString(16)}` }],
            });
          } catch (switchError) {
            // Falls Chain nicht existiert, füge sie hinzu
            if (switchError.code === 4902) {
              console.log('➕ Adding ApeChain to wallet...');
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${APECHAIN_ID.toString(16)}`,
                  chainName: 'ApeChain',
                  nativeCurrency: {
                    name: 'ApeCoin',
                    symbol: 'APE',
                    decimals: 18,
                  },
                  rpcUrls: ['https://apechain.calderachain.xyz/http'],
                  blockExplorerUrls: ['https://apescan.io'],
                  iconUrls: ['https://apechain.com/icons/apechain.png'],
                }],
              });
            } else {
              throw switchError;
            }
          }
        } else {
          throw new Error('No Ethereum provider found');
        }
      }
    } catch (error) {
      console.error('❌ Failed to switch to ApeChain:', error);
      
      // User-friendly error messages
      if (error.code === 4001) {
        console.log('🚫 User rejected network switch');
      } else {
        setConnectionError(`Failed to switch to ApeChain: ${error.message}`);
      }
    } finally {
      setTimeout(() => {
        switchingRef.current = false;
      }, 1000);
    }
  }, [mounted, switchChain]);

  // ✅ DISCONNECT - Fixed
  const disconnectWallet = useCallback(async () => {
    if (!mounted) {
      console.warn('⚠️ Hook not mounted, cannot disconnect');
      return;
    }

    try {
      console.log('🔌 Disconnecting wallet...');
      
      if (disconnect && typeof disconnect === 'function') {
        await disconnect();
        console.log('✅ Wallet disconnected successfully');
      }
      
      // Reset local states
      setConnectionError(null);
      setIsConnecting(false);
      connectingRef.current = false;
      switchingRef.current = false;
      
    } catch (error) {
      console.error('❌ Disconnect failed:', error);
    }
  }, [mounted, disconnect]);

  // ✅ ADDRESS FORMATTING
  const formattedAddress = address && mounted
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const mobileAddress = address && mounted
    ? `${address.slice(0, 4)}...${address.slice(-2)}`
    : '';

  // ✅ CONNECTION STATUS DERIVED STATE
  const isWalletConnected = mounted && isConnected && !!address;
  
  // ✅ DEBUG INFO (nur in Development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && mounted) {
      console.log('🔍 Wallet State:', {
        isConnected: isWalletConnected,
        address: address?.slice(0, 10) + '...',
        chain: chain?.name,
        chainId: chain?.id,
        isCorrectNetwork,
        isConnecting,
        error: connectionError
      });
    }
  }, [isWalletConnected, address, chain, isCorrectNetwork, isConnecting, connectionError, mounted]);

  // ✅ AUTO-CLEAR ERRORS
  useEffect(() => {
    if (connectionError) {
      const timer = setTimeout(() => {
        setConnectionError(null);
      }, 5000); // Clear errors after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [connectionError]);

  // ✅ RETURN STABLE INTERFACE
  return {
    // ✅ Connection State
    isConnected: isWalletConnected,
    address: mounted ? address : undefined,
    formattedAddress,
    mobileAddress,
    
    // ✅ Network State  
    chain: mounted ? chain : undefined,
    chainName,
    chainId: chain?.id,
    isCorrectNetwork,
    isApeChain,
    
    // ✅ Functions
    connect,
    disconnect: disconnectWallet,
    switchToApeChain,
    
    // ✅ Loading States
    isConnecting,
    isLoading: isConnecting,
    
    // ✅ Error State
    error: connectionError,
    hasError: !!connectionError,
    
    // ✅ Internal State
    mounted,
    lastConnectAttempt,
    
    // ✅ Constants
    APECHAIN_ID,
    
    // ✅ Helper Functions
    clearError: () => setConnectionError(null),
    retry: () => {
      setConnectionError(null);
      connect();
    }
  };
}