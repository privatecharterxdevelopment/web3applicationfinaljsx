import React, { useState, useEffect } from 'react';
import {
  Shield,
  User,
  Calendar,
  Check,
  X,
  FileText,
  AlertTriangle,
  Eye,
  Download,
  Flag,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAdminPermissions } from '../../../hooks/useAdminPermissions';

interface KYCApplication {
  id: string;
  user_id: string;
  application_data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
    passportNumber: string;
    passportExpiry: string;
    file_info?: {
      name: string;
      size: number;
      type: string;
      public_url: string;
      uploaded_at: string;
    };
  };
  status: string;
  risk_score?: number;
  verification_level: string;
  documents_verified: boolean;
  identity_verified: boolean;
  address_verified: boolean;
  admin_notes?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_at?: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

const VERIFICATION_LEVELS = [
  { value: 'level_1', label: 'Level 1 - Basic', color: 'blue' },
  { value: 'level_2', label: 'Level 2 - Enhanced', color: 'green' },
  { value: 'level_3', label: 'Level 3 - Premium', color: 'purple' }
];

const RISK_LEVELS = [
  { min: 0, max: 30, label: 'Low Risk', color: 'green' },
  { min: 31, max: 70, label: 'Medium Risk', color: 'yellow' },
  { min: 71, max: 100, label: 'High Risk', color: 'red' }
];

