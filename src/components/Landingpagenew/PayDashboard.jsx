import React, { useState, useEffect, useRef } from 'react';
import {
  Home, CreditCard, Receipt, Wallet, User, ArrowDown, ArrowUp,
  ArrowRight, Copy, QrCode, X, Plane, Ship, Car, Navigation,
  Sparkles, Settings, ChevronRight, ChevronLeft, HelpCircle,
  LogOut, Shield, Bell, Lock, Info, Star, MessageSquare, Eye, EyeOff,
  Snowflake, Plus
} from 'lucide-react';

// Constants
const CARD_BG = '#F2F2F7';
const BORDER_RADIUS = '12px';

// Services for rotating banner
const SERVICES = [
  { id: 'jets', title: 'Private Jets', subtitle: 'Fly anywhere, anytime', icon: Plane },
  { id: 'yachts', title: 'Luxury Yachts', subtitle: 'Sail the world in style', icon: Ship },
  { id: 'cars', title: 'Car Rental', subtitle: 'Premium vehicles worldwide', icon: Car },
  { id: 'helicopter', title: 'Helicopters', subtitle: 'Skip the traffic', icon: Navigation },
];

// Mock data
const LATEST_TRANSACTIONS = [
  { id: '1', name: 'Lisa S.', amount: '$29.50', type: 'up', avatar: 'https://i.pravatar.cc/100?img=5' },
  { id: '2', name: 'Nike', amount: '$299.99', type: 'down', logo: 'https://logo.clearbit.com/nike.com' },
  { id: '3', name: 'PS Store', amount: '$39.19', type: 'down', logo: 'https://logo.clearbit.com/playstation.com' },
  { id: '4', name: 'Todd P.', amount: '$110', type: 'down', avatar: 'https://i.pravatar.cc/100?img=12' },
];

const TRANSACTIONS = [
  { id: '1', title: 'Lisa S.', subtitle: 'Received', amount: '+$29.50', type: 'up', avatar: 'https://i.pravatar.cc/100?img=5', date: 'Today' },
  { id: '2', title: 'Nike', subtitle: 'Payment', amount: '-$299.99', type: 'down', logo: 'https://logo.clearbit.com/nike.com', date: 'Today' },
  { id: '3', title: 'PS Store', subtitle: 'Payment', amount: '-$39.19', type: 'down', logo: 'https://logo.clearbit.com/playstation.com', date: 'Today' },
  { id: '4', title: 'Salary', subtitle: 'Income', amount: '+$5,000.00', type: 'up', date: 'Yesterday' },
  { id: '5', title: 'Uber', subtitle: 'Transport', amount: '-$34.24', type: 'down', date: 'Yesterday' },
  { id: '6', title: 'Netflix', subtitle: 'Subscription', amount: '-$15.99', type: 'down', logo: 'https://logo.clearbit.com/netflix.com', date: 'Jan 20' },
  { id: '7', title: 'Todd P.', subtitle: 'Sent', amount: '-$110.00', type: 'down', avatar: 'https://i.pravatar.cc/100?img=12', date: 'Jan 20' },
  { id: '8', title: 'Apple', subtitle: 'Payment', amount: '-$1,299.00', type: 'down', logo: 'https://logo.clearbit.com/apple.com', date: 'Jan 19' },
];

const CRYPTO_HOLDINGS = [
  { id: 'usdc', symbol: 'USDC', name: 'USD Coin', balance: 5420.00, usdValue: 5420.00, color: '#2775CA', change: '+0.00%' },
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', balance: 0.0234, usdValue: 2340.00, color: '#F7931A', change: '+2.34%' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', balance: 1.245, usdValue: 4112.50, color: '#627EEA', change: '+1.87%' },
];

const CARD_DATA = {
  lastFour: '3456',
  fullNumber: '1234 5678 9012 3456',
  cvc: '678',
  expiry: '12/26',
  balance: 24092.67,
};

const USER = {
  name: 'John Smith',
  email: 'john.smith@email.com',
  avatar: 'https://i.pravatar.cc/200?img=3',
  tier: 'Premium',
};

const MENU_ITEMS = [
  { id: 'personal', icon: User, label: 'Personal Information' },
  { id: 'security', icon: Shield, label: 'Security' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'payment', icon: CreditCard, label: 'Payment Methods' },
  { id: 'crypto', icon: Wallet, label: 'Crypto Wallet' },
  { id: 'privacy', icon: Lock, label: 'Privacy' },
  { id: 'help', icon: HelpCircle, label: 'Help Center' },
  { id: 'about', icon: Info, label: 'About' },
];

