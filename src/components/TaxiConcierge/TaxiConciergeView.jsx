import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Car, Clock, ChevronRight, Check, Calendar, MessageSquare, Loader2, ChevronDown, ChevronUp, Users, X } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '../../lib/supabase';
import { createRequest } from '../../services/requests';
import PaymentModal from './PaymentModal';

// Mapbox access token from environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

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
  const [bookingStep, setBookingStep] = useState(1); // 1: Locations, 2: DateTime/Persons, 3: Car Selection
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
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

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Light grey map style
      center: [-80.1918, 25.7617], // Miami
      zoom: 11,
      pitch: 45
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Add 3D buildings layer when the map loads
    map.current.on('load', () => {
      try {
        // Insert the layer beneath any symbol layer to prevent labels from being covered
        const layers = map.current.getStyle().layers;
        const labelLayerId = layers.find(
          (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
        )?.id;

        // Add 3D building layer
        map.current.addLayer(
          {
            id: 'add-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#d8d8d8',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            }
          },
          labelLayerId
        );
      } catch (error) {
        console.log('3D buildings could not be added:', error);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Get user's current location
  useEffect(() => {
    if (!map.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);

          // Add user location marker
          const el = document.createElement('div');
          el.className = 'user-location-marker';
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#4A90E2';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';

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
    if (!userLocation) {
      alert('Location not available. Please enable location services.');
      return;
    }

    const [longitude, latitude] = userLocation;
    const feature = await reverseGeocode(longitude, latitude);

    if (feature) {
      selectLocationA(feature);
    } else {
      alert('Unable to get address for your location.');
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
    setFeatureA(feature); // Store feature for Switzerland checking
    setShowSuggestionsA(false);

    // Add marker
    if (map.current) {
      // Remove existing marker A
      const existingMarkers = document.querySelectorAll('.marker-a');
      existingMarkers.forEach(marker => marker.remove());

      const el = document.createElement('div');
      el.className = 'marker-a';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.backgroundColor = '#000000';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

      new mapboxgl.Marker(el)
        .setLngLat(feature.center)
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>From:</strong> ${feature.place_name}`))
        .addTo(map.current);

      map.current.flyTo({
        center: feature.center,
        zoom: 14
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

      map.current.flyTo({
        center: feature.center,
        zoom: 14
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

  // Get route when both locations are set
  useEffect(() => {
    if (coordsA && coordsB) {
      getRoute();
    }
  }, [coordsA, coordsB]);

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

      console.log('Route calculated:', {
        distanceMeters: data.distance,
        distanceKm: distanceInKm,
        durationSeconds: data.duration,
        durationMinutes: durationInMinutes
      });

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
            'line-width': 4,
            'line-opacity': 0.9
          }
        });

        // Add pulsing animation to route
        let opacity = 0.5;
        let increasing = true;
        setInterval(() => {
          if (!map.current.getLayer('route')) return;

          if (increasing) {
            opacity += 0.02;
            if (opacity >= 1) increasing = false;
          } else {
            opacity -= 0.02;
            if (opacity <= 0.5) increasing = true;
          }

          map.current.setPaintProperty('route', 'line-opacity', opacity);
        }, 50);
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
      console.error('Error getting route:', error);
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
          // Create request in user_requests table
          await createRequest({
            userId: user.id,
            type: 'taxi_concierge',
            data: {
              ...requestData,
              carImage: selectedCar.image,
              carName: selectedCar.name,
              carSeats: selectedCar.seats,
              status: 'pending'
            },
            userEmail: user.email
          });

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
      `}</style>

      {/* Full Page Map Container - extends to edges with rounded bottom-right corner */}
      <div ref={mapContainer} className="absolute inset-0 rounded-br-2xl z-0" />

      {/* Bottom Booking Panel - Always visible for location inputs */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-200 pointer-events-auto transition-transform duration-300 ${isPanelMinimized ? 'translate-y-[calc(100%-60px)]' : 'translate-y-0'} max-h-[78vh] z-10`} style={{ overflow: 'visible' }}>
        <div className="max-w-4xl mx-auto h-full flex flex-col" style={{ overflow: 'visible' }}>
          {/* Minimize/Maximize Toggle Button - Only show after addresses are entered */}
          {(locationA || locationB) && (
            <button
              onClick={() => setIsPanelMinimized(!isPanelMinimized)}
              className="absolute top-3 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
              title={isPanelMinimized ? 'Maximize panel' : 'Minimize panel'}
            >
              {isPanelMinimized ? (
                <ChevronUp size={20} className="text-gray-600" />
              ) : (
                <ChevronDown size={20} className="text-gray-600" />
              )}
            </button>
          )}

          {/* Location Inputs - Hidden when selecting car (Step 3) */}
          {bookingStep !== 3 && (
            <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100 relative" style={{ zIndex: 50 }}>
              <div className="flex gap-3 pr-12">
              <div className="relative flex-1" style={{ zIndex: 60 }}>
                <div className="relative">
                  <input
                    type="text"
                    value={locationA}
                    onChange={(e) => handleLocationAChange(e.target.value)}
                    placeholder="Pick-up location"
                    className="w-full px-4 py-3.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm bg-white"
                  />
                  <button
                    onClick={handleUseCurrentLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Use current location"
                  >
                    <Navigation size={16} className="text-gray-400" />
                  </button>
                </div>
                {showSuggestionsA && suggestionsA.length > 0 && (
                  <div className="absolute w-full bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto" style={{
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

              <div className="relative flex-1" style={{ zIndex: 60 }}>
                <input
                  type="text"
                  value={locationB}
                  onChange={(e) => handleLocationBChange(e.target.value)}
                  placeholder="Drop-off location"
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm bg-white"
                />
                {showSuggestionsB && suggestionsB.length > 0 && (
                  <div className="absolute w-full bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto" style={{
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
            </div>
            </div>
          )}

          {/* Multi-Step Flow - Shows after route is calculated */}
          {eta && distance && (
            <>
              {/* Step 1: Route Summary & Continue Button */}
              {bookingStep === 1 && (
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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

                  {/* Long Distance Notice (>1 hour) */}
                  {eta > 60 ? (
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
                      {/* Switzerland Badge */}
                      {isSwissBooking ? (
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
                        Continue to Pickup Details
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Shows DateTime summary - already selected in modal */}
              {bookingStep === 2 && (
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl space-y-2">
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
                <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[400px]">
                  {/* Car List - Bolt/Uber Style */}
                  <div className="space-y-2 pr-2">
                    {carTypes.filter(car => car.seats >= passengers).map((car, index) => {
                      const price = calculatePrice(car);
                      return (
                        <button
                          key={car.id}
                          onClick={() => {
                            setSelectedCar(car);
                            // Show payment page
                            setTimeout(() => setShowPaymentPage(true), 300);
                          }}
                          className={`w-full p-3 rounded-lg transition-all ${
                            selectedCar?.id === car.id
                              ? 'bg-gray-200'
                              : index % 2 === 0
                                ? 'bg-gray-50 hover:bg-gray-100'
                                : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Car Image */}
                            <div className="flex-shrink-0">
                              <img
                                src={car.image}
                                alt={car.name}
                                className="w-20 h-14 object-contain"
                              />
                            </div>

                            {/* Car Info */}
                            <div className="flex-1 text-left">
                              <h4 className="text-base font-semibold text-gray-800">{car.name}</h4>
                              <div className="text-xs text-gray-600 mt-1">
                                {car.seats} seats - {distance} km - {bookNow ? 'Now' : pickupTime}
                              </div>
                            </div>

                            {/* PVCX Earnings & Price */}
                            <div className="flex-shrink-0 flex items-center gap-3">
                              {/* PVCX Tokens Earned */}
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                                <span className="text-xs font-semibold text-gray-700">
                                  +{Math.round(distance * 1.5)} $PVCX
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
                                <div className="text-base font-bold text-gray-800 animate-fadeInUp">
                                  {formatPrice(price.min)}
                                </div>
                                <div className="text-[10px] text-gray-600 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                                  to {formatPrice(price.max)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
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
              <h3 className="text-lg font-semibold text-gray-800">Pickup Details</h3>
              <button
                onClick={() => setShowDateTimeModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            {/* Book Now Toggle - Only available in Switzerland */}
            {isSwissBooking ? (
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
            ) : (
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
            )}

            {/* Date and Time Pickers - Only show if not "Book Now" */}
            {!bookNow && (
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-2">
                      <Calendar size={14} className="inline mr-1" />
                      Pickup Date
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
                    <label className="block text-xs font-medium text-gray-800 mb-2">
                      <Clock size={14} className="inline mr-1" />
                      Pickup Time
                      {!isSwissBooking && (
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
                if (!bookNow && (!pickupDate || !pickupTime)) {
                  alert('Please select date and time');
                  return;
                }

                // Validate 30-minute minimum for non-Switzerland bookings
                if (!isSwissBooking && !bookNow) {
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
