import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const API_KEY = Deno.env.get('EXCHANGERATE_API_KEY') || 'f51793adf9d3c8de77732b07';
const BASE_URL = 'https://v6.exchangerate-api.com/v6';
const CACHE_DURATION_HOURS = 24;

// Fallback rates if API fails
const FALLBACK_RATES = {
  GBP: 0.79,
  EUR: 0.92,
  CHF: 0.88,
  USD: 1,
};

interface ExchangeRates {
  GBP: number;
  EUR: number;
  CHF: number;
  USD: number;
  [key: string]: number;
}

interface CachedRates {
  rates: ExchangeRates;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check for cached rates in Supabase
    const { data: cachedData } = await supabaseAdmin
      .from('app_settings')
      .select('value, updated_at')
      .eq('key', 'exchange_rates')
      .single();

    // Check if cache is still valid (within 24 hours)
    if (cachedData?.value && cachedData?.updated_at) {
      const cacheAge = Date.now() - new Date(cachedData.updated_at).getTime();
      const cacheMaxAge = CACHE_DURATION_HOURS * 60 * 60 * 1000;

      if (cacheAge < cacheMaxAge) {
        console.log('Returning cached exchange rates');
        return new Response(JSON.stringify({
          success: true,
          rates: cachedData.value,
          cached: true,
          cachedAt: cachedData.updated_at
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Fetch fresh rates from API
    console.log('Fetching fresh exchange rates from API');
    const response = await fetch(`${BASE_URL}/${API_KEY}/latest/USD`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.result !== 'success' || !data.conversion_rates) {
      throw new Error('Invalid API response');
    }

    const rates: ExchangeRates = {
      GBP: data.conversion_rates.GBP || FALLBACK_RATES.GBP,
      EUR: data.conversion_rates.EUR || FALLBACK_RATES.EUR,
      CHF: data.conversion_rates.CHF || FALLBACK_RATES.CHF,
      USD: 1,
    };

    console.log('Exchange rates fetched:', rates);

    // Cache rates in Supabase
    const { error: upsertError } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        key: 'exchange_rates',
        value: rates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (upsertError) {
      console.error('Error caching rates:', upsertError);
      // Continue anyway, just won't be cached
    }

    return new Response(JSON.stringify({
      success: true,
      rates,
      cached: false,
      fetchedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching exchange rates:', error);

    // Return fallback rates on error
    return new Response(JSON.stringify({
      success: true,
      rates: FALLBACK_RATES,
      cached: false,
      fallback: true,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