export default function KYCVerificationManagement() {
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingApplication, setEditingApplication] = useState<KYCApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [riskScore, setRiskScore] = useState<number>(0);
  const [verificationLevel, setVerificationLevel] = useState<string>('level_1');
  const [documentsVerified, setDocumentsVerified] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [addressVerified, setAddressVerified] = useState(false);

  const { canApproveKYC, canRejectKYC, hasPermission } = useAdminPermissions();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('kyc_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (fetchError) throw fetchError;

      setApplications(data || []);

    } catch (err) {
      console.error('Error fetching KYC applications:', err);
      setError('Failed to load KYC applications');
    } finally {
      setLoading(false);
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

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    if (!hasPermission('kyc_applications', 'write')) {
      setError('You do not have permission to update KYC applications');
      return;
    }

    try {
      const oldApplication = applications.find(a => a.id === applicationId);

      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        reviewed_at: new Date().toISOString()
      };

      if (newStatus === 'approved') {
        updates.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('kyc_applications')
        .update(updates)
        .eq('id', applicationId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: newStatus === 'approved' ? 'approve' : newStatus === 'rejected' ? 'reject' : 'update',
        p_target_table: 'kyc_applications',
        p_target_id: applicationId,
        p_old_data: { status: oldApplication?.status },
        p_new_data: { status: newStatus },
        p_admin_notes: `KYC application ${newStatus}`
      });

      fetchApplications();
    } catch (err) {
      console.error('Error updating KYC application status:', err);
      setError('Failed to update KYC application status');
    }
  };

  const handleDetailedReview = async () => {
    if (!editingApplication || !hasPermission('kyc_applications', 'write')) return;

    try {
      const updates = {
        risk_score: riskScore,
        verification_level: verificationLevel,
        documents_verified: documentsVerified,
        identity_verified: identityVerified,
        address_verified: addressVerified,
        admin_notes: adminNotes,
        rejection_reason: rejectionReason || null,
        status: rejectionReason ? 'rejected' : 'approved',
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        reviewed_at: new Date().toISOString(),
        approved_at: !rejectionReason ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('kyc_applications')
        .update(updates)
        .eq('id', editingApplication.id);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: rejectionReason ? 'reject' : 'approve',
        p_target_table: 'kyc_applications',
        p_target_id: editingApplication.id,
        p_old_data: {
          status: editingApplication.status,
          risk_score: editingApplication.risk_score
        },
        p_new_data: updates,
        p_admin_notes: 'Detailed KYC review completed'
      });

      setEditingApplication(null);
      resetForm();
      fetchApplications();
    } catch (err) {
      console.error('Error completing KYC review:', err);
      setError('Failed to complete KYC review');
    }
  };

  const resetForm = () => {
    setAdminNotes('');
    setRejectionReason('');
    setRiskScore(0);
    setVerificationLevel('level_1');
    setDocumentsVerified(false);
    setIdentityVerified(false);
    setAddressVerified(false);
  };

  const openEditModal = (application: KYCApplication) => {
    setEditingApplication(application);
    setAdminNotes(application.admin_notes || '');
    setRejectionReason(application.rejection_reason || '');
    setRiskScore(application.risk_score || 0);
    setVerificationLevel(application.verification_level || 'level_1');
    setDocumentsVerified(application.documents_verified || false);
    setIdentityVerified(application.identity_verified || false);
    setAddressVerified(application.address_verified || false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'requires_additional_info':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (score?: number): string => {
    if (!score) return 'bg-gray-100 text-gray-600';

    if (score <= 30) return 'bg-green-100 text-green-800';
    if (score <= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskLabel = (score?: number): string => {
    if (!score) return 'Not Assessed';

    const level = RISK_LEVELS.find(level => score >= level.min && score <= level.max);
    return level ? level.label : 'Unknown';
  };

  const getVerificationLevelColor = (level: string): string => {
    const levelConfig = VERIFICATION_LEVELS.find(l => l.value === level);
    const color = levelConfig?.color || 'gray';

    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      gray: 'bg-gray-100 text-gray-800'
    };

    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const filteredApplications = applications.filter(application => {
    const matchesTab = activeTab === 'all' || application.status.toLowerCase() === activeTab;
    const matchesSearch = !searchQuery ||
      application.application_data.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.application_data.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.application_data.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.application_data.passportNumber.toLowerCase().includes(searchQuery.toLowerCase());

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
          <h2 className="text-2xl font-bold">KYC Verification</h2>
          <p className="text-gray-600">Review and approve Know Your Customer applications</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search applications..."
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
            {['all', 'pending', 'under_review', 'requires_additional_info', 'approved', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab === 'all' ? 'All Applications' : tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                  {tab === 'all'
                    ? applications.length
                    : applications.filter(a => a.status.toLowerCase() === tab).length
                  }
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk & Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Shield size={20} className="text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {application.application_data.firstName} {application.application_data.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.application_data.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          {application.application_data.nationality}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {application.application_data.passportNumber}
                      </div>
                      <div className="text-gray-500">
                        Expires: {new Date(application.application_data.passportExpiry).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500">
                        DOB: {new Date(application.application_data.dateOfBirth).toLocaleDateString()}
                      </div>
                      {application.application_data.file_info && (
                        <div className="flex items-center mt-1 text-xs text-green-600">
                          <FileText size={12} className="mr-1" />
                          Document uploaded
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${application.documents_verified ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                        <span className="text-xs">Documents</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${application.identity_verified ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                        <span className="text-xs">Identity</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${application.address_verified ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                        <span className="text-xs">Address</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(application.risk_score)}`}>
                        {application.risk_score ? `${application.risk_score}% Risk` : 'Not Assessed'}
                      </span>
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVerificationLevelColor(application.verification_level)}`}>
                          {VERIFICATION_LEVELS.find(l => l.value === application.verification_level)?.label || application.verification_level}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                      {application.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(application.submitted_at)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(application)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Review application"
                      >
                        <Eye size={18} />
                      </button>

                      {application.application_data.file_info?.public_url && (
                        <button
                          onClick={() => handleDownloadDocument(application.application_data.file_info!.public_url)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Download document"
                        >
                          <Download size={18} />
                        </button>
                      )}

                      {application.status === 'pending' && hasPermission('kyc_applications', 'write') && (
                        <button
                          onClick={() => handleStatusChange(application.id, 'under_review')}
                          className="text-orange-600 hover:text-orange-900"
                          title="Start review"
                        >
                          <FileText size={18} />
                        </button>
                      )}

                      {['pending', 'under_review'].includes(application.status) && canApproveKYC && (
                        <button
                          onClick={() => handleStatusChange(application.id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                          title="Quick approve"
                        >
                          <Check size={18} />
                        </button>
                      )}

                      {['pending', 'under_review'].includes(application.status) && canRejectKYC && (
                        <button
                          onClick={() => handleStatusChange(application.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                          title="Quick reject"
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

          {filteredApplications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No KYC applications found
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {editingApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">KYC Application Review</h3>
              <button
                onClick={() => setEditingApplication(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Applicant Information */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Personal Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">First Name</div>
                        <div className="font-medium">{editingApplication.application_data.firstName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Last Name</div>
                        <div className="font-medium">{editingApplication.application_data.lastName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium">{editingApplication.application_data.email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="font-medium">{editingApplication.application_data.phone || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Date of Birth</div>
                        <div className="font-medium">{formatDate(editingApplication.application_data.dateOfBirth)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Nationality</div>
                        <div className="font-medium">{editingApplication.application_data.nationality}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Address Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="font-medium">{editingApplication.application_data.address}</div>
                      <div>{editingApplication.application_data.city}, {editingApplication.application_data.postalCode}</div>
                      <div>{editingApplication.application_data.country}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Document Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Passport Number</div>
                        <div className="font-medium">{editingApplication.application_data.passportNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Expiry Date</div>
                        <div className="font-medium">{formatDate(editingApplication.application_data.passportExpiry)}</div>
                      </div>
                    </div>

                    {editingApplication.application_data.file_info && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{editingApplication.application_data.file_info.name}</div>
                            <div className="text-xs text-gray-500">
                              {(editingApplication.application_data.file_info.size / 1024 / 1024).toFixed(2)} MB •
                              Uploaded {formatDate(editingApplication.application_data.file_info.uploaded_at)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadDocument(editingApplication.application_data.file_info!.public_url)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Download document"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Review Form */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Verification Checks</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={documentsVerified}
                        onChange={(e) => setDocumentsVerified(e.target.checked)}
                        className="mr-2 rounded border-gray-300 focus:ring-black focus:border-black"
                      />
                      <span className="text-sm">Documents verified</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={identityVerified}
                        onChange={(e) => setIdentityVerified(e.target.checked)}
                        className="mr-2 rounded border-gray-300 focus:ring-black focus:border-black"
                      />
                      <span className="text-sm">Identity verified</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={addressVerified}
                        onChange={(e) => setAddressVerified(e.target.checked)}
                        className="mr-2 rounded border-gray-300 focus:ring-black focus:border-black"
                      />
                      <span className="text-sm">Address verified</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={riskScore}
                    onChange={(e) => setRiskScore(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {getRiskLabel(riskScore)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Level
                  </label>
                  <select
                    value={verificationLevel}
                    onChange={(e) => setVerificationLevel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {VERIFICATION_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    placeholder="Add review notes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    placeholder="Reason for rejection (leave empty to approve)"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setEditingApplication(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDetailedReview}
                    className={`px-4 py-2 rounded-lg text-white ${rejectionReason
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                      }`}
                  >
                    {rejectionReason ? 'Reject Application' : 'Approve Application'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}