/**
 * CoinGate API Handler
 * Handles cryptocurrency payment order creation
 */

const COINGATE_API_KEY = 'zzwp6uzWzU6Zx6Txdf4htsNzAQzjQzzszqpp1sqr';
const COINGATE_API_URL = 'https://api.coingate.com/v2';

/**
 * Create a CoinGate payment order
 * POST /api/coingate/create-order
 */
async function createOrder(req, res) {
  try {
    const {
      price_amount,
      price_currency,
      receive_currency,
      title,
      description,
      order_id,
      purchaser_email
    } = req.body;

    // Validate required fields
    if (!price_amount || !price_currency || !receive_currency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: price_amount, price_currency, receive_currency'
      });
    }

    console.log('Creating CoinGate order:', {
      price_amount,
      price_currency,
      receive_currency,
      order_id
    });

    // Get app URL from environment or use defaults
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Create order with CoinGate API
    const response = await fetch(`${COINGATE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${COINGATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount,
        price_currency,
        receive_currency,
        title: title || 'PrivateCharterX Payment',
        description: description || 'Payment for PrivateCharterX services',
        order_id: order_id || `ORDER-${Date.now()}`,
        purchaser_email,
        success_url: `${appUrl}/dashboard`,
        cancel_url: `${appUrl}/dashboard`,
        callback_url: `${appUrl}/api/coingate-callback`,
      }),
    });

    const data = await response.json();

    // Check if CoinGate API returned an error
    if (!response.ok) {
      console.error('CoinGate API error:', data);
      return res.status(response.status).json({
        success: false,
        error: data.message || 'CoinGate API error',
        details: data
      });
    }

    console.log('CoinGate order created successfully:', data.id);

    // Return successful response
    return res.json({
      success: true,
      order: {
        id: data.id,
        order_id: data.order_id,
        status: data.status,
        payment_url: data.payment_url,
        created_at: data.created_at,
        price_amount: data.price_amount,
        price_currency: data.price_currency,
        receive_currency: data.receive_currency,
      },
    });
  } catch (error) {
    console.error('Error creating CoinGate order:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

module.exports = {
  createOrder
};
