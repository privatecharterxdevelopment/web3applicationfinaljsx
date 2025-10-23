import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

const ReferralSystem = ({ 
  referralCode = "JET2024X",
  successfulReferrals = 0,
  totalChatsEarned = 0,
  userName = "Guest"
}) => {
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);
  
  const referralLink = `https://sphera.ai/ref/${referralCode}`;
  const refsUntilBonus = Math.max(0, 5 - successfulReferrals);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] py-16 px-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="h-px w-12 bg-black/20 mb-6 mx-auto" />
          <p className="text-xs tracking-[0.3em] uppercase text-black/40 mb-3 font-medium">Referral Program</p>
          <h1 className="text-5xl font-normal text-black tracking-tight mb-3">Bring a Jet-Setter</h1>
          <p className="text-base text-black/50 font-normal">Both of you receive +2 free chats per successful referral</p>
          <div className="h-px w-12 bg-black/20 mx-auto mt-6" />
        </div>

        {/* Main Stats Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-black/10 rounded-3xl p-10 mb-6">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Successful Referrals */}
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-3 font-medium">Successful Referrals</p>
              <p className="text-6xl font-normal text-black mb-2">{successfulReferrals}</p>
              <div className="h-px w-8 bg-black/10" />
            </div>

            {/* Free Chats Earned */}
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-3 font-medium">Free Chats Earned</p>
              <p className="text-6xl font-normal text-black mb-2">{totalChatsEarned}</p>
              <div className="h-px w-8 bg-black/10" />
            </div>

            {/* Until Bonus */}
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-3 font-medium">Until 50% Bonus</p>
              <p className="text-6xl font-normal text-black mb-2">{refsUntilBonus}</p>
              <p className="text-[10px] text-black/50 font-normal mt-2">more referrals needed</p>
            </div>
          </div>
        </div>

        {/* Progress to Bonus */}
        {successfulReferrals > 0 && successfulReferrals < 5 && (
          <div className="bg-white/60 backdrop-blur-xl border border-black/10 rounded-3xl p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 font-medium">Progress to 50% Off</p>
              <p className="text-sm text-black/60 font-normal">{successfulReferrals}/5</p>
            </div>
            <div className="bg-black/5 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-black h-full transition-all duration-500 rounded-full"
                style={{ width: `${(successfulReferrals / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Bonus Achieved */}
        {successfulReferrals >= 5 && (
          <div className="bg-black text-white rounded-3xl p-6 mb-8 text-center">
            <p className="text-xs tracking-[0.2em] uppercase mb-2 font-light">Congratulations!</p>
            <p className="text-lg font-light">You've earned 50% off your next month</p>
          </div>
        )}

        {/* Referral Link Section */}
        <div className="bg-white/80 backdrop-blur-xl border border-black/10 rounded-3xl p-8 mb-8">
          <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-6 font-light">Your Referral Link</p>
          
          <div className="flex items-stretch gap-3 mb-6">
            <div className="flex-1 bg-[#fafafa] border border-black/10 rounded-2xl px-5 py-4">
              <p className="font-mono text-xs text-black/60 truncate">{referralLink}</p>
            </div>
            
            <button
              onClick={handleCopy}
              className={`px-8 py-4 rounded-2xl transition-all flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-light ${
                copied
                  ? 'bg-black text-white'
                  : 'bg-transparent border border-black/20 text-black hover:bg-black/5'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=Join me on Sphera AI - luxury travel made simple&url=${encodeURIComponent(referralLink)}`, '_blank')}
              className="py-3 rounded-2xl bg-transparent border border-black/10 text-xs text-black hover:bg-black/5 transition-all font-light"
            >
              Share on X
            </button>
            <button 
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, '_blank')}
              className="py-3 rounded-2xl bg-transparent border border-black/10 text-xs text-black hover:bg-black/5 transition-all font-light"
            >
              Share on LinkedIn
            </button>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white/60 backdrop-blur-xl border border-black/10 rounded-3xl p-8 mb-8">
          <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-8 font-light">How It Works</p>
          
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full border border-black/20 flex items-center justify-center">
                  <span className="text-sm text-black/40 font-light">1</span>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm text-black mb-1 font-light">Share Your Link</p>
                <p className="text-xs text-black/40 font-light leading-relaxed">Send your unique referral link to friends who love luxury travel</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full border border-black/20 flex items-center justify-center">
                  <span className="text-sm text-black/40 font-light">2</span>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm text-black mb-1 font-light">They Subscribe</p>
                <p className="text-xs text-black/40 font-light leading-relaxed">Your friend signs up and subscribes to any paid plan</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full border border-black/20 flex items-center justify-center">
                  <span className="text-sm text-black/40 font-light">3</span>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm text-black mb-1 font-light">Both Receive Rewards</p>
                <p className="text-xs text-black/40 font-light leading-relaxed">You each receive +2 free chats instantly added to your account</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Tiers */}
        <div className="bg-white/60 backdrop-blur-xl border border-black/10 rounded-3xl p-8">
          <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-8 font-light">Rewards Tiers</p>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between pb-6 border-b border-black/5">
              <div>
                <p className="text-sm text-black mb-1 font-light">Per Referral</p>
                <p className="text-xs text-black/40 font-light">Each successful sign-up</p>
              </div>
              <p className="text-lg text-black font-light">+2 Chats</p>
            </div>

            <div className="flex items-start justify-between pb-6 border-b border-black/5">
              <div>
                <p className="text-sm text-black mb-1 font-light">5 Referrals</p>
                <p className="text-xs text-black/40 font-light">Milestone bonus</p>
              </div>
              <p className="text-lg text-black font-light">50% Off Next Month</p>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-black mb-1 font-light">10+ Referrals</p>
                <p className="text-xs text-black/40 font-light">Contact us for VIP benefits</p>
              </div>
              <p className="text-lg text-black font-light">Custom Rewards</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-xs text-black/30 font-light">Referrals must subscribe to a paid plan to qualify. Credits expire after 12 months.</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralSystem;