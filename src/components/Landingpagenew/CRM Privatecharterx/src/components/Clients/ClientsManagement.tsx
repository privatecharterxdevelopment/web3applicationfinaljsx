import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Star, 
  Building2, 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserPlus,
  X,
  Check,
  Clock,
  FileText,
  CheckSquare,
  Video,
  ExternalLink,
  Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AddClientModal } from './AddClientModal';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  type: 'individual' | 'corporate';
  vip_status: boolean | null;
  total_bookings: number | null;
  total_spent: number | null;
  notes: string | null;
  address_street: string | null;
  address_city: string | null;
  address_country: string | null;
  address_zip_code: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  creator_name?: string;
  status?: string | null;
}

export const ClientsManagement: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'corporate'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'zoom_call' | 'contracting' | 'closed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [editClientData, setEditClientData] = useState<Partial<Client>>({});

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, filterType, statusFilter]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          system_users!created_by (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const clientsWithCreator = data?.map(client => ({
        ...client,
        creator_name: client.system_users?.name || 'Unknown',
        status: client.status || 'new'
      })) || [];
      
      setClients(clientsWithCreator);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.creator_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(client => client.type === filterType);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    setFilteredClients(filtered);
  };

  const updateClientStatus = async (clientId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;
      
      showSuccess('Status Updated', `Client status has been updated to ${formatStatus(newStatus)}`);
      
      // Update local state
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId ? { ...client, status: newStatus } : client
        )
      );
      
      setShowStatusModal(false);
      setSelectedClient(null);
    } catch (err: any) {
      console.error('Error updating client status:', err);
      showError('Error', err.message || 'Failed to update client status');
    }
  };

  const updateClient = async () => {
    if (!selectedClient) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('clients')
        .update({ 
          ...editClientData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClient.id);

      if (error) throw error;
      
      showSuccess('Client Updated', 'Client information has been updated successfully');
      
      // Update local state
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === selectedClient.id ? { ...client, ...editClientData } : client
        )
      );
      
      // Update selected client if details modal is open
      if (showClientDetails) {
        setSelectedClient({...selectedClient, ...editClientData});
      }
      
      setShowEditModal(false);
    } catch (err: any) {
      console.error('Error updating client:', err);
      showError('Error', err.message || 'Failed to update client');
    } finally {
      setIsSaving(false);
    }
  };

  const formatStatus = (status: string | null | undefined) => {
    if (!status) return 'New';
    
    switch (status) {
      case 'contacted': return 'Contacted';
      case 'zoom_call': return 'Zoom Call';
      case 'contracting': return 'Contracting';
      case 'closed': return 'Closed Deal';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status || status === 'new') return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'zoom_call': return 'bg-purple-100 text-purple-800';
      case 'contracting': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string | null | undefined) => {
    if (!status || status === 'new') return <Clock className="w-4 h-4 text-gray-500" />;
    
    switch (status) {
      case 'contacted': return <Mail className="w-4 h-4 text-blue-500" />;
      case 'zoom_call': return <Video className="w-4 h-4 text-purple-500" />;
      case 'contracting': return <FileText className="w-4 h-4 text-yellow-500" />;
      case 'closed': return <CheckSquare className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const ClientCard: React.FC<{ client: Client }> = ({ client }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            {client.type === 'corporate' ? 
              <Building2 className="w-6 h-6 text-gray-600" /> : 
              <User className="w-6 h-6 text-gray-600" />
            }
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-black">{client.name}</h3>
              {client.vip_status && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
            </div>
            {client.company && <p className="text-sm text-gray-500">{client.company}</p>}
            <p className="text-xs text-gray-400 capitalize">{client.type} Client</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              setSelectedClient(client);
              setShowStatusModal(true);
            }}
            className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${getStatusColor(client.status)}`}
          >
            {getStatusIcon(client.status)}
            <span>{formatStatus(client.status)}</span>
          </button>
          <button 
            onClick={() => {
              setSelectedClient(client);
              setShowClientDetails(true);
            }}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          {user?.role === 'admin' && (
            <button 
              onClick={() => {
                setSelectedClient(client);
                setEditClientData({
                  name: client.name,
                  email: client.email,
                  phone: client.phone,
                  company: client.company,
                  type: client.type,
                  vip_status: client.vip_status,
                  notes: client.notes,
                  address_street: client.address_street,
                  address_city: client.address_city,
                  address_country: client.address_country,
                  address_zip_code: client.address_zip_code
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
          <Mail className="w-4 h-4" />
          <span>{client.email}</span>
        </div>
        {client.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{client.phone}</span>
          </div>
        )}
        {(client.address_city || client.address_country) && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>
              {client.address_city && client.address_country 
                ? `${client.address_city}, ${client.address_country}`
                : client.address_city || client.address_country
              }
            </span>
          </div>
        )}
        {client.created_at && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Client since {new Date(client.created_at).toLocaleDateString()}</span>
          </div>
        )}
        {client.creator_name && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <UserPlus className="w-4 h-4" />
            <span>Added by {client.creator_name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-sm font-medium text-black">{client.total_bookings || 0}</p>
          <p className="text-xs text-gray-500">Total Bookings</p>
        </div>
        <div>
          <p className="text-sm font-medium text-black">${(client.total_spent || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Spent</p>
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
            <p className="text-gray-600">Loading clients...</p>
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
            <h1 className="text-2xl font-bold text-black mb-2">Client Management</h1>
            <p className="text-gray-600">Manage your client database and relationships</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clients by name, email, company, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Clients</option>
                <option value="individual">Individual</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="zoom_call">Zoom Call</option>
              <option value="contracting">Contracting</option>
              <option value="closed">Closed Deal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{clients.length}</p>
          <p className="text-sm text-gray-500">Total Clients</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{clients.filter(c => c.vip_status).length}</p>
          <p className="text-sm text-gray-500">VIP Clients</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{clients.filter(c => c.status === 'closed').length}</p>
          <p className="text-sm text-gray-500">Closed Deals</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{clients.filter(c => c.type === 'corporate').length}</p>
          <p className="text-sm text-gray-500">Corporate</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{clients.filter(c => c.type === 'individual').length}</p>
          <p className="text-sm text-gray-500">Individual</p>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>

      {filteredClients.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No clients found</h3>
          <p className="text-gray-500">
            {searchTerm || filterType !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'No clients have been added yet'
            }
          </p>
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientAdded={fetchClients}
      />

      {/* Update Status Modal */}
      {showStatusModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Update Client Status</h2>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedClient(null);
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Client:</p>
                <p className="font-medium text-black">{selectedClient.name}</p>
                {selectedClient.company && (
                  <p className="text-sm text-gray-500">{selectedClient.company}</p>
                )}
              </div>
              
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Select Status:</p>
                <div className="space-y-3">
                  <button
                    onClick={() => updateClientStatus(selectedClient.id, 'new')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedClient.status === 'new' || !selectedClient.status
                        ? 'border-gray-800 bg-gray-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">New</span>
                    </div>
                    {(selectedClient.status === 'new' || !selectedClient.status) && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => updateClientStatus(selectedClient.id, 'contacted')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedClient.status === 'contacted'
                        ? 'border-blue-800 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Contacted</span>
                    </div>
                    {selectedClient.status === 'contacted' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => updateClientStatus(selectedClient.id, 'zoom_call')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedClient.status === 'zoom_call'
                        ? 'border-purple-800 bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Video className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">Zoom Call</span>
                    </div>
                    {selectedClient.status === 'zoom_call' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => updateClientStatus(selectedClient.id, 'contracting')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedClient.status === 'contracting'
                        ? 'border-yellow-800 bg-yellow-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">Contracting</span>
                    </div>
                    {selectedClient.status === 'contracting' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => updateClientStatus(selectedClient.id, 'closed')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      selectedClient.status === 'closed'
                        ? 'border-green-800 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Closed Deal</span>
                    </div>
                    {selectedClient.status === 'closed' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Edit Client</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedClient(null);
                  setEditClientData({});
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-black mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={editClientData.name || selectedClient.name}
                      onChange={(e) => setEditClientData({ ...editClientData, name: e.target.value })}
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
                      value={editClientData.email || selectedClient.email}
                      onChange={(e) => setEditClientData({ ...editClientData, email: e.target.value })}
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
                      value={editClientData.phone !== undefined ? editClientData.phone || '' : selectedClient.phone || ''}
                      onChange={(e) => setEditClientData({ ...editClientData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Type
                    </label>
                    <select
                      value={editClientData.type || selectedClient.type}
                      onChange={(e) => setEditClientData({ ...editClientData, type: e.target.value as 'individual' | 'corporate' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="individual">Individual</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-medium text-black mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Company Information
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={editClientData.company !== undefined ? editClientData.company || '' : selectedClient.company || ''}
                    onChange={(e) => setEditClientData({ ...editClientData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Leave empty for individual clients"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-medium text-black mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={editClientData.address_street !== undefined ? editClientData.address_street || '' : selectedClient.address_street || ''}
                      onChange={(e) => setEditClientData({ ...editClientData, address_street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={editClientData.address_city !== undefined ? editClientData.address_city || '' : selectedClient.address_city || ''}
                      onChange={(e) => setEditClientData({ ...editClientData, address_city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={editClientData.address_country !== undefined ? editClientData.address_country || '' : selectedClient.address_country || ''}
                      onChange={(e) => setEditClientData({ ...editClientData, address_country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={editClientData.address_zip_code !== undefined ? editClientData.address_zip_code || '' : selectedClient.address_zip_code || ''}
                      onChange={(e) => setEditClientData({ ...editClientData, address_zip_code: e.target.value })}
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
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="vip_status"
                      checked={editClientData.vip_status !== undefined ? !!editClientData.vip_status : !!selectedClient.vip_status}
                      onChange={(e) => setEditClientData({ ...editClientData, vip_status: e.target.checked })}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <label htmlFor="vip_status" className="ml-2 text-sm text-gray-700">
                      VIP Status
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={editClientData.notes !== undefined ? editClientData.notes || '' : selectedClient.notes || ''}
                      onChange={(e) => setEditClientData({ ...editClientData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Any additional notes about the client..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedClient(null);
                  setEditClientData({});
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateClient}
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

      {/* Client Details Modal */}
      {showClientDetails && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Client Details</h2>
              <div className="flex items-center space-x-2">
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setShowClientDetails(false);
                      setEditClientData({
                        name: selectedClient.name,
                        email: selectedClient.email,
                        phone: selectedClient.phone,
                        company: selectedClient.company,
                        type: selectedClient.type,
                        vip_status: selectedClient.vip_status,
                        notes: selectedClient.notes,
                        address_street: selectedClient.address_street,
                        address_city: selectedClient.address_city,
                        address_country: selectedClient.address_country,
                        address_zip_code: selectedClient.address_zip_code
                      });
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                    title="Edit Client"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowClientDetails(false);
                    setSelectedClient(null);
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
                  {selectedClient.type === 'corporate' ? 
                    <Building2 className="w-8 h-8 text-gray-600" /> : 
                    <User className="w-8 h-8 text-gray-600" />
                  }
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-semibold text-black">{selectedClient.name}</h3>
                    {selectedClient.vip_status && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                  </div>
                  {selectedClient.company && <p className="text-gray-600">{selectedClient.company}</p>}
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedClient.status)}`}>
                      {formatStatus(selectedClient.status)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 capitalize">
                      {selectedClient.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-black mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedClient.email}</span>
                    </div>
                    {selectedClient.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedClient.phone}</span>
                      </div>
                    )}
                    {(selectedClient.address_street || selectedClient.address_city || selectedClient.address_country) && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          {selectedClient.address_street && <div>{selectedClient.address_street}</div>}
                          {selectedClient.address_city && selectedClient.address_country && (
                            <div>{selectedClient.address_city}, {selectedClient.address_country}</div>
                          )}
                          {selectedClient.address_zip_code && <div>{selectedClient.address_zip_code}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-black mb-3">Client Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Bookings</span>
                      <span className="font-medium">{selectedClient.total_bookings || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Spent</span>
                      <span className="font-medium">${(selectedClient.total_spent || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Client Since</span>
                      <span className="font-medium">
                        {selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Added By</span>
                      <span className="font-medium">{selectedClient.creator_name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedClient.notes && (
                <div>
                  <h4 className="font-medium text-black mb-3">Notes</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">{selectedClient.notes}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => {
                    setShowClientDetails(false);
                    setShowStatusModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Update Status</span>
                </button>
                
                <button
                  onClick={() => window.location.hash = "#bookings"}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Bookings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};