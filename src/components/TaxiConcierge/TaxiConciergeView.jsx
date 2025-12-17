import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Car, Clock, ChevronRight, Check, Calendar, MessageSquare, Loader2, ChevronDown, ChevronUp, Users, X } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '../../lib/supabase';
import { createRequest } from '../../services/requests';
import PaymentModal from './PaymentModal';
import { convertToUSD, initializeExchangeRates } from '../../services/currencyService';
import { generateRequestConfirmationPDF, downloadPDF, savePDFToStorage } from '../../services/pdfGeneratorService';

// Mapbox token - privatecharterx account
const MAPBOX_TOKEN = 'pk.eyJ1IjoicHJpdmF0ZWNoYXJ0ZXJ4IiwiYSI6ImNsdGJ2dG4zazFucGsya21tNXRldW5udjYifQ.NrWJLJuG9n6b1jhRh5AkSg';

const TaxiConciergeView = ({ onRequestSubmit }) => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userLocationMarker = useRef(null);
  const [locationA, setLocationA] = useState('');
  const [locationB, setLocationB] = useState('');
  const [coordsA, setCoordsA] = useState(null);
  const [coordsB, setCoordsB] = useState(null);
  const [route, setRoute] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [suggestionsA, setSuggestionsA] = useState([]);
  const [suggestionsB, setSuggestionsB] = useState([]);
  const [showSuggestionsA, setShowSuggestionsA] = useState(false);
  const [showSuggestionsB, setShowSuggestionsB] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [serviceCategory, setServiceCategory] = useState('taxi'); // 'taxi', 'concierge', 'luxury-cars'
  const [bookingStep, setBookingStep] = useState(1); // 1: Locations, 2: DateTime/Persons, 3: Car Selection
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [bookNow, setBookNow] = useState(false);
  const [extraNotes, setExtraNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSwissBooking, setIsSwissBooking] = useState(false);
  const [isZurichBooking, setIsZurichBooking] = useState(false); // Keep for backward compatibility
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  // Currency is auto-set based on pickup location country
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [pricePerKm, setPricePerKm] = useState(2.50);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'crypto' or 'card'
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [luxuryCars, setLuxuryCars] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [returnAddress, setReturnAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [isModalExpanded, setIsModalExpanded] = useState(false);

  // Country-based pricing configuration with local currencies
  // Switzerland: CHF, Eurozone: EUR, USA: USD, Thailand: THB, Others: USD (on request)
  const countryPricing = {
    // Switzerland - CHF
    'Schweiz': { basePrice: 5.00, currency: 'CHF', code: 'CH', bookable: true },
    'Switzerland': { basePrice: 5.00, currency: 'CHF', code: 'CH', bookable: true },
    'Suisse': { basePrice: 5.00, currency: 'CHF', code: 'CH', bookable: true },
    'Svizzera': { basePrice: 5.00, currency: 'CHF', code: 'CH', bookable: true },
    // Eurozone - EUR
    'Deutschland': { basePrice: 3.50, currency: 'EUR', code: 'DE', bookable: true },
    'Germany': { basePrice: 3.50, currency: 'EUR', code: 'DE', bookable: true },
    'France': { basePrice: 3.50, currency: 'EUR', code: 'FR', bookable: true },
    'Italia': { basePrice: 2.50, currency: 'EUR', code: 'IT', bookable: true },
    'Italy': { basePrice: 2.50, currency: 'EUR', code: 'IT', bookable: true },
    'Österreich': { basePrice: 3.50, currency: 'EUR', code: 'AT', bookable: true },
    'Austria': { basePrice: 3.50, currency: 'EUR', code: 'AT', bookable: true },
    'España': { basePrice: 2.80, currency: 'EUR', code: 'ES', bookable: true },
    'Spain': { basePrice: 2.80, currency: 'EUR', code: 'ES', bookable: true },
    'Portugal': { basePrice: 2.50, currency: 'EUR', code: 'PT', bookable: true },
    'Netherlands': { basePrice: 3.20, currency: 'EUR', code: 'NL', bookable: true },
    'Belgium': { basePrice: 3.20, currency: 'EUR', code: 'BE', bookable: true },
    'Greece': { basePrice: 2.50, currency: 'EUR', code: 'GR', bookable: true },
    'Ireland': { basePrice: 3.00, currency: 'EUR', code: 'IE', bookable: true },
    'Bulgaria': { basePrice: 2.50, currency: 'EUR', code: 'BG', bookable: true },
    // USA - USD
    'United States': { basePrice: 4.00, currency: 'USD', code: 'US', bookable: true },
    // Thailand - THB
    'Thailand': { basePrice: 50.00, currency: 'THB', code: 'TH', bookable: true },
    'ประเทศไทย': { basePrice: 50.00, currency: 'THB', code: 'TH', bookable: true },
    // On Request countries - USD (quote only)
    'United Arab Emirates': { basePrice: 5.00, currency: 'USD', code: 'AE', bookable: false, onRequest: true },
    'Dubai': { basePrice: 5.00, currency: 'USD', code: 'AE', bookable: false, onRequest: true },
    'Saudi Arabia': { basePrice: 5.00, currency: 'USD', code: 'SA', bookable: false, onRequest: true },
    'Qatar': { basePrice: 5.00, currency: 'USD', code: 'QA', bookable: false, onRequest: true },
    'Singapore': { basePrice: 5.00, currency: 'USD', code: 'SG', bookable: false, onRequest: true },
    'Hong Kong': { basePrice: 5.00, currency: 'USD', code: 'HK', bookable: false, onRequest: true },
    'Japan': { basePrice: 5.00, currency: 'USD', code: 'JP', bookable: false, onRequest: true },
    'China': { basePrice: 5.00, currency: 'USD', code: 'CN', bookable: false, onRequest: true },
    '中国': { basePrice: 5.00, currency: 'USD', code: 'CN', bookable: false, onRequest: true },
    'United Kingdom': { basePrice: 4.00, currency: 'USD', code: 'GB', bookable: false, onRequest: true },
    'Australia': { basePrice: 5.00, currency: 'USD', code: 'AU', bookable: false, onRequest: true }
  };

  // Sanctioned/Restricted countries - Service NOT available
  // Based on US OFAC, EU, and international sanctions lists
  const sanctionedCountries = [
    // Full sanctions
    'Russia', 'Россия', 'Russian Federation',
    'Iran', 'ایران', 'Islamic Republic of Iran',
    'North Korea', '조선민주주의인민공화국', 'Democratic People\'s Republic of Korea', 'DPRK',
    'Syria', 'سوريا', 'Syrian Arab Republic',
    'Cuba',
    // Partial/Regional sanctions
    'Belarus', 'Беларусь', 'Republic of Belarus',
    'Venezuela',
    'Myanmar', 'Burma',
    'Libya', 'ليبيا',
    'Sudan', 'السودان',
    'South Sudan',
    'Somalia', 'Soomaaliya',
    'Yemen', 'اليمن',
    'Afghanistan', 'افغانستان',
    'Zimbabwe',
    'Eritrea',
    // Crimea region
    'Crimea',
    // China removed from sanctions list - available on request
  ];

  // Check if country is sanctioned
  const isCountrySanctioned = (countryName) => {
    if (!countryName) return false;
    const normalizedName = countryName.toLowerCase().trim();
    return sanctionedCountries.some(sanctioned =>
      normalizedName === sanctioned.toLowerCase() ||
      normalizedName.includes(sanctioned.toLowerCase()) ||
      sanctioned.toLowerCase().includes(normalizedName)
    );
  };

  // Check if country is on request only
  const [isOnRequestOnly, setIsOnRequestOnly] = useState(false);
  const [isSanctionedCountry, setIsSanctionedCountry] = useState(false);

  const carTypes = [
    {
      id: 'economy',
      name: 'Economy',
      seats: 4,
      priceMinCHF: 3.50,
      priceMaxCHF: 6.00,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_251110158_bmw-7-2015-seitenansicht_4x.png',
      description: 'Comfortable sedan'
    },
    {
      id: 'business',
      name: 'Business',
      seats: 4,
      priceMinCHF: 4.50,
      priceMaxCHF: 7.50,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_253116175_mercedes-benz-s-2018-seitenansicht_4x.png',
      description: 'Premium sedan'
    },
    {
      id: 'first-class',
      name: 'First Class',
      seats: 4,
      priceMinCHF: 6.00,
      priceMaxCHF: 9.00,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_253111171_mercedes-benz-s-2020-seitenansicht_4x.png',
      description: 'Luxury sedan'
    },
    {
      id: 'van',
      name: 'Van',
      seats: 7,
      priceMinCHF: 6.50,
      priceMaxCHF: 9.00,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/vito.jpg',
      description: 'Spacious van for groups'
    },
    {
      id: 'vip',
      name: 'VIP',
      seats: 4,
      priceMinCHF: 8.00,
      priceMaxCHF: 12.00,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_255110169_mercedes-benz-s-2020-seitenansicht_4x.png',
      description: 'Ultra-luxury experience'
    }
  ];

  // Initialize map
  useEffect(() => {
    if (map.current) return; // initialize map only once

    try {
      if (!MAPBOX_TOKEN) {
        console.error('❌ Mapbox token missing!');
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11', // Monochromatic grey/white Uber-style
        center: [-80.1918, 25.7617], // Miami
        zoom: 12,
        pitch: 45,
        bearing: 0,
        antialias: true,
        hash: false,
        preserveDrawingBuffer: false,
        refreshExpiredTiles: false,
        maxTileCacheSize: 50
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Map load event - fast
      map.current.on('load', () => {
        setMapLoaded(true);

        // Add 3D buildings AFTER initial load (lazy)
        setTimeout(() => {
          try {
            if (!map.current) return;
            const layers = map.current.getStyle().layers;
            const labelLayerId = layers.find(
              (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
            )?.id;

            if (labelLayerId) {
              map.current.addLayer(
                {
                  id: '3d-buildings',
                  source: 'composite',
                  'source-layer': 'building',
                  filter: ['==', 'extrude', 'true'],
                  type: 'fill-extrusion',
                  minzoom: 15,
                  paint: {
                    'fill-extrusion-color': '#ddd',
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.6
                  }
                },
                labelLayerId
              );
            }
          } catch (error) {
            console.error('3D error:', error);
          }
        }, 500);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e.error?.message || e);
      });

    } catch (error) {
      console.error('❌ Map initialization failed:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Load luxury cars from database
  useEffect(() => {
    const fetchLuxuryCars = async () => {
      try {
        const { data, error } = await supabase
          .from('luxury_cars')
          .select('*')
          .eq('is_available', 'available');

        if (error) throw error;

        // Transform database format to match carTypes format
        const transformedCars = (data || []).map(car => ({
          id: car.id,
          name: car.name, // Use pre-formatted name from database
          seats: 4, // Default seats for luxury cars
          priceMinCHF: parseFloat(car.price_per_day) / 100, // Convert from cents
          priceMaxCHF: parseFloat(car.price_per_day) / 80, // Upper estimate
          image: car.image_url,
          location: car.location,
          pricePerDay: parseFloat(car.price_per_day) / 100, // Convert from cents
          pricePerHour: parseFloat(car.price_per_hour) / 100, // Convert from cents
          pricePerWeek: parseFloat(car.price_per_week) / 100, // Convert from cents
          type: car.type,
          brand: car.brand,
          model: car.model,
          description: car.description,
          features: car.features
        }));

        setLuxuryCars(transformedCars);
      } catch (error) {
        console.error('Error loading luxury cars:', error);
      }
    };

    fetchLuxuryCars();
  }, []);

  // Get user's current location
  useEffect(() => {
    if (!map.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);

          // Add user location marker (clickable)
          const el = document.createElement('div');
          el.className = 'user-location-marker';
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#4A90E2';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';

          // Make it clickable - use current location as pickup
          el.addEventListener('click', async () => {
            try {
              const feature = await reverseGeocode(longitude, latitude);
              if (feature) {
                selectLocationA(feature);
                // Remove blue marker after selecting
                if (userLocationMarker.current) {
                  userLocationMarker.current.remove();
                  userLocationMarker.current = null;
                }
              }
            } catch (error) {
              console.error('Error using current location:', error);
            }
          });

          userLocationMarker.current = new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .setPopup(new mapboxgl.Popup().setHTML('<strong>Your Location</strong>'))
            .addTo(map.current);

          // Center map on user location
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 13,
            duration: 2000
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Keep default location (Miami) if geolocation fails
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      // Watch user location for updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);

          // Update marker position
          if (userLocationMarker.current) {
            userLocationMarker.current.setLngLat([longitude, latitude]);
          }
        },
        (error) => {
          console.log('Watch position error:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 27000
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        if (userLocationMarker.current) {
          userLocationMarker.current.remove();
        }
      };
    }
  }, [map.current]);

  // Detect user's country and set currency based on location
  useEffect(() => {
    const detectUserCurrency = async () => {
      try {
        // Try to get user's geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { longitude, latitude } = position.coords;

              // Use Mapbox Geocoding API to reverse geocode and get country
              const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxgl.accessToken}`
              );
              const data = await response.json();

              if (data.features && data.features.length > 0) {
                // Find the country from the context
                const feature = data.features[0];
                const countryContext = feature.context?.find(c => c.id.startsWith('country'));

                if (countryContext) {
                  const countryName = countryContext.text;
                  console.log('Detected country:', countryName);

                  // All countries now default to USD
                  const detectedCurrency = 'USD';
                  setSelectedCurrency(detectedCurrency);
                  console.log(`Auto-selected currency: ${detectedCurrency} for ${countryName}`);
                }
              }
            },
            (error) => {
              console.log('Geolocation error, using default currency (USD):', error);
              // Keep default USD
            }
          );
        }
      } catch (error) {
        console.error('Error detecting user currency:', error);
        // Keep default USD
      }
    };

    detectUserCurrency();
  }, []); // Run once on mount

  // Hide "Need Help" widget when component mounts
  useEffect(() => {
    // Find and hide all help widgets
    const hideHelpWidgets = () => {
      // Look for common help widget selectors
      const selectors = [
        '[class*="need-help"]',
        '[class*="Need Help"]',
        '[class*="help-widget"]',
        'button:contains("Need Help")',
        '.fixed.bottom-4.right-4',
        '.fixed.bottom-6.right-6',
        '[style*="position: fixed"][style*="bottom"]'
      ];

      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
          });
        } catch (e) {
          // Ignore selector errors
        }
      });
    };

    hideHelpWidgets();

    // Run again after a short delay to catch lazy-loaded widgets
    const timer = setTimeout(hideHelpWidgets, 500);

    return () => clearTimeout(timer);
  }, []);

  // Geocoding function - Enhanced with Google Places for hotels/restaurants/airports
  const geocodeAddress = async (address) => {
    try {
      const searchLower = address.toLowerCase();

      // Detect if this is an airport search (multiple languages)
      const isAirportSearch = searchLower.includes('airport') ||
                              searchLower.includes('flughafen') ||
                              searchLower.includes('aéroport') ||
                              searchLower.includes('aeroporto') ||
                              searchLower.includes('aeropuerto') ||
                              searchLower.includes('luchthaven') ||
                              searchLower.includes('lufthavn') ||
                              searchLower.includes('lotnisko') ||
                              searchLower.includes('letisko') ||
                              searchLower.includes('letiště') ||
                              searchLower.includes('repülőtér') ||
                              searchLower.includes('terminal') ||
                              searchLower.includes('intl') ||
                              searchLower.includes('international') ||
                              // Common 3-letter airport codes
                              /\b(jfk|lax|lhr|cdg|fra|zrh|muc|vie|ams|bcn|mad|fco|mxp|ory|lgw|stn|bhx|man|dub|bru|dus|ham|ber|txl|nce|gcn|las|sfo|ord|atl|dfw|mia|sea|bos|den|phx|iah|msp|dtw|phl|ewr|tpa|san|sju|hnl|anc|pdx|slc|sin|hkg|nrt|hnd|icn|bkk|dxb|auh|doh|ist|cph|arn|osl|hel|waw|prg|bud|svo|dme|led|pek|pvg|can|ckg|tpe|kul|mnl|sgn|han|del|bom|blr|maa|ccu|gru|gig|eze|scl|bog|mex|cun|gdl|lim|bue|rio)\b/.test(searchLower);

      // Detect if this is likely a POI search (hotel, restaurant, landmark)
      const isPOISearch = searchLower.includes('hotel') ||
                          searchLower.includes('baur') ||
                          searchLower.includes('ritz') ||
                          searchLower.includes('four seasons') ||
                          searchLower.includes('hyatt') ||
                          searchLower.includes('marriott') ||
                          searchLower.includes('hilton') ||
                          searchLower.includes('restaurant') ||
                          searchLower.includes('cafe') ||
                          searchLower.includes('bar') ||
                          searchLower.includes('bistro') ||
                          searchLower.includes('palace') ||
                          searchLower.includes('lac') ||
                          searchLower.includes('grand') ||
                          searchLower.includes('plaza') ||
                          searchLower.includes('resort') ||
                          searchLower.includes('kempinski') ||
                          searchLower.includes('mandarin') ||
                          searchLower.includes('shangri') ||
                          searchLower.includes('peninsula') ||
                          searchLower.includes('st. regis') ||
                          searchLower.includes('w hotel') ||
                          searchLower.includes('waldorf') ||
                          searchLower.includes('intercontinental') ||
                          searchLower.includes('sofitel') ||
                          searchLower.includes('fairmont');

      // For airport and POI searches, use Google Places API via edge function
      if ((isAirportSearch || isPOISearch) && address.length >= 3) {
        try {
          // For airports, append "airport" if not already present to improve search
          let searchQuery = address;
          if (isAirportSearch && !searchLower.includes('airport') && !searchLower.includes('flughafen')) {
            searchQuery = `${address} airport`;
          }

          const { data: googleData, error } = await supabase.functions.invoke('google-places', {
            body: {
              action: 'searchText',
              query: searchQuery,
              maxResults: 8,
              location: userLocation ? { lat: userLocation[1], lng: userLocation[0] } : null,
              radius: isAirportSearch ? 100000 : 50000 // Larger radius for airports
            }
          });

          if (!error && googleData?.places && googleData.places.length > 0) {
            // Transform Google Places results to Mapbox-like format for compatibility
            const googleFeatures = googleData.places.map(place => ({
              id: place.id,
              place_type: ['poi'],
              text: place.name,
              place_name: `${place.name}, ${place.address}`,
              center: place.location ? [place.location.lng, place.location.lat] : null,
              geometry: place.location ? {
                type: 'Point',
                coordinates: [place.location.lng, place.location.lat]
              } : null,
              properties: {
                category: place.category,
                rating: place.rating,
                phone: place.phone,
                website: place.website
              },
              context: []
            })).filter(f => f.center !== null);

            if (googleFeatures.length > 0) {
              console.log('Google Places results for:', address, googleFeatures.length);
              return googleFeatures;
            }
          }
        } catch (googleError) {
          console.warn('Google Places search failed, falling back to Mapbox:', googleError);
        }
      }

      // Fallback to Mapbox for regular addresses or if Google fails
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&fuzzyMatch=true&limit=10&types=poi,poi.landmark,address,place,locality,neighborhood&language=en,de,fr,it,es,bg,nl,pt,pl,cs,ro,hu`;

      // Add proximity bias if we have user location for better local results
      if (userLocation) {
        url += `&proximity=${userLocation[0]},${userLocation[1]}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      return data.features || [];
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  };

  // Reverse geocoding function (coordinates to address)
  const reverseGeocode = async (longitude, latitude) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=address,poi&language=en`
      );
      const data = await response.json();
      return data.features[0]; // Return the first (most relevant) result
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  // Check if location is in Switzerland
  const isLocationInSwitzerland = (feature) => {
    if (!feature || !feature.context) return false;

    const context = feature.context || [];
    const placeName = feature.place_name?.toLowerCase() || '';

    // Check context for Switzerland
    const hasSwitzerlandContext = context.some(item =>
      item.id.includes('country') &&
      (item.text?.toLowerCase().includes('switzerland') ||
       item.text?.toLowerCase().includes('schweiz') ||
       item.text?.toLowerCase().includes('suisse') ||
       item.text?.toLowerCase().includes('svizzera') ||
       item.short_code === 'ch')
    );

    // Also check place name for Switzerland variations
    const hasSwitzerlandInName =
      placeName.includes('switzerland') ||
      placeName.includes('schweiz') ||
      placeName.includes('suisse') ||
      placeName.includes('svizzera');

    return hasSwitzerlandContext || hasSwitzerlandInName;
  };

  // Check if location is specifically in Zurich (for direct booking eligibility)
  const isLocationInZurich = (feature) => {
    if (!feature) return false;

    const context = feature.context || [];
    const placeName = feature.place_name?.toLowerCase() || '';
    const text = feature.text?.toLowerCase() || '';

    // Check context for Zurich region/place
    const hasZurichContext = context.some(item =>
      (item.id.includes('place') || item.id.includes('region') || item.id.includes('locality')) &&
      (item.text?.toLowerCase().includes('zurich') ||
       item.text?.toLowerCase().includes('zürich') ||
       item.text?.toLowerCase().includes('zuerich'))
    );

    // Also check place name directly for Zurich
    const hasZurichInName =
      placeName.includes('zurich') ||
      placeName.includes('zürich') ||
      placeName.includes('zuerich') ||
      text.includes('zurich') ||
      text.includes('zürich') ||
      text.includes('zuerich');

    return hasZurichContext || hasZurichInName;
  };

  // Handle "use current location" button click
  const handleUseCurrentLocation = async () => {
    // Request geolocation permission if not already granted
    if (!userLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { longitude, latitude } = position.coords;
            setUserLocation([longitude, latitude]);

            // Get address and set as pickup location
            const feature = await reverseGeocode(longitude, latitude);
            if (feature) {
              selectLocationA(feature);
              // Remove blue marker after selecting
              if (userLocationMarker.current) {
                userLocationMarker.current.remove();
                userLocationMarker.current = null;
              }
            }
          },
          (error) => {
            alert('Please enable location access in your browser settings to use this feature.');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
      return;
    }

    // If we already have location, use it
    const [longitude, latitude] = userLocation;
    const feature = await reverseGeocode(longitude, latitude);

    if (feature) {
      selectLocationA(feature);
      // Remove blue marker after selecting
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
        userLocationMarker.current = null;
      }
    }
  };

  // Handle location A input
  const handleLocationAChange = async (value) => {
    setLocationA(value);
    if (value.length > 2) {
      const results = await geocodeAddress(value);
      setSuggestionsA(results);
      setShowSuggestionsA(true);
    } else {
      setSuggestionsA([]);
      setShowSuggestionsA(false);
    }
  };

  // Handle location B input
  const handleLocationBChange = async (value) => {
    setLocationB(value);
    if (value.length > 2) {
      const results = await geocodeAddress(value);
      setSuggestionsB(results);
      setShowSuggestionsB(true);
    } else {
      setSuggestionsB([]);
      setShowSuggestionsB(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside suggestions dropdowns
      const suggestionsA = document.querySelector('[data-suggestions-a]');
      const suggestionsB = document.querySelector('[data-suggestions-b]');
      const inputA = document.querySelector('[data-input-a]');
      const inputB = document.querySelector('[data-input-b]');

      if (suggestionsA && !suggestionsA.contains(event.target) && !inputA.contains(event.target)) {
        setShowSuggestionsA(false);
      }
      if (suggestionsB && !suggestionsB.contains(event.target) && !inputB.contains(event.target)) {
        setShowSuggestionsB(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowSuggestionsA(false);
        setShowSuggestionsB(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Select location A
  const selectLocationA = (feature) => {
    setLocationA(feature.place_name);
    setCoordsA(feature.center);
    setFeatureA(feature);
    setShowSuggestionsA(false);

    // Add marker with pulsing effect
    if (map.current) {
      // Remove existing marker A
      const existingMarkers = document.querySelectorAll('.marker-a');
      existingMarkers.forEach(marker => marker.remove());

      // Create pulsing ring container
      const container = document.createElement('div');
      container.className = 'marker-a';
      container.style.position = 'relative';
      container.style.width = '24px';
      container.style.height = '24px';

      // Create pulsing ring
      const pulseRing = document.createElement('div');
      pulseRing.style.position = 'absolute';
      pulseRing.style.top = '50%';
      pulseRing.style.left = '50%';
      pulseRing.style.width = '40px';
      pulseRing.style.height = '40px';
      pulseRing.style.marginLeft = '-20px';
      pulseRing.style.marginTop = '-20px';
      pulseRing.style.borderRadius = '50%';
      pulseRing.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
      pulseRing.style.animation = 'pulse 2s infinite';

      // Create main black dot
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.left = '0';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.backgroundColor = '#000000';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.zIndex = '10';

      container.appendChild(pulseRing);
      container.appendChild(el);

      new mapboxgl.Marker(container)
        .setLngLat(feature.center)
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>From:</strong> ${feature.place_name}`))
        .addTo(map.current);

      // Faster, smoother flyTo animation
      map.current.flyTo({
        center: feature.center,
        zoom: 14,
        duration: 800, // Reduced from default ~2000ms
        essential: true // Ensures animation completes even if user interacts
      });
    }
  };

  // Select location B
  const selectLocationB = (feature) => {
    setLocationB(feature.place_name);
    setCoordsB(feature.center);
    setFeatureB(feature); // Store feature for Switzerland checking
    setShowSuggestionsB(false);

    // Add marker - destination pin
    if (map.current) {
      // Remove existing marker B
      const existingMarkers = document.querySelectorAll('.marker-b');
      existingMarkers.forEach(marker => marker.remove());

      // Create pin-shaped marker for destination
      const el = document.createElement('div');
      el.className = 'marker-b';
      el.innerHTML = `
        <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 8.836 16 24 16 24s16-15.164 16-24C32 7.163 24.837 0 16 0z"
                fill="#EF4444"
                stroke="#FFFFFF"
                stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
        </svg>
      `;
      el.style.width = '32px';
      el.style.height = '40px';
      el.style.cursor = 'pointer';
      el.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))';

      new mapboxgl.Marker(el, { anchor: 'bottom' })
        .setLngLat(feature.center)
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>To:</strong> ${feature.place_name}`))
        .addTo(map.current);

      // Faster, smoother flyTo animation
      map.current.flyTo({
        center: feature.center,
        zoom: 14,
        duration: 800, // Reduced from default ~2000ms
        essential: true // Ensures animation completes even if user interacts
      });
    }
  };

  // Detect country from location features
  const detectCountryFromFeature = (feature) => {
    if (!feature || !feature.context) return null;

    const countryContext = feature.context.find(item => item.id.includes('country'));
    if (countryContext) {
      return countryContext.text;
    }
    return null;
  };

  // Check if pickup location is in Zurich (only Zurich allows direct booking)
  const [featureA, setFeatureA] = useState(null);
  const [featureB, setFeatureB] = useState(null);

  useEffect(() => {
    if (featureA && featureB) {
      // Only Zurich pickup allows direct booking - all other locations are "On Request"
      const pickupInZurich = isLocationInZurich(featureA);
      setIsSwissBooking(pickupInZurich); // Now means "Zurich booking" for direct booking
      setIsZurichBooking(pickupInZurich); // Direct booking only from Zurich

      // Disable "Book Now" if pickup is not in Zurich
      if (!pickupInZurich && bookNow) {
        setBookNow(false);
      }

      // Detect country and set pricing with regional currencies
      const country = detectCountryFromFeature(featureA) || detectCountryFromFeature(featureB);

      // Check if country is sanctioned - block service entirely
      if (isCountrySanctioned(country)) {
        setIsSanctionedCountry(true);
        setIsOnRequestOnly(false);
        setDetectedCountry(country);
        setPricePerKm(0);
        setSelectedCurrency('USD');
        console.log(`⚠️ SANCTIONED COUNTRY DETECTED: ${country} - Service not available`);
        return;
      }

      setIsSanctionedCountry(false);

      if (country && countryPricing[country]) {
        const pricing = countryPricing[country];
        setPricePerKm(pricing.basePrice);
        setSelectedCurrency(pricing.currency);
        setDetectedCountry(country);
        setIsOnRequestOnly(pricing.onRequest || false);
        console.log(`Country detected: ${country}, Price: ${pricing.basePrice} ${pricing.currency}/km, Bookable: ${pricing.bookable}, OnRequest: ${pricing.onRequest || false}`);
      } else {
        // Unknown country - show USD, on request only
        setPricePerKm(5.00);
        setSelectedCurrency('USD');
        setDetectedCountry(country || 'Unknown');
        setIsOnRequestOnly(true);
        console.log(`Unknown country: ${country || 'Unknown'}, showing USD prices - On Request Only`);
      }
    } else {
      setIsSwissBooking(false);
      setIsZurichBooking(false);
      setIsOnRequestOnly(false);
      setIsSanctionedCountry(false);
    }
  }, [featureA, featureB]);

  // Get route when both locations are set (only for taxi/concierge)
  useEffect(() => {
    if (serviceCategory !== 'luxury-cars' && coordsA && coordsB && mapLoaded) {
      // Debounce route calculation to prevent lag
      const timeoutId = setTimeout(() => {
        getRoute();
        // REMOVED: Auto-minimize panel - let user control when to minimize
      }, 300); // 300ms debounce to allow map animations to complete

      return () => clearTimeout(timeoutId);
    }

    // For luxury cars, just show the rental location marker
    if (serviceCategory === 'luxury-cars' && coordsA && mapLoaded && map.current) {
      // No route needed, just show the location (don't set distance/eta for luxury cars)
      // Center map on rental location
      map.current.flyTo({
        center: coordsA,
        zoom: 12,
        duration: 1000 // Reduced from 1500ms for snappier feel
      });
    }
  }, [coordsA, coordsB, mapLoaded, serviceCategory]);

  const getRoute = async () => {
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsA[0]},${coordsA[1]};${coordsB[0]},${coordsB[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`,
        { method: 'GET' }
      );
      const json = await query.json();

      if (!json.routes || json.routes.length === 0) {
        console.error('No route found');
        return;
      }

      const data = json.routes[0];
      const routeGeoJSON = data.geometry;

      // Mapbox returns distance in meters, convert to km
      const distanceInKm = (data.distance / 1000).toFixed(1);
      const durationInMinutes = Math.round(data.duration / 60);

      setRoute(routeGeoJSON);
      setDistance(distanceInKm);
      setEta(durationInMinutes);

      // Draw route on map
      if (map.current.getSource('route')) {
        map.current.getSource('route').setData({
          type: 'Feature',
          properties: {},
          geometry: routeGeoJSON
        });
      } else {
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: routeGeoJSON
            }
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#6B7280',
            'line-width': 2,
            'line-opacity': 0.7
          }
        });
        // Pulsing animation removed for better performance
      }

      // Fit map to show entire route
      const coordinates = routeGeoJSON.coordinates;
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: 100
      });
    } catch (error) {
      console.error('Route error:', error);
    }
  };

  // Currency conversion rates (base: USD)
  const currencyRates = {
    'USD': 1,
    'CHF': 0.88,
    'EUR': 0.92,
    'THB': 34.50,  // Thai Baht
    'USDT': 1,
    'USDC': 1,
    'BTC': 0.000010
  };

  const calculatePrice = (carType) => {
    if (!distance) return { min: 0, max: 0 };
    const distanceNum = parseFloat(distance);

    // Get base currency for detected country (default USD)
    const baseCurrency = detectedCountry && countryPricing[detectedCountry]
      ? countryPricing[detectedCountry].currency
      : 'USD';

    // Get country price ratio compared to Switzerland
    // Switzerland base is 5.70 USD/km, other countries scale from that
    const countryRatio = pricePerKm / 5.70;

    // Calculate prices using the car's specific CHF prices scaled by country ratio
    const minPriceInBaseCurrency = distanceNum * carType.priceMinCHF * countryRatio;
    const maxPriceInBaseCurrency = distanceNum * carType.priceMaxCHF * countryRatio;

    // Convert to selected currency if different from base
    let convertedMinPrice = minPriceInBaseCurrency;
    let convertedMaxPrice = maxPriceInBaseCurrency;

    if (selectedCurrency !== baseCurrency) {
      const baseRate = currencyRates[baseCurrency] || 1;
      const targetRate = currencyRates[selectedCurrency] || 1;
      convertedMinPrice = minPriceInBaseCurrency * (targetRate / baseRate);
      convertedMaxPrice = maxPriceInBaseCurrency * (targetRate / baseRate);
    }

    console.log('Price calculation:', {
      carModel: carType.name,
      distance: distanceNum,
      pricePerKmCountry: pricePerKm,
      countryRatio,
      carPriceCHF: `${carType.priceMinCHF} - ${carType.priceMaxCHF}`,
      baseCurrency,
      minPriceBase: minPriceInBaseCurrency.toFixed(2),
      maxPriceBase: maxPriceInBaseCurrency.toFixed(2),
      selectedCurrency,
      convertedMin: convertedMinPrice.toFixed(2),
      convertedMax: convertedMaxPrice.toFixed(2)
    });

    return {
      min: convertedMinPrice.toFixed(selectedCurrency === 'BTC' ? 8 : 2),
      max: convertedMaxPrice.toFixed(selectedCurrency === 'BTC' ? 8 : 2)
    };
  };

  const formatPrice = (price) => {
    if (selectedCurrency === 'BTC') {
      return `${price} BTC`;
    }
    return `${price} ${selectedCurrency}`;
  };

  const handleSubmitRequest = (car = null) => {
    const carToUse = car || selectedCar;

    // For luxury cars, only locationA is required
    // For taxi/concierge, both locationA and locationB are required
    if (!carToUse || !locationA || (serviceCategory !== 'luxury-cars' && !locationB)) {
      alert('Please select locations and a car type');
      return;
    }
    if (!bookNow && (!pickupDate || !pickupTime)) {
      alert('Please select pickup date and time');
      return;
    }

    // Start loader
    setIsSubmitting(true);

    const priceRange = calculatePrice(carToUse);
    const requestData = {
      serviceType: serviceCategory, // 'taxi', 'concierge', or 'luxury-cars'
      from: locationA,
      to: serviceCategory !== 'luxury-cars' ? locationB : undefined,
      coordsA,
      coordsB: serviceCategory !== 'luxury-cars' ? coordsB : undefined,
      carType: carToUse,
      distance: serviceCategory !== 'luxury-cars' ? distance : undefined,
      eta: serviceCategory !== 'luxury-cars' ? eta : undefined,
      priceRange: `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`,
      pickupDate: bookNow ? 'Now' : pickupDate,
      pickupTime: bookNow ? 'Now' : pickupTime,
      returnDate: serviceCategory === 'luxury-cars' ? returnDate : undefined,
      returnTime: serviceCategory === 'luxury-cars' ? returnTime : undefined,
      deliveryAddress: serviceCategory === 'luxury-cars' ? deliveryAddress : undefined,
      returnAddress: serviceCategory === 'luxury-cars' ? returnAddress : undefined,
      passengers,
      currency: selectedCurrency,
      paymentMethod: paymentMethod, // 'crypto' or 'card'
      cryptoCurrency: paymentMethod === 'crypto' ? selectedCrypto : null,
      extraNotes,
      isZurichBooking,
      timestamp: new Date().toISOString()
    };

    console.log('Taxi request:', requestData);

    if (onRequestSubmit) {
      onRequestSubmit(requestData);
    }

    // Save request to database and create notification
    const saveRequest = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Attempting to save ground transportation request for user:', user.id);

          // Calculate price breakdown
          const basePrice = priceRange.min || 0;
          const platformFeePercent = 2.5;
          const platformFee = Math.round(basePrice * (platformFeePercent / 100));
          const vatPercent = 8.1; // Swiss VAT
          const vatAmount = Math.round(basePrice * (vatPercent / 100));
          const totalPrice = basePrice + platformFee + vatAmount;

          // Create request in user_requests table - DIRECT INSERT
          const { data: insertedData, error: dbError } = await supabase
            .from('user_requests')
            .insert([{
              user_id: user.id,
              type: serviceCategory === 'luxury-cars' ? 'luxury_car_rental' : 'ground_transport',
              status: 'pending',
              data: {
                ...requestData,
                // Car details - use carToUse to ensure we have the selected car
                carImage: carToUse.image,
                carName: carToUse.name,
                carSeats: carToUse.seats,
                carId: carToUse.id,
                // Location details
                from: locationA,
                to: locationB,
                pickupLocation: locationA,
                dropoffLocation: locationB,
                // Route details
                distance: distance,
                eta: eta,
                // Full price breakdown
                base_price: basePrice,
                platform_fee: platformFee,
                platform_fee_percent: platformFeePercent,
                vat_amount: vatAmount,
                vat_percent: vatPercent,
                total_price: totalPrice,
                priceRange: `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`,
                priceMin: priceRange.min,
                priceMax: priceRange.max,
                currency: selectedCurrency,
                // Booking details
                pickupDate: bookNow ? 'Now' : pickupDate,
                pickupTime: bookNow ? 'Now' : pickupTime,
                passengers: passengers,
                bookNow: bookNow,
                // Extra info
                extraNotes: extraNotes,
                isSwissBooking: isSwissBooking,
                detectedCountry: detectedCountry,
                // User info
                user_email: user.email
              }
            }])
            .select();

          if (dbError) {
            console.error('Database insert error:', dbError);
            alert(`Failed to save request: ${dbError.message}`);
            throw dbError;
          }

          console.log('Ground transportation request saved successfully:', insertedData);

          // Generate PDF and send email with attachment
          if (insertedData && insertedData[0]) {
            const savedRequest = insertedData[0];
            try {
              const pdfRequest = {
                id: savedRequest.id,
                type: 'ground_transport',
                service_type: 'ground_transport',
                created_at: new Date().toISOString(),
                client_email: user?.email,
                data: {
                  from: locationA,
                  to: locationB,
                  pickupDate: bookNow ? 'Now' : pickupDate,
                  pickupTime: bookNow ? 'Now' : pickupTime,
                  passengers: passengers,
                  carName: carToUse.name,
                  total: totalPrice,
                  currency: selectedCurrency
                }
              };

              const { blob, filename, base64 } = await generateRequestConfirmationPDF(pdfRequest);

              // Save PDF to storage
              try {
                await savePDFToStorage(blob, filename, 'request', savedRequest.id);
                console.log('Ground transport PDF saved to storage');
              } catch (storageErr) {
                console.warn('Could not save PDF:', storageErr);
              }

              // Download PDF for user
              downloadPDF(blob, filename);

              // Send email with PDF attachment
              try {
                await supabase.functions.invoke('send-request-email', {
                  body: {
                    to: user?.email,
                    requestData: {
                      id: savedRequest.id,
                      type: 'ground_transport',
                      created_at: new Date().toISOString(),
                      status: 'pending',
                      user: {
                        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Valued Client',
                        email: user?.email
                      },
                      details: {
                        from: locationA,
                        to: locationB,
                        date: bookNow ? 'Now' : pickupDate,
                        time: bookNow ? 'Now' : pickupTime,
                        passengers: passengers,
                        service_type: 'Ground Transport',
                        price: totalPrice,
                        currency: selectedCurrency
                      }
                    },
                    pdfBase64: base64,
                    pdfFilename: filename
                  }
                });
                console.log('Email with PDF sent for ground transport request');
              } catch (emailErr) {
                console.error('Failed to send email:', emailErr);
              }
            } catch (pdfErr) {
              console.error('Failed to generate PDF:', pdfErr);
            }
          }

          // Create notification
          const notificationData = {
            user_id: user.id,
            type: isZurichBooking ? 'taxi_booking_confirmed' : 'taxi_quote_requested',
            title: isZurichBooking ? 'Ride Confirmed' : 'Quote Request Submitted',
            message: isZurichBooking
              ? `Your ride from ${locationA} to ${locationB} is confirmed!`
              : `Quote request for ${locationA} to ${locationB} submitted. We'll contact you within 24 hours.`,
            is_read: false,
            action_url: '/dashboard/favourites',
            metadata: requestData,
            created_at: new Date().toISOString()
          };

          await supabase.from('notifications').insert([notificationData]);
        }
      } catch (error) {
        console.error('Error saving request:', error);
      }
    };

    saveRequest();

    // Simulate confirmation wait (in real app, this would be WebSocket/API polling)
    setTimeout(() => {
      setIsSubmitting(false);
      setShowNotification(true);

      if (isZurichBooking) {
        setNotificationMessage('Your ride is confirmed! Driver will arrive at the scheduled time.');
      } else {
        setNotificationMessage('Quote request submitted! Our team will contact you within 24 hours with pricing.');
      }

      // Auto-hide notification after 3 seconds, then redirect to dashboard
      setTimeout(() => {
        setShowNotification(false);
        // Reset form
        setLocationA('');
        setLocationB('');
        setCoordsA(null);
        setCoordsB(null);
        setSelectedCar(null);
        setPickupDate('');
        setPickupTime('');
        setExtraNotes('');
        // Redirect to dashboard overview
        navigate('/dashboard');
      }, 3000);
    }, 3000);
  };

  const skipLoader = () => {
    setIsSubmitting(false);
    setShowNotification(true);
    setNotificationMessage('Your ride request has been submitted! You will be notified when a driver confirms.');
    setTimeout(() => {
      setShowNotification(false);
      setLocationA('');
      setLocationB('');
      setCoordsA(null);
      setCoordsB(null);
      setSelectedCar(null);
      setPickupDate('');
      setPickupTime('');
      setExtraNotes('');
      // Redirect to dashboard overview
      navigate('/dashboard');
    }, 3000);
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-br-2xl taxi-concierge-page">
      {/* Hide "Need Help" chat widget on this page */}
      <style>{`
        /* Pulsing animation for marker */
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.2;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* Hide all possible help/chat widgets when taxi page is active */
        body:has(.taxi-concierge-page) [class*="help"],
        body:has(.taxi-concierge-page) [class*="Help"],
        body:has(.taxi-concierge-page) [class*="need-help"],
        body:has(.taxi-concierge-page) [class*="Need Help"],
        body:has(.taxi-concierge-page) [class*="chat-widget"],
        body:has(.taxi-concierge-page) button:has-text("Need Help"),
        body:has(.taxi-concierge-page) div:has-text("Need Help?"),
        body:has(.taxi-concierge-page) [role="button"]:has-text("Help") {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Target fixed positioned help widgets */
        body:has(.taxi-concierge-page) .fixed[class*="bottom"],
        body:has(.taxi-concierge-page) [style*="position: fixed"][style*="bottom"] {
          display: none !important;
        }

        /* Hide Mapbox attribution controls */
        .taxi-concierge-page .mapboxgl-ctrl-bottom-left,
        .taxi-concierge-page .mapboxgl-ctrl-bottom-right {
          display: none !important;
        }
      `}</style>

      {/* Full Page Map Container - extends to edges with rounded bottom-right corner */}
      <div
        ref={mapContainer}
        className="absolute inset-0 rounded-br-2xl z-0"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
          backgroundColor: '#f0f0f0'
        }}
      />


      {/* Bottom Booking Panel - Floating modal with proper iOS-safe spacing */}
      <div
        className={`absolute ${serviceCategory === 'luxury-cars' ? 'left-4 md:left-6' : 'left-1/2 -translate-x-1/2'} pointer-events-auto z-10 transition-all duration-300`}
        style={{
          maxWidth: serviceCategory === 'luxury-cars' ? '480px' : '650px',
          width: serviceCategory === 'luxury-cars' ? 'calc(100% - 2rem)' : 'calc(100% - 2rem)',
          bottom: 'max(16px, env(safe-area-inset-bottom))',
          top: 'auto',
          maxHeight: bookingStep === 3 ? '65vh' : 'auto'
        }}
      >
        <div className={`bg-white shadow-2xl rounded-2xl transition-all duration-300 w-full h-full`} style={{ overflow: bookingStep === 3 ? 'hidden' : 'visible', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div className="flex flex-col flex-1" style={{ overflow: bookingStep === 3 ? 'hidden' : 'visible', minHeight: 0 }}>
          {/* Minimize/Maximize Toggle Button - HIDDEN per user request */}
          {/* Previously showed ChevronUp/ChevronDown in top-right corner */}


          {/* Location Inputs - Hidden when selecting car */}
          {bookingStep !== 3 && (
            <div className="flex-shrink-0 px-5 py-4 relative" style={{ zIndex: 50, overflow: 'visible' }}>
              {/* Category Selector - Bookmark Style */}
              <div className="flex gap-1 mb-3 border-b border-gray-200">
                <button
                  onClick={() => setServiceCategory('taxi')}
                  className={`px-3 py-2 text-xs font-medium transition-all border-b-2 ${
                    serviceCategory === 'taxi'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Airport Transfer
                </button>
                {/* Concierge and Luxury Cars hidden - services not currently available */}
              </div>

              {/* Location Inputs - Stack on mobile, side-by-side on desktop */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3" style={{ overflow: 'visible' }}>
              <div className="relative flex-1" style={{ zIndex: 60, overflow: 'visible' }}>
                <div className="relative" style={{ overflow: 'visible' }}>
                  <input
                    data-input-a
                    type="text"
                    value={locationA}
                    onChange={(e) => handleLocationAChange(e.target.value)}
                    onFocus={() => {
                      if (suggestionsA.length > 0) {
                        setShowSuggestionsA(true);
                      }
                    }}
                    placeholder={serviceCategory === 'luxury-cars' ? 'Rental Location (City)' : 'Pick-up location'}
                    className="w-full px-3 py-2.5 pr-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black text-sm bg-white transition-all"
                  />
                  <button
                    onClick={handleUseCurrentLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
                    title="Use my current location"
                  >
                    <Navigation size={16} className="text-gray-400 group-hover:text-black transition-colors" />
                  </button>
                </div>
                {showSuggestionsA && suggestionsA.length > 0 && (
                  <div
                    data-suggestions-a
                    className="absolute w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 sm:max-h-60 overflow-y-auto"
                    style={{
                      bottom: 'calc(100% + 8px)',
                      left: 0,
                      zIndex: 9999
                    }}
                  >
                    {suggestionsA.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectLocationA(suggestion)}
                        className="w-full px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-sm font-medium text-gray-800 truncate">{suggestion.text}</div>
                        <div className="text-xs text-gray-500 truncate">{suggestion.place_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input - Only for Taxi/Concierge */}
              {serviceCategory !== 'luxury-cars' && (
                <div className="relative flex-1" style={{ zIndex: 60, overflow: 'visible' }}>
                  <input
                    data-input-b
                    type="text"
                    value={locationB}
                    onChange={(e) => handleLocationBChange(e.target.value)}
                    onFocus={() => {
                      if (suggestionsB.length > 0) {
                        setShowSuggestionsB(true);
                      }
                    }}
                    placeholder="Drop-off location"
                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black text-sm bg-white transition-all"
                  />
                  {showSuggestionsB && suggestionsB.length > 0 && (
                    <div
                      data-suggestions-b
                      className="absolute w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 sm:max-h-60 overflow-y-auto"
                      style={{
                        bottom: 'calc(100% + 8px)',
                        left: 0,
                        zIndex: 9999
                      }}
                    >
                      {suggestionsB.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => selectLocationB(suggestion)}
                          className="w-full px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-sm font-medium text-gray-800 truncate">{suggestion.text}</div>
                          <div className="text-xs text-gray-500 truncate">{suggestion.place_name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delivery & Return Address - Only for Luxury Cars */}
            {serviceCategory === 'luxury-cars' && (
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Delivery Address (optional +$55-90 for custom delivery)"
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black text-sm bg-white transition-all"
                />
                <input
                  type="text"
                  value={returnAddress}
                  onChange={(e) => setReturnAddress(e.target.value)}
                  placeholder="Return Address (optional)"
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black text-sm bg-white transition-all"
                />
              </div>
            )}
            </div>
          )}

          {/* Multi-Step Flow - Shows after route is calculated (or location set for luxury cars) and when not minimized */}
          {((serviceCategory === 'luxury-cars' && coordsA) || (eta && distance)) && !isPanelMinimized && (
            <div className="border-t border-gray-100">
              {/* Step 1: Route Summary & Continue Button (hide distance/eta for luxury cars) */}
              {bookingStep === 1 && (
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                  {/* Only show distance/time for taxi/concierge */}
                  {serviceCategory !== 'luxury-cars' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-500" />
                          <span className="text-sm font-semibold text-gray-800">{eta} min</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300" />
                        <div className="flex items-center gap-2">
                          <Navigation size={16} className="text-gray-500" />
                          <span className="text-sm font-semibold text-gray-800">{distance} km</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sanctioned Country Notice - Service NOT available */}
                  {isSanctionedCountry ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-2">
                        <Shield size={16} className="text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-900">Service Not Available</p>
                          <p className="text-xs text-red-700 mt-1">
                            Due to international sanctions and compliance requirements, our services are not available in {detectedCountry || 'this region'}.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : serviceCategory !== 'luxury-cars' && eta > 120 ? (
                    /* Long Distance Notice (>2 hours) - Only for taxi/concierge */
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={16} className="text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">Long Distance Trip</p>
                          <p className="text-xs text-amber-700 mt-1">
                            This trip is longer than 2 hours. Please contact us directly at{' '}
                            <a href="mailto:bookings@privatecharterx.com" className="underline font-medium">
                              bookings@privatecharterx.com
                            </a>{' '}
                            for a custom quote.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Badge - Only Zurich allows direct booking, all others are On Request */}
                      {serviceCategory === 'luxury-cars' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          <MessageSquare size={14} />
                          Quote Request - Interior photos sent within 24h
                        </div>
                      ) : isZurichBooking ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          <Check size={14} />
                          Direct Booking Available - Zurich
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                          <MessageSquare size={14} />
                          On Request - {detectedCountry || 'Your Region'}
                        </div>
                      )}

                      <button
                        onClick={() => setShowDateTimeModal(true)}
                        className="w-full py-3.5 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>{serviceCategory === 'luxury-cars' ? 'Continue to Rental Details' : 'Continue to Pickup Details'}</span>
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Shows DateTime summary - different for luxury cars */}
              {bookingStep === 2 && (
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                    {serviceCategory === 'luxury-cars' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Rental Start:</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {`${pickupDate} at ${pickupTime}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Rental End:</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {`${returnDate} at ${returnTime}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Duration:</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {(() => {
                              const start = new Date(`${pickupDate}T${pickupTime}`);
                              const end = new Date(`${returnDate}T${returnTime}`);
                              const hours = Math.round((end - start) / (1000 * 60 * 60));
                              const days = Math.floor(hours / 24);
                              const remainingHours = hours % 24;
                              if (days > 0) {
                                return `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
                              }
                              return `${hours} hour${hours > 1 ? 's' : ''}`;
                            })()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Pickup Time:</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {bookNow ? 'Now' : `${pickupDate} at ${pickupTime}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Passengers:</span>
                          <span className="text-sm font-semibold text-gray-800">{passengers}</span>
                        </div>
                      </>
                    )}
                    <button
                      onClick={() => setShowDateTimeModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit Details
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Car Selection with Images - Mobile optimized */}
              {bookingStep === 3 && (
                <div className="flex flex-col h-full min-h-0" style={{ maxHeight: isModalExpanded ? 'calc(100dvh - max(100px, calc(env(safe-area-inset-top) + 86px)))' : 'min(55vh, 400px)' }}>
                  {/* Expand/Collapse Button - Centered at top of car list */}
                  <div className="flex justify-center py-3 border-b border-gray-100 flex-shrink-0">
                    <button
                      onClick={() => setIsModalExpanded(!isModalExpanded)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all text-sm font-medium text-gray-700"
                    >
                      {isModalExpanded ? (
                        <>
                          <ChevronDown size={16} />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronUp size={16} />
                          Show More Cars
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent', minHeight: 0 }}>
                    {/* Search & Filter - Only for Luxury Cars */}
                    {serviceCategory === 'luxury-cars' && (
                    <div className="mb-4 space-y-3">
                      {/* Search Bar */}
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by brand or model..."
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm"
                      />

                      {/* Brand Filter Buttons */}
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {['all', 'Ferrari', 'Lamborghini', 'Porsche', 'McLaren', 'Mercedes', 'BMW', 'Range Rover', 'Rolls-Royce', 'Bentley'].map(brand => (
                          <button
                            key={brand}
                            onClick={() => setSelectedBrand(brand.toLowerCase())}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                              selectedBrand === brand.toLowerCase()
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {brand === 'all' ? 'All Brands' : brand}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Car List - Bolt/Uber Style - Shows ~4 cars then scroll */}
                  <div className="space-y-3 pb-4">
                    {(serviceCategory === 'luxury-cars' ? luxuryCars : carTypes)
                      .filter(car => {
                        // Filter by passengers
                        if (car.seats < passengers) return false;

                        // Filter by search query (luxury cars only)
                        if (serviceCategory === 'luxury-cars' && searchQuery) {
                          const query = searchQuery.toLowerCase();
                          const carName = car.name.toLowerCase();
                          if (!carName.includes(query)) return false;
                        }

                        // Filter by brand (luxury cars only)
                        if (serviceCategory === 'luxury-cars' && selectedBrand !== 'all') {
                          const carName = car.name.toLowerCase();
                          if (!carName.includes(selectedBrand)) return false;
                        }

                        return true;
                      })
                      .map((car, index) => {
                      const price = calculatePrice(car);
                      return (
                        <button
                          key={car.id}
                          onClick={() => {
                            setSelectedCar(car);
                            // For luxury cars or "on request" countries, show quote modal instead of payment
                            if (serviceCategory === 'luxury-cars' || isOnRequestOnly) {
                              setTimeout(() => setShowQuoteModal(true), 300);
                            } else {
                              setTimeout(() => setShowPaymentPage(true), 300);
                            }
                          }}
                          className={`w-full p-4 rounded-xl transition-all border ${
                            selectedCar?.id === car.id
                              ? 'bg-gray-100 border-black'
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            {/* Car Image */}
                            <div className="flex-shrink-0">
                              <img
                                src={car.image}
                                alt={car.name}
                                className="w-20 h-14 md:w-24 md:h-16 object-contain"
                              />
                            </div>

                            {/* Car Info */}
                            <div className="flex-1 text-left min-w-0">
                              <h4 className="text-sm md:text-base font-semibold text-gray-800 truncate">{car.name}</h4>
                              <div className="text-xs text-gray-600 mt-1 truncate">
                                {serviceCategory === 'luxury-cars'
                                  ? `${car.seats} seats - ${car.location || locationA}`
                                  : `${car.seats} seats - ${distance} km - ${bookNow ? 'Now' : pickupTime}`
                                }
                              </div>
                            </div>

                            {/* PVCX Earnings & Price */}
                            <div className="flex-shrink-0 flex items-center gap-2 md:gap-3">
                              {/* PVCX Tokens Earned - different calculation for luxury cars */}
                              <div className="hidden md:inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                                <span className="text-xs font-semibold text-gray-700">
                                  +{serviceCategory === 'luxury-cars'
                                    ? Math.round((car.pricePerDay || 100) / 10)
                                    : Math.round(distance * 1.5)
                                  } $PVCX
                                </span>
                              </div>

                              {/* Price - Currency auto-set by country */}
                              <div className="text-right">
                                {serviceCategory === 'luxury-cars' && car.pricePerDay ? (
                                  <>
                                    <div className="text-sm md:text-base font-bold text-gray-800 animate-fadeInUp">
                                      {formatPrice(car.pricePerDay)}
                                    </div>
                                    <div className="text-[10px] text-gray-600 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                                      per day
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-sm md:text-base font-bold text-gray-800 animate-fadeInUp">
                                      {formatPrice(price.min)}
                                    </div>
                                    <div className="text-[10px] text-gray-600 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                                      to {formatPrice(price.max)}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Loading Overlay - Monochromatic Style */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            {/* Thin black spinner */}
            <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Processing request...</p>
          </div>
        </div>
      )}

      {/* Date/Time/Persons Popup Modal */}
      {showDateTimeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 md:p-6 max-w-lg w-full shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-800">
                {serviceCategory === 'luxury-cars' ? 'Rental Details' : 'Pickup Details'}
              </h3>
              <button
                onClick={() => setShowDateTimeModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            {/* Book Now Toggle - Only available in Switzerland and NOT for luxury cars */}
            {serviceCategory !== 'luxury-cars' && isSwissBooking ? (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">Book for now</span>
                    <p className="text-xs text-gray-600 mt-0.5">Instant booking available in Switzerland</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={bookNow}
                    onChange={(e) => {
                      setBookNow(e.target.checked);
                      if (e.target.checked) {
                        setPickupDate('');
                        setPickupTime('');
                      }
                    }}
                    className="w-12 h-6 rounded-full appearance-none bg-gray-300 checked:bg-black relative cursor-pointer transition-colors
                      after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform
                      checked:after:translate-x-6"
                  />
                </label>
              </div>
            ) : serviceCategory !== 'luxury-cars' ? (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <Clock size={14} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Advance Booking Required</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Instant booking is only available in Switzerland. Please schedule at least 30 minutes in advance.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Date and Time Pickers - Different for luxury cars */}
            {!bookNow && (
              <div className="mb-4 space-y-4">
                {/* Pickup/Rental Start Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    {serviceCategory === 'luxury-cars' ? 'Rental Start' : 'Pickup Date & Time'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        <Calendar size={12} className="inline mr-1" />
                        Date
                      </label>
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        <Clock size={12} className="inline mr-1" />
                        Time
                        {serviceCategory !== 'luxury-cars' && !isSwissBooking && (
                          <span className="ml-1 text-[10px] text-blue-600 font-normal">(min. 30min)</span>
                        )}
                      </label>
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Return Date & Time - Only for Luxury Cars */}
                {serviceCategory === 'luxury-cars' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Rental End
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <Calendar size={12} className="inline mr-1" />
                          Date
                        </label>
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          min={pickupDate || new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          <Clock size={12} className="inline mr-1" />
                          Time
                        </label>
                        <input
                          type="time"
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    {/* Duration Display */}
                    {pickupDate && pickupTime && returnDate && returnTime && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                          <strong className="text-gray-800">Rental Duration:</strong> {(() => {
                            const start = new Date(`${pickupDate}T${pickupTime}`);
                            const end = new Date(`${returnDate}T${returnTime}`);
                            const hours = Math.round((end - start) / (1000 * 60 * 60));
                            const days = Math.floor(hours / 24);
                            const remainingHours = hours % 24;
                            if (days > 0) {
                              return `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
                            }
                            return `${hours} hour${hours > 1 ? 's' : ''}`;
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Number of Passengers */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-800 mb-2">
                <Users size={14} className="inline mr-1" />
                Number of Passengers
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="w-9 h-9 rounded-lg border-2 border-gray-300 hover:border-black transition-colors flex items-center justify-center font-semibold text-sm"
                >
                  -
                </button>
                <span className="text-xl font-semibold text-gray-800 w-10 text-center">{passengers}</span>
                <button
                  onClick={() => setPassengers(Math.min(16, passengers + 1))}
                  className="w-9 h-9 rounded-lg border-2 border-gray-300 hover:border-black transition-colors flex items-center justify-center font-semibold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={() => {
                // Validation for pickup date/time
                if (!bookNow && (!pickupDate || !pickupTime)) {
                  alert('Please select rental start date and time');
                  return;
                }

                // Validation for return date/time (luxury cars only)
                if (serviceCategory === 'luxury-cars' && (!returnDate || !returnTime)) {
                  alert('Please select rental end date and time');
                  return;
                }

                // Check that return is after pickup (luxury cars only)
                if (serviceCategory === 'luxury-cars' && returnDate && returnTime) {
                  const start = new Date(`${pickupDate}T${pickupTime}`);
                  const end = new Date(`${returnDate}T${returnTime}`);
                  if (end <= start) {
                    alert('Rental end must be after rental start');
                    return;
                  }
                  // Minimum 3 hours rental
                  const hours = (end - start) / (1000 * 60 * 60);
                  if (hours < 3) {
                    alert('Minimum rental duration is 3 hours');
                    return;
                  }
                }

                // Validate 30-minute minimum for non-Switzerland bookings (taxi/concierge only)
                if (serviceCategory !== 'luxury-cars' && !isSwissBooking && !bookNow) {
                  const selectedDateTime = new Date(`${pickupDate}T${pickupTime}`);
                  const now = new Date();
                  const minTime = new Date(now.getTime() + 30 * 60000); // 30 minutes from now

                  if (selectedDateTime < minTime) {
                    alert('Please schedule at least 30 minutes in advance for locations outside Switzerland.');
                    return;
                  }
                }

                setShowDateTimeModal(false);
                setBookingStep(3); // Move to car selection step
                setIsPanelMinimized(false); // Ensure panel is expanded for car selection
              }}
              className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <span>Continue to Car Selection</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Currency is now auto-set based on pickup country - no manual picker needed */}

      {/* Quote Request Modal - For Luxury Cars and On Request Countries */}
      {showQuoteModal && selectedCar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {serviceCategory === 'luxury-cars' ? 'Request Quote' : 'Request Transfer Quote'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {serviceCategory === 'luxury-cars'
                      ? `${selectedCar.name} - from ${formatPrice(selectedCar.pricePerDay || 550)}/day`
                      : `${selectedCar.name} - ${distance} km - Est. ${formatPrice(calculatePrice(selectedCar).min)} - ${formatPrice(calculatePrice(selectedCar).max)}`
                    }
                  </p>
                  {isOnRequestOnly && serviceCategory !== 'luxury-cars' && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      Service in {detectedCountry} available on request only
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              {/* Car Image */}
              {selectedCar.image && (
                <div className="mb-6">
                  <img
                    src={selectedCar.image}
                    alt={selectedCar.name}
                    className="w-full h-48 object-contain bg-gray-50 rounded-xl"
                  />
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      placeholder="+1 234 567 890"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                </div>

                {/* Date/Time Fields - Different for luxury cars vs taxi */}
                {serviceCategory === 'luxury-cars' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rental Start *</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rental End *</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date *</label>
                      <input
                        type="date"
                        defaultValue={pickupDate}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Time *</label>
                      <input
                        type="time"
                        defaultValue={pickupTime}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                  </div>
                )}

                {/* Locations - Different for luxury cars vs taxi */}
                {serviceCategory === 'luxury-cars' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rental Location</label>
                      <input
                        type="text"
                        value={locationA}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                    {deliveryAddress && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                        <input
                          type="text"
                          value={deliveryAddress}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                    )}
                    {returnAddress && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Return Address</label>
                        <input
                          type="text"
                          value={returnAddress}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
                      <input
                        type="text"
                        value={locationA}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Drop-off Location</label>
                      <input
                        type="text"
                        value={locationB}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
                      <input
                        type="number"
                        value={passengers}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                  <textarea
                    rows={3}
                    placeholder="Any specific requirements or preferences..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black resize-none"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    {serviceCategory === 'luxury-cars' ? (
                      <>
                        <strong>Note:</strong> Interior photos and final pricing will be sent to your email within 24 hours.
                        {deliveryAddress && !deliveryAddress.toLowerCase().includes(locationA.toLowerCase()) && (
                          <span className="block mt-1">Custom delivery fee: +$55-90</span>
                        )}
                      </>
                    ) : (
                      <>
                        <strong>Note:</strong> Our team will confirm availability and send you a detailed quote within 24 hours.
                        {distance && (
                          <span className="block mt-1">Distance: {distance} km • Est. {eta} min</span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => {
                  // TODO: Save to database
                  alert('Quote request submitted! Check your email within 24h.');
                  setShowQuoteModal(false);
                }}
                className="w-full mt-6 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                {serviceCategory === 'luxury-cars' ? 'Request Quote' : 'Request Transfer Quote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentPage && selectedCar && (
        <PaymentModal
          bookingData={{
            selectedCar,
            distance,
            eta,
            priceRange: calculatePrice(selectedCar),
            locationA,
            locationB,
            passengers,
            pickupDate,
            pickupTime,
            bookNow,
            currency: selectedCurrency
          }}
          onClose={() => setShowPaymentPage(false)}
          onPaymentComplete={handleSubmitRequest}
        />
      )}

      {/* Success Notification - Monochromatic Style */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slideIn border border-gray-700">
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-gray-900" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Request Submitted!</h4>
            <p className="text-sm text-gray-300">{notificationMessage}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* Custom scrollbar for car list */
        div[style*="scrollbarWidth"]::-webkit-scrollbar {
          width: 8px;
        }
        div[style*="scrollbarWidth"]::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
        }
        div[style*="scrollbarWidth"]::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        div[style*="scrollbarWidth"]::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default TaxiConciergeView;
