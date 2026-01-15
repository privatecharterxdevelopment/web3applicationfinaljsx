import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// CoinGate webhook payload interface
interface CoinGateWebhook {
  id: number;
  order_id: string; // Our booking ID
  status: 'new' | 'pending' | 'confirming' | 'paid' | 'invalid' | 'expired' | 'canceled' | 'refunded';
  price_amount: string;
  price_currency: string;
  receive_amount: string;
  receive_currency: string;
  pay_amount: string;
  pay_currency: string;
  underpaid_amount?: string;
  overpaid_amount?: string;
  is_refundable?: boolean;
  token?: string;
  created_at?: string;
  expire_at?: string;
  payment_url?: string;
  payment_address?: string;
  transaction_id?: string; // Blockchain transaction hash
}

// Map CoinGate status to our payment_status
function mapCoingateStatus(coingateStatus: string): string {
  const statusMap: Record<string, string> = {
    'new': 'pending',
    'pending': 'pending',
    'confirming': 'confirming',
    'paid': 'paid',
    'invalid': 'failed',
    'expired': 'expired',
    'canceled': 'cancelled',
    'refunded': 'refunded'
  };
  return statusMap[coingateStatus] || 'pending';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Always return 200 to CoinGate (even on errors - just log them)
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse webhook payload
    let webhookData: CoinGateWebhook;

    // CoinGate can send as form data or JSON
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      webhookData = {
        id: parseInt(formData.get('id') as string),
        order_id: formData.get('order_id') as string,
        status: formData.get('status') as CoinGateWebhook['status'],
        price_amount: formData.get('price_amount') as string,
        price_currency: formData.get('price_currency') as string,
        receive_amount: formData.get('receive_amount') as string,
        receive_currency: formData.get('receive_currency') as string,
        pay_amount: formData.get('pay_amount') as string,
        pay_currency: formData.get('pay_currency') as string,
        underpaid_amount: formData.get('underpaid_amount') as string,
        overpaid_amount: formData.get('overpaid_amount') as string,
        token: formData.get('token') as string,
        payment_address: formData.get('payment_address') as string,
        transaction_id: formData.get('transaction_id') as string
      };
    } else {
      webhookData = await req.json();
    }

    console.log('CoinGate webhook received:', {
      id: webhookData.id,
      order_id: webhookData.order_id,
      status: webhookData.status,
      pay_amount: webhookData.pay_amount,
      pay_currency: webhookData.pay_currency
    });

    // Validate required fields
    if (!webhookData.order_id || !webhookData.status) {
      console.error('Missing required webhook fields');
      return new Response(JSON.stringify({ status: 'ok', message: 'Missing fields' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find booking by order_id (which is our booking ID)
    const { data: booking, error: findError } = await supabaseAdmin
      .from('user_bookings')
      .select('*')
      .eq('id', webhookData.order_id)
      .single();

    if (findError || !booking) {
      // Try finding by coingate_order_id
      const { data: bookingByOrderId, error: findError2 } = await supabaseAdmin
        .from('user_bookings')
        .select('*')
        .eq('coingate_order_id', webhookData.id.toString())
        .single();

      if (findError2 || !bookingByOrderId) {
        console.error('Booking not found for order:', webhookData.order_id, webhookData.id);
        return new Response(JSON.stringify({ status: 'ok', message: 'Booking not found' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Use the booking found by coingate_order_id
      Object.assign(booking, bookingByOrderId);
    }

    // Map status
    const newPaymentStatus = mapCoingateStatus(webhookData.status);
    const previousStatus = booking.payment_status;

    console.log(`Updating booking ${booking.id}: ${previousStatus} → ${newPaymentStatus}`);

    // Prepare update data
    const updateData: Record<string, any> = {
      payment_status: newPaymentStatus,
      crypto_currency: webhookData.pay_currency,
      crypto_amount: webhookData.pay_amount ? parseFloat(webhookData.pay_amount) : null,
      crypto_amount_received: webhookData.receive_amount ? parseFloat(webhookData.receive_amount) : null,
      transaction_hash: webhookData.transaction_id,
      metadata: {
        ...booking.metadata,
        coingate_status: webhookData.status,
        coingate_last_update: new Date().toISOString(),
        payment_address: webhookData.payment_address,
        underpaid_amount: webhookData.underpaid_amount,
        overpaid_amount: webhookData.overpaid_amount
      }
    };

    // Set timestamps based on status
    if (newPaymentStatus === 'paid' && previousStatus !== 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    if (newPaymentStatus === 'cancelled' || newPaymentStatus === 'expired') {
      updateData.cancelled_at = new Date().toISOString();
    }

    // Update booking - THIS TRIGGERS credit_pvcx_on_booking_confirmation() when status becomes 'paid'!
    const { error: updateError } = await supabaseAdmin
      .from('user_bookings')
      .update(updateData)
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return new Response(JSON.stringify({ status: 'ok', message: 'Update failed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle commercial flight bookings - create actual Duffel order after payment
    if (newPaymentStatus === 'paid' && previousStatus !== 'paid' && (booking.booking_type === 'commercial_flight' || booking.booking_type === 'flight')) {
      console.log('Processing commercial flight booking - creating Duffel order...');

      try {
        // Flight data is stored as flight_data (underscore) in metadata
        const flightData = booking.metadata?.flight_data || booking.metadata?.flightData;
        const offerId = booking.metadata?.duffel_offer_id || flightData?.offerId || booking.service_id;
        const passengers = booking.metadata?.passengers || flightData?.passengers || [];

        if (offerId && passengers.length > 0) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

          // Call create-flight-order to book with Duffel
          const selectedSeats = booking.metadata?.selected_seats || flightData?.selectedSeats || [];

          const orderResponse = await fetch(`${supabaseUrl}/functions/v1/create-flight-order`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              offerId: offerId,
              passengers: passengers.map((p: any) => ({
                type: 'adult',
                givenName: p.givenName,
                familyName: p.familyName,
                gender: p.gender,
                email: p.email || booking.contact_email,
                phone: booking.contact_phone,
                bornOn: p.bornOn
              })),
              userId: booking.user_id,
              email: booking.contact_email,
              phone: booking.contact_phone,
              selectedSeats: selectedSeats,
              metadata: {
                coingate_booking_id: booking.id,
                payment_confirmed: true
              }
            })
          });

          const orderResult = await orderResponse.json();

          if (orderResult.success && orderResult.order) {
            console.log(`Duffel order created: ${orderResult.order.id}, PNR: ${orderResult.order.bookingReference}`);

            // Update booking with Duffel order details
            await supabaseAdmin
              .from('user_bookings')
              .update({
                booking_status: 'confirmed',
                metadata: {
                  ...booking.metadata,
                  duffel_order_id: orderResult.order.id,
                  booking_reference: orderResult.order.bookingReference,
                  duffel_order_status: orderResult.order.status,
                  duffel_documents: orderResult.order.documents,
                  flight_booked_at: new Date().toISOString()
                }
              })
              .eq('id', booking.id);

            console.log('Flight booking confirmed with PNR:', orderResult.order.bookingReference);
          } else {
            console.error('Failed to create Duffel order:', orderResult.error);
            // Mark booking as needing manual intervention
            await supabaseAdmin
              .from('user_bookings')
              .update({
                booking_status: 'pending_manual',
                metadata: {
                  ...booking.metadata,
                  duffel_error: orderResult.error,
                  needs_manual_booking: true
                }
              })
              .eq('id', booking.id);
          }
        } else {
          console.error('Missing flight data for commercial flight booking:', {
            offerId,
            passengersCount: passengers.length,
            metadata: JSON.stringify(booking.metadata)
          });
        }
      } catch (flightError) {
        console.error('Error creating Duffel flight order:', flightError);
      }
    }

    // Record transaction in booking_transactions
    if (newPaymentStatus === 'paid' && previousStatus !== 'paid') {
      const { error: txError } = await supabaseAdmin
        .from('booking_transactions')
        .insert({
          booking_id: booking.id,
          user_id: booking.user_id,
          transaction_type: 'payment',
          amount: parseFloat(webhookData.price_amount),
          currency: webhookData.price_currency,
          crypto_amount: webhookData.pay_amount ? parseFloat(webhookData.pay_amount) : null,
          crypto_currency: webhookData.pay_currency,
          transaction_hash: webhookData.transaction_id,
          coingate_order_id: webhookData.id.toString(),
          coingate_status: webhookData.status,
          status: 'completed',
          description: `Payment for ${booking.service_title}`,
          metadata: {
            receive_amount: webhookData.receive_amount,
            receive_currency: webhookData.receive_currency,
            payment_address: webhookData.payment_address
          },
          confirmed_at: new Date().toISOString()
        });

      if (txError) {
        console.error('Error recording transaction:', txError);
      }

      // Send booking confirmation email
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Get user details
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('first_name, last_name, email')
          .eq('id', booking.user_id)
          .single();

        await fetch(`${supabaseUrl}/functions/v1/booking-confirmation-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bookingId: booking.id,
            userEmail: user?.email || booking.contact_email,
            userName: user?.first_name || booking.contact_name || 'Valued Customer',
            serviceTitle: booking.service_title,
            serviceType: booking.booking_type,
            totalAmount: booking.total_amount,
            currency: booking.currency,
            cryptoAmount: webhookData.pay_amount,
            cryptoCurrency: webhookData.pay_currency,
            transactionHash: webhookData.transaction_id,
            pvcxReward: booking.total_amount * 0.015 // 1.5% reward
          })
        });

        console.log('Booking confirmation email sent');
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the webhook for email errors
      }
    }

    console.log(`Webhook processed successfully for booking ${booking.id}`);

    return new Response(JSON.stringify({
      status: 'ok',
      bookingId: booking.id,
      paymentStatus: newPaymentStatus
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Always return 200 to CoinGate
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Error logged',
      error: error.message
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
