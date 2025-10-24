import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  Calendar, 
  MapPin, 
  Users, 
  Check, 
  X, 
  ArrowRight, 
  FileText,
  Building2,
  DollarSign,
  AlertCircle,
  Search,
  Download,
  Eye,
  Mail,
  Phone,
  Plane,
  Upload
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAdminPermissions } from '../../../hooks/useAdminPermissions';

interface CO2CertificateRequest {
  id: string;
  request_id: string;
  user_id: string;
  wallet_address: string;
  company_name: string;
  contact_email: string;
  service_type: string;
  first_flight_date: string;
  origin: string;
  destination: string;
  aircraft_type: string;
  passenger_count: number;
  total_emissions_kg: string;
  certification_type: string;
  base_fee: string;
  carbon_offset_cost: string;
  total_cost: string;
  urgency: string;
  wants_blockchain_nft: boolean;
  wants_email_pdf: boolean;
  status: string;
  admin_notes?: string;
  verification_notes?: string;
  assigned_ngo_id?: string;
  ngo_approval_status?: string;
  certificate_issued_at?: string;
  certificate_pdf_url?: string;
  created_at: string;
  updated_at: string;
  metadata: any;
}

interface EnvironmentalPartner {
  id: string;
  name: string;
  organization_type: string;
  verification_status: string;
  active: boolean;
}

