import React from 'react';

const PaymentMockup = ({ className = '' }) => {
  return (
    <div className={`relative w-full max-w-lg mx-auto ${className}`}>
      {/* Container with perspective for 3D effect */}
      <div
        className="relative flex items-center justify-center py-8"
        style={{ perspective: '1200px' }}
      >
        {/* iPhone Mockup - Dark Theme */}
        <div
          className="relative"
          style={{
            transform: 'rotateY(-8deg) rotateX(3deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Phone Frame - Dark */}
          <div
            className="relative bg-[#1a1a1a] rounded-[2.5rem] p-1 shadow-2xl"
            style={{
              width: '220px',
              height: '450px',
              boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.4), 0 20px 40px -20px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Phone Inner Bezel */}
            <div className="absolute inset-1 bg-[#0a0a0a] rounded-[2.25rem]" />

            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20" />

            {/* Screen Content - Dark Mode */}
            <div className="absolute inset-1.5 bg-[#0f0f0f] rounded-[2rem] overflow-hidden">
              {/* Modern Dark App Screen */}
              <div className="w-full h-full flex flex-col">
                {/* Status Bar */}
                <div className="flex justify-between items-center px-5 pt-7 pb-1">
                  <span className="text-[9px] font-medium text-white/80">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-1.5 border border-white/40 rounded-sm">
                      <div className="w-3/4 h-full bg-white/60 rounded-sm" />
                    </div>
                  </div>
                </div>

                {/* App Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white/30" />
                  </div>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest">PCX</p>
                  <div className="w-6 h-6" />
                </div>

                {/* Balance Section */}
                <div className="px-4 py-5 text-center">
                  <p className="text-[8px] text-white/30 uppercase tracking-widest mb-2">Total Balance</p>
                  <p className="text-3xl font-light text-white tracking-tight">$12,458</p>
                  <p className="text-[9px] text-white/40 mt-1">+2.4% this month</p>
                </div>

                {/* Quick Actions - Minimal */}
                <div className="px-5 py-3">
                  <div className="flex justify-between gap-2">
                    {['Add', 'Send', 'More'].map((label, i) => (
                      <button key={i} className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-medium text-white/70">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Preview - Minimal Dark */}
                <div className="px-4 py-3">
                  <div
                    className="rounded-xl p-3.5"
                    style={{
                      background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0d0d0d 100%)',
                    }}
                  >
                    <div className="flex justify-between items-start mb-5">
                      <p className="text-[7px] text-white/30 uppercase tracking-widest">PrivateCharterX</p>
                      <div className="flex -space-x-1">
                        <div className="w-3 h-3 rounded-full bg-red-500 opacity-90" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-90" />
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-[8px] text-white/40 tracking-widest">•••• 4242</p>
                      <p className="text-[9px] text-white/60 font-medium">$8,240</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity - Clean */}
                <div className="flex-1 px-4 py-2">
                  <p className="text-[8px] text-white/30 uppercase tracking-widest mb-3">Activity</p>
                  <div className="space-y-3">
                    {[
                      { name: 'NetJets Europe', amount: '-$4,200' },
                      { name: 'USDC Deposit', amount: '+$10,000' },
                      { name: 'Transfer', amount: '-$500' },
                    ].map((tx, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white/20" />
                          </div>
                          <div>
                            <p className="text-[9px] text-white/70 font-medium">{tx.name}</p>
                            <p className="text-[7px] text-white/30">Today</p>
                          </div>
                        </div>
                        <p className="text-[9px] text-white/50 font-medium">{tx.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Nav - Minimal */}
                <div className="px-6 py-4 flex justify-center gap-1.5">
                  <div className="w-8 h-0.5 rounded-full bg-white/40" />
                </div>
              </div>
            </div>
          </div>

          {/* Floating Credit Card - Hidden on mobile */}
          <div
            className="absolute hidden sm:block"
            style={{
              top: '18%',
              right: '-55%',
              transform: 'rotateY(-20deg) rotateX(8deg) rotateZ(12deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="relative rounded-xl p-3 flex flex-col justify-between shadow-2xl"
              style={{
                width: '180px',
                height: '115px',
                background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 30%, #0d0d0d 60%, #000000 100%)',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* Shine Effect */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)',
                }}
              />

              {/* Card Top */}
              <div className="flex justify-between items-start relative z-10">
                <p className="text-[6px] text-white/30 uppercase tracking-widest">PrivateCharterX</p>
                <div className="flex -space-x-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 opacity-90" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 opacity-90" />
                </div>
              </div>

              {/* Chip - Monochrome */}
              <div className="relative z-10">
                <div className="w-7 h-5 rounded bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 opacity-80" />
              </div>

              {/* Card Bottom */}
              <div className="flex justify-between items-end relative z-10">
                <div>
                  <p className="text-[7px] text-white/50 tracking-wider">•••• 4242</p>
                  <p className="text-[6px] text-white/30">JOHN SMITH</p>
                </div>
                <div className="text-white/30">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 14.5c1.5-2 4.5-2 6 0" />
                    <path d="M6 12c2.5-3.5 9.5-3.5 12 0" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shadow beneath */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-3 bg-black/20 rounded-full blur-lg"
        style={{ transform: 'translateX(-20%)' }}
      />
    </div>
  );
};

export default PaymentMockup;
