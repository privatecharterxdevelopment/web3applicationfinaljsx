-- Migration: Create enhanced dashboard functions for Profile Overview v2
-- Provides lifetime chart data and comprehensive dashboard metrics

-- =====================================================
-- FUNCTION 1: Get Lifetime Chart Data
-- =====================================================
-- Returns daily aggregated data from user registration date to today
-- Used for multi-line chart showing portfolio value, booking revenue, PVCX balance, and activity

CREATE OR REPLACE FUNCTION get_lifetime_chart_data(p_user_id UUID)
RETURNS TABLE(
  date DATE,
  portfolio_value NUMERIC,
  booking_revenue NUMERIC,
  pvcx_balance NUMERIC,
  transaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH user_registration AS (
    -- Get user registration date
    SELECT created_at::DATE as reg_date
    FROM auth.users
    WHERE id = p_user_id
  ),
  date_series AS (
    -- Generate series of dates from registration to today
    SELECT generate_series(
      (SELECT reg_date FROM user_registration),
      CURRENT_DATE,
      '1 day'::interval
    )::DATE as series_date
  ),
  daily_transactions AS (
    -- Aggregate transaction volume by date (Web3 + Fiat)
    SELECT
      created_at::DATE as tx_date,
      COUNT(*) as tx_count,
      SUM(CASE
        WHEN currency = 'USD' THEN amount
        WHEN currency = 'EUR' THEN amount * 1.1 -- EUR to USD conversion
        ELSE 0
      END) as volume_usd
    FROM transactions
    WHERE user_id = p_user_id
      AND status = 'completed'
      AND created_at IS NOT NULL
    GROUP BY created_at::DATE
  ),
  daily_bookings AS (
    -- Aggregate booking revenue by date
    SELECT
      created_at::DATE as booking_date,
      SUM(total_price) as revenue_eur
    FROM booking_requests
    WHERE user_id = p_user_id
      AND status IN ('pending', 'confirmed', 'completed')
      AND created_at IS NOT NULL
    GROUP BY created_at::DATE

    UNION ALL

    -- Also include user_requests bookings
    SELECT
      created_at::DATE as booking_date,
      SUM(COALESCE((data->>'total_price')::NUMERIC, 0)) as revenue_eur
    FROM user_requests
    WHERE user_id = p_user_id
      AND type IN ('private_jet_charter', 'helicopter_charter', 'empty_leg', 'adventure_package', 'luxury_car_rental')
      AND status IN ('pending', 'approved', 'completed')
      AND created_at IS NOT NULL
      AND data->>'total_price' IS NOT NULL
    GROUP BY created_at::DATE
  ),
  daily_pvcx AS (
    -- Aggregate PVCX balance changes by date
    SELECT
      created_at::DATE as pvcx_date,
      SUM(amount) as pvcx_change
    FROM pvcx_transactions
    WHERE user_id = p_user_id
      AND created_at IS NOT NULL
    GROUP BY created_at::DATE
  ),
  cumulative_data AS (
    -- Calculate cumulative values
    SELECT
      ds.series_date as date,
      COALESCE(SUM(dt.volume_usd) OVER (ORDER BY ds.series_date), 0) as portfolio_value,
      COALESCE(SUM(db.revenue_eur) OVER (ORDER BY ds.series_date), 0) as booking_revenue,
      COALESCE(SUM(dp.pvcx_change) OVER (ORDER BY ds.series_date), 0) as pvcx_balance,
      COALESCE(SUM(dt.tx_count) OVER (ORDER BY ds.series_date), 0) as transaction_count
    FROM date_series ds
    LEFT JOIN daily_transactions dt ON ds.series_date = dt.tx_date
    LEFT JOIN daily_bookings db ON ds.series_date = db.booking_date
    LEFT JOIN daily_pvcx dp ON ds.series_date = dp.pvcx_date
  )
  SELECT * FROM cumulative_data
  ORDER BY date;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCTION 2: Get Enhanced Dashboard Metrics
-- =====================================================
-- Returns aggregated metrics for all 6 dashboard cards
-- Includes transactions, bookings, tokenization, DAOs, PVCX, and CO2 impact

CREATE OR REPLACE FUNCTION get_enhanced_dashboard_metrics(p_user_id UUID)
RETURNS TABLE(
  -- Card 1: Total Transactions
  web3_transactions BIGINT,
  fiat_transactions BIGINT,
  total_transaction_volume NUMERIC,

  -- Card 2: RWS Bookings
  total_bookings BIGINT,
  booking_revenue NUMERIC,
  pending_bookings BIGINT,

  -- Card 3: Tokenization Projects
  tokenization_projects BIGINT,
  active_tokens BIGINT,
  total_token_value NUMERIC,

  -- Card 4: DAO Participation
  dao_count BIGINT,
  total_governance_tokens BIGINT,
  active_proposals BIGINT,

  -- Card 5: PVCX Rewards
  pvcx_balance NUMERIC,
  pvcx_earned_total NUMERIC,
  pvcx_from_bookings NUMERIC,
  pvcx_from_referrals NUMERIC,

  -- Card 6: CO2 Impact
  tons_offset NUMERIC,
  co2_certificates BIGINT,
  total_co2_investment NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Card 1: Transactions (Web3 + Fiat)
    (SELECT COUNT(*)
     FROM transactions
     WHERE user_id = p_user_id
       AND category IN ('wallet_signature', 'crypto', 'nft_purchase', 'token_purchase')
       AND status = 'completed'
    ) as web3_transactions,

    (SELECT COUNT(*)
     FROM transactions
     WHERE user_id = p_user_id
       AND category IN ('booking', 'service', 'subscription', 'payment')
       AND status = 'completed'
    ) as fiat_transactions,

    (SELECT COALESCE(SUM(CASE
       WHEN currency = 'USD' THEN amount
       WHEN currency = 'EUR' THEN amount * 1.1
       ELSE amount
     END), 0)
     FROM transactions
     WHERE user_id = p_user_id
       AND status = 'completed'
    ) as total_transaction_volume,

    -- Card 2: RWS Bookings
    (SELECT COUNT(*)
     FROM booking_requests
     WHERE user_id = p_user_id
    ) + (SELECT COUNT(*)
     FROM user_requests
     WHERE user_id = p_user_id
       AND type IN ('private_jet_charter', 'helicopter_charter', 'empty_leg', 'adventure_package', 'luxury_car_rental', 'event_booking')
    ) as total_bookings,

    (SELECT COALESCE(SUM(total_price), 0)
     FROM booking_requests
     WHERE user_id = p_user_id
    ) + (SELECT COALESCE(SUM((data->>'total_price')::NUMERIC), 0)
     FROM user_requests
     WHERE user_id = p_user_id
       AND type IN ('private_jet_charter', 'helicopter_charter', 'empty_leg', 'adventure_package', 'luxury_car_rental')
       AND data->>'total_price' IS NOT NULL
    ) as booking_revenue,

    (SELECT COUNT(*)
     FROM booking_requests
     WHERE user_id = p_user_id
       AND status = 'pending'
    ) + (SELECT COUNT(*)
     FROM user_requests
     WHERE user_id = p_user_id
       AND type IN ('private_jet_charter', 'helicopter_charter', 'empty_leg', 'adventure_package', 'luxury_car_rental')
       AND status = 'pending'
    ) as pending_bookings,

    -- Card 3: Tokenization Projects
    (SELECT COUNT(*)
     FROM tokenization_drafts
     WHERE user_id = p_user_id
    ) as tokenization_projects,

    (SELECT COUNT(*)
     FROM tokenization_drafts
     WHERE user_id = p_user_id
       AND status IN ('approved', 'deployed')
    ) as active_tokens,

    (SELECT COALESCE(SUM(asset_value), 0)
     FROM tokenization_drafts
     WHERE user_id = p_user_id
       AND status IN ('approved', 'deployed')
    ) as total_token_value,

    -- Card 4: DAO Participation
    (SELECT COUNT(DISTINCT dao_id)
     FROM dao_members
     WHERE user_id = p_user_id
    ) as dao_count,

    (SELECT COALESCE(SUM(token_balance), 0)
     FROM dao_members
     WHERE user_id = p_user_id
    ) as total_governance_tokens,

    (SELECT COUNT(*)
     FROM dao_proposals
     WHERE dao_id IN (
       SELECT dao_id FROM dao_members WHERE user_id = p_user_id
     ) AND status = 'active'
    ) as active_proposals,

    -- Card 5: PVCX Rewards
    (SELECT COALESCE(SUM(CASE
       WHEN transaction_type = 'credit' THEN amount
       WHEN transaction_type = 'debit' THEN -amount
       ELSE 0
     END), 0)
     FROM pvcx_transactions
     WHERE user_id = p_user_id
    ) as pvcx_balance,

    (SELECT COALESCE(SUM(amount), 0)
     FROM pvcx_transactions
     WHERE user_id = p_user_id
       AND transaction_type = 'credit'
    ) as pvcx_earned_total,

    (SELECT COALESCE(SUM(amount), 0)
     FROM pvcx_transactions
     WHERE user_id = p_user_id
       AND transaction_type = 'credit'
       AND description LIKE '%booking%'
    ) as pvcx_from_bookings,

    (SELECT COALESCE(SUM(amount), 0)
     FROM pvcx_transactions
     WHERE user_id = p_user_id
       AND transaction_type = 'credit'
       AND description LIKE '%referral%'
    ) as pvcx_from_referrals,

    -- Card 6: CO2 Impact
    (SELECT COALESCE(SUM((data->>'tons')::NUMERIC), 0)
     FROM user_requests
     WHERE user_id = p_user_id
       AND type = 'co2_certificate'
       AND data->>'tons' IS NOT NULL
    ) as tons_offset,

    (SELECT COUNT(*)
     FROM user_requests
     WHERE user_id = p_user_id
       AND type = 'co2_certificate'
       AND status IN ('approved', 'completed')
    ) as co2_certificates,

    (SELECT COALESCE(SUM((data->>'amount')::NUMERIC), 0)
     FROM user_requests
     WHERE user_id = p_user_id
       AND type = 'co2_certificate'
       AND data->>'amount' IS NOT NULL
    ) as total_co2_investment;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_lifetime_chart_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_enhanced_dashboard_metrics(UUID) TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON FUNCTION get_lifetime_chart_data(UUID) IS 'Returns daily chart data from user registration to today for multi-line dashboard chart';
COMMENT ON FUNCTION get_enhanced_dashboard_metrics(UUID) IS 'Returns comprehensive metrics for 6 dashboard cards: Transactions, Bookings, Tokenization, DAOs, PVCX, CO2';