export default function CO2CertificateManagement() {
  const [requests, setRequests] = useState<CO2CertificateRequest[]>([]);
  const [partners, setPartners] = useState<EnvironmentalPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRequest, setEditingRequest] = useState<CO2CertificateRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [selectedNGO, setSelectedNGO] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<CO2CertificateRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [issuingRequest, setIssuingRequest] = useState<CO2CertificateRequest | null>(null);
  const [showIssuanceModal, setShowIssuanceModal] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);

  const { canAssignNGO, hasPermission } = useAdminPermissions();

  useEffect(() => {
    fetchRequests();
    fetchPartners();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('co2_certificate_requests')
        .select(`
          *,
          assigned_ngo:assigned_ngo_id (
            name,
            organization_type
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching CO2 certificate requests:', err);
      setError('Failed to load CO2 certificate requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('environmental_partners')
        .select('*')
        .eq('active', true)
        .eq('verification_status', 'verified')
        .order('name');

      if (fetchError) throw fetchError;

      setPartners(data || []);
    } catch (err) {
      console.error('Error fetching environmental partners:', err);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    if (!hasPermission('co2_certificate_requests', 'write')) {
      setError('You do not have permission to update CO2 certificate requests');
      return;
    }

    try {
      const oldRequest = requests.find(r => r.id === requestId);
      
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'certificate_issued') {
        updates.certificate_issued_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('co2_certificate_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'update',
        p_target_table: 'co2_certificate_requests',
        p_target_id: requestId,
        p_old_data: { status: oldRequest?.status },
        p_new_data: { status: newStatus },
        p_admin_notes: `Status changed to ${newStatus}`
      });

      fetchRequests();
    } catch (err) {
      console.error('Error updating CO2 certificate status:', err);
      setError('Failed to update CO2 certificate status');
    }
  };

  const handleAssignNGO = async () => {
    if (!editingRequest || !selectedNGO || !canAssignNGO) return;

    try {
      const { error } = await supabase
        .from('co2_certificate_requests')
        .update({
          assigned_ngo_id: selectedNGO,
          status: 'ngo_assigned',
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRequest.id);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'assign',
        p_target_table: 'co2_certificate_requests',
        p_target_id: editingRequest.id,
        p_old_data: { assigned_ngo_id: editingRequest.assigned_ngo_id },
        p_new_data: { assigned_ngo_id: selectedNGO },
        p_admin_notes: 'NGO assigned for certificate processing'
      });

      setEditingRequest(null);
      setSelectedNGO('');
      setAdminNotes('');
      fetchRequests();
    } catch (err) {
      console.error('Error assigning NGO:', err);
      setError('Failed to assign NGO');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'ngo_assigned':
        return 'bg-purple-100 text-purple-800';
      case 'certificate_issued':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency.toLowerCase()) {
      case 'rush':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const openRequestDetails = (request: CO2CertificateRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const closeRequestDetails = () => {
    setSelectedRequest(null);
    setShowDetailsModal(false);
  };

  const openIssuanceModal = (request: CO2CertificateRequest) => {
    setIssuingRequest(request);
    setShowIssuanceModal(true);
  };

  const closeIssuanceModal = () => {
    setIssuingRequest(null);
    setShowIssuanceModal(false);
    setCertificateFile(null);
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount);
  };

  const handleCertificateUpload = async () => {
    if (!issuingRequest || !certificateFile) return;

    try {
      setUploadingCertificate(true);
      setError(null);

      // Upload the certificate file to Supabase storage
      const fileExt = certificateFile.name.split('.').pop();
      const fileName = `${issuingRequest.request_id}-certificate.${fileExt}`;
      const filePath = `co2-certificates/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('co2-certificates')
        .upload(filePath, certificateFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('co2-certificates')
        .getPublicUrl(filePath);

      // Update the request with the certificate URL and mark as issued
      const updates = {
        status: 'certificate_issued',
        certificate_pdf_url: publicUrl,
        certificate_issued_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('co2_certificate_requests')
        .update(updates)
        .eq('id', issuingRequest.id);

      if (updateError) throw updateError;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'issue_certificate',
        p_target_table: 'co2_certificate_requests',
        p_target_id: issuingRequest.id,
        p_old_data: { status: issuingRequest.status },
        p_new_data: updates,
        p_admin_notes: `Certificate issued and uploaded: ${fileName}`
      });

      closeIssuanceModal();
      fetchRequests();
    } catch (err) {
      console.error('Error uploading certificate:', err);
      setError('Failed to upload certificate and issue');
    } finally {
      setUploadingCertificate(false);
    }
  };

  const handleDownloadDocument = async (publicUrl: string) => {
    try {
      const response = await supabase.functions.invoke('generate-signed-urls', {
        body: { publicUrl }
      });

      if (response.error) {
        console.error('Error generating signed URL:', response.error);
        setError('Failed to generate document download link');
        return;
      }

      const { signedUrl } = response.data;
      if (signedUrl) {
        // Open the signed URL in a new tab for download
        window.open(signedUrl, '_blank');
      } else {
        setError('Failed to generate download link');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document');
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesTab = activeTab === 'all' || request.status.toLowerCase() === activeTab;
    const matchesSearch = !searchQuery || 
      request.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.request_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">CO2 Certificate Requests</h2>
          <p className="text-gray-600">Manage carbon offset certificate requests and NGO assignments</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['all', 'pending', 'under_review', 'ngo_assigned', 'certificate_issued'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'all' ? 'All Requests' : tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                  {tab === 'all' 
                    ? requests.length 
                    : requests.filter(r => r.status.toLowerCase() === tab).length
                  }
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flight Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emissions & Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Priority
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Leaf size={20} className="text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.request_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(request.created_at)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 flex items-center">
                        <Building2 size={16} className="text-gray-400 mr-1" />
                        {request.company_name}
                      </div>
                      <div className="text-gray-500">{request.contact_email}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center text-gray-900 mb-1">
                        <MapPin size={16} className="text-gray-400 mr-1" />
                        <span>{request.origin}</span>
                        <ArrowRight size={14} className="mx-2 text-gray-400" />
                        <span>{request.destination}</span>
                      </div>
                      <div className="text-gray-500 mb-1">
                        <Calendar size={14} className="inline mr-1" />
                        {formatDate(request.first_flight_date)}
                      </div>
                      <div className="text-gray-500">
                        {request.aircraft_type} • {request.passenger_count} pax
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 mb-1">
                        {parseFloat(request.total_emissions_kg).toFixed(1)}t CO₂
                      </div>
                      <div className="flex items-center text-green-600 font-medium">
                        <DollarSign size={14} className="mr-1" />
                        ${parseFloat(request.total_cost).toFixed(2)}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {request.certification_type}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {request.urgency !== 'standard' && (
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {request.wants_blockchain_nft && (
                        <div className="text-xs text-blue-600 font-medium">
                          NFT Requested
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openRequestDetails(request)}
                        className="text-purple-600 hover:text-purple-900"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                      {request.status === 'pending' && hasPermission('co2_certificate_requests', 'write') && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'under_review')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Start review"
                        >
                          <FileText size={18} />
                        </button>
                      )}
                      
                      {request.status === 'under_review' && canAssignNGO && (
                        <button
                          onClick={() => {
                            setEditingRequest(request);
                            setAdminNotes(request.admin_notes || '');
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Assign NGO"
                        >
                          <Building2 size={18} />
                        </button>
                      )}
                      
                      {request.status === 'ngo_assigned' && hasPermission('co2_certificate_requests', 'approve') && (
                        <button
                          onClick={() => openIssuanceModal(request)}
                          className="text-green-600 hover:text-green-900"
                          title="Issue certificate with upload"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      
                      {request.certificate_pdf_url && (
                        <a
                          href={request.certificate_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900"
                          title="Download certificate"
                        >
                          <Download size={18} />
                        </a>
                      )}
                      
                      {['pending', 'under_review'].includes(request.status) && hasPermission('co2_certificate_requests', 'write') && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                          title="Reject request"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No CO2 certificate requests found
            </div>
          )}
        </div>
      </div>

      {/* NGO Assignment Modal */}
      {editingRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Assign Environmental Partner</h3>
              <button
                onClick={() => setEditingRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Request Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Request ID</div>
                    <div className="font-medium">{editingRequest.request_id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Company</div>
                    <div className="font-medium">{editingRequest.company_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Emissions</div>
                    <div className="font-medium">{parseFloat(editingRequest.total_emissions_kg).toFixed(1)}t CO₂</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Cost</div>
                    <div className="font-medium">${parseFloat(editingRequest.total_cost).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* NGO Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Environmental Partner
                </label>
                <select
                  value={selectedNGO}
                  onChange={(e) => setSelectedNGO(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Choose a partner...</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name} ({partner.organization_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  placeholder="Add notes about the assignment"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignNGO}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                  disabled={!selectedNGO}
                >
                  Assign Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CO2 Certificate Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                  <Leaf size={24} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    CO2 Certificate Request
                  </h2>
                  <p className="text-sm text-gray-600">ID: {selectedRequest.request_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={closeRequestDetails}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Request Overview */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Request Overview</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Service Type</div>
                        <div className="text-sm font-medium text-gray-900">{selectedRequest.service_type}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Submitted</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.created_at)}</div>
                      </div>
                    </div>
                    {selectedRequest.certificate_issued_at && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Certificate Issued</div>
                        <div className="text-sm font-medium text-green-600">{formatDate(selectedRequest.certificate_issued_at)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Information */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Company Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{selectedRequest.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedRequest.contact_email}</span>
                    </div>
                    {selectedRequest.wallet_address && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Wallet Address</div>
                        <div className="text-sm font-mono text-gray-900 bg-white p-2 rounded border">
                          {selectedRequest.wallet_address}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Flight Information */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Flight Details</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    {/* Route */}
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Route</div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <MapPin size={16} className="text-blue-500" />
                        {selectedRequest.origin}
                        <ArrowRight size={16} className="text-gray-400" />
                        <MapPin size={16} className="text-green-500" />
                        {selectedRequest.destination}
                      </div>
                    </div>
                    
                    {/* Flight Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Flight Date</div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          {formatDate(selectedRequest.first_flight_date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Aircraft Type</div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Plane size={16} className="text-gray-400" />
                          {selectedRequest.aircraft_type}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Passengers</div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Users size={16} className="text-gray-400" />
                          {selectedRequest.passenger_count}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Certification Type</div>
                        <div className="text-sm font-medium text-gray-900">{selectedRequest.certification_type}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emissions & Pricing */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Emissions & Pricing</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {parseFloat(selectedRequest.total_emissions_kg).toFixed(1)}t
                        </div>
                        <div className="text-xs text-gray-500">Total CO₂ Emissions</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {formatCurrency(selectedRequest.total_cost)}
                        </div>
                        <div className="text-xs text-gray-500">Total Cost</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Base Fee</div>
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(selectedRequest.base_fee)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Carbon Offset Cost</div>
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(selectedRequest.carbon_offset_cost)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Options */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Service Options</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Priority Level</div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(selectedRequest.urgency)}`}>
                          {selectedRequest.urgency.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${selectedRequest.wants_blockchain_nft ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm text-gray-700">Blockchain NFT Certificate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${selectedRequest.wants_email_pdf ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm text-gray-700">Email PDF Certificate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate Information */}
                {selectedRequest.certificate_pdf_url && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Certificate</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">CO2 Offset Certificate</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Issued: {selectedRequest.certificate_issued_at ? formatDate(selectedRequest.certificate_issued_at) : 'Pending'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadDocument(selectedRequest.certificate_pdf_url!)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Download size={16} />
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {(selectedRequest.admin_notes || selectedRequest.verification_notes) && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Admin Notes</h3>
                    <div className="space-y-3">
                      {selectedRequest.admin_notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                          <div className="text-sm font-medium text-yellow-800 mb-1">Admin Notes</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.admin_notes}</p>
                        </div>
                      )}
                      {selectedRequest.verification_notes && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <div className="text-sm font-medium text-blue-800 mb-1">Verification Notes</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.verification_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Issuance Modal */}
      {showIssuanceModal && issuingRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Issue CO2 Certificate</h3>
              <button
                onClick={closeIssuanceModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Request Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Request ID</div>
                    <div className="font-medium">{issuingRequest.request_id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Company</div>
                    <div className="font-medium">{issuingRequest.company_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Emissions</div>
                    <div className="font-medium">{parseFloat(issuingRequest.total_emissions_kg).toFixed(1)}t CO₂</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Cost</div>
                    <div className="font-medium">{formatCurrency(issuingRequest.total_cost)}</div>
                  </div>
                </div>
              </div>

              {/* Certificate Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Certificate PDF
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {!certificateFile ? (
                    <div className="text-center">
                      <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                      <div className="text-sm text-gray-600 mb-2">Upload certificate PDF file</div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.type === 'application/pdf') {
                            setCertificateFile(file);
                          } else {
                            setError('Please select a valid PDF file');
                          }
                        }}
                        className="hidden"
                        id="certificate-upload"
                      />
                      <label
                        htmlFor="certificate-upload"
                        className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 cursor-pointer"
                      >
                        Choose PDF File
                      </label>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <FileText size={32} className="text-red-600 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{certificateFile.name}</div>
                          <div className="text-xs text-gray-500">
                            {(certificateFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setCertificateFile(null)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeIssuanceModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={uploadingCertificate}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCertificateUpload}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={!certificateFile || uploadingCertificate}
                >
                  {uploadingCertificate ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Issue Certificate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
