/**
 * Gnosis Safe Integration for DexRais.funds
 *
 * This module provides utilities for creating and managing Gnosis Safe wallets
 * for campaign escrow on Base network.
 *
 * All-or-Nothing Model:
 * - If campaign reaches 100% of goal: funds unlock to creator
 * - If campaign doesn't reach 100%: automatic refunds to all backers
 */

import Safe, { EthersAdapter } from '@safe-global/protocol-kit';
import { SafeAccountConfig, SafeFactory } from '@safe-global/protocol-kit';
import { ethers } from 'ethers';
import { base } from 'wagmi/chains';

export const SAFE_VERSION = '1.3.0';
export const BASE_CHAIN_ID = base.id;

/**
 * Configuration for creating a new Gnosis Safe
 */
export interface SafeConfig {
  owners: string[]; // Wallet addresses of Safe owners
  threshold: number; // Number of signatures required for transactions
  campaignId: string; // Campaign ID for reference
}

/**
 * Create a new Gnosis Safe for a campaign
 *
 * @param signer - Ethers signer (connected wallet)
 * @param creatorAddress - Campaign creator's wallet address
 * @param platformAddress - Platform's wallet address for multi-sig
 * @param campaignId - Campaign ID
 * @returns Safe address
 *
 * @example
 * ```typescript
 * const safeAddress = await createCampaignSafe(
 *   signer,
 *   '0x123...', // creator
 *   '0x456...', // platform
 *   'campaign-uuid'
 * );
 * ```
 */
export async function createCampaignSafe(
  signer: ethers.Signer,
  creatorAddress: string,
  platformAddress: string,
  campaignId: string
): Promise<string> {
  try {
    // Initialize EthersAdapter with the signer
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer,
    });

    // Configure Safe: 2/2 multisig (creator + platform)
    const safeAccountConfig: SafeAccountConfig = {
      owners: [creatorAddress, platformAddress],
      threshold: 2, // Both signatures required
    };

    // Create SafeFactory
    const safeFactory = await SafeFactory.create({ ethAdapter });

    // Deploy Safe
    const safeSdk = await safeFactory.deploySafe({ safeAccountConfig });
    const safeAddress = await safeSdk.getAddress();

    console.log('✅ Gnosis Safe created successfully:', {
      campaignId,
      safeAddress,
      owners: [creatorAddress, platformAddress],
      threshold: 2,
    });

    return safeAddress;
  } catch (error) {
    console.error('❌ Failed to create Safe:', error);
    throw new Error(`Gnosis Safe creation failed: ${error.message || error}`);
  }
}

/**
 * Get Safe information
 *
 * @param signer - Ethers signer
 * @param safeAddress - Address of the Safe
 * @returns Safe details including balance and owners
 */
export async function getSafeInfo(signer: ethers.Signer, safeAddress: string) {
  try {
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer,
    });

    const safeSdk = await Safe.create({ ethAdapter, safeAddress });

    const owners = await safeSdk.getOwners();
    const threshold = await safeSdk.getThreshold();
    const balance = await safeSdk.getBalance();

    return {
      address: safeAddress,
      owners,
      threshold,
      balance: balance.toString(),
    };
  } catch (error) {
    console.error('❌ Failed to get Safe info:', error);
    throw error;
  }
}

/**
 * Release funds to campaign creator (when 100% goal is reached)
 *
 * @param signer - Ethers signer
 * @param safeAddress - Safe address
 * @param recipientAddress - Campaign creator's address
 * @param usdcTokenAddress - USDC contract address on Base
 * @param amount - Amount in USDC (wei)
 */
export async function releaseFundsToCreator(
  signer: ethers.Signer,
  safeAddress: string,
  recipientAddress: string,
  usdcTokenAddress: string,
  amount: string
) {
  try {
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer,
    });

    const safeSdk = await Safe.create({ ethAdapter, safeAddress });

    // Create transaction to transfer USDC from Safe to creator
    const safeTransactionData = {
      to: usdcTokenAddress,
      value: '0',
      data: encodeFunctionData('transfer', [recipientAddress, amount]),
    };

    const safeTransaction = await safeSdk.createTransaction({ safeTransactionData });
    const txHash = await safeSdk.executeTransaction(safeTransaction);

    console.log('✅ Funds released to creator:', {
      safeAddress,
      recipient: recipientAddress,
      amount,
      txHash,
    });

    return txHash;
  } catch (error) {
    console.error('❌ Failed to release funds:', error);
    throw error;
  }
}

