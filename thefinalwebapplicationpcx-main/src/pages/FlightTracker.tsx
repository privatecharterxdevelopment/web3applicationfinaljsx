import React, { useState, useEffect } from 'react';
import { Search, Map, List, Plane, Clock, TrendingUp, Activity, Eye, X, ChevronRight, Radio, Leaf } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CO2DetailModal from '../components/CO2DetailModal';

interface Flight {
  id: string;
  callsign: string;
  aircraft_type: string;
  registration: string;
  origin: string;
  destination: string;
  departure_time: string;
  current_position: {
    lat: number;
    lng: number;
    altitude: number;
    speed: number;
  };
  status: 'active' | 'departed' | 'arrived';
  distance_km: number;
  estimated_value: number;
}

// Mock data with CO2 calculations
const mockFlights: Flight[] = [
  {
    id: '1',
    callsign: 'N450GA',
    aircraft_type: 'G450',
    registration: 'N450GA',
    origin: 'KTEB',
    destination: 'EGGW',
    departure_time: '14:30',
    current_position: { lat: 51.8763, lng: -8.4841, altitude: 41000, speed: 545 },
    status: 'active',
    distance_km: 5544,
    estimated_value: 2.8
  },
  {
    id: '2',
    callsign: 'OE-LEM',
    aircraft_type: 'Citation X+',
    registration: 'OE-LEM',
    origin: 'LFMN',
    destination: 'LSZH',
    departure_time: '16:15',
    current_position: { lat: 46.2044, lng: 6.1432, altitude: 35000, speed: 485 },
    status: 'active',
    distance_km: 380,
    estimated_value: 1.2
  },
  {
    id: '3',
    callsign: 'N728GV',
    aircraft_type: 'Global 7500',
    registration: 'N728GV',
    origin: 'KLAX',
    destination: 'RJTT',
    departure_time: '22:00',
    current_position: { lat: 35.6762, lng: 139.6503, altitude: 0, speed: 0 },
    status: 'arrived',
    distance_km: 8825,
    estimated_value: 4.7
  },
  {
    id: '4',
    callsign: 'M-IDAS',
    aircraft_type: 'Falcon 7X',
    registration: 'M-IDAS',
    origin: 'EGKB',
    destination: 'LFPB',
    departure_time: '11:45',
    current_position: { lat: 49.0097, lng: 2.5479, altitude: 39000, speed: 520 },
    status: 'active',
    distance_km: 365,
    estimated_value: 1.8
  },
  {
    id: '5',
    callsign: 'VP-CSS',
    aircraft_type: 'A319 ACJ',
    registration: 'VP-CSS',
    origin: 'UUDD',
    destination: 'OMDB',
    departure_time: '08:20',
    current_position: { lat: 26.8206, lng: 30.8025, altitude: 42000, speed: 490 },
    status: 'active',
    distance_km: 2845,
    estimated_value: 6.2
  }
];

