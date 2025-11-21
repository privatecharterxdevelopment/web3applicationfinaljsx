import { erc20Abi } from 'viem';

// USDC on Base Chain
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// USDC has 6 decimals (not 18!)
export const USDC_DECIMALS = 6;

export const usdcContract = {
  address: USDC_ADDRESS,
  abi: erc20Abi,
} as const;

// Helper to convert USDC amount to wei (6 decimals)
export function usdcToWei(amount: number): bigint {
  return BigInt(Math.floor(amount * 1_000_000));
}

// Helper to convert wei to USDC display value
export function weiToUsdc(wei: bigint): number {
  return Number(wei) / 1_000_000;
}
