import React, { useState } from 'react';
import { 
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
  X, 
  Save, 
  FileText, 
  Video, 
  ExternalLink 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  business_type: string;
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

interface PartnerDetailsProps {
  partner: Partner;
  onClose: () => void;
  onStatusChange: (partnerId: string, newStatus: 'pending' | 'active' | 'inactive' | 'expired') => Promise<void>;
  onDealStatusChange: (partnerId: string, newDealStatus: 'new' | 'contacted' | 'zoom_call' | 'contracting' | 'closed') => Promise<void>;
  onEdit: () => void;
}

export const PartnerDetails: React.FC<PartnerDetailsProps> = ({
  partner,
  onClose,
  onStatusChange,
  onDealStatusChange,
  onEdit
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [notes, setNotes] = useState(partner.notes || '');
  const [isSaving, setIsSaving] = useState(false);

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

  const saveNotes = async () => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('partners')
        .update({ 
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id);

      if (error) throw error;
      
      showSuccess('Success', 'Notes saved successfully');
    } catch (err: any) {
      console.error('Error saving notes:', err);
      showError('Error', 'Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Partner Details</h2>
          <div className="flex items-center space-x-2">
            {user?.role === 'admin' && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-black transition-colors"
                title="Edit Partner"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
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
                <h3 className="text-xl font-semibold text-black">{partner.company_name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(partner.status)}`}>
                  {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                </span>
              </div>
              <p className="text-gray-600">{partner.business_type}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${getDealStatusColor(partner.deal_status)}`}>
                  {formatDealStatus(partner.deal_status)}
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
                  <span>{partner.contact_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{partner.email}</span>
                </div>
                {partner.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{partner.phone}</span>
                  </div>
                )}
                {partner.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {partner.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Partner Since: {formatDate(partner.created_at)}</span>
                </div>
                {partner.creator?.name && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>Added by: {partner.creator.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-black mb-3">Membership Details</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(partner.status)}`}>
                    {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                  </span>
                </div>
                {partner.paid_amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Paid Amount</span>
                    <span className="font-medium">${partner.paid_amount.toLocaleString()}</span>
                  </div>
                )}
                {partner.payment_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Payment Date</span>
                    <span>{formatDate(partner.payment_date)}</span>
                  </div>
                )}
                {partner.expiry_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Expiry Date</span>
                    <span>{formatDate(partner.expiry_date)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Partner Since</span>
                  <span>{formatDate(partner.created_at)}</span>
                </div>
                {partner.creator?.name && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Added By</span>
                    <span>{partner.creator.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-black mb-3">Notes</h4>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Add notes about this partner..."
              />
              <button
                onClick={saveNotes}
                disabled={isSaving}
                className="absolute bottom-2 right-2 p-1 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-black mb-3">Deal Status</h4>
            <div className="space-y-3">
              <button
                onClick={() => onDealStatusChange(partner.id, 'new')}
                className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                  partner.deal_status === 'new' || !partner.deal_status
                    ? 'border-gray-800 bg-gray-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">New</span>
                </div>
                {(partner.deal_status === 'new' || !partner.deal_status) && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </button>
              
              <button
                onClick={() => onDealStatusChange(partner.id, 'contacted')}
                className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                  partner.deal_status === 'contacted'
                    ? 'border-blue-800 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Contacted</span>
                </div>
                {partner.deal_status === 'contacted' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </button>
              
              <button
                onClick={() => onDealStatusChange(partner.id, 'zoom_call')}
                className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                  partner.deal_status === 'zoom_call'
                    ? 'border-purple-800 bg-purple-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Video className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">Zoom Call</span>
                </div>
                {partner.deal_status === 'zoom_call' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </button>
              
              <button
                onClick={() => onDealStatusChange(partner.id, 'contracting')}
                className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                  partner.deal_status === 'contracting'
                    ? 'border-yellow-800 bg-yellow-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">Contracting</span>
                </div>
                {partner.deal_status === 'contracting' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </button>
              
              <button
                onClick={() => onDealStatusChange(partner.id, 'closed')}
                className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                  partner.deal_status === 'closed'
                    ? 'border-green-800 bg-green-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Closed Deal</span>
                </div>
                {partner.deal_status === 'closed' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-between">
            <div>
              <button
                onClick={() => onStatusChange(partner.id, 'active')}
                disabled={partner.status === 'active'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 mr-2"
              >
                Activate
              </button>
              <button
                onClick={() => onStatusChange(partner.id, 'inactive')}
                disabled={partner.status === 'inactive'}
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
  );
};