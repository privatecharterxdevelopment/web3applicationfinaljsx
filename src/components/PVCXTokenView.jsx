import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PVCXWithdrawalModal from './Modals/PVCXWithdrawalModal';

const PVCXTokenView = ({ user, onNavigate }) => {
  const [balance, setBalance] = useState(0);
  const [earnedFromBookings, setEarnedFromBookings] = useState(0);
  const [earnedFromCO2, setEarnedFromCO2] = useState(0);
  const [potentialEarnings, setPotentialEarnings] = useState({ km_reward: 0, co2_reward: 0, total_potential: 0 });
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Liquidity pool status (set to true when DEX listing is live)
  const isLiquidityPoolLive = false;

  useEffect(() => {
    if (user) {
      fetchPVCXBalance();
      fetchPotentialEarnings();
    }
  }, [user]);

  const fetchPVCXBalance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_pvcx_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setBalance(parseFloat(data.balance) || 0);
        setEarnedFromBookings(parseFloat(data.earned_from_bookings) || 0);
        setEarnedFromCO2(parseFloat(data.earned_from_co2) || 0);
      } else if (!error || error.code === 'PGRST116') {
        setBalance(0);
        setEarnedFromBookings(0);
        setEarnedFromCO2(0);
      }
    } catch (error) {
      console.error('Error fetching PVCX balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPotentialEarnings = async () => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_potential_pvcx_earnings', { p_user_id: user.id });

      if (data && data.length > 0) {
        setPotentialEarnings(data[0]);
      }
    } catch (error) {
      console.error('Error fetching potential earnings:', error);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">$PVCX Token</h1>
            <p className="text-sm text-gray-600 mt-1">Reward System & Tokenomics</p>
          </div>
          <img
            src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/Title-removebg-preview.png"
            alt="PVCX"
            className="w-16 h-16 object-contain opacity-80"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Reward Phase Active - Building to 1,000 Users
          </p>
          <p className="text-xs text-gray-700 leading-relaxed">
            Earn PVCX tokens through every booking and CO₂ certificate. Your balance is tracked securely.
            Once we reach 1,000 token holders, trading & withdrawals will be enabled on DEX (Uniswap).
          </p>
        </div>

        {/* Balance Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Balance</h2>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">Loading balance...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main Balance */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-2">Total Balance</p>
                <p className="text-5xl font-light text-gray-900 mb-1">
                  {balance.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </p>
                <p className="text-sm text-gray-500">$PVCX</p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">From Bookings</p>
                  <p className="text-2xl font-light text-gray-900">
                    {earnedFromBookings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">From CO₂ Certificates</p>
                  <p className="text-2xl font-light text-gray-900">
                    {earnedFromCO2.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Withdrawal Button */}
              {isLiquidityPoolLive ? (
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  disabled={balance <= 0}
                  className="w-full py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Request Withdrawal
                </button>
              ) : (
                <div className="text-center">
                  <button
                    disabled
                    className="w-full py-3 bg-gray-200 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
                  >
                    Withdrawals at 1,000 Users
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Trading & withdrawals enabled once milestone reached
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Earning Potential */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Earning Potential</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-2">Estimated Booking Rewards</p>
              <p className="text-2xl font-light text-gray-900 mb-1">
                {potentialEarnings.km_reward?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">Every km × 1.5 multiplier</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-2">Estimated CO₂ Rewards</p>
              <p className="text-2xl font-light text-gray-900 mb-1">
                {potentialEarnings.co2_reward?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">CO₂ tons saved × 2.0 multiplier</p>
            </div>
            <div className="bg-gray-900 text-white rounded-lg p-4">
              <p className="text-xs opacity-70 mb-2">Total Potential</p>
              <p className="text-2xl font-light mb-1">
                {potentialEarnings.total_potential?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs opacity-70">$PVCX</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 italic">
            * CO₂ rewards require admin certification
          </p>
        </div>

        {/* Token Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Token Information</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-xs text-gray-600 mb-1">Symbol</p>
                <p className="text-sm font-semibold text-gray-900">PVCX</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Supply</p>
                <p className="text-sm font-semibold text-gray-900">10,000,000</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Network</p>
                <p className="text-sm font-semibold text-gray-900">Ethereum</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Standard</p>
                <p className="text-sm font-semibold text-gray-900">ERC-20</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-600 mb-2">Contract Address</p>
              <div className="bg-gray-50 rounded px-3 py-2 text-center">
                <p className="text-xs text-gray-500">Available at 1,000 users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tokenomics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribution & Tokenomics</h2>
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Presale Investors</p>
                <p className="text-xs text-gray-600">Early backers & strategic partners</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">30% (3M)</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Customer Rewards</p>
                <p className="text-xs text-gray-600">Earned through platform usage</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">25% (2.5M)</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Operational Growth</p>
                <p className="text-xs text-gray-600">Team, marketing & development</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">45% (4.5M)</p>
            </div>
          </div>
        </div>

        {/* Reward Mechanics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">1. Book Services</p>
              <p className="text-xs text-gray-600">
                Every taxi/concierge or private jet booking earns you PVCX tokens based on distance traveled (km × 1.5).
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">2. Earn CO₂ Credits</p>
              <p className="text-xs text-gray-600">
                Get certified CO₂ savings from eco-friendly travel choices with 2x multiplier (tons × 2.0).
              </p>
            </div>
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 opacity-60">
              <p className="text-sm font-semibold text-gray-700 mb-2">3. Trade & Withdraw</p>
              <p className="text-xs text-gray-600">
                Available once we reach 1,000 token holders. Tokens will be tradable on Uniswap.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Contribution */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Impact</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Every booking generates 2% back in PVCX rewards, creating a self-reinforcing economy where platform
              growth directly drives token demand. With strategic distribution and customer incentives, PVCX transforms
              luxury travel from a transaction into an investment.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              In addition, 2% of every booking flows directly into verified NGO projects, ensuring that each journey
              delivers value to clients while making a meaningful global impact.
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <PVCXWithdrawalModal
          user={user}
          balance={balance}
          onClose={() => {
            setShowWithdrawalModal(false);
            fetchPVCXBalance();
          }}
        />
      )}
    </div>
  );
};

export default PVCXTokenView;
