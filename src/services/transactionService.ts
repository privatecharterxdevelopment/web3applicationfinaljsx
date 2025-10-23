// Transaction tracking service for blockchain swaps
export interface SwapTransaction {
  id: string;
  hash: string;
  from: string;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  status: 'pending' | 'confirming' | 'success' | 'failed';
  timestamp: number;
  chainId: number;
  gasUsed?: string;
  gasPriceGwei?: string;
  etherscanUrl: string;
}

class TransactionService {
  private static STORAGE_KEY = 'pvcx_swap_transactions';

  // Get all transactions for a user
  static getTransactions(userAddress: string): SwapTransaction[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    try {
      const allTxs: Record<string, SwapTransaction[]> = JSON.parse(stored);
      return allTxs[userAddress.toLowerCase()] || [];
    } catch {
      return [];
    }
  }

  // Save a new transaction
  static saveTransaction(userAddress: string, tx: SwapTransaction): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    let allTxs: Record<string, SwapTransaction[]> = {};

    if (stored) {
      try {
        allTxs = JSON.parse(stored);
      } catch {
        allTxs = {};
      }
    }

    const addressKey = userAddress.toLowerCase();
    if (!allTxs[addressKey]) {
      allTxs[addressKey] = [];
    }

    allTxs[addressKey].unshift(tx); // Add to beginning (newest first)

    // Keep only last 100 transactions per user
    if (allTxs[addressKey].length > 100) {
      allTxs[addressKey] = allTxs[addressKey].slice(0, 100);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allTxs));
  }

  // Update transaction status
  static updateTransactionStatus(
    userAddress: string,
    txHash: string,
    status: SwapTransaction['status'],
    additionalData?: Partial<SwapTransaction>
  ): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return;

    try {
      const allTxs: Record<string, SwapTransaction[]> = JSON.parse(stored);
      const addressKey = userAddress.toLowerCase();
      const userTxs = allTxs[addressKey] || [];

      const txIndex = userTxs.findIndex(tx => tx.hash === txHash);
      if (txIndex !== -1) {
        userTxs[txIndex] = {
          ...userTxs[txIndex],
          status,
          ...additionalData,
        };
        allTxs[addressKey] = userTxs;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allTxs));
      }
    } catch (error) {
      console.error('Failed to update transaction status:', error);
    }
  }

  // Clear all transactions for a user
  static clearTransactions(userAddress: string): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return;

    try {
      const allTxs: Record<string, SwapTransaction[]> = JSON.parse(stored);
      delete allTxs[userAddress.toLowerCase()];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allTxs));
    } catch (error) {
      console.error('Failed to clear transactions:', error);
    }
  }
}

export default TransactionService;
