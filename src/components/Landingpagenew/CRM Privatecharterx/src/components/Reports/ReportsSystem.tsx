import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  Filter,
  DollarSign,
  Users,
  Plane,
  FileText
} from 'lucide-react';

export const ReportsSystem: React.FC = () => {
  const [reportType, setReportType] = useState<'revenue' | 'bookings' | 'clients' | 'performance'>('revenue');
  const [dateRange, setDateRange] = useState('30days');

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

  const topClients = [
    { name: 'Client 1', company: 'Company 1', spent: 0, bookings: 0 },
    { name: 'Client 2', company: 'Company 2', spent: 0, bookings: 0 },
    { name: 'Client 3', company: 'Company 3', spent: 0, bookings: 0 },
    { name: 'Client 4', company: 'Individual', spent: 0, bookings: 0 }
  ];

  const ReportCard: React.FC<{
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
    icon: React.ComponentType<any>;
  }> = ({ title, value, change, changeType, icon: Icon }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-black mt-1">{value}</p>
          <p className={`text-xs mt-1 flex items-center ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {change}
          </p>
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-gray-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Reports & Analytics</h1>
            <p className="text-gray-600">Track performance and generate insights for your business</p>
          </div>
          <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>

        {/* Report Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="revenue">Revenue Report</option>
                <option value="bookings">Bookings Report</option>
                <option value="clients">Client Report</option>
                <option value="performance">Performance Report</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="6months">Last 6 months</option>
                <option value="1year">Last year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ReportCard
          title="Total Bookings"
          value="0"
          change="+12.5% from last period"
          changeType="positive"
          icon={Calendar}
        />
        <ReportCard
          title="Active Clients"
          value="0"
          change="+8.2% from last period"
          changeType="positive"
          icon={Users}
        />
        <ReportCard
          title="Services"
          value="0"
          change="+15.1% from last period"
          changeType="positive"
          icon={Plane}
        />
        <ReportCard
          title="Completed"
          value="0"
          change="+4.3% from last period"
          changeType="positive"
          icon={FileText}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">Revenue Trend</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {revenueData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700 w-8">{data.month}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                      <div 
                        className="bg-black h-2 rounded-full" 
                        style={{ width: `${(data.revenue / 4200000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-black">
                      ${(data.revenue / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-gray-500">{data.bookings} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">Service Breakdown</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {serviceBreakdown.map((service, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{service.service}</span>
                    <span className="text-sm font-semibold text-black">{service.percentage}%</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-black h-2 rounded-full" 
                        style={{ width: `${service.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">
                      ${(service.revenue / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{service.bookings} bookings</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-black">Top Clients by Revenue</h2>
        </div>
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
              {topClients.map((client, index) => (
                <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-medium text-black">{client.name}</td>
                  <td className="p-4 text-gray-600">{client.company}</td>
                  <td className="p-4 font-semibold text-black">${client.spent.toLocaleString()}</td>
                  <td className="p-4 text-gray-600">{client.bookings}</td>
                  <td className="p-4 text-gray-600">${Math.round(client.spent / client.bookings).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};