/**
 * Referral Card Component
 * 
 * Displays referral stats, progress, and share link
 * Compact version for sidebar
 */

import React, { useState, useEffect } from 'react';
import { Gift, Users, Copy, Check, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ReferralCard = ({ compact = false }) => {
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({
    total_referrals: 0,
    completed_referrals: 0,
    rewarded_referrals: 0,
    pending_referrals: 0,
    total_rewards_earned: 0
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create referral code
      const code = await getOrCreateReferralCode(user.id);
      setReferralCode(code);

      // Get referral stats
      const { data, error } = await supabase
        .rpc('get_referral_stats', { user_uuid: user.id });

      if (!error && data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateReferralCode = async (userId) => {
    // Check if user already has a code
    const { data: existing } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_user_id', userId)
      .limit(1)
      .single();

    if (existing?.referral_code) {
      return existing.referral_code;
    }

    // Generate new code (6 characters: PCX + 3 random chars)
    const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
    const newCode = `PCX${randomChars}`;

    // Create initial referral record
    await supabase.from('referrals').insert({
      referrer_user_id: userId,
      referral_code: newCode,
      status: 'pending'
    });

    return newCode;
  };

  const getReferralLink = () => {
    return `${window.location.origin}/?ref=${referralCode}`;
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getProgressToBonus = () => {
    // 5 successful referrals = 50% off next month
    const target = 5;
    const current = stats.completed_referrals;
    const percentage = Math.min((current / target) * 100, 100);
    return { current, target, percentage };
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 animate-pulse">
        <div className="h-24 bg-white/10 rounded-lg" />
      </div>
    );
  }

  const progress = getProgressToBonus();

  // Compact version for sidebar
  if (compact) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Gift className="w-5 h-5 text-pink-400" />
            <div>
              <div className="text-sm font-bold text-white">Referral Program</div>
              <div className="text-xs text-gray-400">
                {stats.completed_referrals} successful
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Progress to 50% bonus</span>
            <span className="font-semibold">{progress.current}/{progress.target}</span>
          </div>
          <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Copy Referral Link - Black Button */}
        <button
          onClick={copyReferralLink}
          className="w-full bg-black hover:bg-black/80 text-white py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-2 border border-white/10"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Full version for dedicated page
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Referral Program</h3>
          <p className="text-gray-400 text-sm">Earn rewards by inviting friends</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Total Referrals</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.total_referrals}</div>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Successful</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.completed_referrals}</div>
        </div>
      </div>

      {/* Progress to Bonus */}
      <div className="bg-white/5 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">Progress to 50% Bonus</span>
          <span className="text-sm font-bold text-pink-400">
            {progress.current}/{progress.target}
          </span>
        </div>
        <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">
          Refer {progress.target - progress.current} more friend{progress.target - progress.current !== 1 ? 's' : ''} to get 50% off your next month!
        </p>
      </div>

      {/* Referral Link */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Your Referral Link
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={getReferralLink()}
            readOnly
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-pink-500/50"
          />
          <button
            onClick={copyReferralLink}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white p-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
            title="Copy link"
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* How it Works */}
      <div className="mt-6 p-4 bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20 rounded-xl">
        <h4 className="text-sm font-semibold text-white mb-3">How It Works</h4>
        <div className="space-y-2 text-xs text-gray-300">
          <div className="flex items-start space-x-2">
            <span className="text-pink-400 font-bold">1.</span>
            <span>Share your unique referral link with friends</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-pink-400 font-bold">2.</span>
            <span>They sign up and make their first booking</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-pink-400 font-bold">3.</span>
            <span>You both receive rewards! 🎉</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-pink-400 font-bold">4.</span>
            <span>Get 50% off when you refer 5 successful signups</span>
          </div>
        </div>
      </div>

      {/* Pending Referrals */}
      {stats.pending_referrals > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex items-center space-x-2 text-yellow-400 text-sm">
            <span className="text-lg">⏳</span>
            <span>
              <strong>{stats.pending_referrals}</strong> pending referral{stats.pending_referrals !== 1 ? 's' : ''} waiting for first booking
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralCard;
