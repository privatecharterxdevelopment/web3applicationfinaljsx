import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Building2, User, Mail, Phone, Globe, ExternalLink, Search, Filter, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AddPartnerModal } from './AddPartnerModal';

interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  business_type: string;
  status: string;
  deal_status: string | null;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface PartnerMapProps {
  partners?: Partner[];
  onSelectPartner?: (partner: Partner) => void;
  standalone?: boolean;
}

export const PartnerMap: React.FC<PartnerMapProps> = ({ 
  partners: propPartners, 
  onSelectPartner,
  standalone = false
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [partners, setPartners] = useState<Partner[]>(propPartners || []);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(standalone);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive' | 'expired'>('all');
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | L.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[] | L.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapsScriptRef = useRef<HTMLScriptElement | null>(null);
  const leafletScriptRef = useRef<HTMLScriptElement | null>(null);
  const leafletCssRef = useRef<HTMLLinkElement | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Memoize the filter function to prevent unnecessary re-renders
  const filterPartners = useCallback(() => {
    if (!standalone) return;
    
    let filtered = partners;

    if (searchTerm) {
      filtered = filtered.filter(partner => 
        partner.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.business_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(partner => partner.status === statusFilter);
    }

    if (businessTypeFilter !== 'all') {
      filtered = filtered.filter(partner => partner.business_type === businessTypeFilter);
    }

    setFilteredPartners(filtered);
  }, [partners, searchTerm, statusFilter, businessTypeFilter, standalone]);

  useEffect(() => {
    if (standalone) {
      fetchPartners();
    } else {
      setFilteredPartners(propPartners || []);
    }
  }, [standalone, propPartners]);

  useEffect(() => {
    if (standalone) {
      filterPartners();
    }
  }, [partners, searchTerm, businessTypeFilter, statusFilter, standalone, filterPartners]);

  useEffect(() => {
    // Try to load Google Maps first, fallback to Leaflet if it fails
    if (!document.getElementById('google-maps-script') && !googleMapsScriptRef.current && useGoogleMaps) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBq_-HkAhm1qd3HK1KymgvpFJnNLPF33oI&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
      };
      script.onerror = () => {
        console.warn('Google Maps failed to load, falling back to OpenStreetMap');
        setMapError('Google Maps billing not enabled. Using OpenStreetMap instead.');
        setUseGoogleMaps(false);
        loadLeafletMap();
      };
      document.head.appendChild(script);
      googleMapsScriptRef.current = script;
    } else if (!useGoogleMaps) {
      loadLeafletMap();
    } else if (window.google && window.google.maps) {
      setMapLoaded(true);
    }

    // Cleanup function
    return () => {
      // Clean up markers when component unmounts
      if (markersRef.current) {
        markersRef.current.forEach(marker => {
          if (marker) {
            if (useGoogleMaps && 'setMap' in marker) {
              google.maps.event.clearInstanceListeners(marker);
              marker.setMap(null);
            } else if (!useGoogleMaps && 'remove' in marker) {
              marker.remove();
            }
          }
        });
        markersRef.current = [];
      }
      
      // Close info window if open
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [useGoogleMaps]);

  const loadLeafletMap = () => {
    // Load Leaflet CSS
    if (!leafletCssRef.current) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
      leafletCssRef.current = link;
    }

    // Load Leaflet JS
    if (!leafletScriptRef.current) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
      leafletScriptRef.current = script;
    } else if (window.L) {
      setMapLoaded(true);
    }
  };

  useEffect(() => {
    // Only initialize map when both map is loaded and we have partners data
    if (mapLoaded && filteredPartners.length > 0 && mapContainerRef.current) {
      // Use a small timeout to ensure the DOM is fully ready
      const timer = setTimeout(() => {
        if (useGoogleMaps) {
          initializeGoogleMap();
        } else {
          initializeLeafletMap();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [mapLoaded, filteredPartners, useGoogleMaps]);

  const fetchPartners = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          creator:system_users!created_by (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add mock location data for demonstration
      const partnersWithLocation = data?.map(partner => ({
        ...partner,
        location: generateMockLocation()
      })) || [];
      
      setPartners(partnersWithLocation);
      
      // Extract unique business types
      const types = [...new Set(partnersWithLocation.map(p => p.business_type))];
      setBusinessTypes(types);
    } catch (err: any) {
      console.error('Error fetching partners:', err);
      showError('Error', 'Failed to fetch partners');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate random location in Europe for demonstration
  const generateMockLocation = () => {
    // Random coordinates roughly in Europe
    const latitude = 46 + (Math.random() * 10 - 5);
    const longitude = 8 + (Math.random() * 20 - 10);
    
    return {
      latitude,
      longitude,
      address: 'Business Address'
    };
  };

  const initializeGoogleMap = () => {
    // Check if Google Maps is loaded
    if (!window.google || !window.google.maps || !mapContainerRef.current) {
      console.error('Google Maps API not loaded or map container not found');
      return;
    }

    // Clear existing markers
    if (markersRef.current) {
      markersRef.current.forEach(marker => {
        if (marker && 'setMap' in marker) {
          google.maps.event.clearInstanceListeners(marker);
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    }

    // Create map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: 48.8566, lng: 2.3522 }, // Paris, roughly central in Europe
        zoom: 4,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        styles: [
          {
            "featureType": "all",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#616161"}]
          },
          {
            "featureType": "all",
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#f5f5f5"}]
          },
          {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{"color": "#fefefe"}]
          },
          {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#bdbdbd"}]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{"color": "#e9e9e9"}]
          }
        ]
      });
    }

    // Create info window if it doesn't exist
    if (!infoWindowRef.current) {
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }

    // Add markers for each partner
    const bounds = new window.google.maps.LatLngBounds();
    
    filteredPartners.forEach(partner => {
      if (partner.location) {
        const position = {
          lat: partner.location.latitude,
          lng: partner.location.longitude
        };

        // Extend bounds to include this marker
        bounds.extend(position);

        // Create marker
        const marker = new window.google.maps.Marker({
          position,
          map: mapRef.current,
          title: partner.company_name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: getStatusColor(partner.status),
            fillOpacity: 0.8,
            strokeWeight: 1,
            strokeColor: '#FFFFFF'
          }
        });

        // Add click listener to marker
        marker.addListener('click', () => {
          // Set content for info window
          const content = `
            <div style="padding: 10px; max-width: 300px;">
              <h3 style="font-weight: bold; margin-bottom: 5px;">${partner.company_name}</h3>
              <p style="margin-bottom: 5px;">${partner.business_type}</p>
              <p style="margin-bottom: 5px;"><strong>Contact:</strong> ${partner.contact_name}</p>
              <p style="margin-bottom: 5px;"><strong>Email:</strong> ${partner.email}</p>
              ${partner.phone ? `<p style="margin-bottom: 5px;"><strong>Phone:</strong> ${partner.phone}</p>` : ''}
              <div style="margin-top: 10px;">
                <button id="view-details-btn" style="background-color: #000; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                  View Details
                </button>
              </div>
            </div>
          `;
          
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(mapRef.current, marker);
            
            // Set timeout to add event listener after the info window is fully rendered
            setTimeout(() => {
              const viewDetailsBtn = document.getElementById('view-details-btn');
              if (viewDetailsBtn) {
                viewDetailsBtn.addEventListener('click', () => {
                  if (standalone) {
                    setSelectedPartner(partner);
                    setShowDetailsModal(true);
                  } else if (onSelectPartner) {
                    onSelectPartner(partner);
                  }
                  if (infoWindowRef.current) {
                    infoWindowRef.current.close();
                  }
                });
              }
            }, 10);
          }
          
          setSelectedPartner(partner);
        });

        // Store marker reference
        markersRef.current.push(marker);
      }
    });

    // Fit map to bounds if we have any markers
    if (filteredPartners.some(p => p.location) && markersRef.current.length > 0 && mapRef.current) {
      mapRef.current.fitBounds(bounds);
      
      // Don't zoom in too far on small datasets
      const listener = window.google.maps.event.addListener(mapRef.current, 'idle', () => {
        if (mapRef.current && mapRef.current.getZoom() && mapRef.current.getZoom() > 12) {
          mapRef.current.setZoom(12);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  };

  const initializeLeafletMap = () => {
    // Check if Leaflet is loaded
    if (!window.L || !mapContainerRef.current) {
      console.error('Leaflet not loaded or map container not found');
      return;
    }

    // Clear existing markers
    if (markersRef.current) {
      markersRef.current.forEach(marker => {
        if (marker && 'remove' in marker) {
          marker.remove();
        }
      });
      markersRef.current = [];
    }

    // Create map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = window.L.map(mapContainerRef.current).setView([48.8566, 2.3522], 4);
      
      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // Add markers for each partner
    const group = window.L.featureGroup();
    
    filteredPartners.forEach(partner => {
      if (partner.location) {
        const position: [number, number] = [partner.location.latitude, partner.location.longitude];

        // Create custom icon
        const icon = window.L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 16px; 
            height: 16px; 
            border-radius: 50%; 
            background-color: ${getStatusColor(partner.status)}; 
            border: 2px solid white; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        // Create marker
        const marker = window.L.marker(position, { icon }).addTo(mapRef.current);

        // Add popup
        const popupContent = `
          <div style="padding: 5px;">
            <h3 style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">${partner.company_name}</h3>
            <p style="margin-bottom: 3px; font-size: 12px;">${partner.business_type}</p>
            <p style="margin-bottom: 3px; font-size: 12px;"><strong>Contact:</strong> ${partner.contact_name}</p>
            <p style="margin-bottom: 3px; font-size: 12px;"><strong>Email:</strong> ${partner.email}</p>
            ${partner.phone ? `<p style="margin-bottom: 3px; font-size: 12px;"><strong>Phone:</strong> ${partner.phone}</p>` : ''}
            <div style="margin-top: 8px;">
              <button onclick="window.viewPartnerDetails('${partner.id}')" style="background-color: #000; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                View Details
              </button>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);

        // Add to group for bounds calculation
        group.addLayer(marker);

        // Store marker reference
        markersRef.current.push(marker);
      }
    });

    // Set up global function for popup button
    (window as any).viewPartnerDetails = (partnerId: string) => {
      const partner = filteredPartners.find(p => p.id === partnerId);
      if (partner) {
        if (standalone) {
          setSelectedPartner(partner);
          setShowDetailsModal(true);
        } else if (onSelectPartner) {
          onSelectPartner(partner);
        }
      }
    };

    // Fit map to bounds if we have any markers
    if (group.getLayers().length > 0 && mapRef.current) {
      mapRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#10B981'; // green
      case 'pending': return '#F59E0B'; // yellow
      case 'inactive': return '#6B7280'; // gray
      case 'expired': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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

  if (isLoading) {
    return (
      <div className={`${standalone ? 'p-6 bg-gray-50 min-h-screen' : ''}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading partner map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${standalone ? 'p-6 bg-gray-50 min-h-screen' : ''}`}>
      {standalone && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-black mb-2">Partner Map</h1>
              <p className="text-gray-600">View all partners on a global map</p>
              {mapError && (
                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
                  <p className="text-sm text-yellow-800">{mapError}</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Partner</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search partners by name, contact, email, or business type..."
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
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <select
                value={businessTypeFilter}
                onChange={(e) => setBusinessTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Business Types</option>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="font-medium text-black">Partner Locations</h3>
            {!useGoogleMaps && (
              <p className="text-xs text-gray-500 mt-1">Using OpenStreetMap (Google Maps billing not enabled)</p>
            )}
          </div>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-600">Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-xs text-gray-600">Inactive</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Expired</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Map Container */}
          <div 
            ref={mapContainerRef}
            className="md:col-span-2 h-[600px]"
            id="partner-map"
          >
            {!mapLoaded && (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Partner List */}
          <div className="border-l border-gray-200 h-[600px] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-black">Partners List</h3>
              <p className="text-xs text-gray-500 mt-1">Click on a partner to view on map</p>
            </div>
            
            <div className="divide-y divide-gray-100">
              {filteredPartners.map((partner) => (
                <div 
                  key={partner.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedPartner(partner);
                    if (standalone) {
                      setShowDetailsModal(true);
                    } else if (onSelectPartner) {
                      onSelectPartner(partner);
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-black">{partner.company_name}</h4>
                      <p className="text-xs text-gray-500">{partner.business_type}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          partner.status === 'active' ? 'bg-green-100 text-green-800' :
                          partner.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          partner.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                        </span>
                        <MapPin className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredPartners.length === 0 && (
                <div className="p-8 text-center">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No partners found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Partner Modal */}
      {standalone && showAddModal && (
        <AddPartnerModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onPartnerAdded={fetchPartners}
        />
      )}

      {/* Partner Details Modal */}
      {standalone && showDetailsModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Partner Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPartner(null);
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-semibold text-black">{selectedPartner.company_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedPartner.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedPartner.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedPartner.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedPartner.status.charAt(0).toUpperCase() + selectedPartner.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600">{selectedPartner.business_type}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getDealStatusColor(selectedPartner.deal_status)}`}>
                      {formatDealStatus(selectedPartner.deal_status)}
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
                      <span>{selectedPartner.contact_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedPartner.email}</span>
                    </div>
                    {selectedPartner.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedPartner.phone}</span>
                      </div>
                    )}
                    {selectedPartner.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a href={selectedPartner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedPartner.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-black mb-3">Location Details</h4>
                  <div className="space-y-3">
                    {selectedPartner.location && (
                      <>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>Coordinates: {selectedPartner.location.latitude.toFixed(4)}, {selectedPartner.location.longitude.toFixed(4)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>Address: {selectedPartner.location.address}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Partner Since: {formatDate(selectedPartner.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => window.location.hash = "#partners"}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Full Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Calendar component for the import
const Calendar = ({ className }: { className?: string }) => (
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
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
    <line x1="16" x2="16" y1="2" y2="6"></line>
    <line x1="8" x2="8" y1="2" y2="6"></line>
    <line x1="3" x2="21" y1="10" y2="10"></line>
  </svg>
);

// Extend the Window interface to include Leaflet
declare global {
  interface Window {
    L: any;
    google: any;
    viewPartnerDetails: (partnerId: string) => void;
  }
}