// Tab Bar Component
const PayTabBar = ({ activeTab, setActiveTab, onSwitchToMain }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50"
       style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)', paddingTop: '8px' }}>
    <button onClick={() => setActiveTab('home')} className="flex-1 flex justify-center p-2">
      <Home size={22} className={activeTab === 'home' ? 'text-gray-900' : 'text-gray-400'} />
    </button>
    <button onClick={() => setActiveTab('card')} className="flex-1 flex justify-center p-2">
      <CreditCard size={22} className={activeTab === 'card' ? 'text-gray-900' : 'text-gray-400'} />
    </button>

    {/* Center Switcher Button */}
    <button
      onClick={onSwitchToMain}
      className="relative -mt-5 flex items-center justify-center"
    >
      <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shadow-lg">
        <Sparkles size={24} className="text-white" />
      </div>
    </button>

    <button onClick={() => setActiveTab('transactions')} className="flex-1 flex justify-center p-2">
      <Receipt size={22} className={activeTab === 'transactions' ? 'text-gray-900' : 'text-gray-400'} />
    </button>
    <button onClick={() => setActiveTab('crypto')} className="flex-1 flex justify-center p-2">
      <Wallet size={22} className={activeTab === 'crypto' ? 'text-gray-900' : 'text-gray-400'} />
    </button>
  </div>
);

