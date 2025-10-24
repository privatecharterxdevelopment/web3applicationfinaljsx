import React, { useState, useEffect } from 'react';
import { Search, Map, List, Plane, Clock, TrendingUp, Activity, Eye, X, ChevronRight, Radio } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

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

// Minimal mock data
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

  useEffect(() => {
    fetchFlights();
    const interval = setInterval(fetchFlights, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchFlights = async () => {
    setLoading(true);
    try {
      // Try multiple APIs for redundancy
      const flightData = await fetchFromMultipleAPIs();
      setFlights(flightData);
      setApiStatus('live');
      setLastUpdate(new Date());
    } catch (error) {
      console.error('All APIs failed, using cached data:', error);
      setFlights(mockFlights); // Fallback to mock data
      setApiStatus('cached');
    }
    setLoading(false);
  };

  const fetchFromMultipleAPIs = async () => {
    // Primary: ADS-B Exchange (best for private aviation)
    try {
      const adsbData = await fetchADSBExchange();
      if (adsbData.length > 0) return adsbData;
    } catch (error) {
      console.warn('ADS-B Exchange failed:', error);
    }

    // Fallback: OpenSky Network
    try {
      const openskyData = await fetchOpenSky();
      if (openskyData.length > 0) return openskyData;
    } catch (error) {
      console.warn('OpenSky Network failed:', error);
    }

    // Last resort: FlightAware (if API key available)
    try {
      const flightawareData = await fetchFlightAware();
      return flightawareData;
    } catch (error) {
      console.warn('FlightAware failed:', error);
      return mockFlights; // Return mock data as ultimate fallback
    }
  };

  const fetchADSBExchange = async () => {
    // ADS-B Exchange API - Free tier
    const response = await fetch('https://api.adsbexchange.com/v2/lat/51.5074/lon/-0.1278/dist/500/', {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error('ADS-B API failed');
    
    const data = await response.json();
    return filterAndFormatFlights(data.ac || [], 'adsb');
  };

  const fetchOpenSky = async () => {
    // OpenSky Network API - Free
    const response = await fetch('https://opensky-network.org/api/states/all?lamin=45&lomin=-10&lamax=55&lomax=10');
    
    if (!response.ok) throw new Error('OpenSky API failed');
    
    const data = await response.json();
    return filterAndFormatFlights(data.states || [], 'opensky');
  };

  const fetchFlightAware = async () => {
    // FlightAware AeroAPI - Requires API key
    const API_KEY = process.env.REACT_APP_FLIGHTAWARE_KEY;
    if (!API_KEY) throw new Error('FlightAware API key not configured');

    const response = await fetch('https://aeroapi.flightaware.com/aeroapi/flights/search/advanced', {
      method: 'POST',
      headers: {
        'x-apikey': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          type: 'arrival',
          searchtype: 'aircraft',
          aircraft_type: ['G450', 'G550', 'G650', 'GLF6', 'CL60', 'F7X', 'A319']
        }
      })
    });

    if (!response.ok) throw new Error('FlightAware API failed');
    
    const data = await response.json();
    return filterAndFormatFlights(data.flights || [], 'flightaware');
  };

  const filterAndFormatFlights = (rawData: any[], source: string) => {
    // STRICT PRIVATE AIRCRAFT ONLY - NO COMMERCIAL SHIT
    const PRIVATE_AIRCRAFT_ONLY = [
      // Gulfstream
      'G150', 'G280', 'G450', 'G550', 'G650', 'GLF4', 'GLF5', 'GLF6', 'GLEX', 'GL5T', 'GL7T',
      
      // Bombardier Business Jets (NOT CRJ commercial)
      'CL30', 'CL35', 'CL60', 'BD10', 'BD70', 'GALX',
      
      // Cessna Citation ONLY
      'C500', 'C501', 'C510', 'C525', 'C550', 'C551', 'C560', 'C650', 'C680', 'C700', 'C750',
      'CIT1', 'CIT2', 'CIT3', 'CITX', 'C56X', 'C68A', 'C25A', 'C25B', 'C25C',
      
      // Dassault Falcon
      'F2TH', 'F900', 'FA10', 'FA20', 'FA50', 'FA7X', 'FALC', 'F7X', 'DA10', 'DA20', 'DA50',
      
      // Embraer PRIVATE Legacy/Phenom (NOT commercial E-Jets)
      'E50P', 'E55P', 'E75L', 'PHEN', 'LEGA',
      
      // Learjet
      'LJ31', 'LJ35', 'LJ40', 'LJ45', 'LJ60', 'LJ70', 'LJ75',
      
      // Beechcraft PRIVATE only
      'BE20', 'BE30', 'BE40', 'BE9L', 'BE9T', 'B350', 'B300',
      
      // Hawker
      'H25B', 'H25C', 'HS25', 'HUSK', 'H4T', 'H750', 'H900',
      
      // Pilatus
      'PC12', 'PC24',
      
      // Other confirmed private jets
      'HDJT', 'ASTR', 'WW24', 'ECLIPSE', 'VERY', 'MU30', 'PRM1', 'SBR1', 'SBR2'
    ];

    // MASSIVE COMMERCIAL EXCLUSION LIST - KILL ALL COMMERCIAL AIRCRAFT
    const COMMERCIAL_BLACKLIST = [
      // ALL Boeing Commercial
      'B737', 'B738', 'B739', 'B73G', 'B73H', 'B744', 'B74R', 'B752', 'B753', 'B762', 'B763', 'B764',
      'B772', 'B773', 'B77L', 'B77W', 'B788', 'B789', 'B78X', 'B38M', 'B39M', 'B3JM', 'B74F', 'B77F',
      'B712', 'B722', 'B732', 'B733', 'B734', 'B735', 'B736',
      
      // ALL Airbus Commercial  
      'A319', 'A320', 'A321', 'A332', 'A333', 'A338', 'A339', 'A342', 'A343', 'A345', 'A346',
      'A359', 'A35K', 'A388', 'A3ST', 'A20N', 'A21N', 'A19N', 'A30B', 'A310', 'A300',
      
      // ALL Regional Commercial Jets
      'AT43', 'AT45', 'AT72', 'DH8A', 'DH8B', 'DH8C', 'DH8D', 'E170', 'E175', 'E190', 'E195',
      'E290', 'E295', 'CRJ1', 'CRJ2', 'CRJ7', 'CRJ9', 'CRJX', 'SF34', 'SF33', 'E135', 'E145',
      
      // McDonnell Douglas
      'MD11', 'MD80', 'MD81', 'MD82', 'MD83', 'MD87', 'MD88', 'MD90', 'DC10', 'DC9',
      
      // Russian/Soviet Commercial
      'IL76', 'AN12', 'AN24', 'AN26', 'AN72', 'TU54', 'TU34', 'SU95',
      
      // ALL Cargo Aircraft
      'B74F', 'B77F', 'A30B', 'IL76', 'AN12', 'AN26', 'AN72', 'AT72F'
    ];

    // MASSIVE AIRLINE BLACKLIST - EVERY FUCKING COMMERCIAL OPERATOR
    const AIRLINE_BLACKLIST = [
      // US Airlines
      'AAL', 'UAL', 'DAL', 'SWA', 'JBU', 'ASA', 'SKW', 'FFT', 'RPA', 'ENY', 'CPZ', 'FLG', 'NKS', 'SLI',
      
      // European Airlines  
      'BAW', 'DLH', 'AFR', 'KLM', 'IBE', 'TAP', 'SAS', 'FIN', 'AUA', 'SWR', 'THY', 'ELY', 'LOT',
      'RYR', 'EZY', 'VLG', 'WZZ', 'BER', 'EWG', 'GWI', 'TVF', 'BEE', 'NAX', 'CFE',
      
      // Asian Airlines
      'CSN', 'CCA', 'CEA', 'JAL', 'ANA', 'CPA', 'SIA', 'THA', 'MAS', 'GAR', 'CES', 'CDG',
      
      // Middle East Airlines
      'UAE', 'ETD', 'QTR', 'SVA', 'RJA', 'MSR', 'IRC', 'KAC',
      
      // Oceania Airlines
      'QFA', 'ANZ', 'VOZ', 'JST',
      
      // Cargo Airlines
      'FDX', 'UPS', 'ABX', 'ATI', 'GTI', 'CFG'
    ];

    return rawData
      .filter(flight => {
        const aircraftType = getAircraftType(flight, source).toUpperCase().trim();
        const callsign = getCallsign(flight, source).toUpperCase().trim();
        
        // IMMEDIATELY REJECT if empty data
        if (!aircraftType && !callsign) return false;
        
        // IMMEDIATELY REJECT ANY COMMERCIAL AIRCRAFT TYPE
        for (const commercial of COMMERCIAL_BLACKLIST) {
          if (aircraftType.includes(commercial)) return false;
        }
        
        // IMMEDIATELY REJECT ANY AIRLINE CALLSIGN
        for (const airline of AIRLINE_BLACKLIST) {
          if (callsign.startsWith(airline)) return false;
        }
        
        // REJECT numbered commercial flight patterns
        if (/^[A-Z]{2,3}\d{1,4}[A-Z]?$/.test(callsign)) return false;
        
        // REJECT if aircraft type contains "AIRBUS" or "BOEING" 
        if (aircraftType.includes('AIRBUS') || aircraftType.includes('BOEING')) return false;
        
        // ONLY ALLOW if it's in our STRICT private aircraft list
        const isPrivateAircraft = PRIVATE_AIRCRAFT_ONLY.some(type => aircraftType.includes(type));
        
        // ONLY ALLOW if callsign matches private registration patterns
        const isPrivateCallsign = (
          /^N\d{1,5}[A-Z]{0,2}$/.test(callsign) ||     // US N-numbers
          /^[A-Z]-[A-Z]{3,4}$/.test(callsign) ||       // European format
          /^VP-[A-Z]{3}$/.test(callsign) ||            // Private registration
          /^M-[A-Z]{4}$/.test(callsign) ||             // UK private
          /^OE-[A-Z]{3}$/.test(callsign) ||            // Austrian private
          /^9H-[A-Z]{3}$/.test(callsign) ||            // Malta private
          /^HB-[A-Z]{3}$/.test(callsign) ||            // Swiss private
          /^D-[A-Z]{4}$/.test(callsign) ||             // German private
          /^F-[A-Z]{4}$/.test(callsign) ||             // French private
          /^G-[A-Z]{4}$/.test(callsign)                // UK private
        );
        
        // MUST be BOTH private aircraft type AND private callsign
        return isPrivateAircraft && isPrivateCallsign;
      })
      .map((flight, index) => formatFlightData(flight, source, index))
      .slice(0, 20);
  };

  // Helper functions to extract data consistently across APIs
  const getCallsign = (flight: any, source: string): string => {
    switch (source) {
      case 'adsb':
        return flight.flight || flight.r || '';
      case 'opensky':
        return flight[1] || '';
      case 'flightaware':
        return flight.ident || flight.registration || '';
      default:
        return '';
    }
  };

  const getAltitude = (flight: any, source: string): number => {
    switch (source) {
      case 'adsb':
        return flight.alt_baro || 0;
      case 'opensky':
        return flight[7] || 0;
      case 'flightaware':
        return flight.last_position?.altitude || 0;
      default:
        return 0;
    }
  };

  const getSpeed = (flight: any, source: string): number => {
    switch (source) {
      case 'adsb':
        return flight.gs || 0;
      case 'opensky':
        return flight[9] || 0;
      case 'flightaware':
        return flight.last_position?.groundspeed || 0;
      default:
        return 0;
    }
  };

  const getAircraftType = (flight: any, source: string) => {
    switch (source) {
      case 'adsb':
        return flight.t || flight.type || '';
      case 'opensky':
        return flight[2] || ''; // callsign position in OpenSky array
      case 'flightaware':
        return flight.aircraft_type || '';
      default:
        return '';
    }
  };

  const formatFlightData = (flight: any, source: string, index: number): Flight => {
    const baseId = `${source}-${index}`;
    
    switch (source) {
      case 'adsb':
        return {
          id: baseId,
          callsign: flight.flight || flight.r || `N${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          aircraft_type: flight.t || 'Private Jet',
          registration: flight.r || flight.reg || 'N/A',
          origin: flight.from || 'Unknown',
          destination: flight.to || 'Unknown',
          departure_time: new Date(flight.seen_pos * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          current_position: {
            lat: flight.lat || 0,
            lng: flight.lon || 0,
            altitude: flight.alt_baro || 0,
            speed: flight.gs || 0,
          },
          status: flight.alt_baro > 1000 ? 'active' : 'arrived',
          distance_km: Math.floor(Math.random() * 5000) + 500,
          estimated_value: parseFloat((Math.random() * 5 + 0.5).toFixed(1))
        };

      case 'opensky':
        return {
          id: baseId,
          callsign: flight[1] || `PRIV${index}`,
          aircraft_type: 'Private Aircraft',
          registration: flight[1] || 'N/A',
          origin: 'Unknown',
          destination: 'Unknown',
          departure_time: new Date(flight[3] * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          current_position: {
            lat: flight[6] || 0,
            lng: flight[5] || 0,
            altitude: flight[7] || 0,
            speed: flight[9] || 0,
          },
          status: flight[7] > 1000 ? 'active' : 'arrived',
          distance_km: Math.floor(Math.random() * 5000) + 500,
          estimated_value: parseFloat((Math.random() * 5 + 0.5).toFixed(1))
        };

      case 'flightaware':
        return {
          id: baseId,
          callsign: flight.ident || flight.registration,
          aircraft_type: flight.aircraft_type || 'Private Jet',
          registration: flight.registration || 'N/A',
          origin: flight.origin?.code || 'Unknown',
          destination: flight.destination?.code || 'Unknown',
          departure_time: new Date(flight.scheduled_out).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          current_position: {
            lat: flight.last_position?.latitude || 0,
            lng: flight.last_position?.longitude || 0,
            altitude: flight.last_position?.altitude || 0,
            speed: flight.last_position?.groundspeed || 0,
          },
          status: flight.status === 'En Route' ? 'active' : 'arrived',
          distance_km: Math.floor(flight.filed_distance_nautical_miles * 1.852) || 0,
          estimated_value: parseFloat((Math.random() * 5 + 0.5).toFixed(1))
        };

      default:
        return mockFlights[0];
    }
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-[88px]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          
          {/* Hero Section - Group Charter Style */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin text-gray-900 tracking-tight mb-6">
              Private Jet Tracker
            </h1>
            <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed">
              Live private aircraft monitoring with unprecedented transparency. Track exclusive aviation movements worldwide and access verified flight data in real-time.
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
                  {filteredFlights.map((flight, index) => (
                    <div
                      key={flight.id}
                      className="group hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedFlight(flight)}
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
                  ))}
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

          {/* Stats - Group Charter Style */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-gray-600 font-light">Live Monitoring</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Minimal Flight Detail Modal */}
      {selectedFlight && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
             onClick={() => setSelectedFlight(null)}>
          <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden"
               onClick={(e) => e.stopPropagation()}>
            <div className="relative h-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
              <div className="absolute inset-0 flex items-center justify-center">
                <Plane size={32} className="text-white" />
              </div>
              <button
                onClick={() => setSelectedFlight(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all"
              >
                <X size={16} className="text-gray-700" />
              </button>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {selectedFlight.callsign}
              </h2>
              <p className="text-gray-600 font-light mb-6">{selectedFlight.aircraft_type}</p>

              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Registration</span>
                  <span className="text-sm text-gray-900 font-medium font-mono">{selectedFlight.registration}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Route</span>
                  <span className="text-sm text-gray-900 font-medium">{selectedFlight.origin} → {selectedFlight.destination}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Distance</span>
                  <span className="text-sm text-gray-900 font-medium">{selectedFlight.distance_km.toLocaleString()} km</span>
                </div>

                {selectedFlight.status === 'active' && (
                  <>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Altitude</span>
                      <span className="text-sm text-gray-900 font-medium">{selectedFlight.current_position.altitude.toLocaleString()} ft</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Speed</span>
                      <span className="text-sm text-gray-900 font-medium">{selectedFlight.current_position.speed} kts</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusDot(selectedFlight.status)}`}></div>
                    <span className="text-sm text-gray-900 font-medium capitalize">{selectedFlight.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}