/**
 * Ethers.js utilities for wagmi v2 compatibility
 */

import { providers } from 'ethers';
import { type WalletClient } from 'viem';

/**
 * Convert a viem WalletClient to an ethers.js Signer
 * Required for wagmi v2 compatibility with libraries expecting ethers Signer
 * (e.g., Aragon SDK, Safe Protocol Kit)
 */
export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient;

  if (!account) {
    throw new Error('WalletClient does not have an account');
  }

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };

  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);

  return signer;
}