/**
 * Process refunds to all backers (when campaign doesn't reach 100%)
 *
 * @param signer - Ethers signer
 * @param safeAddress - Safe address
 * @param backers - Array of backer addresses and their contribution amounts
 * @param usdcTokenAddress - USDC contract address on Base
 */
export async function processRefunds(
  signer: ethers.Signer,
  safeAddress: string,
  backers: Array<{ address: string; amount: string }>,
  usdcTokenAddress: string
) {
  try {
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer,
    });

    const safeSdk = await Safe.create({ ethAdapter, safeAddress });

    // Create batch transaction for all refunds
    const refundTransactions = backers.map((backer) => ({
      to: usdcTokenAddress,
      value: '0',
      data: encodeFunctionData('transfer', [backer.address, backer.amount]),
    }));

    // Execute batch refund
    const safeTransaction = await safeSdk.createTransaction({
      safeTransactionData: refundTransactions,
    });
    const txHash = await safeSdk.executeTransaction(safeTransaction);

    console.log('✅ Refunds processed:', {
      safeAddress,
      backerCount: backers.length,
      txHash,
    });

    return txHash;
  } catch (error) {
    console.error('❌ Failed to process refunds:', error);
    throw error;
  }
}

/**
 * Helper: Encode function data for ERC20 transfer
 */
function encodeFunctionData(functionName: string, params: any[]): string {
  const iface = new ethers.utils.Interface([
    'function transfer(address to, uint256 amount) returns (bool)',
  ]);
  return iface.encodeFunctionData(functionName, params);
}

/**
 * Helper: Generate Safe URL for manual creation
 *
 * @param chainId - Chain ID (Base = 8453)
 * @returns URL to create Safe on app.safe.global
 */
export function getSafeCreationURL(chainId: number = BASE_CHAIN_ID): string {
  return `https://app.safe.global/new-safe?chain=${chainId === BASE_CHAIN_ID ? 'base' : 'eth'}`;
}

/**
 * Helper: Generate Safe URL for viewing a specific Safe
 *
 * @param safeAddress - Safe address
 * @param chainId - Chain ID (Base = 8453)
 * @returns URL to view Safe on app.safe.global
 */
export function getSafeViewURL(safeAddress: string, chainId: number = BASE_CHAIN_ID): string {
  return `https://app.safe.global/${chainId === BASE_CHAIN_ID ? 'base' : 'eth'}:${safeAddress}`;
}

/**
 * Configuration for platform
 * This address should be controlled by the platform and will be
 * a co-signer on all campaign Safes
 */
export const PLATFORM_SAFE_SIGNER = process.env.NEXT_PUBLIC_PLATFORM_SIGNER_ADDRESS || '0x0000000000000000000000000000000000000000';

/**
 * USDC Token Address on Base
 */
export const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

/**
 * Instructions for manual Safe creation (fallback)
 */
export const SAFE_CREATION_INSTRUCTIONS = `
# How to Create a Gnosis Safe for Your Campaign

1. Visit https://app.safe.global/new-safe?chain=base
2. Connect your wallet (campaign creator)
3. Select "Base" network
4. Add the following owners:
   - Your wallet address (campaign creator)
   - Platform address: ${PLATFORM_SAFE_SIGNER}
5. Set threshold to 2 (both signatures required)
6. Review and deploy Safe
7. Copy the Safe address
8. Return to campaign creation and enter Safe address

## All-or-Nothing Model

- **100% Goal Reached**: Funds unlock to creator automatically
- **Under 100%**: All backers receive automatic refunds
- **Transparency**: All transactions visible on-chain
- **DAO Voting**: Token holders can participate in governance
`;

export default {
  createCampaignSafe,
  getSafeInfo,
  releaseFundsToCreator,
  processRefunds,
  getSafeCreationURL,
  getSafeViewURL,
  SAFE_CREATION_INSTRUCTIONS,
  USDC_BASE_ADDRESS,
};
