import React, { useState, useEffect, useRef } from 'react';
import Map, {
  Source,
  Layer,
  Marker,
  NavigationControl,
  MapRef
} from 'react-map-gl';
import { MapPin, Plane } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RoutePreviewMapProps {
  origin: { lat: number; lng: number; name: string; city: string; country: string } | null;
  destination: { lat: number; lng: number; name: string; city: string; country: string } | null;
  className?: string;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoicHJpdmF0ZWNoYXJ0ZXJ4IiwiYSI6ImNtN2Z4empwNzA2Z2wyanM3NWN2Znpmbm4ifQ.nuvmpND_qtdsauY-n8F_9g';

const initialViewState = {
  longitude: 10.0,
  latitude: 51.0,
  zoom: 2,
  pitch: 0,
  bearing: 0
};

function RoutePreviewMap({ origin, destination, className = '' }: RoutePreviewMapProps) {
  const [viewState, setViewState] = useState(initialViewState);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // Calculate route line
  const routeGeoJson = React.useMemo(() => {
    if (!origin || !destination) return null;

    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { type: 'route' },
        geometry: {
          type: 'LineString',
          coordinates: [[origin.lng, origin.lat], [destination.lng, destination.lat]]
        }
      }]
    };
  }, [origin, destination]);

  // Update view state when locations change
  useEffect(() => {
    if (origin && destination && mapLoaded) {
      try {
        const bounds = {
          minLng: Math.min(origin.lng, destination.lng),
          maxLng: Math.max(origin.lng, destination.lng),
          minLat: Math.min(origin.lat, destination.lat),
          maxLat: Math.max(origin.lat, destination.lat)
        };

        const centerLng = (bounds.minLng + bounds.maxLng) / 2;
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;
        const dLng = Math.abs(bounds.maxLng - bounds.minLng);
        const dLat = Math.abs(bounds.maxLat - bounds.minLat);
        const maxDiff = Math.max(dLng, dLat);

        // Calculate zoom level for the route
        const zoom = Math.min(Math.max(1, 6 - Math.log2(maxDiff)), 4);

        setTimeout(() => {
          setViewState({
            longitude: centerLng,
            latitude: centerLat,
            zoom,
            pitch: 0,
            bearing: 0
          });
        }, 100);
      } catch (error) {
        console.error('Error updating route preview map:', error);
      }
    }
  }, [origin, destination, mapLoaded]);

  const routeLayer = {
    id: 'route-line',
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#000000',
      'line-width': 2,
      'line-opacity': 1
    }
  } as const;

  // Calculate midpoint for airplane icon
  const midpoint = React.useMemo(() => {
    if (!origin || !destination) return null;
    return {
      lng: (origin.lng + destination.lng) / 2,
      lat: (origin.lat + destination.lat) / 2
    };
  }, [origin, destination]);

  // Calculate bearing (direction) from origin to destination (simplified for flat projection)
  const bearing = React.useMemo(() => {
    if (!origin || !destination) return 0;
    const deltaLng = destination.lng - origin.lng;
    const deltaLat = destination.lat - origin.lat;
    // Calculate angle in degrees, adjusted for map orientation
    const angle = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
    return angle;
  }, [origin, destination]);

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  if (!origin || !destination) {
    return (
      <div className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Route preview unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 ${className}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        style={{
          width: '100%',
          height: '100%'
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        scrollZoom={true}
        dragRotate={true}
        touchZoomRotate={true}
        doubleClickZoom={true}
        touchPitch={true}
        dragPan={true}
        interactive={true}
      >
        {/* Route line */}
        {routeGeoJson && mapLoaded && (
          <Source
            id="route"
            type="geojson"
            data={routeGeoJson}
          >
            <Layer {...routeLayer} />
          </Source>
        )}

        {/* Origin marker */}
        <Marker
          longitude={origin.lng}
          latitude={origin.lat}
          anchor="center"
        >
          <div className="relative">
            <div className="p-1.5 bg-blue-500 rounded-full shadow-md">
              <MapPin size={14} className="text-white" />
            </div>
          </div>
        </Marker>

        {/* Destination marker */}
        <Marker
          longitude={destination.lng}
          latitude={destination.lat}
          anchor="center"
        >
          <div className="relative">
            <div className="p-1.5 bg-green-500 rounded-full shadow-md">
              <MapPin size={14} className="text-white" />
            </div>
          </div>
        </Marker>

        {/* Airplane icon at midpoint */}
        {midpoint && (
          <Marker
            longitude={midpoint.lng}
            latitude={midpoint.lat}
            anchor="center"
          >
            <div style={{
              transform: `rotate(${bearing}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l8 10h-6v10h-4V12H4l8-10z" fill="black" />
              </svg>
            </div>
          </Marker>
        )}

        {/* Minimal controls */}
        <div className="absolute bottom-2 right-2">
          <NavigationControl showCompass={false} showZoom={true} />
        </div>
      </Map>
    </div>
  );
}

export default RoutePreviewMap;