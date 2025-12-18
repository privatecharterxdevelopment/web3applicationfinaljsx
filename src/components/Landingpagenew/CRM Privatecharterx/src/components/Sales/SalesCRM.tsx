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
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  FileText,
  Tag,
  Video,
  Upload,
  Download,
  Users,
  BarChart2,
  Briefcase
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AddDealModal } from './AddDealModal';
import { LeadAcquisition } from './LeadAcquisition';
import { CSVImport } from './CSVImport';

interface SalesDeal {
  id: string;
  sales_user_id: string | null;
  partner_id: string | null;
  deal_amount: number;
  deal_date: string;
  commission_rate: number | null;
  commission_amount: number | null;
  notes: string | null;
  status: 'pending' | 'closed' | 'cancelled';
  created_at: string | null;
  updated_at: string | null;
  partner?: {
    company_name: string;
    contact_name: string;
    email: string;
    business_type: string;
  };
  system_users?: {
    name: string;
  };
}

export const SalesCRM: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<'deals' | 'acquisition' | 'analytics'>('deals');
  const [deals, setDeals] = useState<SalesDeal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<SalesDeal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'closed' | 'cancelled'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<SalesDeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'deals') {
      fetchDeals();
      fetchCompanies();
    }
  }, [activeTab]);

  useEffect(() => {
    filterDeals();
  }, [deals, searchTerm, statusFilter]);

  const fetchDeals = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sales_deals')
        .select(`
          *,
          partner:partners!partner_id (company_name, contact_name, email, business_type),
          system_users!sales_user_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch deals');
      console.error('Error fetching deals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name, contact_name, email, business_type')
        .order('company_name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (err: any) {
      console.error('Error fetching companies:', err);
    }
  };

  const filterDeals = () => {
    let filtered = deals;

    if (searchTerm) {
      filtered = filtered.filter(deal => 
        deal.partner?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partner?.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partner?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.partner?.business_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.system_users?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(deal => deal.status === statusFilter);
    }

    setFilteredDeals(filtered);
  };

  const updateDealStatus = async (dealId: string, newStatus: 'pending' | 'closed' | 'cancelled') => {
    try {
      setIsUpdatingStatus(true);
      const { error } = await supabase
        .from('sales_deals')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (error) throw error;
      
      showSuccess('Success', `Deal status updated to ${newStatus}`);
      
      // Update local state
      setDeals(prevDeals => 
        prevDeals.map(deal => 
          deal.id === dealId ? { ...deal, status: newStatus } : deal
        )
      );
      
      // Update selected deal if details modal is open
      if (selectedDeal && selectedDeal.id === dealId) {
        setSelectedDeal({...selectedDeal, status: newStatus});
      }
    } catch (err: any) {
      console.error('Error updating deal status:', err);
      showError('Error', 'Failed to update deal status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const saveDealNotes = async (dealId: string, notes: string) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('sales_deals')
        .update({ 
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (error) throw error;
      
      showSuccess('Success', 'Notes saved successfully');
      fetchDeals();
    } catch (err: any) {
      console.error('Error updating deal:', err);
      showError('Error', err.message || 'Failed to update deal');
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
      case 'closed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'closed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const calculateTotalRevenue = () => {
    return deals.reduce((sum, deal) => sum + deal.deal_amount, 0);
  };

  const calculateTotalCommission = () => {
    return deals.reduce((sum, deal) => sum + (deal.commission_amount || 0), 0);
  };

  if (isLoading && activeTab === 'deals') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading deals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Sales CRM</h1>
            <p className="text-gray-600">Manage deals, leads, and track sales performance</p>
          </div>
          <div className="flex space-x-3">
            {activeTab === 'deals' && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Deal</span>
              </button>
            )}
            {activeTab === 'acquisition' && (
              <button 
                onClick={() => setShowCSVImportModal(true)}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import Leads</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'deals'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Deals</span>
          </button>
          <button
            onClick={() => setActiveTab('acquisition')}
            className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'acquisition'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lead Acquisition</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'analytics'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Deals Tab */}
      {activeTab === 'deals' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">{deals.length}</p>
              <p className="text-sm text-gray-500">Total Deals</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">{deals.filter(d => d.status === 'closed').length}</p>
              <p className="text-sm text-gray-500">Closed Deals</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">${calculateTotalRevenue().toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">${calculateTotalCommission().toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Commission</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search deals by company, contact, or notes..."
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
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Deals Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">Company</th>
                    <th className="text-left p-4 font-medium text-gray-700">Contact</th>
                    <th className="text-left p-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left p-4 font-medium text-gray-700">Commission</th>
                    <th className="text-left p-4 font-medium text-gray-700">Date</th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700">Sales Rep</th>
                    <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-black">{deal.partner?.company_name || 'Unknown Company'}</p>
                            <p className="text-xs text-gray-500">{deal.partner?.business_type || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-black">{deal.partner?.contact_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{deal.partner?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">${deal.deal_amount.toLocaleString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-green-600 font-medium">${(deal.commission_amount || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{(deal.commission_rate || 0) * 100}%</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(deal.deal_date)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(deal.status)}
                          <select
                            value={deal.status}
                            onChange={(e) => updateDealStatus(deal.id, e.target.value as any)}
                            disabled={isUpdatingStatus}
                            className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(deal.status)}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="closed">Closed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{deal.system_users?.name || 'Unknown'}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedDeal(deal);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-black transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredDeals.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No deals found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No deals have been created yet'
                }
              </p>
            </div>
          )}

          {/* Add Deal Modal */}
          <AddDealModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onDealAdded={fetchDeals}
            companies={companies}
          />

          {/* Deal Details Modal */}
          {showDetailsModal && selectedDeal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-black">Deal Details</h2>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedDeal(null);
                    }}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-semibold text-black">{selectedDeal.partner?.company_name || 'Unknown Company'}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedDeal.status)}`}>
                          {selectedDeal.status.charAt(0).toUpperCase() + selectedDeal.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600">{selectedDeal.partner?.business_type || 'Unknown Type'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-black mb-3">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{selectedDeal.partner?.contact_name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{selectedDeal.partner?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-black mb-3">Deal Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-medium">${selectedDeal.deal_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Commission Rate:</span>
                          <span className="font-medium">{((selectedDeal.commission_rate || 0) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Commission Amount:</span>
                          <span className="font-medium text-green-600">${(selectedDeal.commission_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Deal Date:</span>
                          <span className="font-medium">{formatDate(selectedDeal.deal_date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Sales Rep:</span>
                          <span className="font-medium">{selectedDeal.system_users?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedDeal.notes && (
                    <div>
                      <h4 className="font-medium text-black mb-3">Notes</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-line">{selectedDeal.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 flex justify-between">
                    <div>
                      <button
                        onClick={() => updateDealStatus(selectedDeal.id, 'closed')}
                        disabled={selectedDeal.status === 'closed' || isUpdatingStatus}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 mr-2"
                      >
                        Mark as Closed
                      </button>
                      <button
                        onClick={() => updateDealStatus(selectedDeal.id, 'cancelled')}
                        disabled={selectedDeal.status === 'cancelled' || isUpdatingStatus}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Cancel Deal
                      </button>
                    </div>
                    
                    <button
                      onClick={() => window.location.hash = "#partners"}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>View Company</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Lead Acquisition Tab */}
      {activeTab === 'acquisition' && (
        <LeadAcquisition onLeadConverted={fetchDeals} />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Sales Performance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Closed Deals</p>
                <p className="text-2xl font-bold text-black">{deals.filter(d => d.status === 'closed').length}</p>
                <p className="text-xs text-green-600">
                  +{Math.round(deals.filter(d => d.status === 'closed').length / Math.max(deals.length, 1) * 100)}% close rate
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Average Deal Size</p>
                <p className="text-2xl font-bold text-black">
                  ${deals.length > 0 ? Math.round(calculateTotalRevenue() / deals.length).toLocaleString() : 0}
                </p>
                <p className="text-xs text-blue-600">Based on {deals.length} total deals</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Commission Earned</p>
                <p className="text-2xl font-bold text-black">${calculateTotalCommission().toLocaleString()}</p>
                <p className="text-xs text-green-600">
                  {deals.length > 0 ? Math.round(calculateTotalCommission() / calculateTotalRevenue() * 100) : 0}% of total revenue
                </p>
              </div>
            </div>
            
            <div className="h-64 flex items-end space-x-2">
              {deals.length > 0 ? (
                Array.from({ length: 12 }, (_, i) => {
                  // Get month name
                  const date = new Date();
                  date.setMonth(date.getMonth() - 11 + i);
                  const monthName = date.toLocaleString('default', { month: 'short' });
                  
                  // Random value for demo
                  const value = Math.floor(Math.random() * 100);
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${value}%` }}
                      ></div>
                      <p className="text-xs mt-1 text-gray-600">{monthName}</p>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Deal Pipeline</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Leads</span>
                  <span className="text-sm font-medium">{Math.floor(Math.random() * 50)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Qualified Leads</span>
                  <span className="text-sm font-medium">{Math.floor(Math.random() * 40)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Proposals</span>
                  <span className="text-sm font-medium">{Math.floor(Math.random() * 30)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Negotiations</span>
                  <span className="text-sm font-medium">{Math.floor(Math.random() * 20)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Closed Deals</span>
                  <span className="text-sm font-medium">{deals.filter(d => d.status === 'closed').length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Top Performing Categories</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Aviation</span>
                    <span className="text-sm font-medium">$1,250,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Luxury Travel</span>
                    <span className="text-sm font-medium">$850,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Financial Services</span>
                    <span className="text-sm font-medium">$620,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Real Estate</span>
                    <span className="text-sm font-medium">$480,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Technology</span>
                    <span className="text-sm font-medium">$320,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                  <Download className="w-4 h-4" />
                  <span>Download Full Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCSVImportModal && (
        <CSVImport
          isOpen={showCSVImportModal}
          onClose={() => setShowCSVImportModal(false)}
          onImportComplete={() => {
            setShowCSVImportModal(false);
            showSuccess('Success', 'Leads imported successfully');
          }}
        />
      )}
    </div>
  );
};