// Home Tab
const HomeTab = ({ user, onDeposit, onSend, onNavigate }) => {
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentServiceIndex((prev) => (prev + 1) % SERVICES.length);
        setFadeIn(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const balanceWhole = Math.floor(CARD_DATA.balance).toLocaleString('en-US');
  const balanceCents = (CARD_DATA.balance % 1).toFixed(2).substring(1);
  const currentService = SERVICES[currentServiceIndex];
  const ServiceIcon = currentService.icon;

  return (
    <div className="flex-1 overflow-y-auto pb-24" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <div className="px-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => onNavigate('profile')} className="flex items-center gap-3">
            <img src={user?.avatar || USER.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="text-[15px] font-semibold text-gray-900">{user?.first_name || user?.name || USER.name}</p>
              <p className="text-xs text-gray-500">Personal</p>
            </div>
          </button>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center relative" style={{ backgroundColor: CARD_BG }}>
              <span className="text-sm font-semibold text-gray-900">3</span>
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* Balance */}
        <div className="text-center mb-6">
          <p className="text-[44px] font-light text-gray-900 tracking-tight">
            ${balanceWhole}<span className="text-2xl text-gray-400">{balanceCents}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={onDeposit}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl"
            style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}
          >
            <ArrowDown size={16} className="text-gray-900" />
            <span className="text-[15px] font-medium text-gray-900">Deposit</span>
          </button>
          <button
            onClick={onSend}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl"
            style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}
          >
            <ArrowRight size={16} className="text-gray-900" />
            <span className="text-[15px] font-medium text-gray-900">Send</span>
          </button>
        </div>

        {/* Card Banner */}
        <button
          onClick={() => onNavigate('card')}
          className="w-full flex items-center overflow-hidden mb-4"
          style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS, height: '120px' }}
        >
          <div className="flex-1 p-4">
            <p className="text-base font-semibold text-gray-900 leading-tight">Order your free<br />debit card today</p>
            <p className="text-xs text-gray-400 mt-1.5">Limited Offer</p>
          </div>
          <div className="w-44 h-36 -mr-4 -mt-2">
            <img
              src="/assets/Whisk_2280d9b9ca2532fbafa412e4b0264bfbeg.png"
              alt="Card"
              className="w-full h-full object-cover"
            />
          </div>
        </button>

        {/* Services Banner */}
        <div
          className={`p-4 mb-4 transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}
        >
          <div className="flex items-center">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
              <ServiceIcon size={24} className="text-gray-900" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-[15px] font-semibold text-gray-900">{currentService.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{currentService.subtitle}</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
          <div className="flex justify-center gap-1 mt-3">
            {SERVICES.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentServiceIndex ? 'w-4 bg-gray-900' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Latest */}
        <div className="p-4 mb-4" style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}>
          <p className="text-[15px] font-semibold text-gray-900 mb-3">Latest</p>
          <div className="flex gap-4 overflow-x-auto">
            {LATEST_TRANSACTIONS.map((item) => (
              <div key={item.id} className="flex flex-col items-center w-16">
                <div className="relative mb-1">
                  <img
                    src={item.avatar || item.logo}
                    alt={item.name}
                    className="w-12 h-12 rounded-full object-cover bg-gray-200"
                  />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 ${
                    item.type === 'up' ? 'bg-green-500' : 'bg-red-500'
                  }`} style={{ borderColor: CARD_BG }}>
                    {item.type === 'up' ? (
                      <ArrowUp size={8} className="text-white" />
                    ) : (
                      <ArrowDown size={8} className="text-white" />
                    )}
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-900 text-center">{item.name}</p>
                <p className="text-[11px] text-gray-500">{item.amount}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Spending */}
        <button
          onClick={() => onNavigate('transactions')}
          className="w-full p-4 text-left mb-4"
          style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}
        >
          <p className="text-base font-medium text-gray-900 leading-relaxed">
            This month you<br />spent <span className="text-red-500 font-bold">$645</span>
          </p>
        </button>

        {/* Recent */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[15px] font-semibold text-gray-900">Recent</p>
            <button onClick={() => onNavigate('transactions')} className="text-[13px] text-gray-500">View all</button>
          </div>
          <div style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}>
            {LATEST_TRANSACTIONS.slice(0, 3).map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center p-4 ${index < 2 ? 'border-b border-black/5' : ''}`}
              >
                <img
                  src={item.avatar || item.logo}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover bg-gray-200"
                />
                <div className="flex-1 ml-3">
                  <p className="text-[15px] font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.type === 'up' ? 'Received' : 'Payment'}</p>
                </div>
                <p className={`text-[15px] font-semibold ${item.type === 'up' ? 'text-green-500' : 'text-gray-900'}`}>
                  {item.type === 'up' ? '+' : '-'}{item.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Card Tab
const CardTab = ({ onBack }) => {
  const [showDetails, setShowDetails] = useState(false);

  const maskNumber = (num) => {
    if (showDetails) return num;
    return num.replace(/\d(?=\d{4})/g, '•');
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <div className="px-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-1">
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
          <p className="text-[17px] font-semibold text-gray-900">Card</p>
          <button className="p-1">
            <Settings size={22} className="text-gray-900" />
          </button>
        </div>

        {/* Card Image */}
        <div className="flex justify-center mb-6">
          <img
            src="/assets/Whisk_2280d9b9ca2532fbafa412e4b0264bfbeg.png"
            alt="Card"
            className="w-full max-w-xs h-48 object-contain"
          />
        </div>

        {/* Balance */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Available</p>
          <p className="text-4xl font-light text-gray-900">
            ${CARD_DATA.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Card Info */}
        <div className="p-4 mb-6" style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}>
          <p className="text-[15px] font-semibold text-gray-900 mb-3">Card info</p>

          <div className="flex items-center justify-between py-3 border-b border-black/5">
            <p className="text-sm text-gray-500">Card number</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 font-mono">{maskNumber(CARD_DATA.fullNumber)}</p>
              <Copy size={16} className="text-gray-400" />
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-black/5">
            <p className="text-sm text-gray-500">CVC</p>
            <p className="text-sm font-medium text-gray-900">{showDetails ? CARD_DATA.cvc : '•••'}</p>
          </div>

          <div className="flex items-center justify-between py-3">
            <p className="text-sm text-gray-500">Expiry</p>
            <p className="text-sm font-medium text-gray-900">{CARD_DATA.expiry}</p>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center gap-1.5 w-full mt-3"
          >
            {showDetails ? <EyeOff size={16} className="text-gray-500" /> : <Eye size={16} className="text-gray-500" />}
            <span className="text-[13px] text-gray-500">{showDetails ? 'Hide' : 'Show'} details</span>
          </button>
        </div>

        {/* Quick Actions */}
        <p className="text-[15px] font-semibold text-gray-900 mb-3">Quick actions</p>
        <div className="flex p-2" style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}>
          {[
            { icon: Snowflake, label: 'Freeze' },
            { icon: Settings, label: 'Settings' },
            { icon: Lock, label: 'PIN' },
            { icon: HelpCircle, label: 'Help' },
          ].map((action) => (
            <button key={action.label} className="flex-1 flex flex-col items-center py-3">
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center mb-1.5">
                <action.icon size={20} className="text-gray-900" />
              </div>
              <span className="text-[11px] text-gray-500">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Transactions Tab
const TransactionsTab = ({ onBack }) => {
  return (
    <div className="flex-1 overflow-y-auto pb-24" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <div className="px-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-1">
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
          <p className="text-[17px] font-semibold text-gray-900">Transactions</p>
          <button className="p-1">
            <Settings size={20} className="text-gray-900" />
          </button>
        </div>

        {/* Transactions List */}
        {(() => {
          let lastDate = '';
          return TRANSACTIONS.map((tx, index) => {
            const showDate = tx.date !== lastDate;
            lastDate = tx.date;
            const isLast = index === TRANSACTIONS.length - 1 || TRANSACTIONS[index + 1]?.date !== tx.date;
            const isFirst = showDate;

            return (
              <div key={tx.id}>
                {showDate && (
                  <p className="text-[13px] font-semibold text-gray-500 mt-6 mb-2">{tx.date}</p>
                )}
                <div
                  className={`flex items-center p-4 ${!isLast ? 'border-b border-black/5' : ''}`}
                  style={{
                    backgroundColor: CARD_BG,
                    borderTopLeftRadius: isFirst ? BORDER_RADIUS : 0,
                    borderTopRightRadius: isFirst ? BORDER_RADIUS : 0,
                    borderBottomLeftRadius: isLast ? BORDER_RADIUS : 0,
                    borderBottomRightRadius: isLast ? BORDER_RADIUS : 0,
                  }}
                >
                  {tx.avatar ? (
                    <img src={tx.avatar} alt={tx.title} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                  ) : tx.logo ? (
                    <img src={tx.logo} alt={tx.title} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'up' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {tx.type === 'up' ? (
                        <ArrowDown size={18} className="text-green-500" />
                      ) : (
                        <ArrowUp size={18} className="text-red-500" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 ml-3">
                    <p className="text-[15px] font-medium text-gray-900">{tx.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{tx.subtitle}</p>
                  </div>
                  <p className={`text-[15px] font-semibold ${tx.type === 'up' ? 'text-green-500' : 'text-gray-900'}`}>
                    {tx.amount}
                  </p>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};

// Crypto Tab
const CryptoTab = ({ onBack }) => {
  const totalBalance = CRYPTO_HOLDINGS.reduce((sum, h) => sum + h.usdValue, 0);
  const balanceWhole = Math.floor(totalBalance).toLocaleString('en-US');
  const balanceCents = (totalBalance % 1).toFixed(2).substring(1);

  return (
    <div className="flex-1 overflow-y-auto pb-24" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <div className="px-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-1">
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
          <p className="text-[17px] font-semibold text-gray-900">Crypto</p>
          <button className="p-1" style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS, width: 36, height: 36 }}>
            <QrCode size={20} className="text-gray-900 m-auto" />
          </button>
        </div>

        {/* Balance */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Balance</p>
          <p className="text-[44px] font-light text-gray-900 tracking-tight mt-1">
            ${balanceWhole}<span className="text-2xl text-gray-400">{balanceCents}</span>
          </p>
          <p className="text-[13px] text-green-500 mt-1">+$156.32 (1.34%) today</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          {[
            { icon: ArrowDown, label: 'Receive', color: 'text-green-500' },
            { icon: ArrowUp, label: 'Send', color: 'text-blue-500' },
            { icon: ArrowRight, label: 'Swap', color: 'text-purple-500' },
          ].map((action) => (
            <button
              key={action.label}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5"
              style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}
            >
              <action.icon size={16} className={action.color} />
              <span className="text-sm font-medium text-gray-900">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Holdings */}
        <p className="text-[15px] font-semibold text-gray-900 mb-3">Holdings</p>
        <div className="mb-6" style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}>
          {CRYPTO_HOLDINGS.map((crypto, index) => (
            <div
              key={crypto.id}
              className={`flex items-center p-4 ${index < CRYPTO_HOLDINGS.length - 1 ? 'border-b border-black/5' : ''}`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: crypto.color + '20' }}
              >
                {crypto.symbol === 'USDC' ? (
                  <span className="text-lg font-bold" style={{ color: crypto.color }}>$</span>
                ) : crypto.symbol === 'BTC' ? (
                  <span className="text-lg font-bold" style={{ color: crypto.color }}>₿</span>
                ) : (
                  <span className="text-lg font-bold" style={{ color: crypto.color }}>Ξ</span>
                )}
              </div>
              <div className="flex-1 ml-3">
                <p className="text-[15px] font-semibold text-gray-900">{crypto.symbol}</p>
                <p className="text-xs text-gray-500 mt-0.5">{crypto.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-medium text-gray-900">{crypto.balance}</p>
                <p className="text-xs text-gray-500 mt-0.5">${crypto.usdValue.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Profile Tab
const ProfileTab = ({ user, onBack }) => {
  return (
    <div className="flex-1 overflow-y-auto pb-24" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <div className="px-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-1">
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
          <p className="text-[17px] font-semibold text-gray-900">Profile</p>
          <button className="text-[15px] text-gray-500">Edit</button>
        </div>

        {/* Profile Card */}
        <div className="flex flex-col items-center py-6">
          <img
            src={user?.avatar || USER.avatar}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover mb-3"
          />
          <p className="text-xl font-semibold text-gray-900">{user?.name || USER.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{user?.email || USER.email}</p>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full mt-3" style={{ backgroundColor: CARD_BG }}>
            <Star size={12} className="text-yellow-500" />
            <span className="text-xs font-medium text-gray-900">{USER.tier}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex p-4 mb-4" style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}>
          <div className="flex-1 text-center">
            <p className="text-lg font-semibold text-gray-900">12</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Transactions</p>
          </div>
          <div className="w-px bg-black/10" />
          <div className="flex-1 text-center">
            <p className="text-lg font-semibold text-gray-900">3</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Cards</p>
          </div>
          <div className="w-px bg-black/10" />
          <div className="flex-1 text-center">
            <p className="text-lg font-semibold text-gray-900">Gold</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Status</p>
          </div>
        </div>

        {/* Menu */}
        <div className="mb-4" style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}>
          {MENU_ITEMS.map((item, index) => (
            <button
              key={item.id}
              className={`w-full flex items-center p-4 ${index < MENU_ITEMS.length - 1 ? 'border-b border-black/5' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-3">
                <item.icon size={18} className="text-gray-900" />
              </div>
              <span className="flex-1 text-[15px] text-gray-900 text-left">{item.label}</span>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          ))}
        </div>

        {/* Support */}
        <button className="w-full flex items-center p-4 mb-4 bg-black" style={{ borderRadius: BORDER_RADIUS }}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div className="flex-1 ml-3 text-left">
            <p className="text-[15px] font-semibold text-white">Contact Support</p>
            <p className="text-xs text-white/70 mt-0.5">Chat with us 24/7</p>
          </div>
          <ChevronRight size={18} className="text-white" />
        </button>

        {/* Sign Out */}
        <button
          className="w-full flex items-center justify-center gap-2 p-4"
          style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}
        >
          <LogOut size={18} className="text-red-500" />
          <span className="text-[15px] font-medium text-red-500">Sign Out</span>
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">PCX Pay v1.0.0</p>
      </div>
    </div>
  );
};

