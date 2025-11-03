import React, { useState, useEffect } from 'react';
import {
  Shield, Plus, Users, CheckCircle, Clock, ArrowRight, Copy, ExternalLink,
  AlertCircle, Wallet, DollarSign, FileText, Settings, Trash2, Send, Check, X
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { BrowserProvider } from 'ethers';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { deploySafe } from '../../lib/safeService';

// PrivateCharterX Treasury wallet address for fee collection
const PRIVATECHARTERX_TREASURY = '0xe2eecbbfe60d013e93c7dc4da482e6657ee7801b';

export default function EscrowPage() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { user } = useAuth();

  const [safes, setSafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSafe, setSelectedSafe] = useState(null);
  const [activeView, setActiveView] = useState('list'); // list, detail

  // Fetch user's safes
  useEffect(() => {
    if (isConnected && address) {
      fetchSafes();
    }
  }, [isConnected, address]);

  const fetchSafes = async () => {
    setLoading(true);
    try {
      // Fetch safes where user is owner or creator
      const { data, error } = await supabase
        .from('safe_accounts')
        .select('*')
        .or(`creator_address.eq.${address},owners.cs.{${address}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSafes(data || []);
    } catch (error) {
      console.error('Error fetching safes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSafeCreated = () => {
    setShowCreateModal(false);
    fetchSafes();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-light text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to create and manage multi-signature escrow accounts
          </p>
          <button
            onClick={() => open()}
            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-end mb-4 sm:mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gray-100 text-black rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Create Safe
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-gray-900 mb-2">What is a Safe Account?</h3>
              <p className="text-sm text-gray-700 mb-3">
                A Safe (formerly Gnosis Safe) is a multi-signature smart contract wallet that requires multiple owner confirmations
                to execute transactions. This adds an extra layer of security for managing digital assets.
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gray-600" />
                  Multiple owners can control the same account
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gray-600" />
                  Requires M-of-N signatures to execute transactions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gray-600" />
                  Perfect for DAOs, businesses, and shared treasuries
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Safes</p>
                <p className="text-2xl font-light text-black">{safes.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-2xl font-light text-black">
                  {safes.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Owned by Me</p>
                <p className="text-2xl font-light text-black">
                  {safes.filter(s => s.creator_address === address).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-2xl font-light text-black">
                  {safes.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Safes List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : safes.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-2xl">
            <Shield size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Safe Accounts Yet</h3>
            <p className="text-gray-500 mb-6">Create your first multi-signature wallet to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create Safe
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safes.map((safe) => (
              <SafeCard
                key={safe.id}
                safe={safe}
                currentAddress={address}
                onSelect={() => {
                  setSelectedSafe(safe);
                  setActiveView('detail');
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Safe Modal */}
      {showCreateModal && (
        <CreateSafeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSafeCreated}
        />
      )}

      {/* Safe Detail Modal */}
      {selectedSafe && activeView === 'detail' && (
        <SafeDetailModal
          safe={selectedSafe}
          onClose={() => {
            setSelectedSafe(null);
            setActiveView('list');
          }}
          onUpdate={fetchSafes}
        />
      )}
    </div>
  );
}

// Safe Card Component
function SafeCard({ safe, currentAddress, onSelect }) {
  const isCreator = safe.creator_address === currentAddress;
  const ownersCount = safe.owners?.length || 0;

  return (
    <div
      onClick={onSelect}
      className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
            <Shield size={24} className="text-gray-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{safe.name}</h3>
            <p className="text-xs text-gray-500">{isCreator ? 'Creator' : 'Owner'}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
          {safe.status}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Threshold:</span>
          <span className="font-medium text-gray-900">{safe.threshold}/{ownersCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Owners:</span>
          <span className="font-medium text-gray-900">{ownersCount}</span>
        </div>
        {safe.safe_address && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Address:</span>
            <span className="font-mono text-xs text-gray-900">
              {safe.safe_address.slice(0, 6)}...{safe.safe_address.slice(-4)}
            </span>
          </div>
        )}
      </div>

      <button className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
        View Details
      </button>
    </div>
  );
}

// Create Safe Modal Component
function CreateSafeModal({ onClose, onSuccess }) {
  const { address } = useAccount();
  const { user } = useAuth();

  const [safeData, setSafeData] = useState({
    name: '',
    description: '',
    owners: [address], // Creator is first owner by default
    threshold: 1,
    network: 'sepolia', // or 'mainnet'
    feeOption: 'classic', // 'classic' (1.5%) or 'disputes' (2.5%)
    feePercentage: 1.5
  });
  const [newOwner, setNewOwner] = useState('');
  const [creating, setCreating] = useState(false);
  const [privateCharterXTermsAccepted, setPrivateCharterXTermsAccepted] = useState(false);
  const [safeGlobalTermsAccepted, setSafeGlobalTermsAccepted] = useState(false);
  const [showPrivateCharterXTermsModal, setShowPrivateCharterXTermsModal] = useState(false);
  const [showSafeGlobalTermsModal, setShowSafeGlobalTermsModal] = useState(false);

  const addOwner = () => {
    if (newOwner && /^0x[a-fA-F0-9]{40}$/.test(newOwner)) {
      if (!safeData.owners.includes(newOwner)) {
        setSafeData(prev => ({
          ...prev,
          owners: [...prev.owners, newOwner]
        }));
        setNewOwner('');
      } else {
        alert('This address is already an owner');
      }
    } else {
      alert('Please enter a valid Ethereum address');
    }
  };

  const removeOwner = (index) => {
    if (safeData.owners.length > 1) {
      setSafeData(prev => ({
        ...prev,
        owners: prev.owners.filter((_, i) => i !== index),
        threshold: Math.min(prev.threshold, prev.owners.length - 1)
      }));
    }
  };

  const createSafe = async () => {
    if (!safeData.name) {
      alert('Please enter a Safe name');
      return;
    }

    if (safeData.threshold > safeData.owners.length) {
      alert('Threshold cannot be greater than number of owners');
      return;
    }

    if (!privateCharterXTermsAccepted || !safeGlobalTermsAccepted) {
      alert('Please accept both PrivateCharterX and Safe Global Terms & Conditions to continue');
      return;
    }

    setCreating(true);
    try {
      // Step 1: Get the signer from the user's wallet
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Step 2: Deploy Safe to blockchain
      console.log('🚀 Deploying Safe to blockchain...');
      const { safeAddress, txHash } = await deploySafe(signer, {
        network: safeData.network,
        owners: safeData.owners,
        threshold: safeData.threshold,
        feeOption: safeData.feeOption,
        feePercentage: safeData.feePercentage
      });

      console.log(`✅ Safe deployed at: ${safeAddress}`);

      // Step 3: Save to database with deployed address
      const { data, error} = await supabase
        .from('safe_accounts')
        .insert([{
          creator_address: address,
          user_id: user?.id,
          name: safeData.name,
          description: safeData.description,
          owners: safeData.owners,
          threshold: safeData.threshold,
          network: safeData.network,
          safe_address: safeAddress, // Store deployed address
          fee_option: safeData.feeOption,
          fee_percentage: safeData.feePercentage,
          terms_accepted_at: new Date().toISOString(),
          status: 'active', // Mark as active since deployment succeeded
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      alert(`Safe created successfully!\n\nAddress: ${safeAddress}\nTransaction: ${txHash}`);
      onSuccess && onSuccess(data[0]);
    } catch (error) {
      console.error('Error creating Safe:', error);
      alert(`Failed to create Safe: ${error.message || 'Unknown error'}\n\nPlease ensure you have sufficient funds for gas fees and try again.`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] sm:h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-medium text-gray-900">Create Safe Escrow</h2>
            <p className="text-xs text-gray-500 mt-0.5">Multi-signature wallet with automatic fee collection</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Split Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Side - Form */}
          <div className="w-full lg:w-1/2 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 lg:border-r border-gray-200">
            {/* Basic Info */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Safe Name *</label>
              <input
                type="text"
                value={safeData.name}
                onChange={(e) => setSafeData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Company Treasury"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={safeData.description}
                onChange={(e) => setSafeData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Optional..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Network *</label>
              <select
                value={safeData.network}
                onChange={(e) => setSafeData(prev => ({ ...prev, network: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="sepolia">Sepolia (Testnet)</option>
                <option value="mainnet">Ethereum Mainnet</option>
                <option value="polygon">Polygon</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="base">Base</option>
              </select>
            </div>

            {/* Owners */}
            <div className="pt-3 border-t border-gray-200">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Safe Owners *</label>
              <p className="text-xs text-gray-500 mb-2">Add wallet addresses who can sign transactions</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0x..."
                />
                <button
                  onClick={addOwner}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {safeData.owners.map((owner, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                    <span className="font-mono text-gray-900 truncate">{owner.slice(0, 10)}...{owner.slice(-8)}</span>
                    <div className="flex items-center gap-2">
                      {index === 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">You</span>}
                      {index !== 0 && (
                        <button onClick={() => removeOwner(index)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Confirmation Threshold * <span className="text-gray-500 font-normal">({safeData.threshold} of {safeData.owners.length})</span>
              </label>
              <select
                value={safeData.threshold}
                onChange={(e) => setSafeData(prev => ({
                  ...prev,
                  threshold: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                {Array.from({ length: safeData.owners.length }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>
                    {num} of {safeData.owners.length} signature{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Signatures required to execute transactions</p>
            </div>

            {/* Fee Structure */}
            <div className="pt-3 border-t border-gray-200">
              <label className="block text-xs font-medium text-gray-700 mb-2">Fee Structure *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSafeData(prev => ({ ...prev, feeOption: 'classic', feePercentage: 1.5 }))}
                  className={`border-2 rounded-lg p-3 text-left transition-all ${
                    safeData.feeOption === 'classic' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-900">Classic</span>
                    {safeData.feeOption === 'classic' && <Check size={14} className="text-black" />}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">1.5%</div>
                  <p className="text-xs text-gray-600">Multi-sig security</p>
                </button>

                <button
                  onClick={() => setSafeData(prev => ({ ...prev, feeOption: 'disputes', feePercentage: 2.5 }))}
                  className={`border-2 rounded-lg p-3 text-left transition-all ${
                    safeData.feeOption === 'disputes' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-900">Managed</span>
                    {safeData.feeOption === 'disputes' && <Check size={14} className="text-black" />}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">2.5%</div>
                  <p className="text-xs text-gray-600">+ Dispute resolution</p>
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="pt-3 border-t border-gray-200 space-y-3">
              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={privateCharterXTermsAccepted}
                  onChange={(e) => setPrivateCharterXTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-black border-gray-300 rounded focus:ring-2 focus:ring-black"
                />
                <span className="text-xs text-gray-700">
                  I accept the{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowPrivateCharterXTermsModal(true); }}
                    className="text-black underline font-medium hover:text-gray-600"
                  >
                    PrivateCharterX T&C
                  </button>
                  {' '}({safeData.feePercentage}% fee)
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={safeGlobalTermsAccepted}
                  onChange={(e) => setSafeGlobalTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-black border-gray-300 rounded focus:ring-2 focus:ring-black"
                />
                <span className="text-xs text-gray-700">
                  I accept the{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowSafeGlobalTermsModal(true); }}
                    className="text-black underline font-medium hover:text-gray-600"
                  >
                    Safe Global Terms
                  </button>
                </span>
              </label>
            </div>
          </div>

          {/* Right Side - Live Preview */}
          <div className="w-full lg:w-1/2 bg-gray-50 p-4 sm:p-6 flex flex-col border-t lg:border-t-0 border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">Safe Preview</h3>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 flex-1">
              {/* Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center">
                  <Shield size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {safeData.name || 'Unnamed Safe'}
                  </h4>
                  <p className="text-xs text-gray-500 capitalize">{safeData.network} Network</p>
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Threshold</span>
                  <span className="font-mono font-medium text-gray-900">
                    {safeData.threshold}/{safeData.owners.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Fee Structure</span>
                  <span className="font-medium text-gray-900">
                    {safeData.feeOption === 'classic' ? 'Classic' : 'Managed'} ({safeData.feePercentage}%)
                  </span>
                </div>
                {safeData.description && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 leading-relaxed">{safeData.description}</p>
                  </div>
                )}
              </div>

              {/* Owners List */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Owners ({safeData.owners.length})</span>
                  <Users size={14} className="text-gray-400" />
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {safeData.owners.map((owner, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-xs font-mono text-gray-900">
                        {owner.slice(0, 8)}...{owner.slice(-6)}
                      </span>
                      {index === 0 && (
                        <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-xs font-medium">You</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Indicators */}
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  {privateCharterXTermsAccepted ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <Clock size={14} className="text-gray-400" />
                  )}
                  <span className={privateCharterXTermsAccepted ? 'text-green-700' : 'text-gray-500'}>
                    PrivateCharterX Terms
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {safeGlobalTermsAccepted ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <Clock size={14} className="text-gray-400" />
                  )}
                  <span className={safeGlobalTermsAccepted ? 'text-green-700' : 'text-gray-500'}>
                    Safe Global Terms
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-auto">
                <div className="flex gap-2">
                  <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Deployment requires gas fees. Make sure you have enough {safeData.network === 'mainnet' ? 'ETH' : safeData.network === 'polygon' ? 'MATIC' : 'test ETH'} in your wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PrivateCharterX Terms & Conditions Modal */}
        {showPrivateCharterXTermsModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">PrivateCharterX Terms & Conditions</h3>
                <button
                  onClick={() => setShowPrivateCharterXTermsModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
                <div className="space-y-4 text-sm text-gray-700">
                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h4>
                    <p>
                      By creating a Safe escrow account on PrivateCharterX, you agree to be bound by these Terms & Conditions.
                      If you do not agree, you must not create a Safe account.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">2. Multi-Signature Wallet Responsibilities</h4>
                    <p className="mb-2">
                      You acknowledge and understand that:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>This is a multi-signature wallet requiring {safeData.threshold} of {safeData.owners.length} owner approvals for transactions</li>
                      <li>You are responsible for securing your private keys and wallet access</li>
                      <li>PrivateCharterX cannot recover lost private keys or reverse transactions</li>
                      <li>You must verify all transaction details before signing</li>
                      <li>Owner addresses cannot be changed after deployment without creating a new Safe</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">3. Fee Structure</h4>
                    <p className="mb-2">
                      You agree to the following fee structure:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-2">
                      <p className="font-medium text-gray-900 mb-1">
                        {safeData.feeOption === 'classic' ? 'Classic Escrow (1.5%)' : 'Managed Escrow (2.5%)'}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        {safeData.feeOption === 'classic'
                          ? 'Standard multi-signature escrow with self-managed dispute resolution'
                          : 'Premium escrow with PrivateCharterX professional dispute resolution and mediation services'
                        }
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs ml-4">
                        <li>Fee percentage: {safeData.feePercentage}% of each transaction</li>
                        <li>Fees are automatically deducted when transactions are executed</li>
                        <li>Fees are sent to PrivateCharterX treasury: {PRIVATECHARTERX_TREASURY}</li>
                        <li>Fees are non-refundable</li>
                      </ul>
                    </div>
                    {safeData.feeOption === 'disputes' && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="font-medium text-blue-900 mb-1">Dispute Resolution Service</p>
                        <p className="text-xs text-blue-700">
                          With the 2.5% fee structure, you gain access to PrivateCharterX's professional dispute resolution service.
                          Our team will mediate and help resolve conflicts between Safe owners according to our dispute resolution policy.
                        </p>
                      </div>
                    )}
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">4. Owner Obligations</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>All owners must act in good faith when approving or rejecting transactions</li>
                      <li>Owners are responsible for reviewing transaction details before signing</li>
                      <li>Owners must maintain secure custody of their private keys</li>
                      <li>Owners agree not to use the Safe for illegal activities</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">5. Blockchain Deployment</h4>
                    <p>
                      Creating a Safe will deploy a smart contract to the {safeData.network} network. You are responsible for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li>Gas fees required for deployment</li>
                      <li>Ensuring sufficient balance in your wallet for deployment</li>
                      <li>Understanding that deployed contracts cannot be deleted, only deactivated</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">6. No Refund Policy</h4>
                    <p>
                      All fees collected by PrivateCharterX are final and non-refundable. This includes:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li>Transaction fees ({safeData.feePercentage}%)</li>
                      <li>Gas fees paid to the blockchain network</li>
                      <li>Any fees paid for dispute resolution services</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">7. Limitation of Liability</h4>
                    <p>
                      PrivateCharterX is not liable for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li>Loss of funds due to lost private keys or compromised wallets</li>
                      <li>Network congestion or blockchain failures</li>
                      <li>Disputes between Safe owners (Classic tier only)</li>
                      <li>Smart contract vulnerabilities or bugs</li>
                      <li>Regulatory changes affecting cryptocurrency transactions</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">8. Modifications</h4>
                    <p>
                      PrivateCharterX reserves the right to modify these terms. Continued use of the service after modifications
                      constitutes acceptance of the new terms.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">9. Contact</h4>
                    <p>
                      For questions about these terms, please contact PrivateCharterX support.
                    </p>
                  </section>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200">
                <button
                  onClick={() => setShowPrivateCharterXTermsModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setPrivateCharterXTermsAccepted(true);
                    setShowPrivateCharterXTermsModal(false);
                  }}
                  className="px-5 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Accept Terms
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Safe Global Terms of Service Modal */}
        {showSafeGlobalTermsModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Safe Global Terms of Service</h3>
                <button
                  onClick={() => setShowSafeGlobalTermsModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
                <div className="space-y-4 text-sm text-gray-700">
                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">About Safe Global</h4>
                    <p>
                      Safe (formerly Gnosis Safe) is a smart contract wallet that requires a minimum number of people to approve a transaction before it can occur (M-of-N). This technology is provided by Safe Global, a leader in digital asset security infrastructure.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h4>
                    <p>
                      By using Safe smart contract wallets, you agree to Safe Global's Terms of Service. Safe Global provides the underlying smart contract infrastructure for multi-signature wallets.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">2. Smart Contract Technology</h4>
                    <p className="mb-2">
                      Safe smart contracts are deployed on the blockchain and operate autonomously. You acknowledge:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Smart contracts are immutable once deployed to the blockchain</li>
                      <li>Safe Global does not have custody or control over your assets</li>
                      <li>You are solely responsible for managing your Safe account</li>
                      <li>Transactions require the configured threshold of owner signatures to execute</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">3. Self-Custody and Responsibility</h4>
                    <p className="mb-2">
                      Safe is a self-custody solution. This means:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>You maintain full control and ownership of your assets</li>
                      <li>You are responsible for securing your private keys</li>
                      <li>Safe Global cannot recover lost keys or reverse transactions</li>
                      <li>No third party can access your Safe without the required signatures</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">4. No Warranty</h4>
                    <p>
                      Safe smart contracts are provided "as is" without warranty of any kind. While Safe contracts are audited and battle-tested,
                      Safe Global makes no guarantees about the absence of bugs or vulnerabilities. Use at your own risk.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">5. Blockchain Risks</h4>
                    <p className="mb-2">
                      Using blockchain technology involves inherent risks:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Network congestion may cause delays or failed transactions</li>
                      <li>Gas fees are required for all blockchain transactions</li>
                      <li>Blockchain transactions are irreversible once confirmed</li>
                      <li>Network forks or upgrades may affect functionality</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">6. Limitation of Liability</h4>
                    <p>
                      Safe Global shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages
                      resulting from your use of Safe smart contracts, including but not limited to loss of funds, loss of data,
                      or business interruption.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">7. Compliance</h4>
                    <p>
                      You are responsible for ensuring your use of Safe complies with all applicable laws and regulations in your jurisdiction.
                      Safe Global does not provide legal or financial advice.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">8. Open Source</h4>
                    <p>
                      Safe smart contracts are open source and available for public review. The code is licensed under LGPL-3.0 and can be
                      found at <a href="https://github.com/safe-global" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">github.com/safe-global</a>.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2">9. More Information</h4>
                    <p>
                      For complete terms and additional information, please visit:{' '}
                      <a href="https://safe.global/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        safe.global/terms
                      </a>
                    </p>
                  </section>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200">
                <button
                  onClick={() => setShowSafeGlobalTermsModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSafeGlobalTermsAccepted(true);
                    setShowSafeGlobalTermsModal(false);
                  }}
                  className="px-5 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Accept Terms
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={createSafe}
            disabled={creating || !safeData.name || !privateCharterXTermsAccepted || !safeGlobalTermsAccepted}
            className="px-6 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Deploying...
              </>
            ) : (
              <>
                <Shield size={16} />
                Create Safe
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Safe Detail Modal Component
function SafeDetailModal({ safe, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, [safe.id]);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('safe_transactions')
      .select('*')
      .eq('safe_id', safe.id)
      .order('created_at', { ascending: false });

    setTransactions(data || []);
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    alert('Address copied!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
              <Shield size={32} className="text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-light text-gray-900">{safe.name}</h2>
              <p className="text-gray-500 text-sm">{safe.threshold}/{safe.owners?.length || 0} Signature Threshold</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {['overview', 'transactions', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="border border-gray-200 rounded-xl p-3 sm:p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network:</span>
                      <span className="font-medium capitalize">{safe.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium capitalize ${
                        safe.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                      }`}>{safe.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(safe.created_at).toLocaleDateString()}</span>
                    </div>
                    {safe.fee_percentage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fee Structure:</span>
                        <span className="font-medium">
                          {safe.fee_option === 'classic' ? 'Classic' : 'Managed'} ({safe.fee_percentage}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-3 sm:p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Safe Address</h4>
                  {safe.safe_address ? (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-gray-900">{safe.safe_address}</span>
                      <button
                        onClick={() => copyAddress(safe.safe_address)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Copy size={16} className="text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Deployment pending...</p>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-3 sm:p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Owners</h4>
                <div className="space-y-2">
                  {safe.owners?.map((owner, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-mono text-gray-900">{owner}</span>
                      <button
                        onClick={() => copyAddress(owner)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Copy size={16} className="text-gray-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Queue</h3>
              {transactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{tx.type}</p>
                          <p className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {tx.confirmations}/{safe.threshold} confirmations
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="border border-gray-200 rounded-xl p-3 sm:p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Danger Zone</h4>
                <p className="text-sm text-gray-600 mb-4">
                  These actions are irreversible. Please proceed with caution.
                </p>
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">
                  Remove Safe
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
