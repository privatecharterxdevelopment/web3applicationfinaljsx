import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  FileText, 
  CreditCard, 
  Calendar, 
  Filter, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Mail, 
  Download, 
  Printer, 
  X, 
  Save,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Phone,
  Send,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';
import { FinancialReports } from './FinancialReports';
import { InvoiceGenerator } from './InvoiceGenerator';
import { PaymentEmailModal } from './PaymentEmailModal';
import { PartnerMemberships } from './PartnerMemberships';

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string | null;
  client_id: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'cancelled';
  payment_method: string | null;
  payment_date: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  file_url: string | null;
  client?: {
    name: string;
    email: string;
    company: string | null;
  };
  order?: {
    order_number: string;
  };
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  reference: string | null;
  invoice_id: string | null;
  order_id: string | null;
  client_id: string | null;
  created_by: string;
  created_at: string;
  invoice?: {
    invoice_number: string;
  };
  order?: {
    order_number: string;
  };
  client?: {
    name: string;
    email: string;
  };
}

export const AccountingSystem: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<'invoices' | 'transactions' | 'reports' | 'partners'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'unpaid' | 'pending' | 'paid' | 'refunded' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | '90days' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [showPaymentEmailModal, setShowPaymentEmailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'accountant') {
      fetchInvoices();
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter, paymentStatusFilter]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, typeFilter, dateRange, customDateRange]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients!client_id (name, email, company),
          order:service_orders!order_id (order_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError('Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          invoice:invoices!invoice_id (invoice_number),
          order:service_orders!order_id (order_number),
          client:clients!client_id (name, email)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.order?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.payment_status === paymentStatusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const today = new Date();
      let startDate: Date;
      
      if (dateRange === 'custom') {
        startDate = new Date(customDateRange.start);
        const endDate = new Date(customDateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      } else {
        switch (dateRange) {
          case '7days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
          case '30days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);
            break;
          case '90days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 90);
            break;
          default:
            startDate = new Date(0); // Beginning of time
        }
        
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startDate && transactionDate <= today;
        });
      }
    }

    setFilteredTransactions(filtered);
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: Invoice['status']) => {
    try {
      setIsUpdatingStatus(true);
      
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;
      
      showSuccess('Success', `Invoice status updated to ${newStatus}`);
      
      // Update local state
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
        )
      );
      
      // Update selected invoice if details modal is open
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({...selectedInvoice, status: newStatus});
      }
    } catch (err: any) {
      console.error('Error updating invoice status:', err);
      showError('Error', 'Failed to update invoice status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const updateInvoicePaymentStatus = async (invoiceId: string, newStatus: Invoice['payment_status']) => {
    try {
      setIsUpdatingStatus(true);
      
      const updateData: any = { 
        payment_status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // If marking as paid, set payment date to now
      if (newStatus === 'paid') {
        updateData.payment_date = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (error) throw error;
      
      showSuccess('Success', `Payment status updated to ${newStatus}`);
      
      // Update local state
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === invoiceId ? { 
            ...invoice, 
            payment_status: newStatus,
            ...(newStatus === 'paid' ? { payment_date: new Date().toISOString() } : {})
          } : invoice
        )
      );
      
      // Update selected invoice if details modal is open
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({
          ...selectedInvoice, 
          payment_status: newStatus,
          ...(newStatus === 'paid' ? { payment_date: new Date().toISOString() } : {})
        });
      }
      
      fetchInvoices(); // Refresh the list
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      showError('Error', 'Failed to update payment status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'sent': return <Mail className="w-4 h-4 text-blue-500" />;
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-gray-500" />;
      case 'unpaid': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'refunded': return <CreditCard className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateTotalRevenue = () => {
    return filteredInvoices
      .filter(invoice => invoice.payment_status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);
  };

  const calculateTotalOutstanding = () => {
    return filteredInvoices
      .filter(invoice => invoice.payment_status === 'unpaid' || invoice.payment_status === 'pending')
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);
  };

  const calculateTotalExpenses = () => {
    return filteredTransactions
      .filter(transaction => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  if (user?.role !== 'admin' && user?.role !== 'accountant') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          Access denied. This section is only available to accounting and admin users.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Accounting System</h1>
            <p className="text-gray-600">Manage invoices, transactions, and financial reports</p>
          </div>
          <div className="flex space-x-3">
            {activeTab === 'invoices' && (
              <button 
                onClick={() => setShowAddInvoiceModal(true)}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Invoice</span>
              </button>
            )}
            {activeTab === 'transactions' && (
              <button 
                onClick={() => setShowAddTransactionModal(true)}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Transaction</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'invoices'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'transactions'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Transactions</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'reports'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Reports</span>
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'partners'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Partner Memberships</span>
          </button>
        </div>
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">0</p>
              <p className="text-sm text-gray-500">Total Invoices</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">0</p>
              <p className="text-sm text-gray-500">Paid</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">0</p>
              <p className="text-sm text-gray-500">Outstanding</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search invoices by number, client, or order..."
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
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Payment Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">Invoice</th>
                    <th className="text-left p-4 font-medium text-gray-700">Client</th>
                    <th className="text-left p-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left p-4 font-medium text-gray-700">Issue Date</th>
                    <th className="text-left p-4 font-medium text-gray-700">Due Date</th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700">Payment</th>
                    <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <FileText className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-black">{invoice.invoice_number}</p>
                            {invoice.order && (
                              <p className="text-xs text-gray-500">Order: {invoice.order.order_number}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-black">{invoice.client?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{invoice.client?.email || 'N/A'}</p>
                          {invoice.client?.company && (
                            <p className="text-xs text-gray-500">{invoice.client.company}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">{formatCurrency(invoice.total_amount, invoice.currency)}</p>
                        <p className="text-xs text-gray-500">Tax: {formatCurrency(invoice.tax_amount, invoice.currency)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(invoice.issue_date)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(invoice.due_date)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(invoice.status)}
                          <select
                            value={invoice.status}
                            onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value as any)}
                            disabled={isUpdatingStatus}
                            className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(invoice.status)}`}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          {isUpdatingStatus && invoice.status === invoice.status && (
                            <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(invoice.payment_status)}
                          <select
                            value={invoice.payment_status}
                            onChange={(e) => updateInvoicePaymentStatus(invoice.id, e.target.value as any)}
                            disabled={isUpdatingStatus}
                            className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(invoice.payment_status)}`}
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="refunded">Refunded</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          {isUpdatingStatus && invoice.payment_status === invoice.payment_status && (
                            <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowInvoiceGenerator(true);
                            }}
                            className="p-2 text-gray-400 hover:text-black transition-colors"
                            title="Generate PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowPaymentEmailModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-black transition-colors"
                            title="Send Payment Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          {invoice.file_url && (
                            <a 
                              href={invoice.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-black transition-colors"
                              title="Download Invoice"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredInvoices.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No invoices found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || paymentStatusFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No invoices have been created yet'
                }
              </p>
            </div>
          )}
        </>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">0</p>
              <p className="text-sm text-gray-500">Total Transactions</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">0</p>
              <p className="text-sm text-gray-500">Income</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">0</p>
              <p className="text-sm text-gray-500">Expenses</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transactions by description, category, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">Date</th>
                    <th className="text-left p-4 font-medium text-gray-700">Description</th>
                    <th className="text-left p-4 font-medium text-gray-700">Category</th>
                    <th className="text-left p-4 font-medium text-gray-700">Type</th>
                    <th className="text-left p-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left p-4 font-medium text-gray-700">Reference</th>
                    <th className="text-left p-4 font-medium text-gray-700">Related To</th>
                    <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(transaction.date)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-black">{transaction.description}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{transaction.category}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{transaction.reference || 'N/A'}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          {transaction.invoice && (
                            <p className="text-xs text-gray-500">Invoice: {transaction.invoice.invoice_number}</p>
                          )}
                          {transaction.order && (
                            <p className="text-xs text-gray-500">Order: {transaction.order.order_number}</p>
                          )}
                          {transaction.client && (
                            <p className="text-xs text-gray-500">Client: {transaction.client.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setSelectedTransaction(transaction)}
                            className="p-2 text-gray-400 hover:text-black transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-2 text-gray-400 hover:text-black transition-colors"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredTransactions.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No transactions found</h3>
              <p className="text-gray-500">
                {searchTerm || typeFilter !== 'all' || dateRange !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No transactions have been recorded yet'
                }
              </p>
            </div>
          )}
        </>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <FinancialReports 
          invoices={invoices} 
          transactions={transactions}
          dateRange={dateRange === 'custom' ? customDateRange : dateRange}
        />
      )}

      {/* Partner Memberships Tab */}
      {activeTab === 'partners' && (
        <PartnerMemberships />
      )}

      {/* Invoice Generator Modal */}
      {showInvoiceGenerator && selectedInvoice && (
        <InvoiceGenerator
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.invoice_number}
          clientName={selectedInvoice.client?.name || 'Unknown Client'}
          clientEmail={selectedInvoice.client?.email || 'unknown@example.com'}
          clientCompany={selectedInvoice.client?.company}
          amount={selectedInvoice.amount}
          taxAmount={selectedInvoice.tax_amount}
          totalAmount={selectedInvoice.total_amount}
          currency={selectedInvoice.currency}
          issueDate={selectedInvoice.issue_date}
          dueDate={selectedInvoice.due_date}
          notes={selectedInvoice.notes}
          orderNumber={selectedInvoice.order?.order_number}
          onClose={() => {
            setShowInvoiceGenerator(false);
            setSelectedInvoice(null);
          }}
          onSave={(fileUrl) => {
            // Update invoice with file URL
            setInvoices(prevInvoices => 
              prevInvoices.map(invoice => 
                invoice.id === selectedInvoice.id ? { ...invoice, file_url: fileUrl } : invoice
              )
            );
            setShowInvoiceGenerator(false);
            setSelectedInvoice(null);
            showSuccess('Success', 'Invoice PDF generated and saved');
          }}
        />
      )}

      {/* Payment Email Modal */}
      {showPaymentEmailModal && selectedInvoice && (
        <PaymentEmailModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowPaymentEmailModal(false);
            setSelectedInvoice(null);
          }}
          onSent={() => {
            setShowPaymentEmailModal(false);
            setSelectedInvoice(null);
            // Update invoice status to sent
            updateInvoiceStatus(selectedInvoice.id, 'sent');
          }}
        />
      )}
    </div>
  );
};