// src/stripe.js
import { loadStripe } from '@stripe/stripe-js';

let stripePromise;

async function initStripe(publishableKey) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

export async function getStripe(publishableKey) {
  const stripe = await initStripe(publishableKey);
  return stripe;
}