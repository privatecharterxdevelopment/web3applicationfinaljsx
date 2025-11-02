import React, { useState, useEffect } from 'react';
import {
  Users, DollarSign, TrendingUp, Calendar, Vote, Settings,
  Eye, ExternalLink, BarChart3, Wallet, ArrowUpRight, Copy,
  CheckCircle, Clock, AlertCircle, Plus, Filter, Search
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import DAOCreator from './DAOCreator';

export default function MyDAOs() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { user } = useAuth();

  const [daos, setDaos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [selectedDAO, setSelectedDAO] = useState(null);
  const [filter, setFilter] = useState('all'); // all, created, joined
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch user's DAOs
  useEffect(() => {
    if (isConnected && address) {
      fetchDAOs();
    }
  }, [isConnected, address]);

  const fetchDAOs = async () => {
    setLoading(true);
    try {
      // Fetch DAOs created by user
      const { data: createdDAOs, error: createdError } = await supabase
        .from('daos')
        .select('*')
        .eq('creator_address', address)
        .order('created_at', { ascending: false });

      if (createdError) throw createdError;

      // Fetch DAOs user has joined (where user's address is in whitelisted_addresses or is a safe owner)
      const { data: joinedDAOs, error: joinedError } = await supabase
        .from('daos')
        .select('*')
        .or(`whitelisted_addresses.cs.{${address}},safe_owners.cs.{${address}}`)
        .neq('creator_address', address)
        .order('created_at', { ascending: false });

      if (joinedError) throw joinedError;

      setDaos([
        ...createdDAOs.map(dao => ({ ...dao, role: 'creator' })),
        ...joinedDAOs.map(dao => ({ ...dao, role: 'member' }))
      ]);
    } catch (error) {
      console.error('Error fetching DAOs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDAOCreated = () => {
    setShowCreator(false);
    fetchDAOs();
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    alert('Address copied to clipboard!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={14} />;
      case 'pending':
        return <Clock size={14} />;
      case 'paused':
        return <AlertCircle size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const filteredDAOs = daos
    .filter(dao => {
      if (filter === 'created') return dao.role === 'creator';
      if (filter === 'joined') return dao.role === 'member';
      return true;
    })
    .filter(dao =>
      dao.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-light text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view and manage your DAOs
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
    <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => setShowCreator(true)}
            className="px-4 py-2 bg-gray-100 text-black rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Create DAO
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total DAOs</p>
                <p className="text-2xl font-light text-black">{daos.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-2xl font-light text-black">
                  {daos.filter(d => d.role === 'creator').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Joined</p>
                <p className="text-2xl font-light text-black">
                  {daos.filter(d => d.role === 'member').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-2xl font-light text-black">
                  {daos.filter(d => d.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search DAOs..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-3 rounded-xl transition-colors ${
                filter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('created')}
              className={`px-4 py-3 rounded-xl transition-colors ${
                filter === 'created' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Created
            </button>
            <button
              onClick={() => setFilter('joined')}
              className={`px-4 py-3 rounded-xl transition-colors ${
                filter === 'joined' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Joined
            </button>
          </div>
        </div>

        {/* DAOs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : filteredDAOs.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-2xl">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No DAOs found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search' : 'Create your first DAO to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreator(true)}
                className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Create DAO
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDAOs.map((dao) => (
              <div
                key={dao.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedDAO(dao)}
              >
                {/* Header Image */}
                {dao.header_image_url && (
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    <img
                      src={dao.header_image_url}
                      alt={dao.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Logo & Name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {dao.logo_url ? (
                        <img
                          src={dao.logo_url}
                          alt={dao.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Users size={24} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{dao.name}</h3>
                        <p className="text-xs text-gray-500">{dao.token_symbol}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {dao.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{dao.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{dao.dao_type}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Role</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{dao.role}</p>
                    </div>
                  </div>

                  {/* Governance Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Governance:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {dao.governance_model?.replace('-', ' ')}
                      </span>
                    </div>
                    {dao.fundraising_goal && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Goal:</span>
                        <span className="font-medium text-gray-900">€{parseInt(dao.fundraising_goal).toLocaleString()}</span>
                      </div>
                    )}
                    {dao.use_safe_escrow && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle size={14} />
                        <span>Safe Escrow Enabled</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                      View Details
                    </button>
                    {dao.role === 'creator' && (
                      <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Settings size={18} className="text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DAO Creator Modal */}
      {showCreator && (
        <DAOCreator
          onClose={() => setShowCreator(false)}
          onSuccess={handleDAOCreated}
        />
      )}

      {/* DAO Detail Modal */}
      {selectedDAO && (
        <DAODetailModal
          dao={selectedDAO}
          onClose={() => setSelectedDAO(null)}
          onUpdate={fetchDAOs}
        />
      )}
    </div>
  );
}

// DAO Detail Modal Component
function DAODetailModal({ dao, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    fetchDAOData();
  }, [dao.id]);

  const fetchDAOData = async () => {
    // Fetch transactions
    const { data: txData } = await supabase
      .from('dao_transactions')
      .select('*')
      .eq('dao_id', dao.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (txData) setTransactions(txData);

    // Fetch proposals
    const { data: proposalData } = await supabase
      .from('dao_proposals')
      .select('*')
      .eq('dao_id', dao.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (proposalData) setProposals(proposalData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            {dao.logo_url ? (
              <img src={dao.logo_url} alt={dao.name} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                <Users size={32} className="text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-light text-gray-900">{dao.name}</h2>
              <p className="text-gray-500">{dao.token_symbol}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ExternalLink size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {['overview', 'transactions', 'proposals', 'members'].map((tab) => (
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
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{dao.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{dao.dao_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Governance:</span>
                      <span className="font-medium capitalize">{dao.governance_model?.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Voting Period:</span>
                      <span className="font-medium">{dao.voting_period_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quorum:</span>
                      <span className="font-medium">{dao.quorum_percentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Token Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{dao.token_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Symbol:</span>
                      <span className="font-medium">{dao.token_symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supply:</span>
                      <span className="font-medium">{parseInt(dao.initial_supply || 0).toLocaleString()}</span>
                    </div>
                    {dao.token_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">€{dao.token_price}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {dao.products && dao.products.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Products & Services</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {dao.products.map((product, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-4">
                        <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                        <p className="text-sm font-medium text-gray-900">€{product.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
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
                        <span className="font-medium text-gray-900">€{tx.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'proposals' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Proposals</h3>
              {proposals.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No proposals yet</p>
              ) : (
                <div className="space-y-3">
                  {proposals.map((proposal) => (
                    <div key={proposal.id} className="border border-gray-200 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{proposal.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{proposal.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {proposal.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Members & Whitelist</h3>
              {dao.whitelisted_addresses && dao.whitelisted_addresses.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Whitelisted Addresses</h4>
                  <div className="space-y-2">
                    {dao.whitelisted_addresses.map((addr, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-mono text-gray-900">{addr}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(addr)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Copy size={16} className="text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {dao.safe_owners && dao.safe_owners.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Safe Owners</h4>
                  <div className="space-y-2">
                    {dao.safe_owners.map((addr, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-mono text-gray-900">{addr}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(addr)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Copy size={16} className="text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Threshold: {dao.safe_threshold}/{dao.safe_owners.length} signatures required
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
