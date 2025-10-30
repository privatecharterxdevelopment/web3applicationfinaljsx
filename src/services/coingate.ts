// src/services/coingate.ts
// CoinGate Crypto Payment Gateway Integration

const COINGATE_API_KEY = 'zzwp6uzWzU6Zx6Txdf4htsNzAQzjQzzszqpp1sqr';
// Use sandbox for testing to avoid CORS issues
const COINGATE_API_URL = 'https://api-sandbox.coingate.com/v2';

export interface CoinGateOrder {
  id: number;
  status: string;
  price_amount: number;
  price_currency: string;
  receive_currency: string;
  pay_currency?: string;
  pay_amount?: string;
  payment_url: string;
  created_at: string;
  order_id: string;
  token?: string;
}

export interface CreateOrderParams {
  price_amount: number;
  price_currency: string; // USD, EUR, etc.
  receive_currency: string; // BTC, ETH, USDT, etc.
  title: string;
  description?: string;
  order_id: string; // Unique order ID from your system
  callback_url?: string;
  cancel_url?: string;
  success_url?: string;
  purchaser_email?: string;
}

class CoinGateService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = COINGATE_API_KEY;
    this.apiUrl = COINGATE_API_URL;
  }

  /**
   * Create a new payment order
   */
  async createOrder(params: CreateOrderParams): Promise<CoinGateOrder> {
    try {
      const response = await fetch(`${this.apiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create CoinGate order');
      }

      const order: CoinGateOrder = await response.json();
      return order;
    } catch (error) {
      console.error('CoinGate createOrder error:', error);
      throw error;
    }
  }

  /**
   * Get order status
   */
  async getOrder(orderId: number): Promise<CoinGateOrder> {
    try {
      const response = await fetch(`${this.apiUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch order');
      }

      const order: CoinGateOrder = await response.json();
      return order;
    } catch (error) {
      console.error('CoinGate getOrder error:', error);
      throw error;
    }
  }

  /**
   * Check if order is paid
   */
  isOrderPaid(status: string): boolean {
    return status === 'paid' || status === 'confirmed';
  }

  /**
   * Get user-friendly status
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'new': 'Awaiting Payment',
      'pending': 'Payment Processing',
      'confirming': 'Confirming Payment',
      'paid': 'Paid Successfully',
      'confirmed': 'Payment Confirmed',
      'invalid': 'Payment Invalid',
      'expired': 'Payment Expired',
      'canceled': 'Payment Canceled',
      'refunded': 'Payment Refunded',
    };
    return statusMap[status] || status;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'new': 'blue',
      'pending': 'yellow',
      'confirming': 'orange',
      'paid': 'green',
      'confirmed': 'green',
      'invalid': 'red',
      'expired': 'gray',
      'canceled': 'gray',
      'refunded': 'purple',
    };
    return colorMap[status] || 'gray';
  }
}

export const coinGateService = new CoinGateService();
