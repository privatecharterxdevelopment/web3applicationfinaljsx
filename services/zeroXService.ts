import { Address } from 'viem';

const ZERO_X_API_KEY = 'bc39261d-3da0-4aa1-812a-a8c3e994d21c';
const ZERO_X_BASE_URL = 'https://api.0x.org';

// Revenue Configuration
export const REVENUE_CONFIG = {
  // PrivateCharterX Revenue Wallet Address
  REVENUE_WALLET: '0xe2eeCBbfE60d013e93c7dC4da482E6657Ee7801b' as Address,
  // Fee percentage (0.5% = 0.005)
  FEE_PERCENTAGE: 0.005,
  // Fee in basis points (50 = 0.5%)
  FEE_BASIS_POINTS: 50,
};

export interface ZeroXQuoteParams {
  chainId: number;
  sellToken: Address;
  buyToken: Address;
  sellAmount: string;
  taker: Address;
  feeRecipient?: Address;
  feeBps?: number;
}

export interface ZeroXQuote {
  sellAmount: string;
  buyAmount: string;
  price: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
  gasPrice: string;
  estimatedGas: string;
  minimumProtocolFee: string;
  to: Address;
  data: string;
  value: string;
}

export class ZeroXService {
  private static getHeaders() {
    return {
      '0x-api-key': ZERO_X_API_KEY,
      '0x-version': 'v2',
      'Content-Type': 'application/json',
    };
  }

  static async getQuote(params: ZeroXQuoteParams): Promise<ZeroXQuote> {
    const searchParams = new URLSearchParams({
      chainId: params.chainId.toString(),
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      sellAmount: params.sellAmount,
      taker: params.taker,
    });

    // Add revenue fee parameters if provided, otherwise use defaults
    if (params.feeRecipient || REVENUE_CONFIG.REVENUE_WALLET) {
      searchParams.append('feeRecipient', params.feeRecipient || REVENUE_CONFIG.REVENUE_WALLET);
      searchParams.append('buyTokenPercentageFee', (params.feeBps || REVENUE_CONFIG.FEE_BASIS_POINTS).toString());
    }

    const url = `${ZERO_X_BASE_URL}/swap/permit2/quote?${searchParams}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`0x API Error: ${response.status} - ${errorData}`);
    }

    return response.json();
  }

  static async getPrice(params: Omit<ZeroXQuoteParams, 'taker'>): Promise<{
    sellAmount: string;
    buyAmount: string;
    price: string;
  }> {
    const searchParams = new URLSearchParams({
      chainId: params.chainId.toString(),
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      sellAmount: params.sellAmount,
    });

    const url = `${ZERO_X_BASE_URL}/swap/permit2/price?${searchParams}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`0x API Error: ${response.status} - ${errorData}`);
    }

    return response.json();
  }
}

export default ZeroXService;