// Deposit Modal
const DepositModal = ({ isOpen, onClose, onNavigateCrypto }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Deposit</h3>
          <button onClick={onClose}>
            <X size={24} className="text-gray-900" />
          </button>
        </div>

        {[
          { icon: '🏦', title: 'Bank Transfer', desc: 'Transfer from your bank', color: CARD_BG },
          { icon: '₿', title: 'Cryptocurrency', desc: 'BTC, ETH, USDC', color: '#FFF3E0', onClick: onNavigateCrypto },
          { icon: '💳', title: 'Debit/Credit Card', desc: 'Instant deposit', color: '#E3F2FD' },
        ].map((option) => (
          <button
            key={option.title}
            onClick={() => { option.onClick?.(); onClose(); }}
            className="w-full flex items-center p-4 mb-3"
            style={{ backgroundColor: CARD_BG, borderRadius: BORDER_RADIUS }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: option.color }}
            >
              {option.icon}
            </div>
            <div className="flex-1 ml-3 text-left">
              <p className="text-[15px] font-medium text-gray-900">{option.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{option.desc}</p>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
};

// Main PayDashboard Component
export default function PayDashboard({ user, onSwitchToMain }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Add noindex meta tag - PCX Pay is still in development
  useEffect(() => {
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);

    return () => {
      document.head.removeChild(metaRobots);
    };
  }, []);

  const handleNavigate = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-40">
      {/* Content based on active tab */}
      {activeTab === 'home' && (
        <HomeTab
          user={user}
          onDeposit={() => setShowDepositModal(true)}
          onSend={() => {}}
          onNavigate={handleNavigate}
        />
      )}
      {activeTab === 'card' && <CardTab onBack={() => setActiveTab('home')} />}
      {activeTab === 'transactions' && <TransactionsTab onBack={() => setActiveTab('home')} />}
      {activeTab === 'crypto' && <CryptoTab onBack={() => setActiveTab('home')} />}
      {activeTab === 'profile' && <ProfileTab user={user} onBack={() => setActiveTab('home')} />}

      {/* Tab Bar */}
      <PayTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchToMain={onSwitchToMain}
      />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onNavigateCrypto={() => setActiveTab('crypto')}
      />
    </div>
  );
}
