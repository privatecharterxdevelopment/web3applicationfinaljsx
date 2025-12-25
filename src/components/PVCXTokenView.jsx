import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PVCXWithdrawalModal from './modals/PVCXWithdrawalModal';

const PVCX_LOGO = 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/privatecharterx_logo_stablecoin-removebg-preview.png';

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
    <div
      className="w-full h-full flex flex-col items-center justify-center px-6 py-12"
      style={{ fontFamily: "'Satoshi', sans-serif" }}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* Token Icon - Centered */}
          <div className="mb-8">
            <img
              src={PVCX_LOGO}
              alt="PVCX Token"
              className="w-28 h-28 object-contain"
            />
          </div>

          {/* Total Balance */}
          <div className="text-center mb-8">
            <p className="text-5xl font-light text-gray-900 tracking-tight mb-1">
              {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-400 font-light">$PVCX</p>
          </div>

          {/* Balance Breakdown */}
          <div className="w-full flex justify-center gap-8 mb-10">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Bookings</p>
              <p className="text-lg font-light text-gray-700">
                {earnedFromBookings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">CO2</p>
              <p className="text-lg font-light text-gray-700">
                {earnedFromCO2.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Withdraw Button */}
          {isLiquidityPoolLive ? (
            <button
              onClick={() => setShowWithdrawalModal(true)}
              disabled={balance <= 0}
              className="w-full py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Withdraw
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-xl cursor-not-allowed"
            >
              Withdrawals at 1,000 Users
            </button>
          )}

          {/* Minimal Footer Note */}
          <p className="text-[11px] text-gray-300 text-center mt-6">
            ERC-20 on Ethereum
          </p>
        </div>
      )}

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
