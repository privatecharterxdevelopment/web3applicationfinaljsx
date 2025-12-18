import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  X, 
  Send, 
  CreditCard, 
  Wallet, 
  Landmark, 
  Bitcoin, 
  DollarSign, 
  Check 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  status: string;
  payment_status: string;
  client_id: string;
  client?: {
    name: string;
    email: string;
  };
}

interface PaymentEmailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSent: () => void;
}

export const PaymentEmailModal: React.FC<PaymentEmailModalProps> = ({ 
  invoice, 
  onClose, 
  onSent 
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [emailSubject, setEmailSubject] = useState(`Invoice ${invoice.invoice_number} from PrivatecharterX`);
  const [emailBody, setEmailBody] = useState(
    `Dear ${invoice.client?.name},\n\n` +
    `We hope this email finds you well. Please find attached invoice ${invoice.invoice_number} for your recent services with PrivatecharterX.\n\n` +
    `Invoice Details:\n` +
    `- Invoice Number: ${invoice.invoice_number}\n` +
    `- Amount: ${invoice.currency} ${invoice.total_amount.toFixed(2)}\n` +
    `- Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}\n` +
    `- Due Date: ${new Date(invoice.due_date).toLocaleDateString()}\n\n` +
    `You can make payment using the secure payment link below:\n` +
    `[PAYMENT_LINK]\n\n` +
    `If you have any questions regarding this invoice, please don't hesitate to contact us.\n\n` +
    `Thank you for your business.\n\n` +
    `Best regards,\n` +
    `The PrivatecharterX Team`
  );
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(['credit_card', 'bank_transfer']);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: <Landmark className="w-5 h-5" /> },
    { id: 'paypal', name: 'PayPal', icon: <Wallet className="w-5 h-5" /> },
    { id: 'crypto', name: 'Cryptocurrency', icon: <Bitcoin className="w-5 h-5" /> },
    { id: 'cash', name: 'Cash', icon: <DollarSign className="w-5 h-5" /> }
  ];

  const togglePaymentMethod = (methodId: string) => {
    setSelectedPaymentMethods(prev => 
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const sendPaymentEmail = async () => {
    if (!invoice.client?.email) {
      showError('Error', 'Client email is missing');
      return;
    }

    try {
      setIsSending(true);

      // Generate a unique payment link
      const paymentLink = `https://pay.privatecharterx.com/${invoice.invoice_number}?amount=${invoice.total_amount}&currency=${invoice.currency}`;
      
      // Replace placeholder with actual payment link
      const emailContent = emailBody.replace('[PAYMENT_LINK]', paymentLink);

      // In a real implementation, this would call an edge function to send the email
      // For this demo, we'll simulate sending the email
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update invoice status to 'sent'
      await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      // Log the email sending activity
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (systemUser) {
        await supabase
          .from('user_activity_logs')
          .insert([{
            user_id: systemUser.id,
            action: 'email_sent',
            details: {
              email_type: 'payment_request',
              recipient: invoice.client?.email,
              invoice_id: invoice.id,
              invoice_number: invoice.invoice_number,
              amount: invoice.total_amount,
              currency: invoice.currency,
              payment_methods: selectedPaymentMethods
            }
          }]);
      }

      setEmailSent(true);
      showSuccess('Success', `Payment email sent to ${invoice.client?.email}`);
      
      // Wait a moment before closing the modal
      setTimeout(() => {
        onSent();
      }, 1500);
    } catch (err: any) {
      console.error('Error sending payment email:', err);
      showError('Error', 'Failed to send payment email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Send Payment Email</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {emailSent ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-black mb-2">Email Sent Successfully</h3>
            <p className="text-gray-600 mb-6">
              Payment request email has been sent to {invoice.client?.email}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-blue-700 font-medium">Payment Request Email</p>
                    <p className="text-blue-600 mt-1 text-sm">
                      This email will be sent to {invoice.client?.email} with a secure payment link.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use [PAYMENT_LINK] as a placeholder for the secure payment link.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Methods
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => togglePaymentMethod(method.id)}
                      className={`flex items-center space-x-2 p-3 rounded-lg border ${
                        selectedPaymentMethods.includes(method.id) ? 'border-black bg-gray-50' : 'border-gray-200'
                      }`}
                    >
                      {method.icon}
                      <span>{method.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select the payment methods that will be available to the client.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-black mb-3">Invoice Summary</h3>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-sm"><span className="font-medium">Invoice:</span> {invoice.invoice_number}</p>
                  <p className="text-sm"><span className="font-medium">Client:</span> {invoice.client?.name}</p>
                  <p className="text-sm"><span className="font-medium">Amount:</span> {invoice.currency} {invoice.total_amount.toFixed(2)}</p>
                  <p className="text-sm"><span className="font-medium">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendPaymentEmail}
                disabled={isSending || selectedPaymentMethods.length === 0}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};