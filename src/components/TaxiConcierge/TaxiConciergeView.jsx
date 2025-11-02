import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Car, Clock, ChevronRight, Check, Calendar, MessageSquare, Loader2, ChevronDown, ChevronUp, Users, X } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '../../lib/supabase';
import { createRequest } from '../../services/requests';
import PaymentModal from './PaymentModal';

// Mapbox token - privatecharterx account
const MAPBOX_TOKEN = 'pk.eyJ1IjoicHJpdmF0ZWNoYXJ0ZXJ4IiwiYSI6ImNsdGJ2dG4zazFucGsya21tNXRldW5udjYifQ.NrWJLJuG9n6b1jhRh5AkSg';

const TaxiConciergeView = ({ onRequestSubmit }) => {
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
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('CHF');
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

  // Country-based pricing configuration
  const countryPricing = {
    'Bulgaria': { basePrice: 2.50, currency: 'EUR', code: 'BG' },
    'Deutschland': { basePrice: 3.50, currency: 'EUR', code: 'DE' },
    'Germany': { basePrice: 3.50, currency: 'EUR', code: 'DE' },
    'Schweiz': { basePrice: 5.00, currency: 'CHF', code: 'CH' },
    'Switzerland': { basePrice: 5.00, currency: 'CHF', code: 'CH' },
    'Suisse': { basePrice: 5.00, currency: 'CHF', code: 'CH' },
    'Italia': { basePrice: 2.50, currency: 'EUR', code: 'IT' },
    'Italy': { basePrice: 2.50, currency: 'EUR', code: 'IT' },
    'Österreich': { basePrice: 3.50, currency: 'EUR', code: 'AT' },
    'Austria': { basePrice: 3.50, currency: 'EUR', code: 'AT' }
  };

  const carTypes = [
    {
      id: 'bmw-7er-2015',
      name: 'BMW 7er 2015',
      seats: 4,
      priceMinCHF: 4.00,
      priceMaxCHF: 7.50,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_251110158_bmw-7-2015-seitenansicht_4x.png'
    },
    {
      id: 'mercedes-s-2018',
      name: 'Mercedes Benz S-Class 2018',
      seats: 5,
      priceMinCHF: 4.50,
      priceMaxCHF: 7.50,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_253116175_mercedes-benz-s-2018-seitenansicht_4x.png'
    },
    {
      id: 'mercedes-s-2020',
      name: 'Mercedes S-Class 2020',
      seats: 5,
      priceMinCHF: 5.00,
      priceMaxCHF: 8.00,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_253111171_mercedes-benz-s-2020-seitenansicht_4x.png'
    },
    {
      id: 'mercedes-vito',
      name: 'Mercedes Vito',
      seats: 7,
      priceMinCHF: 6.50,
      priceMaxCHF: 9.00,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/vito.jpg'
    },
    {
      id: 'mercedes-maybach',
      name: 'Mercedes Benz S-Class Maybach',
      seats: 5,
      priceMinCHF: 8.00,
      priceMaxCHF: 12.00,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_255110169_mercedes-benz-s-2020-seitenansicht_4x.png'
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

  // Geocoding function
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`
      );
      const data = await response.json();
      return data.features;
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  };

  // Reverse geocoding function (coordinates to address)
  const reverseGeocode = async (longitude, latitude) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`
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

  // Keep old function for backward compatibility (now just calls Switzerland check)
  const isLocationInZurich = isLocationInSwitzerland;

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

  // Check if both locations are in Switzerland and detect country
  const [featureA, setFeatureA] = useState(null);
  const [featureB, setFeatureB] = useState(null);

  useEffect(() => {
    if (featureA && featureB) {
      const bothInSwitzerland = isLocationInSwitzerland(featureA) && isLocationInSwitzerland(featureB);
      setIsSwissBooking(bothInSwitzerland);
      setIsZurichBooking(bothInSwitzerland); // Keep for backward compatibility

      // Disable "Book Now" if not in Switzerland
      if (!bothInSwitzerland && bookNow) {
        setBookNow(false);
      }

      // Detect country and set pricing
      const country = detectCountryFromFeature(featureA) || detectCountryFromFeature(featureB);
      if (country && countryPricing[country]) {
        const pricing = countryPricing[country];
        setPricePerKm(pricing.basePrice);
        setSelectedCurrency(pricing.currency);
        setDetectedCountry(country);
        console.log(`Country detected: ${country}, Price: ${pricing.basePrice} ${pricing.currency}/km`);
      } else {
        // Default to Switzerland pricing
        setPricePerKm(5.00);
        setSelectedCurrency('CHF');
        setDetectedCountry('Switzerland');
      }
    } else {
      setIsSwissBooking(false);
      setIsZurichBooking(false);
    }
  }, [featureA, featureB]);

  // Get route when both locations are set (only for taxi/concierge)
  useEffect(() => {
    if (serviceCategory !== 'luxury-cars' && coordsA && coordsB && mapLoaded) {
      // Debounce route calculation to prevent lag
      const timeoutId = setTimeout(() => {
        getRoute();
        // Auto-minimize panel when route is calculated to show map better
        setTimeout(() => {
          setIsPanelMinimized(true);
        }, 800); // Reduced delay for faster UX
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

  // Currency conversion rates (base: CHF)
  const currencyRates = {
    'CHF': 1,
    'USD': 1.13,
    'EUR': 1.05,
    'USDT': 1.13,
    'USDC': 1.13,
    'BTC': 0.000017
  };

  const calculatePrice = (carType) => {
    if (!distance) return { min: 0, max: 0 };
    const distanceNum = parseFloat(distance);

    // Get base currency for detected country (default CHF)
    const baseCurrency = detectedCountry && countryPricing[detectedCountry]
      ? countryPricing[detectedCountry].currency
      : 'CHF';

    // Get country price ratio compared to Switzerland
    // Switzerland base is 5.00 CHF/km, other countries scale from that
    const countryRatio = pricePerKm / 5.00;

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

    if (!carToUse || !locationA || !locationB) {
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
      from: locationA,
      to: locationB,
      coordsA,
      coordsB,
      carType: carToUse,
      distance,
      eta,
      priceRange: `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`,
      pickupDate: bookNow ? 'Now' : pickupDate,
      pickupTime: bookNow ? 'Now' : pickupTime,
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
          // Create request in user_requests table - DIRECT INSERT
          const { error: dbError } = await supabase
            .from('user_requests')
            .insert([{
              user_id: user.id,
              type: 'taxi_concierge',
              status: 'pending',
              data: {
                ...requestData,
                carImage: selectedCar.image,
                carName: selectedCar.name,
                carSeats: selectedCar.seats,
                user_email: user.email
              }
            }]);

          if (dbError) throw dbError;

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

      // Auto-hide notification after 5 seconds
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
      }, 5000);
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


      {/* Bottom Booking Panel - Floating modal with proper spacing */}
      <div className={`absolute ${serviceCategory === 'luxury-cars' ? 'left-6' : 'left-1/2 -translate-x-1/2'} pointer-events-auto z-10 ${bookingStep === 3 ? 'top-6 bottom-6' : 'bottom-6'}`} style={{ maxWidth: serviceCategory === 'luxury-cars' ? '480px' : '650px', width: serviceCategory === 'luxury-cars' ? 'auto' : '90%' }}>
        <div className={`bg-white shadow-2xl rounded-2xl transition-all duration-300 w-full ${bookingStep === 3 ? 'h-full' : ''}`} style={{ overflow: 'visible', position: 'relative' }}>
          <div className="flex flex-col" style={{ overflow: 'visible', height: bookingStep === 3 ? '100%' : 'auto' }}>
          {/* Minimize/Maximize Toggle Button - Only show when route is calculated */}
          {(eta && distance) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPanelMinimized(!isPanelMinimized);
              }}
              className="absolute top-3 right-3 p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-md border border-gray-200 z-50"
              style={{ pointerEvents: 'auto' }}
              title={isPanelMinimized ? 'Show details' : 'Hide details'}
            >
              {isPanelMinimized ? (
                <ChevronUp size={18} className="text-gray-700" />
              ) : (
                <ChevronDown size={18} className="text-gray-700" />
              )}
            </button>
          )}


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
                  Taxi
                </button>
                <button
                  onClick={() => setServiceCategory('concierge')}
                  className={`px-3 py-2 text-xs font-medium transition-all border-b-2 ${
                    serviceCategory === 'concierge'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Concierge
                </button>
                <button
                  onClick={() => setServiceCategory('luxury-cars')}
                  className={`px-3 py-2 text-xs font-medium transition-all border-b-2 ${
                    serviceCategory === 'luxury-cars'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Luxury Cars
                </button>
              </div>

              <div className="flex gap-3" style={{ overflow: 'visible' }}>
              <div className="relative flex-1" style={{ zIndex: 60, overflow: 'visible' }}>
                <div className="relative" style={{ overflow: 'visible' }}>
                  <input
                    type="text"
                    value={locationA}
                    onChange={(e) => handleLocationAChange(e.target.value)}
                    placeholder={serviceCategory === 'luxury-cars' ? 'Rental Location (City)' : 'Pick-up location'}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black text-sm bg-white transition-all"
                  />
                  <button
                    onClick={handleUseCurrentLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                    title="Use my current location"
                  >
                    <Navigation size={16} className="text-gray-400 group-hover:text-black transition-colors" />
                  </button>
                </div>
                {showSuggestionsA && suggestionsA.length > 0 && (
                  <div className="absolute w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto" style={{
                    bottom: 'calc(100% + 8px)',
                    left: 0,
                    zIndex: 9999
                  }}>
                    {suggestionsA.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectLocationA(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-sm font-semibold text-gray-800">{suggestion.text}</div>
                        <div className="text-xs text-gray-600">{suggestion.place_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input - Only for Taxi/Concierge */}
              {serviceCategory !== 'luxury-cars' && (
                <div className="relative flex-1" style={{ zIndex: 60, overflow: 'visible' }}>
                  <input
                    type="text"
                    value={locationB}
                    onChange={(e) => handleLocationBChange(e.target.value)}
                    placeholder="Drop-off location"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black text-sm bg-white transition-all"
                  />
                  {showSuggestionsB && suggestionsB.length > 0 && (
                    <div className="absolute w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto" style={{
                      bottom: 'calc(100% + 8px)',
                      left: 0,
                      zIndex: 9999
                    }}>
                      {suggestionsB.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => selectLocationB(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-sm font-semibold text-gray-800">{suggestion.text}</div>
                          <div className="text-xs text-gray-600">{suggestion.place_name}</div>
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
                  placeholder="Delivery Address (optional +€50-80 for custom delivery)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black text-sm bg-white transition-all"
                />
                <input
                  type="text"
                  value={returnAddress}
                  onChange={(e) => setReturnAddress(e.target.value)}
                  placeholder="Return Address (optional)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black text-sm bg-white transition-all"
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
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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

                  {/* Long Distance Notice (>1 hour) - Only for taxi/concierge */}
                  {serviceCategory !== 'luxury-cars' && eta > 60 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={16} className="text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">Long Distance Trip</p>
                          <p className="text-xs text-amber-700 mt-1">
                            This trip is longer than 1 hour. Please contact us directly at{' '}
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
                      {/* Badge - different for luxury cars */}
                      {serviceCategory === 'luxury-cars' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          <MessageSquare size={14} />
                          Quote Request - Interior photos sent within 24h
                        </div>
                      ) : isSwissBooking ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          <Check size={14} />
                          Instant Booking Available in Switzerland
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          <MessageSquare size={14} />
                          Quote Request - Available Worldwide
                        </div>
                      )}

                      <button
                        onClick={() => setShowDateTimeModal(true)}
                        className="w-full py-3.5 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                      >
                        {serviceCategory === 'luxury-cars' ? 'Continue to Rental Details' : 'Continue to Pickup Details'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Shows DateTime summary - different for luxury cars */}
              {bookingStep === 2 && (
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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

              {/* Step 3: Car Selection with Images */}
              {bookingStep === 3 && (
                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">

                  {/* Search & Filter - Only for Luxury Cars */}
                  {serviceCategory === 'luxury-cars' && (
                    <div className="mb-4 space-y-3">
                      {/* Search Bar */}
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by brand or model..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm"
                      />

                      {/* Brand Filter Buttons */}
                      <div className="flex gap-2 overflow-x-auto pb-2">
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
                            // For luxury cars, show quote modal instead of payment
                            if (serviceCategory === 'luxury-cars') {
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
                          <div className="flex items-center gap-4">
                            {/* Car Image */}
                            <div className="flex-shrink-0">
                              <img
                                src={car.image}
                                alt={car.name}
                                className="w-24 h-16 object-contain"
                              />
                            </div>

                            {/* Car Info */}
                            <div className="flex-1 text-left">
                              <h4 className="text-base font-semibold text-gray-800">{car.name}</h4>
                              <div className="text-xs text-gray-600 mt-1">
                                {serviceCategory === 'luxury-cars'
                                  ? `${car.seats} seats - ${car.location || locationA}`
                                  : `${car.seats} seats - ${distance} km - ${bookNow ? 'Now' : pickupTime}`
                                }
                              </div>
                            </div>

                            {/* PVCX Earnings & Price */}
                            <div className="flex-shrink-0 flex items-center gap-3">
                              {/* PVCX Tokens Earned - different calculation for luxury cars */}
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                                <span className="text-xs font-semibold text-gray-700">
                                  +{serviceCategory === 'luxury-cars'
                                    ? Math.round((car.pricePerDay || 100) / 10)
                                    : Math.round(distance * 1.5)
                                  } $PVCX
                                </span>
                              </div>

                              {/* Price - Clickable to change currency */}
                              <div
                                className="cursor-pointer hover:opacity-70 transition-opacity text-right"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCurrencyPicker(true);
                                }}
                              >
                                {serviceCategory === 'luxury-cars' && car.pricePerDay ? (
                                  <>
                                    <div className="text-base font-bold text-gray-800 animate-fadeInUp">
                                      {formatPrice(car.pricePerDay)}
                                    </div>
                                    <div className="text-[10px] text-gray-600 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                                      per day
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-base font-bold text-gray-800 animate-fadeInUp">
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
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Loading Overlay with Skip Option */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Processing Your Request</h3>
            <p className="text-sm text-gray-600 mb-6">Searching for available drivers...</p>
            <button
              onClick={skipLoader}
              className="text-xs text-gray-600 hover:text-gray-800 underline font-medium"
            >
              Skip and continue
            </button>
          </div>
        </div>
      )}

      {/* Date/Time/Persons Popup Modal */}
      {showDateTimeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {serviceCategory === 'luxury-cars' ? 'Rental Details' : 'Pickup Details'}
              </h3>
              <button
                onClick={() => setShowDateTimeModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
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
              className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors text-sm"
            >
              Continue to Car Selection
            </button>
          </div>
        </div>
      )}

      {/* Currency Picker Modal */}
      {showCurrencyPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Select Currency</h3>
              <button
                onClick={() => setShowCurrencyPicker(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Currency Options in Light Grey Bubbles */}
            <div className="grid grid-cols-3 gap-3">
              {['CHF', 'USD', 'EUR', 'USDT', 'USDC', 'BTC'].map((currency) => (
                <button
                  key={currency}
                  onClick={() => {
                    setSelectedCurrency(currency);
                    setShowCurrencyPicker(false);
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedCurrency === currency
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quote Request Modal - For Luxury Cars */}
      {showQuoteModal && selectedCar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Request Quote</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCar.name} - from €{selectedCar.pricePerDay || '500'}/day
                  </p>
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
                    <strong>Note:</strong> Interior photos and final pricing will be sent to your email within 24 hours.
                    {deliveryAddress && !deliveryAddress.toLowerCase().includes(locationA.toLowerCase()) && (
                      <span className="block mt-1">Custom delivery fee: +€50-80</span>
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
                Request Quote
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

      {/* Success Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slideIn">
          <Check className="w-6 h-6" />
          <div>
            <h4 className="font-semibold">Request Submitted!</h4>
            <p className="text-sm opacity-90">{notificationMessage}</p>
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
      `}</style>
    </div>
  );
};

export default TaxiConciergeView;
