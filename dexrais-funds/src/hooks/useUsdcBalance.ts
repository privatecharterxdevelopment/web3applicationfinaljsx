import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { usdcContract } from '../lib/contracts/usdc';

export function useUsdcBalance(address?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    ...usdcContract,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data || 0n,
    balanceFormatted: data ? formatUnits(data, 6) : '0',
    balanceNumber: data ? Number(formatUnits(data, 6)) : 0,
    isLoading,
    error,
    refetch,
  };
}
