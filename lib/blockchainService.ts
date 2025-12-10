import { ethers } from 'ethers';
import { Network } from '@/store/workflowStore';

export interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

export interface WalletConnection {
  address: string;
  chainId: number;
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function connectWallet(): Promise<WalletConnection | null> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();

    return {
      address: accounts[0],
      chainId: Number(network.chainId),
      provider,
      signer,
    };
  } catch (error: any) {
    console.error('Failed to connect wallet:', error);
    throw new Error(error.message || 'Failed to connect wallet');
  }
}

export async function switchNetwork(chainId: number): Promise<boolean> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      throw new Error('Network not added to MetaMask. Please add it manually.');
    }
    throw error;
  }
}

export async function addNetwork(network: Network): Promise<boolean> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${network.chainId.toString(16)}`,
          chainName: network.name,
          nativeCurrency: {
            name: network.symbol,
            symbol: network.symbol,
            decimals: 18,
          },
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: network.explorer ? [network.explorer] : [],
        },
      ],
    });
    return true;
  } catch (error: any) {
    console.error('Failed to add network:', error);
    throw new Error(error.message || 'Failed to add network');
  }
}

export async function deployContract(
  abi: any[],
  bytecode: string,
  constructorArgs: any[] = [],
  signer: ethers.JsonRpcSigner
): Promise<DeploymentResult> {
  try {
    // Validate inputs
    if (!abi || abi.length === 0) {
      return {
        success: false,
        error: 'ABI is required for deployment',
      };
    }

    if (!bytecode || bytecode.length === 0) {
      return {
        success: false,
        error: 'Bytecode is required for deployment',
      };
    }

    // Ensure bytecode has 0x prefix
    const formattedBytecode = bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`;

    // Create contract factory
    const factory = new ethers.ContractFactory(abi, formattedBytecode, signer);

    // Deploy contract
    const contract = await factory.deploy(...constructorArgs);

    // Wait for deployment
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    const deploymentTx = contract.deploymentTransaction();

    return {
      success: true,
      contractAddress,
      transactionHash: deploymentTx?.hash,
    };
  } catch (error: any) {
    console.error('Deployment error:', error);
    return {
      success: false,
      error: error.message || 'Failed to deploy contract',
    };
  }
}

export async function getBalance(address: string, provider: ethers.BrowserProvider): Promise<string> {
  try {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error: any) {
    console.error('Failed to get balance:', error);
    throw new Error(error.message || 'Failed to get balance');
  }
}

export async function waitForTransaction(
  txHash: string,
  provider: ethers.BrowserProvider
): Promise<ethers.TransactionReceipt | null> {
  try {
    const receipt = await provider.waitForTransaction(txHash);
    return receipt;
  } catch (error: any) {
    console.error('Failed to wait for transaction:', error);
    throw new Error(error.message || 'Failed to wait for transaction');
  }
}

export function getExplorerUrl(network: Network, address: string, type: 'address' | 'tx' = 'address'): string | null {
  if (!network.explorer) return null;

  if (type === 'tx') {
    return `${network.explorer}/tx/${address}`;
  }
  return `${network.explorer}/address/${address}`;
}

export async function estimateGas(
  abi: any[],
  bytecode: string,
  constructorArgs: any[] = [],
  signer: ethers.JsonRpcSigner
): Promise<bigint> {
  try {
    const formattedBytecode = bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`;
    const factory = new ethers.ContractFactory(abi, formattedBytecode, signer);

    const deploymentData = factory.getDeployTransaction(...constructorArgs);
    const gasEstimate = await signer.estimateGas(deploymentData);

    return gasEstimate;
  } catch (error: any) {
    console.error('Failed to estimate gas:', error);
    throw new Error(error.message || 'Failed to estimate gas');
  }
}
