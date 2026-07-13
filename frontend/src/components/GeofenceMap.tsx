"use client";

import { useMemo, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Circle, Marker } from "@react-google-maps/api";

interface GeofenceMapProps {
  lat: number;
  lng: number;
  radius: number;
  onChange?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  userLocation?: { lat: number; lng: number };
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

export default function GeofenceMap({ lat, lng, radius, onChange, readOnly, userLocation }: GeofenceMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyA3CzCZlkh_2xIEBnZTm2xDPaoN5N3pq_k",
  });

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!readOnly && onChange && e.latLng) {
      onChange(e.latLng.lat(), e.latLng.lng());
    }
  }, [readOnly, onChange]);

  if (!isLoaded) return <div className="grid h-full place-items-center text-sm text-slate-500">Loading Google Maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={16}
      onClick={onMapClick}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: true,
      }}
    >
      {/* Geofence Center Marker */}
      <Marker position={center} />
      
      {/* Radius Visualizer */}
      <Circle
        center={center}
        radius={radius}
        options={{
          fillColor: "#6366f1",
          fillOpacity: 0.35,
          strokeColor: "#6366f1",
          strokeWeight: 2,
        }}
      />

      {/* User's current location (e.g. Employee view) */}
      {userLocation && (
        <Circle
          center={userLocation}
          radius={5}
          options={{
            fillColor: "#34d399",
            fillOpacity: 1,
            strokeColor: "#34d399",
            strokeWeight: 2,
          }}
        />
      )}
    </GoogleMap>
  );
}
