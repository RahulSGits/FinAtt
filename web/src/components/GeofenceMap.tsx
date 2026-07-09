"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon paths in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface GeofenceMapProps {
  lat: number;
  lng: number;
  radius: number;
  onChange?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  userLocation?: { lat: number; lng: number };
}

function MapEvents({ onChange, readOnly }: { onChange?: (lat: number, lng: number) => void; readOnly?: boolean }) {
  useMapEvents({
    click(e) {
      if (!readOnly && onChange) {
        onChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function GeofenceMap({ lat, lng, radius, onChange, readOnly, userLocation }: GeofenceMapProps) {
  const position: [number, number] = [lat, lng];

  return (
    <MapContainer
      center={position}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Normal View">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite View">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MapEvents onChange={onChange} readOnly={readOnly} />
      <MapController center={position} />
      
      {/* Visual Marker */}
      <Marker position={position} />
      
      {/* Radius Visualizer */}
      <Circle
        center={position}
        radius={radius}
        pathOptions={{
          color: "#6366f1",
          fillColor: "#6366f1",
          fillOpacity: 0.35,
          weight: 2,
        }}
      />

      {/* User's current location (e.g. Employee view) */}
      {userLocation && (
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={5}
          pathOptions={{
            color: "#34d399",
            fillColor: "#34d399",
            fillOpacity: 1,
            weight: 2,
          }}
        />
      )}
    </MapContainer>
  );
}
