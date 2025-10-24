import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';
import { logger } from '../utils/logger';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentOptions {
  offerId: string;
  offerType: 'fixed_offer' | 'empty_leg' | 'visa';
  price: number;
  currency: string;
  title: string;
}

export const createCheckoutSession = async (options: PaymentOptions) => {
  try {
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const { sessionId } = await response.json();
    
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe failed to load');

    return stripe.redirectToCheckout({ sessionId });
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    throw error;
  }
};

export const processWeb3Payment = async (
  offerId: string,
  offerType: 'fixed_offer' | 'empty_leg' | 'visa',
  amount: number,
  currency: string,
  walletAddress: string,
  transactionHash: string
) => {
  try {
    // Record payment in database
    const { error: paymentError } = await supabase
      .from('payments')
      .insert([{
        offer_id: offerId,
        offer_type: offerType,
        amount,
        currency,
        payment_method: 'crypto',
        status: 'pending',
        transaction_hash: transactionHash
      }]);

    if (paymentError) throw paymentError;

    // Update offer status
    if (offerType !== 'visa') {
      const { error: offerError } = await supabase
        .from('fixed_offers')
        .update({ status: 'payment_pending' })
        .eq('id', offerId);

      if (offerError) throw offerError;
    }

    return { success: true };
  } catch (error) {
    logger.error('Error processing Web3 payment:', error);
    throw error;
  }
};

// Process crypto payment using Web3
export const processCryptoPayment = async (
  offerId: string,
  offerType: 'fixed_offer' | 'empty_leg' | 'visa',
  priceInEth: number,
  walletAddress: string
) => {
  try {
    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        offer_id: offerId,
        offer_type: offerType,
        amount: priceInEth,
        currency: 'ETH',
        payment_method: 'crypto',
        status: 'pending',
        wallet_address: walletAddress
      }])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Return payment details
    return {
      success: true,
      paymentId: payment.id,
      amount: priceInEth,
      currency: 'ETH',
      walletAddress
    };
  } catch (error) {
    logger.error('Error processing crypto payment:', error);
    throw error;
  }
};

// Send payment request via email
export const sendPaymentRequest = async (
  offerId: string,
  offerType: 'fixed_offer' | 'empty_leg' | 'visa',
  userEmail: string,
  details: {
    name: string;
    phone?: string;
    message?: string;
  }
) => {
  try {
    // Create payment request record
    const { error: requestError } = await supabase
      .from('payment_requests')
      .insert([{
        offer_id: offerId,
        offer_type: offerType,
        user_email: userEmail,
        status: 'pending',
        details
      }]);

    if (requestError) throw requestError;

    // Send notification to admin
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([{
        type: 'payment_request',
        title: 'New Payment Request',
        message: `New payment request from ${details.name} for ${offerType}`,
        read: false
      }]);

    if (notificationError) throw notificationError;

    return { success: true };
  } catch (error) {
    logger.error('Error sending payment request:', error);
    throw error;
  }
};