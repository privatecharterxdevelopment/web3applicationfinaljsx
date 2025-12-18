import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  DollarSign, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Check, 
  Save
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';

interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  business_type: string;
  status: string;
  deal_status: string | null;
  tier_id: string | null;
  paid_amount: number | null;
  payment_date: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  creator?: {
    name: string;
  };
}

export const PartnerMemberships: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive' | 'expired'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editPartnerData, setEditPartnerData] = useState<Partial<Partner>>({});

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    filterPartners();
  }, [partners, searchTerm, statusFilter]);

  const fetchPartners = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          creator:system_users!created_by (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (err: any) {
      console.error('Error fetching partners:', err);
      showError('Error', 'Failed to fetch partners');
    } finally {
      setIsLoading(false);
    }
  };

  const filterPartners = () => {
    let filtered = partners;

    if (searchTerm) {
      filtered = filtered.filter(partner => 
        partner.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.business_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(partner => partner.status === statusFilter);
    }

    setFilteredPartners(filtered);
  };

  const updatePartnerStatus = async (partnerId: string, newStatus: 'pending' | 'active' | 'inactive' | 'expired') => {
    try {
      setIsUpdatingStatus(true);
      
      const { error } = await supabase
        .from('partners')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;
      
      showSuccess('Success', `Partner status updated to ${newStatus}`);
      
      // Update local state
      setPartners(prevPartners => 
        prevPartners.map(partner => 
          partner.id === partnerId ? { ...partner, status: newStatus } : partner
        )
      );
      
      // Update selected partner if details modal is open
      if (selectedPartner && selectedPartner.id === partnerId) {
        setSelectedPartner({...selectedPartner, status: newStatus});
      }
    } catch (err: any) {
      console.error('Error updating partner status:', err);
      showError('Error', 'Failed to update partner status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const updatePartner = async () => {
    if (!selectedPartner) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('partners')
        .update({ 
          ...editPartnerData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPartner.id);

      if (error) throw error;
      
      showSuccess('Success', 'Partner updated successfully');
      
      // Update local state
      setPartners(prevPartners => 
        prevPartners.map(partner => 
          partner.id === selectedPartner.id ? { 
            ...partner, 
            ...editPartnerData,
            updated_at: new Date().toISOString()
          } : partner
        )
      );
      
      // Update selected partner if details modal is open
      if (selectedPartner) {
        setSelectedPartner({...selectedPartner, ...editPartnerData});
      }
      
      setShowEditModal(false);
      setEditPartnerData({});
      setSelectedPartner(null);
      fetchPartners();
    } catch (err: any) {
      console.error('Error updating partner:', err);
      showError('Error', 'Failed to update partner');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'inactive': return <X className="w-4 h-4 text-gray-500" />;
      case 'expired': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading partner memberships...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black">Partner Memberships</h2>
          <button 
            onClick={() => window.location.hash = "#partners"}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Partner</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search partners by name, contact, email, or business type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Company</th>
                <th className="text-left p-4 font-medium text-gray-700">Contact</th>
                <th className="text-left p-4 font-medium text-gray-700">Status</th>
                <th className="text-left p-4 font-medium text-gray-700">Tier</th>
                <th className="text-left p-4 font-medium text-gray-700">Payment</th>
                <th className="text-left p-4 font-medium text-gray-700">Expiry</th>
                <th className="text-left p-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner) => {
                const daysUntilExpiry = getDaysUntilExpiry(partner.expiry_date);
                
                return (
                  <tr key={partner.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-black">{partner.company_name}</p>
                          <p className="text-xs text-gray-500">{partner.business_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-black">{partner.contact_name}</p>
                        <p className="text-sm text-gray-500">{partner.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(partner.status)}
                        <select
                          value={partner.status}
                          onChange={(e) => updatePartnerStatus(partner.id, e.target.value as any)}
                          disabled={isUpdatingStatus}
                          className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(partner.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{partner.tier_id || 'No tier'}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        {partner.paid_amount ? (
                          <p className="font-medium text-black">CHF {partner.paid_amount.toLocaleString()}</p>
                        ) : (
                          <p className="text-sm text-gray-500">No payment</p>
                        )}
                        {partner.payment_date && (
                          <p className="text-xs text-gray-500">
                            Paid: {formatDate(partner.payment_date)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        {partner.expiry_date ? (
                          <>
                            <p className="font-medium text-black">{formatDate(partner.expiry_date)}</p>
                            {daysUntilExpiry !== null && (
                              <p className={`text-xs ${
                                daysUntilExpiry < 0 ? 'text-red-500' : 
                                daysUntilExpiry < 30 ? 'text-yellow-500' : 
                                'text-green-500'
                              }`}>
                                {daysUntilExpiry < 0 
                                  ? `Expired ${Math.abs(daysUntilExpiry)} days ago` 
                                  : `${daysUntilExpiry} days remaining`
                                }
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">No expiry date</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => {
                          setSelectedPartner(partner);
                          setEditPartnerData({
                            status: partner.status,
                            tier_id: partner.tier_id,
                            paid_amount: partner.paid_amount,
                            payment_date: partner.payment_date,
                            expiry_date: partner.expiry_date
                          });
                          setShowEditModal(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit Membership</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredPartners.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No partners found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'No partners have been added yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit Membership Modal */}
      {showEditModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Edit Membership</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditPartnerData({});
                  setSelectedPartner(null);
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Partner:</p>
                <p className="font-medium text-black">{selectedPartner.company_name}</p>
                <p className="text-sm text-gray-500">{selectedPartner.contact_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Status
                </label>
                <select
                  value={editPartnerData.status || selectedPartner.status}
                  onChange={(e) => setEditPartnerData({ ...editPartnerData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Tier
                </label>
                <select
                  value={editPartnerData.tier_id !== undefined ? editPartnerData.tier_id || '' : selectedPartner.tier_id || ''}
                  onChange={(e) => setEditPartnerData({ ...editPartnerData, tier_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">No tier</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">CHF</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPartnerData.paid_amount !== undefined ? editPartnerData.paid_amount || '' : selectedPartner.paid_amount || ''}
                    onChange={(e) => setEditPartnerData({ ...editPartnerData, paid_amount: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={editPartnerData.payment_date !== undefined ? editPartnerData.payment_date || '' : selectedPartner.payment_date?.split('T')[0] || ''}
                  onChange={(e) => setEditPartnerData({ ...editPartnerData, payment_date: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={editPartnerData.expiry_date !== undefined ? editPartnerData.expiry_date || '' : selectedPartner.expiry_date?.split('T')[0] || ''}
                  onChange={(e) => setEditPartnerData({ ...editPartnerData, expiry_date: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditPartnerData({});
                  setSelectedPartner(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updatePartner}
                disabled={isSaving}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Membership</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};