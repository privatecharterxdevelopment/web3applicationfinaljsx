import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Plus,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
  Search,
  Filter,
  Upload,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import LaunchpadCreateModal from './components/LaunchpadCreateModal';
import LaunchpadEditModal from './components/LaunchpadEditModal';

interface Launchpad {
  id: string;
  name: string;
  description: string;
  category: string;
  asset_type: string;
  location: string;
  year: number;
  header_image_url?: string;
  asset_image_url?: string;
  gallery_images?: string[];
  token_standard: string;
  token_symbol: string;
  token_price: number;
  total_supply: number;
  target_amount: number;
  raised_amount: number;
  min_investment: number;
  max_investment: number;
  expected_apy: number;
  current_phase: string;
  status: string;
  current_waitlist: number;
  target_waitlist: number;
  waitlist_start_date?: string;
  waitlist_end_date?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminLaunchpads() {
  const [launchpads, setLaunchpads] = useState<Launchpad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLaunchpad, setSelectedLaunchpad] = useState<Launchpad | null>(null);

  const { hasPermission } = useAdminPermissions();

  useEffect(() => {
    fetchLaunchpads();
  }, []);

  const fetchLaunchpads = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('launchpad_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setLaunchpads(data || []);
    } catch (err) {
      console.error('Error fetching launchpads:', err);
      setError('Failed to load launchpads');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission('launchpads', 'delete')) {
      alert('You do not have permission to delete launchpads');
      return;
    }

    if (!confirm('Are you sure you want to delete this launchpad? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('launchpad_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'delete',
        p_target_table: 'launchpad_projects',
        p_target_id: id,
        p_admin_notes: 'Launchpad deleted'
      });

      fetchLaunchpads();
    } catch (err) {
      console.error('Error deleting launchpad:', err);
      alert('Failed to delete launchpad');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!hasPermission('launchpads', 'write')) {
      alert('You do not have permission to update launchpads');
      return;
    }

    try {
      const { error } = await supabase
        .from('launchpad_projects')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'update',
        p_target_table: 'launchpad_projects',
        p_target_id: id,
        p_admin_notes: `Status changed to ${newStatus}`
      });

      fetchLaunchpads();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const openEditModal = (launchpad: Launchpad) => {
    setSelectedLaunchpad(launchpad);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setSelectedLaunchpad(null);
    setShowEditModal(false);
    fetchLaunchpads();
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    fetchLaunchpads();
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseColor = (phase: string): string => {
    switch (phase.toLowerCase()) {
      case 'waitlist':
        return 'bg-yellow-100 text-yellow-800';
      case 'fundraising':
        return 'bg-blue-100 text-blue-800';
      case 'spv_formation':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredLaunchpads = launchpads.filter(lp => {
    const matchesSearch = !searchQuery ||
      lp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lp.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lp.status === statusFilter;
    const matchesPhase = phaseFilter === 'all' || lp.current_phase === phaseFilter;

    return matchesSearch && matchesStatus && matchesPhase;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Rocket className="w-8 h-8 text-indigo-600" />
            Launchpad Management
          </h2>
          <p className="text-gray-600">Create and manage Web3.0 launchpad projects</p>
        </div>

        {hasPermission('launchpads', 'create') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Launchpad
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Launchpads</p>
              <p className="text-2xl font-bold text-gray-900">{launchpads.length}</p>
            </div>
            <Rocket className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {launchpads.filter(lp => lp.status === 'active').length}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">
                {launchpads.filter(lp => lp.status === 'upcoming').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Raised</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(launchpads.reduce((sum, lp) => sum + (lp.raised_amount || 0), 0))}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search launchpads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        >
          <option value="all">All Phases</option>
          <option value="waitlist">Waitlist</option>
          <option value="fundraising">Fundraising</option>
          <option value="spv_formation">SPV Formation</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Launchpads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status / Phase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waitlist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fundraising
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLaunchpads.map((launchpad) => (
                <tr key={launchpad.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-lg overflow-hidden">
                        {launchpad.asset_image_url ? (
                          <img
                            src={launchpad.asset_image_url}
                            alt={launchpad.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Rocket className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{launchpad.name}</div>
                        <div className="text-sm text-gray-500">{launchpad.location} • {launchpad.year}</div>
                        <div className="text-xs text-gray-400">{launchpad.asset_type}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(launchpad.status)}`}>
                        {launchpad.status.toUpperCase()}
                      </span>
                      <br />
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPhaseColor(launchpad.current_phase)}`}>
                        {launchpad.current_phase.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {launchpad.current_waitlist} / {launchpad.target_waitlist}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round((launchpad.current_waitlist / launchpad.target_waitlist) * 100)}% filled
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min((launchpad.current_waitlist / launchpad.target_waitlist) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(launchpad.raised_amount)} / {formatCurrency(launchpad.target_amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round((launchpad.raised_amount / launchpad.target_amount) * 100)}% raised
                      </div>
                      <div className="text-xs text-green-600 font-medium">{launchpad.expected_apy}% APY</div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-blue-600">{launchpad.token_symbol}</div>
                      <div className="text-xs text-gray-500">{launchpad.token_standard}</div>
                      <div className="text-xs text-gray-900">{formatCurrency(launchpad.token_price)}/token</div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <a
                        href={`/launchpad/${launchpad.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-900"
                        title="View public page"
                      >
                        <Eye className="w-5 h-5" />
                      </a>
                      {hasPermission('launchpads', 'write') && (
                        <button
                          onClick={() => openEditModal(launchpad)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                      {hasPermission('launchpads', 'delete') && (
                        <button
                          onClick={() => handleDelete(launchpad.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLaunchpads.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Rocket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No launchpads found</p>
              <p className="text-sm">Create your first launchpad project to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <LaunchpadCreateModal
          onClose={closeCreateModal}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedLaunchpad && (
        <LaunchpadEditModal
          launchpad={selectedLaunchpad}
          onClose={closeEditModal}
        />
      )}
    </div>
  );
}
