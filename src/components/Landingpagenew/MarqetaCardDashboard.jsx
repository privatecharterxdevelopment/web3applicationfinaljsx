import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Snowflake,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Wallet,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  Settings,
  MoreHorizontal,
  MapPin,
  RefreshCw,
  Smartphone,
  Globe,
  Lock,
  Bell,
  Hash,
  Truck,
  AlertCircle,
  ShieldCheck,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MarqetaCardDashboard({ setActiveCategory }) {
  const { user } = useAuth();

  // States
  const [loading, setLoading] = useState(true);
  const [cardFrozen, setCardFrozen] = useState(false);
  const [togglingFreeze, setTogglingFreeze] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpMethod, setTopUpMethod] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [processingTopUp, setProcessingTopUp] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [showOnMap, setShowOnMap] = useState(false);

  // Card data
  const [cardBalance, setCardBalance] = useState(12450);
  const [spentThisMonth, setSpentThisMonth] = useState(8500);
  const [monthlyLimit, setMonthlyLimit] = useState(15000);

  const cardDetails = {
    lastFour: '4582',
    expiry: '12/28',
    fullNumber: '5412 7534 8901 4582',
    cvv: '847',
    cardHolder: user?.user_metadata?.full_name || 'CARDHOLDER',
    cardName: 'PrivateCharterX Card'
  };

  // Demo transactions with merchant images
  const [transactions] = useState([
    { id: 1, merchant: 'Emirates Airlines', amount: -4200, category: 'Travel', image: 'https://logo.clearbit.com/emirates.com', date: '2025-01-18T14:32:00Z', status: 'completed', paymentReason: 'Flight booking' },
    { id: 2, merchant: 'Four Seasons', amount: -1850, category: 'Hotels', image: 'https://logo.clearbit.com/fourseasons.com', date: '2025-01-17T09:15:00Z', status: 'completed', paymentReason: 'Hotel reservation' },
    { id: 3, merchant: 'Carl Johnson', amount: 5000, category: 'Transfer', image: null, date: '2025-01-15T11:00:00Z', status: 'completed', paymentReason: 'Money for trip', isTransfer: true, initials: 'CJ', color: 'from-purple-500 to-pink-500' },
    { id: 4, merchant: 'McDonalds', amount: -30, category: 'Restaurant', image: 'https://logo.clearbit.com/mcdonalds.com', date: '2025-01-14T21:45:00Z', status: 'rejected', paymentReason: 'Cafes & restaurants' },
    { id: 5, merchant: 'NetJets', amount: -15600, category: 'Aviation', image: 'https://logo.clearbit.com/netjets.com', date: '2025-01-12T16:20:00Z', status: 'completed', paymentReason: 'Charter flight' },
    { id: 6, merchant: 'ASOS', amount: -98, category: 'Shopping', image: 'https://logo.clearbit.com/asos.com', date: '2025-01-10T08:00:00Z', status: 'completed', paymentReason: 'Clothing & Shoes' },
    { id: 7, merchant: 'Walmart', amount: -27.55, category: 'Shopping', image: 'https://logo.clearbit.com/walmart.com', date: '2025-01-08T15:30:00Z', status: 'completed', paymentReason: 'Food & Supermarkets' },
  ]);

  const filteredTransactions = useMemo(() => {
    if (transactionFilter === 'income') return transactions.filter(t => t.amount > 0);
    if (transactionFilter === 'expense') return transactions.filter(t => t.amount < 0);
    return transactions;
  }, [transactions, transactionFilter]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleToggleFreeze = async () => {
    setTogglingFreeze(true);
    await new Promise(r => setTimeout(r, 800));
    setCardFrozen(!cardFrozen);
    setTogglingFreeze(false);
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) return;
    setProcessingTopUp(true);
    await new Promise(r => setTimeout(r, 1500));
    setCardBalance(prev => prev + parseFloat(topUpAmount));
    setShowTopUpModal(false);
    setTopUpAmount('');
    setTopUpMethod(null);
    setProcessingTopUp(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const getStatusBadge = (status) => {
    if (status === 'rejected') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">Rejected</span>;
    }
    if (status === 'pending') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-600 rounded">Pending</span>;
    }
    return <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded">Done</span>;
  };

  const leftInBudget = monthlyLimit - spentThisMonth;
  const spentPercentage = (spentThisMonth / monthlyLimit) * 100;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-transparent">
      <div className="max-w-6xl mx-auto p-4 md:p-6">

        {/* Back Button */}
        <button
          onClick={() => setActiveCategory && setActiveCategory('overview')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* TOP ROW - Card Info + Card Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* LEFT - Card Info */}
          <div className="space-y-6">
            {/* Card Header Info */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                ••••{cardDetails.lastFour}
              </span>
              <span>·</span>
              <span>{cardDetails.expiry}</span>
            </div>

            {/* Card Name */}
            <h1 className="text-2xl md:text-3xl font-medium text-gray-900">
              {cardDetails.cardName}
            </h1>

            {/* Spent / Left Progress */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-900 font-medium">{formatCurrency(spentThisMonth)}</span>
                  <span className="text-gray-400 ml-1">spent</span>
                </div>
                <div>
                  <span className="text-gray-900 font-medium">{formatCurrency(leftInBudget)}</span>
                  <span className="text-gray-400 ml-1">left</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-900 to-gray-700 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowTopUpModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Top Up
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm">
                <ArrowUpRight className="w-4 h-4" />
                Send
              </button>
              <button
                onClick={handleToggleFreeze}
                disabled={togglingFreeze}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm ${
                  cardFrozen
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {togglingFreeze ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Snowflake className="w-4 h-4" />
                )}
                {cardFrozen ? 'Unfreeze' : 'Freeze'}
              </button>
            </div>
          </div>

          {/* RIGHT - Card Visual */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-80 h-48">
              {/* Card */}
              <div className={`relative w-full h-full rounded-2xl p-6 transform transition-all duration-500 ${
                cardFrozen ? 'opacity-60 scale-95' : 'hover:scale-105 hover:-rotate-1'
              }`}
                style={{
                  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 30%, #0d0d0d 70%, #000000 100%)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05) inset'
                }}
              >
                {/* Glassmorphic overlay */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
                  <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/3 rounded-full blur-3xl" />
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
                </div>

                {/* Card Content */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                  {/* Top Row - Logo */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white text-sm font-semibold tracking-wide">PrivateCharterX</p>
                      <p className="text-[9px] text-gray-500 tracking-widest mt-0.5">PLATINUM</p>
                    </div>
                    {/* Chip */}
                    <div className="w-10 h-8 rounded bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 opacity-80"
                      style={{
                        background: 'linear-gradient(135deg, #d4af37 0%, #f4e5b0 30%, #d4af37 60%, #aa8c2c 100%)'
                      }}
                    />
                  </div>

                  {/* Card Number */}
                  <div>
                    <p className="text-white text-base tracking-[0.25em] font-mono">
                      {showCardNumber ? cardDetails.fullNumber : `••••  ••••  ••••  ${cardDetails.lastFour}`}
                    </p>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] text-gray-500 mb-0.5 tracking-wider">CARDHOLDER</p>
                      <p className="text-white text-xs tracking-wide">{cardDetails.cardHolder}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-gray-500 mb-0.5 tracking-wider">EXPIRES</p>
                      <p className="text-white text-xs font-mono">{cardDetails.expiry}</p>
                    </div>
                    {/* Mastercard Logo */}
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-red-500" />
                      <div className="w-8 h-8 rounded-full bg-yellow-400 opacity-90" />
                    </div>
                  </div>
                </div>

                {/* Frozen Overlay */}
                {cardFrozen && (
                  <div className="absolute inset-0 bg-blue-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <div className="text-center">
                      <Snowflake className="w-10 h-10 text-blue-300 mx-auto mb-2" />
                      <p className="text-white text-sm font-medium">Card Frozen</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW - Full Width Tabs & Content */}
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              {[
                { id: 'transactions', label: 'Transactions' },
                { id: 'settings', label: 'Settings' },
                { id: 'details', label: 'Card details' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {/* Filters Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                    All <ChevronRight className="w-3 h-3 rotate-90" />
                  </button>
                  <span className="text-gray-300">·</span>
                  <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                    transactions <ChevronRight className="w-3 h-3 rotate-90" />
                  </button>
                  <span className="text-gray-300">·</span>
                  <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                    for this month <ChevronRight className="w-3 h-3 rotate-90" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">On the map</span>
                  <button
                    onClick={() => setShowOnMap(!showOnMap)}
                    className={`w-10 h-6 rounded-full relative transition-all ${showOnMap ? 'bg-gray-900' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${showOnMap ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {/* Transaction List Header */}
              <div className="grid grid-cols-12 gap-4 text-[10px] text-gray-400 uppercase tracking-wider px-2">
                <div className="col-span-5">Description</div>
                <div className="col-span-4">Payment reason</div>
                <div className="col-span-3 text-right">Amount</div>
              </div>

              {/* Transaction List */}
              <div className="space-y-1">
                {filteredTransactions.map((tx, idx) => {
                  const isNewDay = idx === 0 || formatDate(tx.date) !== formatDate(filteredTransactions[idx - 1]?.date);
                  return (
                    <React.Fragment key={tx.id}>
                      {isNewDay && (
                        <div className="text-xs text-gray-400 pt-4 pb-2 px-2">
                          {formatDate(tx.date)}, {new Date(tx.date).toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                      )}
                      <div className="grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-gray-50/80 transition-all cursor-pointer group">
                        {/* Image + Merchant */}
                        <div className="col-span-5 flex items-center gap-3">
                          {tx.isTransfer ? (
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tx.color} flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}>
                              {tx.initials}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {tx.image ? (
                                <img
                                  src={tx.image}
                                  alt={tx.merchant}
                                  className="w-7 h-7 object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="w-full h-full bg-gray-200 items-center justify-center text-gray-500 text-xs font-bold" style={{ display: tx.image ? 'none' : 'flex' }}>
                                {tx.merchant.charAt(0)}
                              </div>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 font-medium truncate">{tx.merchant}</p>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(tx.status)}
                              <span className="text-[10px] text-gray-400">{tx.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Reason */}
                        <div className="col-span-4">
                          <p className="text-sm text-gray-500">{tx.paymentReason || '—'}</p>
                        </div>

                        {/* Amount */}
                        <div className="col-span-3 text-right flex items-center justify-end gap-2">
                          <span className={`text-sm font-medium ${
                            tx.status === 'rejected' ? 'text-gray-400 line-through' :
                            tx.amount > 0 ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {tx.amount > 0 ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all">
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Controls */}
              <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-100 divide-y divide-gray-100">
                <p className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Card Controls</p>

                {[
                  { icon: Snowflake, label: 'Freeze card', desc: 'Temporarily disable all transactions', toggle: true, value: cardFrozen, onToggle: handleToggleFreeze },
                  { icon: Globe, label: 'International payments', desc: 'Enable payments abroad', toggle: true, value: true },
                  { icon: Smartphone, label: 'Contactless payments', desc: 'Tap to pay', toggle: true, value: true },
                  { icon: Lock, label: 'Online payments', desc: 'E-commerce transactions', toggle: true, value: true },
                  { icon: MapPin, label: 'ATM withdrawals', desc: 'Cash withdrawals', toggle: true, value: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                    {item.toggle && (
                      <button
                        onClick={item.onToggle}
                        className={`w-11 h-6 rounded-full relative transition-all ${item.value ? 'bg-gray-900' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${item.value ? 'right-1' : 'left-1'}`} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Security & Management */}
              <div className="space-y-6">
                <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-100 divide-y divide-gray-100">
                  <p className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Security</p>

                  {[
                    { icon: Hash, label: 'Change PIN' },
                    { icon: Bell, label: 'Transaction alerts' },
                    { icon: Target, label: 'Spending limits' },
                    { icon: ShieldCheck, label: '3D Secure', badge: 'Enabled' },
                  ].map((item, idx) => (
                    <button key={idx} className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <p className="text-sm text-gray-900">{item.label}</p>
                      </div>
                      {item.badge ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">{item.badge}</span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-100 divide-y divide-gray-100">
                  <p className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Card Management</p>

                  <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-gray-900">Order physical card</p>
                        <p className="text-xs text-gray-400">Premium metal card</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-900">Replace card</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-all text-red-600">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <p className="text-sm">Report lost or stolen</p>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CARD DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-100 p-5 space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Card number</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-900">
                      {showCardNumber ? cardDetails.fullNumber : `•••• •••• •••• ${cardDetails.lastFour}`}
                    </span>
                    <button onClick={() => setShowCardNumber(!showCardNumber)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
                      {showCardNumber ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Expiry date</span>
                  <span className="text-sm font-mono text-gray-900">{cardDetails.expiry}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">CVV</span>
                  <span className="text-sm font-mono text-gray-900">{showCardNumber ? cardDetails.cvv : '•••'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Cardholder</span>
                  <span className="text-sm text-gray-900">{cardDetails.cardHolder}</span>
                </div>
              </div>

              {/* Add to Wallet */}
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-3 p-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Add to Apple Wallet
                </button>
                <button className="w-full flex items-center justify-center gap-3 p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                  </svg>
                  Add to Google Pay
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top-Up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Top Up Card</h3>
                <button onClick={() => { setShowTopUpModal(false); setTopUpMethod(null); setTopUpAmount(''); }} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4">
                {!topUpMethod ? (
                  <div className="space-y-2">
                    {[
                      { id: 'bank', icon: Building2, label: 'Bank Transfer', desc: 'ACH/SEPA • 1-3 days • Free' },
                      { id: 'card', icon: CreditCard, label: 'Debit Card', desc: 'Instant • 1.5% fee' },
                      { id: 'crypto', icon: Wallet, label: 'Crypto', desc: 'USDC, USDT, ETH • Instant' },
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setTopUpMethod(method.id)}
                        className="w-full p-4 border border-gray-200 rounded-xl flex items-center gap-3 hover:bg-gray-50 transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                          <method.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900">{method.label}</p>
                          <p className="text-xs text-gray-500">{method.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <button onClick={() => setTopUpMethod(null)} className="text-xs text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
                      <ChevronLeft className="w-3 h-3" /> Back
                    </button>

                    <div className="mb-4">
                      <label className="block text-xs text-gray-600 mb-2">Amount</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">$</span>
                        <input
                          type="number"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-2xl"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mb-6">
                      {[100, 500, 1000, 5000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setTopUpAmount(amt.toString())}
                          className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200 font-medium"
                        >
                          ${amt.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleTopUp}
                      disabled={!topUpAmount || parseFloat(topUpAmount) <= 0 || processingTopUp}
                      className="w-full py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                    >
                      {processingTopUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                      {processingTopUp ? 'Processing...' : 'Top Up'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
