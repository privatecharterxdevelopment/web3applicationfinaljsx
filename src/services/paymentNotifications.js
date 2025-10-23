import { supabase } from '../lib/supabase';

/**
 * Admin function to send payment link notification to user
 * @param {string} userId - User UUID
 * @param {string} requestId - Request UUID
 * @param {number} amount - Payment amount
 * @param {string} currency - Currency code (EUR, USD, etc.)
 * @param {string} paymentUrl - Payment link URL
 * @param {string} description - Optional custom message
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
export async function sendPaymentLinkNotification({
  userId,
  requestId,
  amount,
  currency = 'EUR',
  paymentUrl,
  description = null
}) {
  try {
    // Call the database function
    const { data, error } = await supabase.rpc('send_payment_link_notification', {
      p_user_id: userId,
      p_request_id: requestId,
      p_amount: amount,
      p_currency: currency,
      p_payment_url: paymentUrl,
      p_description: description
    });

    if (error) throw error;

    return {
      success: true,
      notificationId: data
    };
  } catch (error) {
    console.error('Error sending payment link notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Admin function to confirm request and optionally send payment link
 * @param {string} requestId - Request UUID
 * @param {object} paymentDetails - Optional payment details
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function confirmRequestWithPayment(requestId, paymentDetails = null) {
  try {
    // Update request status to confirmed
    const { data: request, error: updateError } = await supabase
      .from('requests')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select('user_id')
      .single();

    if (updateError) throw updateError;

    // If payment details provided, send payment link
    if (paymentDetails && request) {
      await sendPaymentLinkNotification({
        userId: request.user_id,
        requestId: requestId,
        ...paymentDetails
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error confirming request:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Example usage in admin panel:
 *
 * // Confirm request and send payment link
 * const result = await confirmRequestWithPayment('request-uuid', {
 *   amount: 5000,
 *   currency: 'EUR',
 *   paymentUrl: 'https://pay.stripe.com/invoice/...',
 *   description: 'Payment for private jet charter - Geneva to Monaco'
 * });
 *
 * if (result.success) {
 *   alert('Request confirmed and payment link sent!');
 * }
 */
