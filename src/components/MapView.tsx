// START: Preserve spaces to avoid auto-sorting
import "leaflet/dist/leaflet.css";

import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";

import "leaflet-defaulticon-compatibility";
// END: Preserve spaces to avoid auto-sorting

import { useRef, useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Icon, Map as LeafletMap, type PointTuple } from "leaflet";
import type { Location } from "@/types";
import { cn } from "@/lib/utils";
import { KOLOMNA_COORDS } from "@/App";
import { MapControls } from "./MapControls";
import { toast } from "sonner";

interface MapViewProps {
  currentLocation: Location | null;
  routePoints: Location[];
  isTracking: boolean;
  className?: string;
}

// Custom hook to handle map events
function MapEventHandler({
  onMapClick,
  onLocationCenter,
  currentLocation,
}: {
  onMapClick?: (location: Location) => void;
  onLocationCenter?: () => void;
  currentLocation: Location | null;
}) {
  const map = useMap();

  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        const location: Location = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          timestamp: Date.now(),
        };
        onMapClick(location);
      }
    },
  });

  // Center map on current location when requested
  useEffect(() => {
    if (currentLocation && onLocationCenter) {
      map.setView([currentLocation.lat, currentLocation.lng], 16);
    }
  }, [map, currentLocation, onLocationCenter]);

  return null;
}

// Component to update map center
function MapCenter({
  center,
  zoom,
}: {
  center: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [map, center, zoom]);

  return null;
}

export function MapView({
  currentLocation,
  routePoints,
  isTracking,
  className,
}: MapViewProps) {
  const [mapRef, setMapRef] = useState<LeafletMap | null>(null);
  const mapContainerRef = useRef<LeafletMap | null>(null);
  const [mapCenter, setMapCenter] = useState<PointTuple>(KOLOMNA_COORDS);
  const [shouldCenter, setShouldCenter] = useState(false);

  console.log(isTracking);

  const handleMapReady = (map: LeafletMap) => {
    setMapRef(map);
    mapContainerRef.current = map;
  };

  // Update map center when current location changes
  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.lat, currentLocation.lng]);
    }
  }, [currentLocation]);

  const handleMapClick = (location: Location) => {
    // Handle tap-and-hold for setting destinations
    console.log("Map clicked:", location);
  };

  const handleCenterLocation =
    // async
    useCallback(() => {
      try {
        if (!currentLocation) {
          // await getCurrentPosition();
        }
        toast.success("Местоположение", {
          description: "Карта центрирована на вашем местоположении",
        });
      } catch {
        toast.error("Ошибка", {
          description: "Не удалось определить местоположение",
        });
      }
    }, [currentLocation]);

  // Handle location centering
  const handleLocationCenter = useCallback(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.lat, currentLocation.lng]);
      setShouldCenter(true);
      setTimeout(() => setShouldCenter(false), 100);
    }
    handleCenterLocation?.();
  }, [currentLocation, handleCenterLocation]);

  // Create polyline points from route
  const polylinePoints: [number, number][] = routePoints.map((point) => [
    point.lat,
    point.lng,
  ]);

  // Create current location icon
  const currentLocationIcon = new Icon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#ffffff" stroke-width="3"/>
        <circle cx="12" cy="12" r="3" fill="#ffffff"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

  return (
    <div className={cn("relative w-full h-full", className)}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="w-full h-full z-0"
        zoomControl={false}
        ref={handleMapReady}
        preferCanvas={true}
        tapTolerance={15}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          tileSize={256}
          updateWhenIdle={false}
          keepBuffer={4}
        />

        {/* Current location marker */}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={currentLocationIcon}
          />
        )}

        {/* Route polyline */}
        {polylinePoints.length > 1 && (
          <Polyline
            positions={polylinePoints}
            color="#3B82F6"
            weight={4}
            opacity={0.8}
            smoothFactor={1}
          />
        )}

        {/* Map event handlers */}
        <MapEventHandler
          onMapClick={handleMapClick}
          onLocationCenter={handleLocationCenter}
          currentLocation={currentLocation}
        />

        {/* Center map when needed */}
        {shouldCenter && <MapCenter center={mapCenter} zoom={16} />}
      </MapContainer>

      {/* Map Controls */}
      {mapRef && (
        <MapControls
          map={mapRef}
          onCenterLocation={handleCenterLocation}
          // onDownloadRegion={() => setShowRegionDownload(true)}
          // onSettings={() => setShowSettings(true)}
        />
      )}

      {/* Map controls overlay */}
      {/* <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-3 h-3 rounded-full",
                isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"
              )}
            />
            <span className="text-sm font-medium">
              {isTracking ? "Трекинг активен" : "Трекинг остановлен"}
            </span>
          </div>
        </div>

        {currentLocation && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <div className="text-xs text-gray-600">
              GPS точность:{" "}
              {currentLocation.accuracy
                ? `${Math.round(currentLocation.accuracy)}м`
                : "Н/Д"}
            </div>
            {currentLocation.speed && (
              <div className="text-xs text-gray-600">
                Скорость: {(currentLocation.speed * 3.6).toFixed(1)} км/ч
              </div>
            )}
          </div>
        )}
      </div> */}
    </div>
  );
}