export default function FlightTracker() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [apiStatus, setApiStatus] = useState<'live' | 'cached' | 'error'>('live');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // CO2 Modal State
  const [showCO2Modal, setShowCO2Modal] = useState(false);
  const [selectedFlightForCO2, setSelectedFlightForCO2] = useState<Flight | null>(null);

  useEffect(() => {
    fetchFlights();
    const interval = setInterval(fetchFlights, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchFlights = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFlights(mockFlights);
      setApiStatus('live');
      setLastUpdate(new Date());
    } catch (error) {
      console.error('API failed, using cached data:', error);
      setFlights(mockFlights);
      setApiStatus('cached');
    }
    setLoading(false);
  };

  // CO2 Calculation helper
  const calculateCO2 = (distance: number, aircraftType: string) => {
    const emissionFactors = {
      'G450': 2.1, 'G550': 2.3, 'G650': 2.5,
      'Citation X+': 1.8, 'Global 7500': 2.7,
      'Falcon 7X': 2.2, 'A319 ACJ': 3.2,
      'default': 2.0
    };
    
    const factor = emissionFactors[aircraftType as keyof typeof emissionFactors] || emissionFactors.default;
    const co2Tonnes = (distance * factor) / 1000;
    const offsetCost = co2Tonnes * 35; // €35 per tonne
    
    return { co2Tonnes, offsetCost };
  };

  const filteredFlights = flights.filter(flight => {
    const search = searchTerm.toLowerCase();
    return (
      flight.callsign.toLowerCase().includes(search) ||
      flight.aircraft_type.toLowerCase().includes(search) ||
      flight.origin.toLowerCase().includes(search) ||
      flight.destination.toLowerCase().includes(search)
    );
  });

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400';
      case 'departed': return 'bg-blue-400';
      case 'arrived': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  // Calculate total CO2 for stats
  const totalCO2Today = flights.reduce((total, flight) => {
    const { co2Tonnes } = calculateCO2(flight.distance_km, flight.aircraft_type);
    return total + co2Tonnes;
  }, 0);

  const handleFlightClick = (flight: Flight) => {
    setSelectedFlightForCO2(flight);
    setShowCO2Modal(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-[88px]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin text-gray-900 tracking-tight mb-6">
              Private Jet Tracker
            </h1>
            <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed">
              Live private aircraft monitoring with carbon offset certificates. Track exclusive aviation movements worldwide and offset your environmental impact.
            </p>
          </div>

          {/* Simple Controls */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search private jets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white shadow-sm"
                />
              </div>
              
              <div className="flex bg-white border border-gray-200 rounded-[1.5rem] overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-colors ${
                    viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-3 transition-colors ${
                    viewMode === 'map' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Map size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Live Indicator */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus === 'live' ? 'bg-green-400 animate-pulse' : 
                  apiStatus === 'cached' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-sm text-gray-600 font-medium">
                  {filteredFlights.filter(f => f.status === 'active').length} private jets active
                </span>
                {apiStatus === 'cached' && (
                  <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
                    Cached data
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                Updated {Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000)}s ago
              </span>
            </div>
          </div>

          {/* Flight List */}
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-16 text-center shadow-sm">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 font-medium">Scanning private aviation radar...</p>
              <p className="text-xs text-gray-500 mt-1">Detecting exclusive aircraft movements</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              {filteredFlights.length === 0 ? (
                <div className="p-16 text-center">
                  <Plane size={32} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 font-medium">No private jets found</p>
                  <p className="text-xs text-gray-500 mt-1">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredFlights.map((flight) => {
                    const { co2Tonnes, offsetCost } = calculateCO2(flight.distance_km, flight.aircraft_type);
                    
                    return (
                      <div
                        key={flight.id}
                        className="group hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleFlightClick(flight)}
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-3 h-3 rounded-full ${getStatusDot(flight.status)}`}></div>
                              
                              <div className="min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="text-sm font-semibold text-gray-900">
                                    {flight.callsign}
                                  </h3>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {flight.aircraft_type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600">
                                    {flight.origin}
                                  </span>
                                  <div className="w-4 h-px bg-gray-300"></div>
                                  <span className="text-xs text-gray-600">
                                    {flight.destination}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 text-right">
                              {/* CO2 Badge */}
                              <div className="text-center">
                                <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200 mb-1">
                                  <Leaf size={12} />
                                  <span>{co2Tonnes.toFixed(1)}t CO₂</span>
                                </div>
                                <div className="text-xs text-gray-500">€{offsetCost.toFixed(0)} offset</div>
                              </div>

                              {flight.status === 'active' && (
                                <div className="text-xs text-gray-500">
                                  <div className="font-medium">{flight.current_position.altitude.toLocaleString()}ft</div>
                                  <div className="mt-0.5">{flight.current_position.speed}kts</div>
                                </div>
                              )}
                              
                              <div className="text-xs text-gray-500">
                                <div className="font-medium">{flight.departure_time}</div>
                                <div className="mt-0.5">{flight.distance_km.toLocaleString()}km</div>
                              </div>

                              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="h-96 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Map size={48} className="text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Interactive Private Jet Map</h4>
                  <p className="text-gray-500 font-light">Mapbox integration coming soon</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Stats with CO2 */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{flights.length}</div>
              <div className="text-gray-600 font-light">Private Jets Tracked</div>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {flights.filter(f => f.status === 'active').length}
              </div>
              <div className="text-gray-600 font-light">Currently Airborne</div>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {totalCO2Today.toFixed(0)}t
              </div>
              <div className="text-gray-600 font-light">CO₂ Emissions Today</div>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                €{(totalCO2Today * 35).toFixed(0)}
              </div>
              <div className="text-gray-600 font-light">Potential Offset Value</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* CO2 Detail Modal */}
      {showCO2Modal && selectedFlightForCO2 && (
        <CO2DetailModal
          flight={selectedFlightForCO2}
          isOpen={showCO2Modal}
          onClose={() => {
            setShowCO2Modal(false);
            setSelectedFlightForCO2(null);
          }}
        />
      )}
    </div>
  );
}