import React, { useState, useEffect } from 'react';
import {
  Shield, Plus, Users, CheckCircle, Clock, ArrowRight, Copy, ExternalLink,
  AlertCircle, Wallet, DollarSign, FileText, Settings, Trash2, Send, Check, X
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

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
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Create Safe
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-gray-900 mb-2">What is a Safe Account?</h3>
              <p className="text-sm text-gray-700 mb-3">
                A Safe (formerly Gnosis Safe) is a multi-signature smart contract wallet that requires multiple owner confirmations
                to execute transactions. This adds an extra layer of security for managing digital assets.
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  Multiple owners can control the same account
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  Requires M-of-N signatures to execute transactions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  Perfect for DAOs, businesses, and shared treasuries
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Safes</p>
                <p className="text-2xl font-light text-black">{safes.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-2xl font-light text-black">
                  {safes.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Owned by Me</p>
                <p className="text-2xl font-light text-black">
                  {safes.filter(s => s.creator_address === address).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-orange-600" />
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
      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{safe.name}</h3>
            <p className="text-xs text-gray-500">{isCreator ? 'Creator' : 'Owner'}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          safe.status === 'active' ? 'bg-green-100 text-green-800' :
          safe.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
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

  const [currentStep, setCurrentStep] = useState(1);
  const [safeData, setSafeData] = useState({
    name: '',
    description: '',
    owners: [address], // Creator is first owner by default
    threshold: 1,
    network: 'sepolia' // or 'mainnet'
  });
  const [newOwner, setNewOwner] = useState('');
  const [creating, setCreating] = useState(false);

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

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('safe_accounts')
        .insert([{
          creator_address: address,
          user_id: user?.id,
          name: safeData.name,
          description: safeData.description,
          owners: safeData.owners,
          threshold: safeData.threshold,
          network: safeData.network,
          status: 'pending', // Will be 'active' after blockchain deployment
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      // Here you would integrate with Safe SDK to deploy the actual Safe
      // For now, we'll just save the configuration

      alert('Safe created successfully! It will be deployed to the blockchain shortly.');
      onSuccess && onSuccess(data[0]);
    } catch (error) {
      console.error('Error creating Safe:', error);
      alert('Failed to create Safe: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-light text-gray-900">Create New Safe</h2>
            <p className="text-sm text-gray-500 mt-1">Multi-signature wallet</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {[
              { id: 1, name: 'Name & Network' },
              { id: 2, name: 'Owners & Threshold' },
              { id: 3, name: 'Review' }
            ].map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    currentStep === step.id ? 'bg-black text-white' :
                    currentStep > step.id ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {currentStep > step.id ? <Check size={20} /> : step.id}
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{step.name}</span>
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-light text-gray-900 mb-6">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Safe Name</label>
                <input
                  type="text"
                  value={safeData.name}
                  onChange={(e) => setSafeData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Company Treasury"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={safeData.description}
                  onChange={(e) => setSafeData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Describe the purpose of this Safe..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                <select
                  value={safeData.network}
                  onChange={(e) => setSafeData(prev => ({ ...prev, network: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="sepolia">Sepolia (Testnet)</option>
                  <option value="mainnet">Ethereum Mainnet</option>
                  <option value="polygon">Polygon</option>
                  <option value="arbitrum">Arbitrum</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-light text-gray-900 mb-6">Owners & Confirmation Threshold</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Safe Owners</label>
                <p className="text-xs text-gray-500 mb-3">
                  Add wallet addresses of all owners. You are already added as the first owner.
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="0x..."
                  />
                  <button
                    onClick={addOwner}
                    className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="space-y-2">
                  {safeData.owners.map((owner, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-900">{owner}</span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">You</span>
                        )}
                      </div>
                      {index !== 0 && (
                        <button
                          onClick={() => removeOwner(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Threshold
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Number of owner confirmations required to execute a transaction
                </p>
                <input
                  type="number"
                  value={safeData.threshold}
                  onChange={(e) => setSafeData(prev => ({
                    ...prev,
                    threshold: Math.min(Math.max(1, parseInt(e.target.value) || 1), prev.owners.length)
                  }))}
                  min="1"
                  max={safeData.owners.length}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Out of {safeData.owners.length} owner(s)
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-light text-gray-900 mb-6">Review & Create</h3>

              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-3">Safe Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">{safeData.name || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network:</span>
                    <span className="font-medium text-gray-900 capitalize">{safeData.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owners:</span>
                    <span className="font-medium text-gray-900">{safeData.owners.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Threshold:</span>
                    <span className="font-medium text-gray-900">{safeData.threshold}/{safeData.owners.length}</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-3">Owner Addresses</h4>
                <div className="space-y-2">
                  {safeData.owners.map((owner, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs text-gray-900">{owner}</span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">You</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Important</p>
                    <p>
                      Creating a Safe will deploy a smart contract on the {safeData.network} network.
                      This requires a blockchain transaction and gas fees.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <div className="flex gap-3">
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
                className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                Next
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={createSafe}
                disabled={creating}
                className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Create Safe
                  </>
                )}
              </button>
            )}
          </div>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
              <Shield size={32} className="text-white" />
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
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
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
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-4">
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
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
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

              <div className="border border-gray-200 rounded-xl p-4">
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
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl p-4">
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
