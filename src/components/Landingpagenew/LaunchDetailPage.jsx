import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plane, Clock, MapPin, Users, ExternalLink, Leaf, Wallet, Loader2, Share2, Facebook, Twitter, Linkedin, Send, Copy, Mail, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useAccount, useWalletClient } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { web3Service } from '../../lib/web3';

export default function LaunchDetailPage({ launch, onBack, onUpdate }) {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { open } = useAppKit();
  const [activeTab, setActiveTab] = useState('details');
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [liveProgress, setLiveProgress] = useState({
    current: launch.current_waitlist || 0,
    target: launch.target_waitlist || 100
  });

  useEffect(() => {
    checkIfJoined();

    // Set up real-time subscription for waitlist updates
    const channel = supabase
      .channel(`launch-${launch.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'launchpad_projects',
          filter: `id=eq.${launch.id}`
        },
        (payload) => {
          if (payload.new) {
            setLiveProgress({
              current: payload.new.current_waitlist || 0,
              target: payload.new.target_waitlist || 100
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [launch.id]);

  const checkIfJoined = async () => {
    if (!address) return;

    try {
      const { data, error } = await supabase
        .from('launchpad_waitlist')
        .select('id')
        .eq('launch_id', launch.id)
        .eq('wallet_address', address.toLowerCase())
        .single();

      if (data) {
        setAlreadyJoined(true);
      }
    } catch (error) {
      // Not joined yet
    }
  };

  const handleJoinWaitlist = async () => {
    if (!isConnected || !walletClient) {
      open();
      return;
    }

    if (!email) {
      alert('Please enter your email address.');
      return;
    }

    setSubmitting(true);

    try {
      // Get wallet signature
      const signatureData = await web3Service.requestWaitlistSignature(
        walletClient,
        address,
        launch.name,
        launch.id
      );

      // Insert into waitlist
      const { error: insertError } = await supabase
        .from('launchpad_waitlist')
        .insert({
          launch_id: launch.id,
          wallet_address: address.toLowerCase(),
          email: email,
          signature: signatureData.signature,
          signature_message: signatureData.message
        });

      if (insertError) {
        if (insertError.message?.includes('duplicate')) {
          alert('You have already joined this waitlist.');
          setAlreadyJoined(true);
          setShowWaitlistModal(false);
          return;
        }
        throw insertError;
      }

      // Record in launchpad_transactions (existing)
      await supabase.from('launchpad_transactions').insert({
        launch_id: launch.id,
        wallet_address: address.toLowerCase(),
        transaction_type: 'waitlist_join',
        signature: signatureData.signature,
        signature_message: signatureData.message,
        status: 'completed'
      });

      // ALSO record in unified transactions table for user's activity feed
      await supabase.from('transactions').insert({
        user_id: user?.id,
        wallet_address: address.toLowerCase(),
        transaction_type: 'launchpad_waitlist_join',
        category: 'wallet_signature',
        amount: 0,
        currency: 'USD',
        status: 'completed',
        description: `Joined waitlist for ${launch.name}`,
        signature: signatureData.signature,
        metadata: {
          launch_id: launch.id,
          launch_name: launch.name,
          signature_message: signatureData.message,
          timestamp: signatureData.timestamp
        }
      });

      // Increment waitlist counter
      const { error: updateError } = await supabase
        .from('launchpad_projects')
        .update({ current_waitlist: (launch.current_waitlist || 0) + 1 })
        .eq('id', launch.id);

      if (updateError) throw updateError;

      setAlreadyJoined(true);
      setShowWaitlistModal(false);
      setShowSuccessMessage(true);

      // Update parent
      if (onUpdate) onUpdate();

      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error joining waitlist:', error);
      if (error.message?.includes('User rejected')) {
        alert('Signature rejected. You must sign the message to join the waitlist.');
      } else {
        alert('Failed to join waitlist. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const progressPercentage = liveProgress.target > 0
    ? (liveProgress.current / liveProgress.target) * 100
    : 0;

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = `Join the waitlist for ${launch.name}`;
    const text = `Check out this exciting tokenized asset launch: ${launch.name}`;

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`,
      copy: () => {
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    };

    if (platform === 'copy') {
      shareUrls.copy();
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['DM_Sans']">
      {/* Header */}
      <header className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Launchpad</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex space-x-8">
            <button className="py-4 text-sm text-black border-b-2 border-black">◇ Launch Details</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-5 py-6">
        {/* Launch Header Card */}
        <div className="bg-white rounded-lg border border-gray-300 mb-6">
          <div className="flex h-80">
            {/* Left side - Asset Image */}
            <div className="w-2/5 relative bg-gray-100">
              {launch.image_url ? (
                <img
                  src={launch.image_url}
                  alt={launch.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-black">{launch.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{launch.category}</div>
                  </div>
                </div>
              )}

              <div className="absolute top-3 left-3 flex space-x-1.5">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  <span>Waitlist Open</span>
                </div>
                <div className="bg-white px-2 py-1 rounded text-xs font-medium">Launchpad</div>
              </div>
            </div>

            {/* Right side - Launch info */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs hover:bg-gray-50"
                  >
                    <Share2 size={12} />
                  </button>
                </div>
              </div>

              <h1 className="text-2xl font-semibold mb-4">
                {launch.name}
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                {launch.asset_type} · {launch.location}
              </p>

              {/* Key metrics */}
              <div className="flex justify-between mt-auto mb-5">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Target Amount</span>
                  <span className="text-sm font-semibold text-black">{formatCurrency(launch.target_amount || 0)}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Waitlist Progress</span>
                  <span className="text-sm font-semibold text-black">{liveProgress.current}/{liveProgress.target}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Est. APY</span>
                  <span className="text-sm font-semibold text-black">{launch.estimated_apy || 0}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content and Booking Section */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Content */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <div>
                <h3 className="text-base font-semibold mb-4">Launch Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Asset Type</div>
                      <div className="text-sm font-semibold text-black">{launch.asset_type || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Location</div>
                      <div className="text-sm font-semibold text-black">{launch.location || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Year</div>
                      <div className="text-sm font-semibold text-black">{launch.year || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Token Standard</div>
                      <div className="text-sm font-semibold text-black">{launch.token_standard || 'ERC-3643'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Min Investment</div>
                      <div className="text-sm font-semibold text-black">{formatCurrency(launch.min_investment || 0)}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Max Investment</div>
                      <div className="text-sm font-semibold text-black">{formatCurrency(launch.max_investment || 0)}</div>
                    </div>
                  </div>

                  {/* Description */}
                  {launch.description && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-3">About This Launch</h4>
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{launch.description}</p>
                    </div>
                  )}

                  {/* Escrow Section */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Wallet className="w-5 h-5 text-gray-600" />
                      <h4 className="text-sm font-bold text-black">Safe Wallet Escrow</h4>
                    </div>
                    <p className="text-xs text-gray-700">
                      {launch.escrow_address ? (
                        <>
                          <span className="font-mono block mb-1">{launch.escrow_address}</span>
                          All funds are secured in a Safe multisig wallet
                        </>
                      ) : (
                        'Escrow wallet will be set up after waitlist phase completes. All funds will be secured in a Safe.global multisig wallet.'
                      )}
                    </p>
                  </div>
                </div>
              )
            </div>
          </div>

          {/* Right Column - Waitlist Widget */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-gray-300 p-5 sticky top-6">
              <h3 className="text-base font-semibold mb-4">Join Waitlist</h3>

              {/* Waitlist Summary */}
              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Current Phase</span>
                  <span className="text-xs font-semibold text-black">Waitlist</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Waitlist Progress</span>
                  <span className="text-xs font-semibold text-black">{liveProgress.current} / {liveProgress.target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Target Amount</span>
                  <span className="text-xs font-semibold text-black">{formatCurrency(launch.target_amount || 0)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5 pb-4 border-b border-gray-200">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 text-center mt-2">
                  {progressPercentage.toFixed(1)}% Complete
                </div>
              </div>

              {/* Join Waitlist Button */}
              {!alreadyJoined ? (
                <button
                  onClick={() => isConnected ? setShowWaitlistModal(true) : open()}
                  className="w-full bg-black text-white py-3 px-4 rounded text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  {isConnected ? 'Join Waitlist' : 'Connect Wallet'}
                </button>
              ) : (
                <div className="w-full py-3 px-4 rounded text-sm font-semibold bg-gray-100 text-gray-600 flex items-center justify-center gap-2">
                  <CheckCircle size={16} />
                  Already Joined
                </div>
              )}

              {/* Share Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full px-4 py-3 mt-3 border border-gray-300 text-black hover:bg-gray-50 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Share2 size={16} />
                Share Launch
              </button>

              {isConnected && (
                <div className="mt-3 text-xs text-gray-500 text-center">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
              )}

              {/* Additional Info */}
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-green-500">✓</span>
                  <span>Wallet signature required</span>
                </div>
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-green-500">✓</span>
                  <span>No payment at this stage</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Get notified when launch goes live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-black">Join Waitlist</h2>
              <button
                onClick={() => setShowWaitlistModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-6">
              Sign with your wallet to join the waitlist for {launch.name}. You'll be notified when the launch goes live.
            </p>

            {/* Email Input */}
            <div className="mb-4">
              <label className="text-xs text-gray-600 block mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Signature Button */}
            <button
              onClick={handleJoinWaitlist}
              disabled={submitting || !email}
              className="w-full bg-black text-white py-3 px-4 rounded text-sm font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <Wallet size={16} />
                  Sign & Join Waitlist
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              No payment required. Your signature confirms your interest.
            </p>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-black">Share This Launch</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-6">
              Share {launch.name} with your network
            </p>

            {/* Social Media Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 hover:bg-gray-50 rounded text-xs font-medium transition-colors"
              >
                <Facebook size={16} className="text-[#1877F2]" />
                Facebook
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 hover:bg-gray-50 rounded text-xs font-medium transition-colors"
              >
                <Twitter size={16} className="text-[#1DA1F2]" />
                Twitter
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 hover:bg-gray-50 rounded text-xs font-medium transition-colors"
              >
                <Linkedin size={16} className="text-[#0A66C2]" />
                LinkedIn
              </button>
              <button
                onClick={() => handleShare('telegram')}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 hover:bg-gray-50 rounded text-xs font-medium transition-colors"
              >
                <Send size={16} className="text-[#26A5E4]" />
                Telegram
              </button>
              <button
                onClick={() => handleShare('email')}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 hover:bg-gray-50 rounded text-xs font-medium transition-colors"
              >
                <Mail size={16} className="text-gray-600" />
                Email
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 hover:bg-gray-50 rounded text-xs font-medium transition-colors"
              >
                <Copy size={16} className="text-gray-600" />
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-6 right-6 z-[10000] animate-fade-in">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[320px]">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black">Successfully Joined!</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Your signature has been recorded for {launch.name}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
