// src/api/coingate/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';

const COINGATE_API_KEY = 'zzwp6uzWzU6Zx6Txdf4htsNzAQzjQzzszqpp1sqr';
const COINGATE_API_URL = 'https://api.coingate.com/v2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      price_amount,
      price_currency,
      receive_currency,
      title,
      description,
      order_id,
      purchaser_email,
      success_url,
      cancel_url,
      callback_url,
    } = body;

    // Validate required fields
    if (!price_amount || !price_currency || !receive_currency || !order_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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
        title,
        description,
        order_id,
        purchaser_email,
        success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/coingate-callback`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('CoinGate API error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to create order' },
        { status: response.status }
      );
    }

    const order = await response.json();

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_id: order.order_id,
        status: order.status,
        price_amount: order.price_amount,
        price_currency: order.price_currency,
        receive_currency: order.receive_currency,
        payment_url: order.payment_url,
        created_at: order.created_at,
      },
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
