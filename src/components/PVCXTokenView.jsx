import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PVCXWithdrawalModal from './modals/PVCXWithdrawalModal';

const PVCXTokenView = ({ user, onNavigate }) => {
  const [balance, setBalance] = useState(0);
  const [earnedFromBookings, setEarnedFromBookings] = useState(0);
  const [earnedFromCO2, setEarnedFromCO2] = useState(0);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Liquidity pool status (set to true when DEX listing is live)
  const isLiquidityPoolLive = false;

  useEffect(() => {
    if (user) {
      fetchPVCXBalance();
    }
  }, [user]);

  const fetchPVCXBalance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pvcx_balance')
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

  return (
    <div className="w-full h-full overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight">PVCX Token</h1>
          <img
            src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/Title-removebg-preview.png"
            alt="PVCX"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain opacity-80"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 space-y-6">
        {/* Balance Card */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Main Balance */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-500 mb-2">Total Balance</p>
              <p className="text-4xl sm:text-5xl font-light text-gray-900 tracking-tight">
                {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-400 mt-1">$PVCX</p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">From Bookings</p>
                <p className="text-lg sm:text-xl font-light text-gray-900">
                  {earnedFromBookings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">From CO₂</p>
                <p className="text-lg sm:text-xl font-light text-gray-900">
                  {earnedFromCO2.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Withdrawal Button */}
            {isLiquidityPoolLive ? (
              <button
                onClick={() => setShowWithdrawalModal(true)}
                disabled={balance <= 0}
                className="w-full py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Request Withdrawal
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-xl cursor-not-allowed"
              >
                Withdrawals at 1,000 Users
              </button>
            )}
          </>
        )}

        {/* Token Info - Minimal */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Symbol</p>
              <p className="text-sm font-medium text-gray-900">PVCX</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Supply</p>
              <p className="text-sm font-medium text-gray-900">10M</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Network</p>
              <p className="text-sm font-medium text-gray-900">Ethereum</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Standard</p>
              <p className="text-sm font-medium text-gray-900">ERC-20</p>
            </div>
          </div>
        </div>

        {/* How to Earn - Simple */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">How to Earn</h3>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</div>
              <p className="text-sm text-gray-600">Book flights, transfers, or concierge services</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</div>
              <p className="text-sm text-gray-600">Earn PVCX rewards based on distance traveled</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</div>
              <p className="text-sm text-gray-400">Trade on DEX once milestone is reached</p>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-gray-400 text-center pt-2">
          Trading & withdrawals enabled at 1,000 token holders
        </p>
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
