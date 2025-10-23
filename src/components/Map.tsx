'use client';

import React, { useState, useEffect, useRef } from 'react';
import Map, {
  Source,
  Layer,
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  GeolocateControl,
  MapRef
} from 'react-map-gl';
import type { Location, Stop } from '@/types';
import { format } from 'date-fns';
import { Building2, MapPin, Phone, Clock, MapPinned, X } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxMapProps {
  origin: Location | null;
  destination: Location | null;
  isReturn: boolean;
  stops: Stop[];
  selectedDate?: string;
  selectedTime?: string;
  showOfficeLocations?: boolean;
  showControls?: boolean;
  hideLabels?: boolean;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoicHJpdmF0ZWNoYXJ0ZXJ4IiwiYSI6ImNtN2Z4empwNzA2Z2wyanM3NWN2Znpmbm4ifQ.nuvmpND_qtdsauY-n8F_9g';

// Center on Europe by default
const initialViewState = {
  longitude: 10.0,
  latitude: 51.0,
  zoom: 4.0,
  pitch: 45,
  bearing: 0
};

const OFFICE_LOCATIONS = [
  {
    id: "london",
    name: "London Office",
    address: "71-75 Shelton Street, Covent Garden",
    city: "London",
    postcode: "WC2H 9JQ",
    country: "United Kingdom",
    hours: "Mo-Su, 00:00 - 23:59",
    lat: 51.5155,
    lng: -0.1229
  },
  {
    id: "zurich",
    name: "Zurich Office",
    address: "Bahnhofstrasse 37/10",
    city: "Zurich",
    postcode: "8001",
    country: "Switzerland",
    hours: "Mo-Su, 00:00 - 23:59",
    lat: 47.3769,
    lng: 8.5417
  },
  {
    id: "miami",
    name: "Miami Office",
    address: "1000 Brickell Ave, Suite 715",
    city: "Miami",
    postcode: "33131",
    country: "United States",
    hours: "Mo-Su, 00:00 - 23:59",
    lat: 25.7617,
    lng: -80.1918
  }
];

const LOCATION_COLORS = {
  origin: 'bg-blue-500',
  destination: 'bg-green-500',
  stop1: 'bg-orange-500',
  stop2: 'bg-purple-500',
  stop3: 'bg-pink-500',
  stop4: 'bg-indigo-500'
};

interface ExtendedLocation extends Location {
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  phone?: string;
  hours?: string;
  date?: string;
  time?: string;
}

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// Validate location coordinates to prevent Ghana fallback
const isValidLocation = (location: Location | null): boolean => {
  if (!location) return false;

  if (location.lat === 0 && location.lng === 0) {
    console.warn('🚨 Invalid location detected: [0,0] coordinates filtered out');
    return false;
  }

  if (Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) {
    console.warn('🚨 Invalid location detected: coordinates out of range', location);
    return false;
  }

  return true;
};

function MapboxMap({
  origin,
  destination,
  isReturn,
  stops,
  selectedDate,
  selectedTime,
  showOfficeLocations = true,
  showControls = true,
  hideLabels = false
}: MapboxMapProps) {
  const [viewState, setViewState] = useState(initialViewState);
  const [selectedLocation, setSelectedLocation] = useState<ExtendedLocation | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const animationRef = useRef<number>();
  const isMobile = useIsMobile();

  // Filter out invalid locations
  const validOrigin = isValidLocation(origin) ? origin : null;
  const validDestination = isValidLocation(destination) ? destination : null;
  const validStops = stops.filter(stop => isValidLocation(stop));

  // Debug logging for invalid locations
  useEffect(() => {
    if (origin && !validOrigin) {
      console.warn('🚨 Origin location invalid, not showing on map:', origin);
    }
    if (destination && !validDestination) {
      console.warn('🚨 Destination location invalid, not showing on map:', destination);
    }
    if (stops.length !== validStops.length) {
      console.warn('🚨 Some stops are invalid, filtered out:', stops.length - validStops.length);
    }
  }, [origin, destination, stops, validOrigin, validDestination, validStops]);

  // Track Ctrl/Cmd key and fullscreen state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsCtrlPressed(false);
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleWheel = (e: WheelEvent) => {
      if ((e.ctrlKey || e.metaKey) && mapRef.current) {
        // Check if the mouse is over the map container
        const mapContainer = mapRef.current.getContainer();
        const rect = mapContainer.getBoundingClientRect();
        const isOverMap = e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom;

        if (isOverMap) {
          e.preventDefault(); // Prevent browser zoom
          e.stopPropagation();

          // Manually trigger map zoom
          const map = mapRef.current.getMap();
          const zoomDelta = e.deltaY > 0 ? -1 : 1;
          const currentZoom = map.getZoom();
          const newZoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), currentZoom + zoomDelta));

          map.easeTo({
            zoom: newZoom,
            duration: 250 // Adjust this up/down if you want slower/faster zoom animation. 250 seems to match the +/- buttons
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Enhanced auto-rotation effect when no valid locations are selected (disabled on mobile for performance)
  useEffect(() => {
    if (isMobile) return; // Disable rotation on mobile for better performance

    let isActive = true;
    let animationId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const animate = () => {
      if (!isActive || !mapLoaded || !mapRef.current) return;

      const shouldRotate = !validOrigin && !validDestination && validStops.length === 0;

      if (shouldRotate) {
        setViewState(prev => ({
          ...prev,
          bearing: (prev.bearing + 0.02) % 360
        }));

        if (isActive) {
          animationId = requestAnimationFrame(animate);
        }
      }
    };

    if (mapLoaded && !validOrigin && !validDestination && validStops.length === 0) {
      timeoutId = setTimeout(() => {
        if (isActive) {
          animationId = requestAnimationFrame(animate);
        }
      }, 1000);
    }

    return () => {
      isActive = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, [mapLoaded, validOrigin, validDestination, validStops.length, isMobile]);

  // Reset view state when all valid locations are cleared
  useEffect(() => {
    if (!validOrigin && !validDestination && validStops.length === 0) {
      setViewState(initialViewState);
      setSelectedLocation(null);
      setShowPopup(false);
    }
  }, [validOrigin, validDestination, validStops.length]);

  // Calculate route lines using only valid locations
  const routeGeoJson = React.useMemo(() => {
    if (!validOrigin || !validDestination) return null;

    try {
      const features = [];

      if (validStops.length > 0) {
        features.push({
          type: 'Feature',
          properties: { type: 'main' },
          geometry: {
            type: 'LineString',
            coordinates: [[validOrigin.lng, validOrigin.lat], [validStops[0].lng, validStops[0].lat]]
          }
        });

        for (let i = 0; i < validStops.length - 1; i++) {
          features.push({
            type: 'Feature',
            properties: { type: 'main' },
            geometry: {
              type: 'LineString',
              coordinates: [[validStops[i].lng, validStops[i].lat], [validStops[i + 1].lng, validStops[i + 1].lat]]
            }
          });
        }

        features.push({
          type: 'Feature',
          properties: { type: 'main' },
          geometry: {
            type: 'LineString',
            coordinates: [[validStops[validStops.length - 1].lng, validStops[validStops.length - 1].lat], [validDestination.lng, validDestination.lat]]
          }
        });
      } else {
        features.push({
          type: 'Feature',
          properties: { type: 'main' },
          geometry: {
            type: 'LineString',
            coordinates: [[validOrigin.lng, validOrigin.lat], [validDestination.lng, validDestination.lat]]
          }
        });
      }

      if (isReturn) {
        features.push({
          type: 'Feature',
          properties: { type: 'return' },
          geometry: {
            type: 'LineString',
            coordinates: [[validDestination.lng, validDestination.lat], [validOrigin.lng, validOrigin.lat]]
          }
        });
      }

      return {
        type: 'FeatureCollection',
        features
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      return null;
    }
  }, [validOrigin, validDestination, isReturn, validStops]);

  // Update view state when valid locations change
  useEffect(() => {
    if (validOrigin && validDestination && mapLoaded && mapRef.current) {
      try {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = undefined;
        }

        let bounds = {
          minLng: Math.min(validOrigin.lng, validDestination.lng),
          maxLng: Math.max(validOrigin.lng, validDestination.lng),
          minLat: Math.min(validOrigin.lat, validDestination.lat),
          maxLat: Math.max(validOrigin.lat, validDestination.lat)
        };

        validStops.forEach(stop => {
          bounds.minLng = Math.min(bounds.minLng, stop.lng);
          bounds.maxLng = Math.max(bounds.maxLng, stop.lng);
          bounds.minLat = Math.min(bounds.minLat, stop.lat);
          bounds.maxLat = Math.max(bounds.maxLat, stop.lat);
        });

        const centerLng = (bounds.minLng + bounds.maxLng) / 2;
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;
        const dLng = Math.abs(bounds.maxLng - bounds.minLng);
        const dLat = Math.abs(bounds.maxLat - bounds.minLat);
        const maxDiff = Math.max(dLng, dLat);

        // Adjust zoom calculation for mobile
        const baseZoom = isMobile ? 5 : 6;
        const zoom = Math.min(Math.max(2, baseZoom - Math.log2(maxDiff)), isMobile ? 4 : 5);

        setTimeout(() => {
          setViewState(prev => ({
            longitude: centerLng,
            latitude: centerLat,
            zoom,
            pitch: isMobile ? 0 : 45, // Reduce pitch on mobile for better performance
            bearing: 0
          }));
        }, 100);

      } catch (error) {
        console.error('Error updating view state:', error);
      }
    }
  }, [validOrigin?.lat, validOrigin?.lng, validDestination?.lat, validDestination?.lng, validStops.length, mapLoaded, isMobile]);

  const mainRouteLayer = {
    id: 'main-route',
    type: 'line',
    filter: ['==', ['get', 'type'], 'main'],
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#000000',
      'line-width': isMobile ? 3 : 2, // Thicker lines on mobile for better visibility
      'line-opacity': 0.8,
      'line-dasharray': [2, 2]
    }
  } as const;

  const returnRouteLayer = {
    id: 'return-route',
    type: 'line',
    filter: ['==', ['get', 'type'], 'return'],
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#000000',
      'line-width': isMobile ? 4 : 3, // Thicker lines on mobile
      'line-opacity': 0.6,
      'line-dasharray': [4, 4]
    }
  } as const;

  const handleMapLoad = () => {
    console.log('🗺️ Map loaded successfully');
    if (!mapLoaded) {
      setMapLoaded(true);
    }

    // Hide labels if requested
    if (hideLabels && mapRef.current) {
      const map = mapRef.current.getMap();

      // Wait for map to fully load
      setTimeout(() => {
        // Comprehensive list of all possible text/label layers
        const layersToHide = [
          'country-label',
          'country-label-sm',
          'country-label-md',
          'country-label-lg',
          'state-label',
          'state-label-sm',
          'state-label-md',
          'state-label-lg',
          'settlement-major-label',
          'settlement-minor-label',
          'settlement-subdivision-label',
          'airport-label',
          'poi-label',
          'water-point-label',
          'water-line-label',
          'natural-point-label',
          'natural-line-label',
          'road-label',
          'road-number-shield',
          'road-exit-shield',
          'place-label',
          'place-label-sm',
          'place-label-md',
          'place-label-lg',
          'marine-label-sm',
          'marine-label-md',
          'marine-label-lg'
        ];

        layersToHide.forEach(layerId => {
          try {
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(layerId, 'visibility', 'none');
            }
          } catch (e) {
            // Ignore errors for layers that don't exist
          }
        });

        // Also hide all symbol layers (which contain text)
        const style = map.getStyle();
        if (style && style.layers) {
          style.layers.forEach(layer => {
            if (layer.type === 'symbol') {
              try {
                map.setLayoutProperty(layer.id, 'visibility', 'none');
              } catch (e) {
                // Ignore errors
              }
            }
          });
        }
      }, 500);
    }
  };

  const handleMarkerClick = (location: ExtendedLocation) => {
    if (!location) return;
    setSelectedLocation(location);
    setShowPopup(true);
  };

  // Mobile-optimized marker size
  const getMarkerSize = () => isMobile ? 20 : 16;
  const getMarkerPadding = () => isMobile ? 'p-3' : 'p-2';

  return (
    <div className="relative w-full h-full overflow-hidden transition-all duration-1000" style={{ backgroundColor: '#ffffff' }}>
      {/* Prevent zoom on double-tap */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ touchAction: 'pan-x pan-y' }}
      />

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
          touchAction: 'none' // Prevent iOS Safari zoom on touch
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        scrollZoom={isCtrlPressed || isFullscreen} // Enable zoom on scroll when Ctrl is held or in fullscreen
        dragRotate={!isMobile} // Disable rotation on mobile
        touchZoomRotate={!isMobile} // Disable touch zoom rotation on mobile
        minZoom={2}
        maxZoom={isMobile ? 4 : 5} // Lower max zoom on mobile
        doubleClickZoom={false} // Disable double-click zoom to prevent conflicts
        touchPitch={false} // Disable touch pitch on mobile
      >

        {/* Mobile-optimized controls */}
        {showControls && (
          <div className={`absolute ${isMobile ? 'bottom-2 right-2' : 'bottom-4 right-4'} flex flex-col gap-2 z-10`}>
            <NavigationControl showCompass={!isMobile} showZoom={true} />
            {!isMobile && <FullscreenControl />}
            <GeolocateControl
              trackUserLocation
              showUserHeading={!isMobile}
              showAccuracyCircle={!isMobile}
            />
          </div>
        )}

        {/* Route lines */}
        {routeGeoJson && mapLoaded && (
          <Source
            id="route"
            type="geojson"
            data={routeGeoJson}
          >
            <Layer {...mainRouteLayer} />
            {isReturn && <Layer {...returnRouteLayer} />}
          </Source>
        )}

        {/* Office Locations */}
        {showOfficeLocations && OFFICE_LOCATIONS.map((office) => (
          <Marker
            key={office.id}
            longitude={office.lng}
            latitude={office.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(office);
            }}
          >
            <div className="relative cursor-pointer group">
              <div className={`${getMarkerPadding()} bg-black rounded-lg shadow-lg transform transition-transform group-hover:scale-110`}>
                <Building2 size={getMarkerSize()} className="text-white" />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45" />
            </div>
          </Marker>
        ))}

        {/* Origin marker */}
        {validOrigin && (
          <Marker
            longitude={validOrigin.lng}
            latitude={validOrigin.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick({
                ...validOrigin,
                date: selectedDate,
                time: selectedTime
              });
            }}
          >
            <div className="relative cursor-pointer group">
              <div className={`${getMarkerPadding()} bg-blue-500 rounded-full shadow-lg transform transition-transform group-hover:scale-110`}>
                <MapPin size={getMarkerSize()} className="text-white" />
              </div>
            </div>
          </Marker>
        )}

        {/* Stop markers */}
        {validStops.map((stop, index) => (
          <Marker
            key={`stop-${index}`}
            longitude={stop.lng}
            latitude={stop.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(stop);
            }}
          >
            <div className="relative cursor-pointer group">
              <div className={`${getMarkerPadding()} ${LOCATION_COLORS[`stop${index + 1}` as keyof typeof LOCATION_COLORS] || LOCATION_COLORS.stop1} rounded-full shadow-lg transform transition-transform group-hover:scale-110`}>
                <MapPin size={getMarkerSize()} className="text-white" />
              </div>
            </div>
          </Marker>
        ))}

        {/* Destination marker */}
        {validDestination && (
          <Marker
            longitude={validDestination.lng}
            latitude={validDestination.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick({
                ...validDestination,
                date: selectedDate,
                time: selectedTime
              });
            }}
          >
            <div className="relative cursor-pointer group">
              <div className={`${getMarkerPadding()} bg-green-500 rounded-full shadow-lg transform transition-transform group-hover:scale-110`}>
                <MapPin size={getMarkerSize()} className="text-white" />
              </div>
            </div>
          </Marker>
        )}

        {/* Mobile-optimized location popup */}
        {showPopup && selectedLocation && (
          <Popup
            longitude={selectedLocation.lng}
            latitude={selectedLocation.lat}
            anchor="bottom"
            onClose={() => setShowPopup(false)}
            closeButton={false}
            closeOnClick={false}
            className="z-50"
            offset={isMobile ? 30 : 20}
            maxWidth={isMobile ? "280px" : "220px"}
          >
            <div className={`p-0 overflow-hidden rounded-lg shadow-lg bg-white/95 backdrop-blur-sm border border-gray-100 ${isMobile ? 'min-w-[260px]' : 'min-w-[220px]'}`}>
              <div className={`flex items-center justify-between bg-black text-white ${isMobile ? 'p-4' : 'p-3'}`}>
                <div className={`font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>
                  {selectedLocation.name || "Location Details"}
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className={`${isMobile ? 'p-2' : 'p-1'} hover:bg-gray-800 rounded-full transition-colors`}
                >
                  <X size={isMobile ? 20 : 16} />
                </button>
              </div>

              <div className={isMobile ? 'p-4' : 'p-3'}>
                {selectedLocation.name ? (
                  <>
                    <div className={`flex items-start gap-2 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                      <MapPinned size={isMobile ? 18 : 16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-600`}>{selectedLocation.address}</div>
                        <div className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-500`}>
                          {selectedLocation.city}, {selectedLocation.postcode}
                        </div>
                        <div className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-500`}>{selectedLocation.country}</div>
                      </div>
                    </div>

                    {selectedLocation.phone && (
                      <div className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-sm'} text-gray-600 ${isMobile ? 'mt-3' : 'mt-2'}`}>
                        <Phone size={isMobile ? 18 : 16} className="text-gray-500" />
                        <span>{selectedLocation.phone}</span>
                      </div>
                    )}

                    {selectedLocation.hours && (
                      <div className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-sm'} text-gray-600 ${isMobile ? 'mt-3' : 'mt-2'}`}>
                        <Clock size={isMobile ? 18 : 16} className="text-gray-500" />
                        <span>{selectedLocation.hours}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className={`font-medium text-gray-900 ${isMobile ? 'text-base' : 'text-sm'}`}>{selectedLocation.address}</div>
                    {selectedLocation.date && selectedLocation.time && (
                      <div className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-sm'} text-gray-600 ${isMobile ? 'mt-3' : 'mt-2'}`}>
                        <Clock size={isMobile ? 18 : 16} className="text-gray-500" />
                        <span>{format(new Date(`${selectedLocation.date}T${selectedLocation.time}`), 'PPp')}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

export default MapboxMap;