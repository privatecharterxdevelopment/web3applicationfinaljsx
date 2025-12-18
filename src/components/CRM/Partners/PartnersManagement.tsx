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
  Map
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';
import { AddPartnerModal } from './AddPartnerModal';
import { PartnerMap } from './PartnerMap';
import { PartnerDetails } from './PartnerDetails';

interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  business_type: string;
  tier_id: string | null;
  status: 'pending' | 'active' | 'inactive' | 'expired';
  payment_id: string | null;
  paid_amount: number | null;
  payment_date: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deal_status: 'new' | 'contacted' | 'zoom_call' | 'contracting' | 'closed' | null;
  creator?: {
    name: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export const PartnersManagement: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'inactive' | 'expired'>('all');
  const [dealStatusFilter, setDealStatusFilter] = useState<'all' | 'new' | 'contacted' | 'zoom_call' | 'contracting' | 'closed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showMapView, setShowMapView] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [editPartnerData, setEditPartnerData] = useState<Partial<Partner>>({});
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    filterPartners();
  }, [partners, searchTerm, statusFilter, businessTypeFilter, dealStatusFilter]);

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
      
      // Add mock location data for demonstration
      const partnersWithLocation = data?.map(partner => ({
        ...partner,
        location: generateMockLocation()
      })) || [];
      
      setPartners(partnersWithLocation);
      
      // Extract unique business types
      const types = [...new Set(partnersWithLocation.map(p => p.business_type))];
      setBusinessTypes(types);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch partners');
      console.error('Error fetching partners:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate random location in Europe for demonstration
  const generateMockLocation = () => {
    // Random coordinates roughly in Europe
    const latitude = 46 + (Math.random() * 10 - 5);
    const longitude = 8 + (Math.random() * 20 - 10);
    
    return {
      latitude,
      longitude,
      address: 'Business Address'
    };
  };

  const filterPartners = () => {
    let filtered = partners;

    if (searchTerm) {
      filtered = filtered.filter(partner => 
        partner.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.business_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.creator?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(partner => partner.status === statusFilter);
    }

    if (businessTypeFilter !== 'all') {
      filtered = filtered.filter(partner => partner.business_type === businessTypeFilter);
    }

    if (dealStatusFilter !== 'all') {
      filtered = filtered.filter(partner => partner.deal_status === dealStatusFilter);
    }

    setFilteredPartners(filtered);
  };

  const updatePartnerStatus = async (partnerId: string, newStatus: 'pending' | 'active' | 'inactive' | 'expired') => {
    try {
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
    }
  };

  const updatePartnerDealStatus = async (partnerId: string, newDealStatus: 'new' | 'contacted' | 'zoom_call' | 'contracting' | 'closed') => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ 
          deal_status: newDealStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;
      
      showSuccess('Success', `Deal status updated to ${newDealStatus}`);
      
      // Update local state
      setPartners(prevPartners => 
        prevPartners.map(partner => 
          partner.id === partnerId ? { ...partner, deal_status: newDealStatus } : partner
        )
      );
      
      // Update selected partner if details modal is open
      if (selectedPartner && selectedPartner.id === partnerId) {
        setSelectedPartner({...selectedPartner, deal_status: newDealStatus});
      }
    } catch (err: any) {
      console.error('Error updating deal status:', err);
      showError('Error', 'Failed to update deal status');
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
      if (showDetailsModal) {
        setSelectedPartner({...selectedPartner, ...editPartnerData});
      }
      
      setShowEditModal(false);
      setEditPartnerData({});
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

  const PartnerCard: React.FC<{ partner: Partner }> = ({ partner }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <Building2 className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-black">{partner.company_name}</h3>
            <p className="text-sm text-gray-500">{partner.business_type}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(partner.status)}`}>
            {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
          </span>
          <button 
            onClick={() => {
              setSelectedPartner(partner);
              setShowDetailsModal(true);
            }}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          {user?.role === 'admin' && (
            <button 
              onClick={() => {
                setSelectedPartner(partner);
                setEditPartnerData({
                  company_name: partner.company_name,
                  contact_name: partner.contact_name,
                  email: partner.email,
                  phone: partner.phone,
                  website: partner.website,
                  business_type: partner.business_type,
                  status: partner.status,
                  deal_status: partner.deal_status
                });
                setShowEditModal(true);
              }}
              className="p-2 text-gray-400 hover:text-black transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>{partner.contact_name}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{partner.email}</span>
        </div>
        {partner.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{partner.phone}</span>
          </div>
        )}
        {partner.website && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Globe className="w-4 h-4" />
            <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {partner.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
        {partner.created_at && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Partner since {formatDate(partner.created_at)}</span>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getDealStatusIcon(partner.deal_status)}
            <span className={`text-xs px-2 py-1 rounded-full ${getDealStatusColor(partner.deal_status)}`}>
              {formatDealStatus(partner.deal_status)}
            </span>
          </div>
          {partner.paid_amount && (
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">${partner.paid_amount.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading partners...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Partners Management</h1>
            <p className="text-gray-600">Manage your business partners and memberships</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
            >
              {viewMode === 'grid' ? (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Table View</span>
                </>
              ) : (
                <>
                  <Grid className="w-4 h-4" />
                  <span>Card View</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowMapView(!showMapView)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                showMapView 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } transition-colors`}
            >
              <MapPin className="w-4 h-4" />
              <span>{showMapView ? 'List View' : 'Map View'}</span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Partner</span>
            </button>
          </div>
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
            <select
              value={businessTypeFilter}
              onChange={(e) => setBusinessTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Business Types</option>
              {businessTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={dealStatusFilter}
              onChange={(e) => setDealStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Deal Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="zoom_call">Zoom Call</option>
              <option value="contracting">Contracting</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{partners.length}</p>
          <p className="text-sm text-gray-500">Total Partners</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{partners.filter(p => p.status === 'active').length}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{partners.filter(p => p.deal_status === 'closed').length}</p>
          <p className="text-sm text-gray-500">Closed Deals</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{businessTypes.length}</p>
          <p className="text-sm text-gray-500">Business Types</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">
            ${partners.reduce((sum, p) => sum + (p.paid_amount || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Payments</p>
        </div>
      </div>

      {/* Partners Display */}
      {showMapView && (
        <PartnerMap partners={filteredPartners} onSelectPartner={(partner) => {
          setSelectedPartner(partner);
          setShowDetailsModal(true);
        }} />
      )}
      
      {!showMapView && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      )}
      
      {!showMapView && viewMode === 'table' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">Company</th>
                  <th className="text-left p-4 font-medium text-gray-700">Contact</th>
                  <th className="text-left p-4 font-medium text-gray-700">Business Type</th>
                  <th className="text-left p-4 font-medium text-gray-700">Status</th>
                  <th className="text-left p-4 font-medium text-gray-700">Deal Status</th>
                  <th className="text-left p-4 font-medium text-gray-700">Created</th>
                  <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedPartner(partner);
                        setShowDetailsModal(true);
                      }}>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-black">{partner.company_name}</p>
                          {partner.website && (
                            <a 
                              href={partner.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="w-3 h-3" />
                              <span>{partner.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-black">{partner.contact_name}</p>
                        <p className="text-xs text-gray-500">{partner.email}</p>
                        {partner.phone && (
                          <p className="text-xs text-gray-500">{partner.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{partner.business_type}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(partner.status)}`}>
                        {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getDealStatusColor(partner.deal_status)}`}>
                        {formatDealStatus(partner.deal_status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{formatDate(partner.created_at)}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPartner(partner);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-black transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPartner(partner);
                              setEditPartnerData({
                                company_name: partner.company_name,
                                contact_name: partner.contact_name,
                                email: partner.email,
                                phone: partner.phone,
                                website: partner.website,
                                business_type: partner.business_type,
                                status: partner.status,
                                deal_status: partner.deal_status
                              });
                              setShowEditModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-black transition-colors"
                            title="Edit Partner"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredPartners.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No partners found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || businessTypeFilter !== 'all' || dealStatusFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'No partners have been added yet'
            }
          </p>
        </div>
      )}

      {/* Add Partner Modal */}
      <AddPartnerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onPartnerAdded={fetchPartners}
      />

      {/* Edit Partner Modal */}
      {showEditModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Edit Partner</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditPartnerData({});
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
                      value={editPartnerData.company_name || selectedPartner.company_name}
                      onChange={(e) => setEditPartnerData({ ...editPartnerData, company_name: e.target.value })}
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
                      value={editPartnerData.business_type || selectedPartner.business_type}
                      onChange={(e) => setEditPartnerData({ ...editPartnerData, business_type: e.target.value })}
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
                      value={editPartnerData.website !== undefined ? editPartnerData.website || '' : selectedPartner.website || ''}
                      onChange={(e) => setEditPartnerData({ ...editPartnerData, website: e.target.value })}
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
                      value={editPartnerData.contact_name || selectedPartner.contact_name}
                      onChange={(e) => setEditPartnerData({ ...editPartnerData, contact_name: e.target.value })}
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
                      value={editPartnerData.email || selectedPartner.email}
                      onChange={(e) => setEditPartnerData({ ...editPartnerData, email: e.target.value })}
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
                      value={editPartnerData.phone !== undefined ? editPartnerData.phone || '' : selectedPartner.phone || ''}
                      onChange={(e) => setEditPartnerData({ ...editPartnerData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div>
                <h3 className="text-lg font-medium text-black mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Status Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Partnership Status
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
                      Deal Status
                    </label>
                    <select
                      value={editPartnerData.deal_status || selectedPartner.deal_status || 'new'}
                      onChange={(e) => setEditPartnerData({ ...editPartnerData, deal_status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="zoom_call">Zoom Call</option>
                      <option value="contracting">Contracting</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditPartnerData({});
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
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Details Modal */}
      {showDetailsModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Partner Details</h2>
              <div className="flex items-center space-x-2">
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setEditPartnerData({
                        company_name: selectedPartner.company_name,
                        contact_name: selectedPartner.contact_name,
                        email: selectedPartner.email,
                        phone: selectedPartner.phone,
                        website: selectedPartner.website,
                        business_type: selectedPartner.business_type,
                        status: selectedPartner.status,
                        deal_status: selectedPartner.deal_status
                      });
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                    title="Edit Partner"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedPartner(null);
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
                    <h3 className="text-xl font-semibold text-black">{selectedPartner.company_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedPartner.status)}`}>
                     {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600">{selectedPartner.business_type}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getDealStatusColor(selectedPartner.deal_status)}`}>
                      {formatDealStatus(selectedPartner.deal_status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-black mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{selectedPartner.contact_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedPartner.email}</span>
                    </div>
                    {selectedPartner.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedPartner.phone}</span>
                      </div>
                    )}
                    {selectedPartner.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a href={selectedPartner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedPartner.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-black mb-3">Membership Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedPartner.status)}`}>
                        {selectedPartner.status.charAt(0).toUpperCase() + selectedPartner.status.slice(1)}
                      </span>
                    </div>
                    {selectedPartner.paid_amount && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Paid Amount</span>
                        <span className="font-medium">${selectedPartner.paid_amount.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedPartner.payment_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Payment Date</span>
                        <span>{formatDate(selectedPartner.payment_date)}</span>
                      </div>
                    )}
                    {selectedPartner.expiry_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Expiry Date</span>
                        <span>{formatDate(selectedPartner.expiry_date)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Partner Since</span>
                      <span>{formatDate(selectedPartner.created_at)}</span>
                    </div>
                    {selectedPartner.creator?.name && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Added By</span>
                        <span>{selectedPartner.creator.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-black mb-3">Deal Status</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => updatePartnerDealStatus(selectedPartner.id, 'new')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedPartner.deal_status === 'new' || !selectedPartner.deal_status
                        ? 'border-gray-800 bg-gray-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">New</span>
                    </div>
                    {(selectedPartner.deal_status === 'new' || !selectedPartner.deal_status) && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => updatePartnerDealStatus(selectedPartner.id, 'contacted')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedPartner.deal_status === 'contacted'
                        ? 'border-blue-800 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Contacted</span>
                    </div>
                    {selectedPartner.deal_status === 'contacted' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => updatePartnerDealStatus(selectedPartner.id, 'zoom_call')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedPartner.deal_status === 'zoom_call'
                        ? 'border-purple-800 bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Video className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">Zoom Call</span>
                    </div>
                    {selectedPartner.deal_status === 'zoom_call' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => updatePartnerDealStatus(selectedPartner.id, 'contracting')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedPartner.deal_status === 'contracting'
                        ? 'border-yellow-800 bg-yellow-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">Contracting</span>
                    </div>
                    {selectedPartner.deal_status === 'contracting' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => updatePartnerDealStatus(selectedPartner.id, 'closed')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedPartner.deal_status === 'closed'
                        ? 'border-green-800 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Closed Deal</span>
                    </div>
                    {selectedPartner.deal_status === 'closed' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-between">
                <div>
                  <button
                    onClick={() => updatePartnerStatus(selectedPartner.id, 'active')}
                    disabled={selectedPartner.status === 'active'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 mr-2"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => updatePartnerStatus(selectedPartner.id, 'inactive')}
                    disabled={selectedPartner.status === 'inactive'}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                </div>
                
                <button
                  onClick={() => window.location.hash = "#accounting"}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>View Financials</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Video component for the import
const Video = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 8.13v7.74a2 2 0 0 1-1.38 1.9l-.62.22A2 2 0 0 1 18 18a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.13a2 2 0 0 1 1.38 1.9Z"></path>
    <rect width="14" height="12" x="2" y="6" rx="2"></rect>
  </svg>
);

// Add Grid component for the import
const Grid = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
    <line x1="3" x2="21" y1="9" y2="9"></line>
    <line x1="3" x2="21" y1="15" y2="15"></line>
    <line x1="9" x2="9" y1="3" y2="21"></line>
    <line x1="15" x2="15" y1="3" y2="21"></line>
  </svg>
);

// Add Check component for the import
const Check = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20,6 9,17 4,12"></polyline>
  </svg>
);