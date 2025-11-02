// Safe Global SDK integration for multi-signature escrow wallets
import Safe from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import { ethers } from 'ethers';

// PrivateCharterX Treasury wallet for fee collection
export const TREASURY_ADDRESS = '0xe2eecbbfe60d013e93c7dc4da482e6657ee7801b';

// Network configurations
const SAFE_NETWORK_CONFIGS = {
  sepolia: {
    txServiceUrl: 'https://safe-transaction-sepolia.safe.global',
    chainId: 11155111n,
    rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || 'nAGVpg8dv1k94VJ_Q-SG0'}`
  },
  mainnet: {
    txServiceUrl: 'https://safe-transaction-mainnet.safe.global',
    chainId: 1n,
    rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || 'nAGVpg8dv1k94VJ_Q-SG0'}`
  },
  polygon: {
    txServiceUrl: 'https://safe-transaction-polygon.safe.global',
    chainId: 137n,
    rpcUrl: 'https://polygon-rpc.com'
  },
  arbitrum: {
    txServiceUrl: 'https://safe-transaction-arbitrum.safe.global',
    chainId: 42161n,
    rpcUrl: 'https://arb1.arbitrum.io/rpc'
  },
  base: {
    txServiceUrl: 'https://safe-transaction-base.safe.global',
    chainId: 8453n,
    rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || 'nAGVpg8dv1k94VJ_Q-SG0'}`
  }
};

export interface SafeConfig {
  network: keyof typeof SAFE_NETWORK_CONFIGS;
  owners: string[];
  threshold: number;
  feeOption: 'classic' | 'disputes';
  feePercentage: number;
}

export interface TransactionProposal {
  to: string;
  value: string; // in wei
  data?: string;
}

/**
 * Initialize Safe API Kit for a specific network
 */
export function getSafeApiKit(network: keyof typeof SAFE_NETWORK_CONFIGS): SafeApiKit {
  const config = SAFE_NETWORK_CONFIGS[network];
  return new SafeApiKit({
    chainId: config.chainId
  });
}

/**
 * Deploy a new Safe account to the blockchain
 */
export async function deploySafe(
  signer: ethers.Signer,
  config: SafeConfig
): Promise<{ safeAddress: string; txHash?: string }> {
  try {
    const networkConfig = SAFE_NETWORK_CONFIGS[config.network];

    // Prepare Safe deployment configuration
    const safeAccountConfig = {
      owners: config.owners,
      threshold: config.threshold,
    };

    // Create Safe instance (Safe SDK v6 handles provider internally)
    const safeSdk = await Safe.init({
      provider: signer.provider,
      signer: await signer.getAddress(),
      safeAccountConfig
    });

    // Get the predicted Safe address
    const safeAddress = await safeSdk.getAddress();

    console.log(`✅ Safe predicted address: ${safeAddress}`);
    console.log(`📋 Owners: ${config.owners.length}, Threshold: ${config.threshold}`);
    console.log(`💰 Fee: ${config.feePercentage}% (${config.feeOption})`);

    // Deploy the Safe
    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction();
    const txResponse = await signer.sendTransaction({
      to: deploymentTransaction.to,
      data: deploymentTransaction.data,
      value: deploymentTransaction.value
    });

    console.log(`🚀 Deploying Safe... TX Hash: ${txResponse.hash}`);

    // Wait for deployment confirmation
    await txResponse.wait();

    console.log(`✅ Safe deployed successfully at ${safeAddress}`);

    return {
      safeAddress,
      txHash: txResponse.hash
    };
  } catch (error) {
    console.error('❌ Failed to deploy Safe:', error);
    throw new Error(`Failed to deploy Safe: ${error.message}`);
  }
}

/**
 * Calculate fee amount based on transaction value and fee percentage
 */
export function calculateFee(valueInWei: string, feePercentage: number): string {
  const value = BigInt(valueInWei);
  const feeAmount = (value * BigInt(Math.floor(feePercentage * 100))) / BigInt(10000);
  return feeAmount.toString();
}

/**
 * Create a multi-send transaction with automatic fee deduction
 * Sends fee to treasury and remaining amount to recipient
 */
export async function createTransactionWithFee(
  safeSdk: Safe,
  to: string,
  valueInWei: string,
  feePercentage: number,
  data: string = '0x'
): Promise<any> {
  try {
    const feeAmount = calculateFee(valueInWei, feePercentage);
    const remainingAmount = (BigInt(valueInWei) - BigInt(feeAmount)).toString();

    console.log(`💰 Total: ${ethers.utils.formatEther(valueInWei)} ETH`);
    console.log(`💸 Fee (${feePercentage}%): ${ethers.utils.formatEther(feeAmount)} ETH`);
    console.log(`💵 To recipient: ${ethers.utils.formatEther(remainingAmount)} ETH`);

    // Create multi-send transaction batch
    const transactions = [
      // First: Send fee to treasury
      {
        to: TREASURY_ADDRESS,
        value: feeAmount,
        data: '0x',
        operation: 0 // CALL
      },
      // Second: Send remaining to recipient
      {
        to,
        value: remainingAmount,
        data,
        operation: 0 // CALL
      }
    ];

    // Create Safe transaction
    const safeTransaction = await safeSdk.createTransaction({
      safeTransactionData: transactions
    });

    return safeTransaction;
  } catch (error) {
    console.error('❌ Failed to create transaction with fee:', error);
    throw new Error(`Failed to create transaction: ${error.message}`);
  }
}

/**
 * Propose a transaction to the Safe (requires owner approval)
 */
export async function proposeTransaction(
  safeSdk: Safe,
  network: keyof typeof SAFE_NETWORK_CONFIGS,
  safeAddress: string,
  transaction: any,
  senderAddress: string
): Promise<string> {
  try {
    const safeApiKit = getSafeApiKit(network);

    // Sign the transaction
    const signedSafeTransaction = await safeSdk.signTransaction(transaction);
    const safeTxHash = await safeSdk.getTransactionHash(signedSafeTransaction);

    // Propose the transaction to Safe Transaction Service
    await safeApiKit.proposeTransaction({
      safeAddress,
      safeTransactionData: signedSafeTransaction.data,
      safeTxHash,
      senderAddress,
      senderSignature: signedSafeTransaction.encodedSignatures()
    });

    console.log(`✅ Transaction proposed. Safe TX Hash: ${safeTxHash}`);
    return safeTxHash;
  } catch (error) {
    console.error('❌ Failed to propose transaction:', error);
    throw new Error(`Failed to propose transaction: ${error.message}`);
  }
}

/**
 * Confirm/Sign a pending transaction
 */
export async function confirmTransaction(
  safeSdk: Safe,
  network: keyof typeof SAFE_NETWORK_CONFIGS,
  safeTxHash: string,
  senderAddress: string
): Promise<void> {
  try {
    const safeApiKit = getSafeApiKit(network);

    // Get pending transaction
    const transaction = await safeApiKit.getTransaction(safeTxHash);
    const signature = await safeSdk.signTransactionHash(safeTxHash);

    // Submit confirmation
    await safeApiKit.confirmTransaction(safeTxHash, signature.data);

    console.log(`✅ Transaction confirmed by ${senderAddress}`);
  } catch (error) {
    console.error('❌ Failed to confirm transaction:', error);
    throw new Error(`Failed to confirm transaction: ${error.message}`);
  }
}

/**
 * Execute a transaction once threshold is met
 */
export async function executeTransaction(
  safeSdk: Safe,
  network: keyof typeof SAFE_NETWORK_CONFIGS,
  safeTxHash: string
): Promise<string> {
  try {
    const safeApiKit = getSafeApiKit(network);

    // Get transaction with all signatures
    const transaction = await safeApiKit.getTransaction(safeTxHash);

    // Execute transaction
    const executeTxResponse = await safeSdk.executeTransaction(transaction);
    const txReceipt = await executeTxResponse.transactionResponse?.wait();

    console.log(`✅ Transaction executed. TX Hash: ${txReceipt?.transactionHash}`);
    return txReceipt?.transactionHash || '';
  } catch (error) {
    console.error('❌ Failed to execute transaction:', error);
    throw new Error(`Failed to execute transaction: ${error.message}`);
  }
}

/**
 * Get pending transactions for a Safe
 */
export async function getPendingTransactions(
  network: keyof typeof SAFE_NETWORK_CONFIGS,
  safeAddress: string
): Promise<any[]> {
  try {
    const safeApiKit = getSafeApiKit(network);
    const pendingTxs = await safeApiKit.getPendingTransactions(safeAddress);
    return pendingTxs.results;
  } catch (error) {
    console.error('❌ Failed to get pending transactions:', error);
    return [];
  }
}

/**
 * Estimate gas for Safe deployment
 */
export async function estimateDeploymentGas(
  signer: ethers.Signer,
  config: SafeConfig
): Promise<string> {
  try {
    const safeAccountConfig = {
      owners: config.owners,
      threshold: config.threshold,
    };

    const safeSdk = await Safe.init({
      provider: signer.provider,
      signer: await signer.getAddress(),
      safeAccountConfig
    });

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction();
    const gasEstimate = await signer.estimateGas({
      to: deploymentTransaction.to,
      data: deploymentTransaction.data,
      value: deploymentTransaction.value
    });

    return gasEstimate.toString();
  } catch (error) {
    console.error('❌ Failed to estimate gas:', error);
    return '0';
  }
}
