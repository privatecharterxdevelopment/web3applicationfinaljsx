import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Clock, 
  Download, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';

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
  };
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  date: string;
  client_id: string | null;
  client?: {
    name: string;
  };
}

interface FinancialReportsProps {
  invoices: Invoice[];
  transactions: Transaction[];
  dateRange: 'all' | '7days' | '30days' | '90days' | 'custom' | { start: string; end: string };
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({ 
  invoices, 
  transactions,
  dateRange 
}) => {
  const [activeReport, setActiveReport] = useState<'revenue' | 'bookings' | 'clients' | 'performance'>('revenue');
  const [reportDateRange, setReportDateRange] = useState('30days');

  const revenueData = [
    { month: 'Jan', revenue: 0, bookings: 0 },
    { month: 'Feb', revenue: 0, bookings: 0 },
    { month: 'Mar', revenue: 0, bookings: 0 },
    { month: 'Apr', revenue: 0, bookings: 0 },
    { month: 'May', revenue: 0, bookings: 0 },
    { month: 'Jun', revenue: 0, bookings: 0 }
  ];

  const serviceBreakdown = [
    { service: 'Private Jets', revenue: 0, percentage: 0, bookings: 0 },
    { service: 'Yachts', revenue: 0, percentage: 0, bookings: 0 },
    { service: 'Helicopters', revenue: 0, percentage: 0, bookings: 0 },
    { service: 'Luxury Cars', revenue: 0, percentage: 0, bookings: 0 }
  ];

  const clientList = [
    { name: 'Client 1', company: 'Company 1', spent: 0, bookings: 0 },
    { name: 'Client 2', company: 'Company 2', spent: 0, bookings: 0 },
    { name: 'Client 3', company: 'Company 3', spent: 0, bookings: 0 },
    { name: 'Client 4', company: 'Individual', spent: 0, bookings: 0 }
  ];

  const ReportCard: React.FC<{
    title: string;
    value: string;
    change: string;
    icon: React.ReactNode;
    trend: 'up' | 'down';
  }> = ({ title, value, change, icon, trend }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-black">{value}</p>
          <p className={`text-sm flex items-center mt-1 ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {change}
          </p>
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );

  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; amount: number }[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<{ category: string; amount: number }[]>([]);
  const [clientData, setClientData] = useState<{ client: string; amount: number }[]>([]);
  const [profitLoss, setProfitLoss] = useState<{ month: string; income: number; expenses: number; profit: number }[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    filterData();
  }, [invoices, transactions, dateRange]);

  useEffect(() => {
    if (filteredInvoices.length > 0 || filteredTransactions.length > 0) {
      generateReports();
    }
  }, [filteredInvoices, filteredTransactions]);

  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  const filterData = () => {
    // Apply date filter
    const today = new Date();
    let startDate: Date;
    let endDate = new Date();

    if (typeof dateRange === 'object' && 'start' in dateRange) {
      startDate = new Date(dateRange.start);
      endDate = new Date(dateRange.end);
    } else {
      switch (dateRange) {
        case '7days':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          break;
        case '90days':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 90);
          break;
        case '30days':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          break;
        case 'all':
        default:
          startDate = new Date(0); // Beginning of time
          break;
      }
    }

    // Filter invoices
    const filtered_invoices = dateRange === 'all' 
      ? [...invoices]
      : invoices.filter(invoice => {
          const issueDate = new Date(invoice.issue_date);
          return issueDate >= startDate && issueDate <= endDate;
        });
    
    setFilteredInvoices(filtered_invoices);

    // Filter transactions
    const filtered_transactions = dateRange === 'all'
      ? [...transactions]
      : transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
    
    setFilteredTransactions(filtered_transactions);
  };

  const generateReports = () => {
    // Generate revenue by month
    const revenueMap = new Map<string, number>();
    
    filteredInvoices.forEach(invoice => {
      const date = new Date(invoice.issue_date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const currentAmount = revenueMap.get(monthYear) || 0;
      revenueMap.set(monthYear, currentAmount + invoice.total_amount);
    });
    
    const sortedRevenue = Array.from(revenueMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' });
        return { month: `${monthName} ${year}`, amount };
      });
    
    setRevenueByMonth(sortedRevenue);

    // Generate expenses by category
    const expensesMap = new Map<string, number>();
    
    filteredTransactions
      .filter(transaction => transaction.type === 'expense')
      .forEach(transaction => {
        const category = transaction.category || 'Uncategorized';
        const currentAmount = expensesMap.get(category) || 0;
        expensesMap.set(category, currentAmount + transaction.amount);
      });
    
    const sortedExpenses = Array.from(expensesMap.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by amount descending
      .map(([category, amount]) => ({ category, amount }));
    
    setExpensesByCategory(sortedExpenses);

    // Generate top clients
    const clientMap = new Map<string, number>();
    
    filteredInvoices.forEach(invoice => {
      const clientName = invoice.client?.name || 'Unknown Client';
      const currentAmount = clientMap.get(clientName) || 0;
      clientMap.set(clientName, currentAmount + invoice.total_amount);
    });
    
    const sortedClients = Array.from(clientMap.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by amount descending
      .slice(0, 10) // Top 10 clients
      .map(([client, amount]) => ({ client, amount }));
    
    setClientData(sortedClients);

    // Generate profit/loss by month
    const incomeByMonth = new Map<string, number>();
    const expensesByMonth = new Map<string, number>();
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (transaction.type === 'income') {
        const currentAmount = incomeByMonth.get(monthYear) || 0;
        incomeByMonth.set(monthYear, currentAmount + transaction.amount);
      } else {
        const currentAmount = expensesByMonth.get(monthYear) || 0;
        expensesByMonth.set(monthYear, currentAmount + transaction.amount);
      }
    });
    
    // Combine income and expenses
    const allMonths = new Set([...incomeByMonth.keys(), ...expensesByMonth.keys()]);
    const profitLossData = Array.from(allMonths)
      .sort()
      .map(monthYear => {
        const income = incomeByMonth.get(monthYear) || 0;
        const expenses = expensesByMonth.get(monthYear) || 0;
        const profit = income - expenses;
        
        const [year, monthNum] = monthYear.split('-');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' });
        
        return {
          month: `${monthName} ${year}`,
          income,
          expenses,
          profit
        };
      });
    
    setProfitLoss(profitLossData);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const exportReportCSV = () => {
    let csvContent = '';
    let fileName = '';
    
    switch (activeReport) {
      case 'revenue':
        csvContent = 'Month,Revenue\n' + 
          revenueByMonth.map(item => `${item.month},${item.amount}`).join('\n');
        fileName = 'revenue_report.csv';
        break;
      case 'expenses':
        csvContent = 'Category,Amount\n' + 
          expensesByCategory.map(item => `${item.category},${item.amount}`).join('\n');
        fileName = 'expenses_report.csv';
        break;
      case 'profit':
        csvContent = 'Month,Income,Expenses,Profit\n' + 
          profitLoss.map(item => `${item.month},${item.income},${item.expenses},${item.profit}`).join('\n');
        fileName = 'profit_loss_report.csv';
        break;
      case 'clients':
        csvContent = 'Client,Revenue\n' + 
          clientData.map(item => `${item.client},${item.amount}`).join('\n');
        fileName = 'top_clients_report.csv';
        break;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate summary metrics
  const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const invoiceCount = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter(i => i.payment_status === 'paid').length;
  const paidPercentage = invoiceCount > 0 ? Math.round((paidInvoices / invoiceCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ReportCard
          title="Total Revenue"
          value="$0"
          change="+0% from last month"
          icon={<DollarSign className="w-8 h-8" />}
          trend="up"
        />
        <ReportCard
          title="Total Bookings"
          value="0"
          change="+0% from last month"
          icon={<Calendar className="w-8 h-8" />}
          trend="up"
        />
        <ReportCard
          title="Avg. Booking Value"
          value="$0"
          change="+0% from last month"
          icon={<TrendingUp className="w-8 h-8" />}
          trend="up"
        />
        <ReportCard
          title="Active Clients"
          value="0"
          change="+0% from last month"
          icon={<Users className="w-8 h-8" />}
          trend="up"
        />
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: '7days', label: '7 Days' },
            { key: '30days', label: '30 Days' },
            { key: '90days', label: '90 Days' },
            { key: 'all', label: 'All Time' }
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setReportDateRange(option.key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                reportDateRange === option.key
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <button className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'revenue', label: 'Revenue', icon: BarChart2 },
            { key: 'bookings', label: 'Bookings', icon: Calendar },
            { key: 'clients', label: 'Clients', icon: Users },
            { key: 'performance', label: 'Performance', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveReport(tab.key as any)}
              className={`px-6 py-4 font-medium text-sm flex items-center space-x-2 ${
                activeReport === tab.key
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {/* Revenue Report */}
          {activeReport === 'revenue' && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-6">Revenue Overview</h3>
              <div className="space-y-4">
                {revenueData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 w-full">
                      <span className="text-sm font-medium text-gray-700 w-8">{data.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                        <div 
                          className="bg-black h-2 rounded-full" 
                          style={{ width: `0%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-black">
                        $0
                      </p>
                      <p className="text-xs text-gray-500">0 bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Bookings Report */}
          {activeReport === 'bookings' && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-6">Service Breakdown</h3>
              <div className="space-y-6">
                {serviceBreakdown.map((service, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{service.service}</span>
                      <span className="text-sm font-semibold text-black">0%</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-black h-2 rounded-full" 
                          style={{ width: `0%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">
                        $0
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">0 bookings</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Clients Report */}
          {activeReport === 'clients' && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-6">Top Clients</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-700">Client</th>
                      <th className="text-left p-4 font-medium text-gray-700">Company</th>
                      <th className="text-left p-4 font-medium text-gray-700">Total Spent</th>
                      <th className="text-left p-4 font-medium text-gray-700">Bookings</th>
                      <th className="text-left p-4 font-medium text-gray-700">Avg. Booking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientList.map((client, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="p-4 font-medium text-black">{client.name}</td>
                        <td className="p-4 text-gray-600">{client.company}</td>
                        <td className="p-4 font-semibold text-black">$0</td>
                        <td className="p-4 text-gray-600">0</td>
                        <td className="p-4 text-gray-600">$0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Performance Report */}
          {activeReport === 'performance' && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-6">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Booking Conversion</h4>
                  <div className="text-3xl font-bold text-black">0%</div>
                  <p className="text-sm text-gray-500">0 bookings from 0 inquiries</p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Average Response Time</h4>
                  <div className="text-3xl font-bold text-black">0h</div>
                  <p className="text-sm text-gray-500">Time to first response</p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Client Retention</h4>
                  <div className="text-3xl font-bold text-black">0%</div>
                  <p className="text-sm text-gray-500">0 repeat clients</p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Revenue Growth</h4>
                  <div className="text-3xl font-bold text-black">0%</div>
                  <p className="text-sm text-gray-500">Month-over-month growth</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add Users component for the import
const Users = ({ className }: { className?: string }) => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);