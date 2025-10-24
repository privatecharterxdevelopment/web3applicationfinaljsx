import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plane, Calendar, MapPin, Users, Clock, Search, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface FlightHistoryProps {
  onBack: () => void;
}

interface Flight {
  id: string;
  user_id: string;
  from: string;
  to: string;
  no_passengers: number;
  start_date: string;
  end_date?: string;
  total_price?: number;
  service_id?: string;
  status: string;
  created_at: string;
}

export default function FlightHistory({ onBack }: FlightHistoryProps) {
  const { user } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('booking_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlights(data || []);
    } catch (error) {
      console.error('Error fetching flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSampleBooking = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('booking_requests')
        .insert([{
          user_id: user.id,
          from: 'London Heathrow (LHR)',
          to: 'Paris Charles de Gaulle (CDG)',
          no_passengers: 4,
          start_date: new Date().toISOString(),
          status: 'pending',
          service_id: 'light-jet',
          email: user.email,
          name: user.name || 'Demo User'
        }]);

      if (error) throw error;
      fetchFlights(); // Refresh the list
    } catch (error) {
      console.error('Error creating sample booking:', error);
    }
  };

  const filteredFlights = flights.filter(flight => {
    // Apply status filter
    if (statusFilter !== 'all' && flight.status !== statusFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        flight.from?.toLowerCase().includes(searchLower) ||
        flight.to?.toLowerCase().includes(searchLower) ||
        flight.status?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold">Flight History</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search flights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        </div>
      ) : filteredFlights.length > 0 ? (
        <div className="space-y-4">
          {filteredFlights.map((flight) => (
            <div key={flight.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Plane size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{flight.from}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                      <span className="font-medium">{flight.to}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {flight.service_id && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                          {flight.service_id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(flight.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{flight.no_passengers} passengers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatDate(flight.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:items-end gap-2">
                  <div className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(flight.status)}`}>
                    {flight.status}
                  </div>
                  {flight.total_price && (
                    <div className="font-bold">
                      €{flight.total_price.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plane size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No Flights Found</h3>
          <p className="text-gray-500 mt-2">
            {searchTerm || statusFilter !== 'all'
              ? 'No flights match your search criteria'
              : 'You haven\'t booked any flights yet'}
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
          {!searchTerm && statusFilter === 'all' && (
            <div className="mt-4 space-y-2">
              <button 
                onClick={() => window.location.href = '/'}
                className="block mx-auto px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Book Your First Flight
              </button>
              <button 
                onClick={createSampleBooking}
                className="block mx-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Create Sample Booking (Demo)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}