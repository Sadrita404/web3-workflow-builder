"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  Upload,
  Download,
  Settings,
  FolderPlus,
  Network,
  Wallet,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import AddNetworkModal from './AddNetworkModal';
import NewProjectModal from './NewProjectModal';
import { toast } from 'react-toastify';
import { switchNetwork, addNetwork } from '@/lib/blockchainService';

export default function TopBar() {
  const {
    currentProject,
    selectedNetwork,
    networks,
    setSelectedNetwork,
  } = useWorkflowStore();

  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showAddNetworkModal, setShowAddNetworkModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkWalletConnection();
    setupWalletListeners();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);

          // Get current chain ID
          const chainId = await window.ethereum.request({
            method: 'eth_chainId'
          });
          setCurrentChainId(parseInt(chainId, 16));

          // Load saved state from localStorage
          const savedAddress = localStorage.getItem('walletAddress');
          if (savedAddress && savedAddress !== accounts[0]) {
            localStorage.setItem('walletAddress', accounts[0]);
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const setupWalletListeners = () => {
    if (typeof window.ethereum !== 'undefined') {
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          localStorage.setItem('walletAddress', accounts[0]);
          toast.info('Wallet account changed');
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setCurrentChainId(newChainId);

        // Update selected network if it matches
        const matchingNetwork = networks.find(n => n.chainId === newChainId);
        if (matchingNetwork && matchingNetwork.id !== selectedNetwork?.id) {
          setSelectedNetwork(matchingNetwork);
          toast.success(`Switched to ${matchingNetwork.name}`);
        }
      });

      // Listen for disconnect
      window.ethereum.on('disconnect', () => {
        disconnectWallet();
      });
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('Please install MetaMask to use this feature!');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      localStorage.setItem('walletAddress', accounts[0]);

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });
      setCurrentChainId(parseInt(chainId, 16));

      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setWalletConnected(false);
    setCurrentChainId(null);
    localStorage.removeItem('walletAddress');
    toast.info('Wallet disconnected');
  };

  const handleNetworkSelect = async (network: typeof networks[0]) => {
    setSelectedNetwork(network);
    setShowNetworkMenu(false);

    // If wallet is connected, try to switch network in MetaMask
    if (walletConnected && network.chainId !== currentChainId) {
      await handleNetworkSwitch(network.chainId);
    }
  };

  const handleNetworkSwitch = async (chainId: number) => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await switchNetwork(chainId);
      setCurrentChainId(chainId);
      toast.success('Network switched successfully!');
    } catch (error: any) {
      // If network doesn't exist in MetaMask, try to add it
      if (error.code === 4902 || error.message?.includes('Unrecognized chain')) {
        const network = networks.find(n => n.chainId === chainId);
        if (network) {
          try {
            await addNetwork(network);
            setCurrentChainId(chainId);
            toast.success(`${network.name} added and switched successfully!`);
          } catch (addError: any) {
            console.error('Failed to add network:', addError);
            toast.error('Failed to add network to MetaMask');
          }
        }
      } else {
        console.error('Failed to switch network:', error);
        toast.error('Failed to switch network. Please switch manually in MetaMask.');
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <>
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
        {/* Left Section - Project Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W3</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-800">
                {currentProject?.title || 'Web3 Workflow Builder'}
              </h1>
              {currentProject?.description && (
                <p className="text-xs text-gray-500">
                  {currentProject.description}
                </p>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Center Section - Network Selector */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNetworkMenu(!showNetworkMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-secondary transition-all duration-200"
            >
              <Network className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-gray-700">
                {selectedNetwork?.name || 'Select Network'}
              </span>
              {walletConnected && currentChainId === selectedNetwork?.chainId && (
                <div className="w-2 h-2 rounded-full bg-green-500" title="Connected" />
              )}
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showNetworkMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNetworkMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden"
                >
                  <div className="p-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                      Select Network
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {networks.map((network) => (
                      <button
                        key={network.id}
                        onClick={() => handleNetworkSelect(network)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          selectedNetwork?.id === network.id ? 'bg-secondary bg-opacity-10' : ''
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                            {network.name}
                            {walletConnected && currentChainId === network.chainId && (
                              <div className="w-2 h-2 rounded-full bg-green-500" title="Connected" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Chain ID: {network.chainId}
                          </div>
                        </div>
                        {selectedNetwork?.id === network.id && (
                          <div className="w-2 h-2 rounded-full bg-secondary" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        setShowNetworkMenu(false);
                        setShowAddNetworkModal(true);
                      }}
                      className="w-full px-3 py-2 text-sm text-secondary hover:bg-secondary hover:bg-opacity-10 rounded transition-colors text-left font-medium"
                    >
                      + Add Custom Network
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {walletConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-700">
                  {formatAddress(walletAddress)}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Disconnect Wallet"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all duration-200"
            >
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">Connect Wallet</span>
            </button>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all duration-200"
            title="Save Project"
          >
            <Save className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all duration-200"
            title="Import Workflow"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all duration-200"
            title="Export Workflow"
          >
            <Download className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-gray-200 mx-2" />
          <button
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all duration-200"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <AddNetworkModal
        isOpen={showAddNetworkModal}
        onClose={() => setShowAddNetworkModal(false)}
      />

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </>
  );
}
