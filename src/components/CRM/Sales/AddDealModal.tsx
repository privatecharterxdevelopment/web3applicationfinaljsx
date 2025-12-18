import React, { useState, useEffect } from 'react';
import { X, Building2, DollarSign, Calendar, FileText, User, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDealAdded: () => void;
  companies: any[];
  selectedCompanyId?: string;
}

export const AddDealModal: React.FC<AddDealModalProps> = ({ 
  isOpen, 
  onClose, 
  onDealAdded,
  companies,
  selectedCompanyId
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    partner_id: selectedCompanyId || '',
    deal_amount: '',
    deal_date: new Date().toISOString().split('T')[0],
    commission_rate: '0.10',
    notes: '',
    status: 'pending' as 'pending' | 'closed' | 'cancelled'
  });

  useEffect(() => {
    if (isOpen && selectedCompanyId) {
      setFormData(prev => ({
        ...prev,
        partner_id: selectedCompanyId
      }));
    }
  }, [isOpen, selectedCompanyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      showError('Error', 'User not found');
      return;
    }

    try {
      setIsLoading(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      // Create the deal
      const { error } = await supabase
        .from('sales_deals')
        .insert([{
          sales_user_id: systemUser.id,
          partner_id: formData.partner_id,
          deal_amount: parseFloat(formData.deal_amount),
          deal_date: formData.deal_date,
          commission_rate: parseFloat(formData.commission_rate),
          notes: formData.notes || null,
          status: formData.status
        }]);

      if (error) throw error;

      showSuccess('Success', 'Sale has been added successfully');
      onDealAdded();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Error adding deal:', err);
      showError('Error', err.message || 'Failed to add sale');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      partner_id: '',
      deal_amount: '',
      deal_date: new Date().toISOString().split('T')[0],
      commission_rate: '0.10',
      notes: '',
      status: 'pending'
    });
  };

  const calculateCommission = () => {
    const amount = parseFloat(formData.deal_amount) || 0;
    const rate = parseFloat(formData.commission_rate) || 0;
    return (amount * rate).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Add New Sale</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Company Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Building2 className="w-4 h-4 mr-1" />
              Company *
            </label>
            <select
              value={formData.partner_id}
              onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Deal Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              Deal Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.deal_amount}
                onChange={(e) => setFormData({ ...formData, deal_amount: e.target.value })}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Deal Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Deal Date *
            </label>
            <input
              type="date"
              value={formData.deal_date}
              onChange={(e) => setFormData({ ...formData, deal_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
          </div>

          {/* Commission Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <User className="w-4 h-4 mr-1" />
              Commission Rate *
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                className="w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {(parseFloat(formData.commission_rate) * 100).toFixed(0)}%
              </span>
            </div>
            {formData.deal_amount && (
              <p className="text-sm text-green-600 mt-1">
                Commission: ${calculateCommission()}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pending"
                  checked={formData.status === 'pending'}
                  onChange={() => setFormData({ ...formData, status: 'pending' })}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                />
                <span className="ml-2 text-sm text-gray-700">Pending</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="closed"
                  checked={formData.status === 'closed'}
                  onChange={() => setFormData({ ...formData, status: 'closed' })}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                />
                <span className="ml-2 text-sm text-gray-700">Closed</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cancelled"
                  checked={formData.status === 'cancelled'}
                  onChange={() => setFormData({ ...formData, status: 'cancelled' })}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                />
                <span className="ml-2 text-sm text-gray-700">Cancelled</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Additional notes about the sale, contract duration, etc."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.partner_id || !formData.deal_amount}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Add Sale</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};