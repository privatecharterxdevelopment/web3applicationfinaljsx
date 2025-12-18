import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Building2, 
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  FileText,
  Video,
  Upload,
  Download,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';
import { AddLeadModal } from './AddLeadModal';

interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  business_type: string;
  status: 'pending' | 'active' | 'inactive' | 'expired';
  deal_status: 'new' | 'contacted' | 'zoom_call' | 'contracting' | 'closed' | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  creator?: {
    name: string;
  };
  notes?: string;
  source?: string;
}

interface LeadAcquisitionProps {
  onLeadConverted: () => void;
}

export const LeadAcquisition: React.FC<LeadAcquisitionProps> = ({ onLeadConverted }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dealStatusFilter, setDealStatusFilter] = useState<'all' | 'new' | 'contacted' | 'zoom_call' | 'contracting' | 'closed'>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState('');
  const [editLeadData, setEditLeadData] = useState<Partial<Lead>>({});
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertNotes, setConvertNotes] = useState('');
  const [convertAmount, setConvertAmount] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, dealStatusFilter, sourceFilter]);

  const fetchLeads = async () => {
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
      
      // Extract unique sources
      const sources = [...new Set(data?.map(lead => lead.source).filter(Boolean))];
      setLeadSources(['CSV Import', 'Website', 'Referral', 'Cold Call', 'Event', 'Other', ...sources]);
      
      setLeads(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leads');
      console.error('Error fetching leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.business_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.creator?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dealStatusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.deal_status === dealStatusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    setFilteredLeads(filtered);
  };

  const updateLeadDealStatus = async (leadId: string, newDealStatus: 'new' | 'contacted' | 'zoom_call' | 'contracting' | 'closed') => {
    try {
      setIsUpdatingStatus(true);
      const { error } = await supabase
        .from('partners')
        .update({ 
          deal_status: newDealStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;
      
      showSuccess('Success', `Lead status updated to ${formatDealStatus(newDealStatus)}`);
      
      // Update local state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? { ...lead, deal_status: newDealStatus } : lead
        )
      );
      
      // Update selected lead if details modal is open
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({...selectedLead, deal_status: newDealStatus});
      }
    } catch (err: any) {
      console.error('Error updating lead status:', err);
      showError('Error', 'Failed to update lead status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const updateLead = async () => {
    if (!selectedLead) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('partners')
        .update({ 
          ...editLeadData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLead.id);

      if (error) throw error;
      
      showSuccess('Success', 'Lead updated successfully');
      
      // Update local state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === selectedLead.id ? { 
            ...lead, 
            ...editLeadData,
            updated_at: new Date().toISOString()
          } : lead
        )
      );
      
      // Update selected lead if details modal is open
      if (showDetailsModal) {
        setSelectedLead({...selectedLead, ...editLeadData});
      }
      
      setShowEditModal(false);
      setEditLeadData({});
    } catch (err: any) {
      console.error('Error updating lead:', err);
      showError('Error', 'Failed to update lead');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', leadId);

      if (error) throw error;
      
      showSuccess('Success', 'Lead deleted successfully');
      
      // Update local state
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
      
      // Close modal if open
      if (selectedLead && selectedLead.id === leadId) {
        setShowDetailsModal(false);
        setSelectedLead(null);
      }
    } catch (err: any) {
      console.error('Error deleting lead:', err);
      showError('Error', 'Failed to delete lead');
    }
  };

  const convertToDeal = async () => {
    if (!selectedLead || !convertAmount) return;
    
    try {
      setIsSaving(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      // Create a new deal
      const { error: dealError } = await supabase
        .from('sales_deals')
        .insert([{
          sales_user_id: systemUser.id,
          partner_id: selectedLead.id,
          deal_amount: parseFloat(convertAmount),
          deal_date: new Date().toISOString().split('T')[0],
          commission_rate: 0.1, // Default 10%
          notes: convertNotes,
          status: 'pending'
        }]);

      if (dealError) throw dealError;

      // Update the lead status
      const { error: leadError } = await supabase
        .from('partners')
        .update({ 
          deal_status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLead.id);

      if (leadError) throw leadError;
      
      showSuccess('Success', 'Lead converted to deal successfully');
      
      // Update local state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === selectedLead.id ? { 
            ...lead, 
            deal_status: 'closed',
            updated_at: new Date().toISOString()
          } : lead
        )
      );
      
      setShowConvertModal(false);
      setShowDetailsModal(false);
      setSelectedLead(null);
      setConvertNotes('');
      setConvertAmount('');
      
      // Refresh deals in parent component
      onLeadConverted();
    } catch (err: any) {
      console.error('Error converting lead to deal:', err);
      showError('Error', 'Failed to convert lead to deal');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDealStatusColor = (status: string | null) => {
    switch (status) {
      case 'new': return 'bg-gray-100 text-gray-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'zoom_call': return 'bg-purple-100 text-purple-800';
      case 'contracting': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDealStatusIcon = (status: string | null) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'contacted': return <Mail className="w-4 h-4 text-blue-500" />;
      case 'zoom_call': return <Video className="w-4 h-4 text-purple-500" />;
      case 'contracting': return <FileText className="w-4 h-4 text-yellow-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDealStatus = (status: string | null) => {
    if (!status) return 'New';
    
    switch (status) {
      case 'contacted': return 'Contacted';
      case 'zoom_call': return 'Zoom Call';
      case 'contracting': return 'Contracting';
      case 'closed': return 'Closed Deal';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black">Lead Acquisition</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search leads by name, contact, email, or business type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={dealStatusFilter}
                onChange={(e) => setDealStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="zoom_call">Zoom Call</option>
                <option value="contracting">Contracting</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Sources</option>
              {leadSources.map((source) => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{leads.length}</p>
          <p className="text-sm text-gray-500">Total Leads</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{leads.filter(l => l.deal_status === 'new').length}</p>
          <p className="text-sm text-gray-500">New Leads</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{leads.filter(l => l.deal_status === 'contacted' || l.deal_status === 'zoom_call').length}</p>
          <p className="text-sm text-gray-500">In Progress</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{leads.filter(l => l.deal_status === 'closed').length}</p>
          <p className="text-sm text-gray-500">Converted</p>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Company</th>
                <th className="text-left p-4 font-medium text-gray-700">Contact</th>
                <th className="text-left p-4 font-medium text-gray-700">Business Type</th>
                <th className="text-left p-4 font-medium text-gray-700">Source</th>
                <th className="text-left p-4 font-medium text-gray-700">Status</th>
                <th className="text-left p-4 font-medium text-gray-700">Created By</th>
                <th className="text-left p-4 font-medium text-gray-700">Created At</th>
                <th className="text-left p-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-black">{lead.company_name}</p>
                        {lead.website && (
                          <a 
                            href={lead.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                          >
                            <Globe className="w-3 h-3" />
                            <span>{lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-black">{lead.contact_name}</p>
                      <p className="text-xs text-gray-500">{lead.email}</p>
                      {lead.phone && (
                        <p className="text-xs text-gray-500">{lead.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{lead.business_type}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{lead.source || 'Manual Entry'}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {getDealStatusIcon(lead.deal_status)}
                      <select
                        value={lead.deal_status || 'new'}
                        onChange={(e) => updateLeadDealStatus(lead.id, e.target.value as any)}
                        disabled={isUpdatingStatus}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${getDealStatusColor(lead.deal_status)}`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="zoom_call">Zoom Call</option>
                        <option value="contracting">Contracting</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{lead.creator?.name || 'Unknown'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{formatDate(lead.created_at)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedLead(lead);
                          setEditLeadData({
                            company_name: lead.company_name,
                            contact_name: lead.contact_name,
                            email: lead.email,
                            phone: lead.phone,
                            website: lead.website,
                            business_type: lead.business_type,
                            source: lead.source,
                            notes: lead.notes
                          });
                          setShowEditModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="Edit Lead"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteLead(lead.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLeads.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No leads found</h3>
          <p className="text-gray-500">
            {searchTerm || dealStatusFilter !== 'all' || sourceFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'No leads have been added yet'
            }
          </p>
        </div>
      )}

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onLeadAdded={fetchLeads}
      />

      {/* Edit Lead Modal */}
      {showEditModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Edit Lead</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditLeadData({});
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Company Information */}
              <div>
                <h3 className="text-lg font-medium text-black mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Company Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={editLeadData.company_name || selectedLead.company_name}
                      onChange={(e) => setEditLeadData({ ...editLeadData, company_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type *
                    </label>
                    <input
                      type="text"
                      value={editLeadData.business_type || selectedLead.business_type}
                      onChange={(e) => setEditLeadData({ ...editLeadData, business_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="e.g., Aviation, Finance, Technology"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={editLeadData.website !== undefined ? editLeadData.website || '' : selectedLead.website || ''}
                      onChange={(e) => setEditLeadData({ ...editLeadData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-black mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      value={editLeadData.contact_name || selectedLead.contact_name}
                      onChange={(e) => setEditLeadData({ ...editLeadData, contact_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={editLeadData.email || selectedLead.email}
                      onChange={(e) => setEditLeadData({ ...editLeadData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editLeadData.phone !== undefined ? editLeadData.phone || '' : selectedLead.phone || ''}
                      onChange={(e) => setEditLeadData({ ...editLeadData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-medium text-black mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Additional Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lead Source
                    </label>
                    <select
                      value={editLeadData.source !== undefined ? editLeadData.source || '' : selectedLead.source || ''}
                      onChange={(e) => setEditLeadData({ ...editLeadData, source: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">Select a source</option>
                      {leadSources.map((source) => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={editLeadData.notes !== undefined ? editLeadData.notes || '' : selectedLead.notes || ''}
                      onChange={(e) => setEditLeadData({ ...editLeadData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Add any notes about this lead..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditLeadData({});
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateLead}
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
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {showDetailsModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Lead Details</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setEditLeadData({
                      company_name: selectedLead.company_name,
                      contact_name: selectedLead.contact_name,
                      email: selectedLead.email,
                      phone: selectedLead.phone,
                      website: selectedLead.website,
                      business_type: selectedLead.business_type,
                      source: selectedLead.source,
                      notes: selectedLead.notes
                    });
                    setShowEditModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                  title="Edit Lead"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedLead(null);
                  }}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-semibold text-black">{selectedLead.company_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDealStatusColor(selectedLead.deal_status)}`}>
                      {formatDealStatus(selectedLead.deal_status)}
                    </span>
                  </div>
                  <p className="text-gray-600">{selectedLead.business_type}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-black mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{selectedLead.contact_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedLead.email}</span>
                    </div>
                    {selectedLead.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedLead.phone}</span>
                      </div>
                    )}
                    {selectedLead.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedLead.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-black mb-3">Lead Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDealStatusColor(selectedLead.deal_status)}`}>
                        {formatDealStatus(selectedLead.deal_status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Source:</span>
                      <span>{selectedLead.source || 'Manual Entry'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Created By:</span>
                      <span>{selectedLead.creator?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Created At:</span>
                      <span>{formatDate(selectedLead.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedLead.notes && (
                <div>
                  <h4 className="font-medium text-black mb-3">Notes</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">{selectedLead.notes}</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-black mb-3">Lead Status</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => updateLeadDealStatus(selectedLead.id, 'new')}
                    disabled={isUpdatingStatus}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedLead.deal_status === 'new' || !selectedLead.deal_status
                        ? 'border-gray-800 bg-gray-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">New</span>
                    </div>
                    {(selectedLead.deal_status === 'new' || !selectedLead.deal_status) && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => updateLeadDealStatus(selectedLead.id, 'contacted')}
                    disabled={isUpdatingStatus}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedLead.deal_status === 'contacted'
                        ? 'border-blue-800 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Contacted</span>
                    </div>
                    {selectedLead.deal_status === 'contacted' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => updateLeadDealStatus(selectedLead.id, 'zoom_call')}
                    disabled={isUpdatingStatus}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedLead.deal_status === 'zoom_call'
                        ? 'border-purple-800 bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Video className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">Zoom Call</span>
                    </div>
                    {selectedLead.deal_status === 'zoom_call' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => updateLeadDealStatus(selectedLead.id, 'contracting')}
                    disabled={isUpdatingStatus}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedLead.deal_status === 'contracting'
                        ? 'border-yellow-800 bg-yellow-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">Contracting</span>
                    </div>
                    {selectedLead.deal_status === 'contracting' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => deleteLead(selectedLead.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Lead
                </button>
                
                <button
                  onClick={() => {
                    setShowConvertModal(true);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Convert to Deal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Deal Modal */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Convert Lead to Deal</h2>
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setShowDetailsModal(true);
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Converting lead:</p>
                <p className="font-medium text-black">{selectedLead.company_name}</p>
                <p className="text-sm text-gray-500">{selectedLead.contact_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Notes
                </label>
                <textarea
                  value={convertNotes}
                  onChange={(e) => setConvertNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Add any notes about this deal..."
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-blue-700 font-medium">Converting this lead will:</p>
                    <ul className="text-blue-600 mt-1 text-sm list-disc list-inside">
                      <li>Create a new deal with the specified amount</li>
                      <li>Set the lead status to "Closed"</li>
                      <li>Move the lead to your deals pipeline</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setShowDetailsModal(true);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={convertToDeal}
                disabled={!convertAmount || isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Convert to Deal</span>
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