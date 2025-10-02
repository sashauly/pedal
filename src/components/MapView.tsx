// START: Preserve spaces to avoid auto-sorting
import "leaflet/dist/leaflet.css";

import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";

import "leaflet-defaulticon-compatibility";
// END: Preserve spaces to avoid auto-sorting

import { useEffect, useState, useCallback } from "react";
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
import { MapControls } from "./MapControls";
import { toast } from "sonner";

const DEFAULT_CENTER: PointTuple = [55.751244, 37.618423]; // Moscow, Russia
const DEFAULT_ZOOM = 13;
const CENTER_ZOOM = 16;

interface MapViewProps {
  currentLocation: Location | null;
  routePoints: Location[];
  isTracking: boolean;
  onMapClick: (location: Location) => void;
  className?: string;
}

function MapEventHandler({
  onMapClick,
}: {
  onMapClick: (location: Location) => void;
}) {
  useMapEvents({
    click: (e) => {
      const location: Location = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        timestamp: Date.now(),
      };
      onMapClick(location);
    },
  });

  return null;
}

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
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.5,
      });
    }
  }, [map, center, zoom]);

  return null;
}

export function MapView({
  currentLocation,
  routePoints,
  isTracking,
  onMapClick,
  className,
}: MapViewProps) {
  const [mapRef, setMapRef] = useState<LeafletMap | null>(null);
  const [mapCenter, setMapCenter] = useState<PointTuple>(DEFAULT_CENTER);
  const [shouldCenter, setShouldCenter] = useState(false);
  const [hasInitialCentered, setHasInitialCentered] = useState(false);

  console.log(isTracking);

  const handleMapReady = (map: LeafletMap) => {
    setMapRef(map);
  };

  useEffect(() => {
    if (currentLocation) {
      const newCenter: PointTuple = [currentLocation.lat, currentLocation.lng];
      setMapCenter(newCenter);

      if (!hasInitialCentered) {
        setShouldCenter(true);
        setHasInitialCentered(true);
      }
    }
  }, [currentLocation, hasInitialCentered]);

  useEffect(() => {
    if (shouldCenter) {
      const timer = setTimeout(() => setShouldCenter(false), 100);
      return () => clearTimeout(timer);
    }
  }, [shouldCenter]);

  const handleUserCenter = useCallback(() => {
    if (!currentLocation) {
      toast.error("Error", {
        description:
          "Current location not available. Please ensure location services are enabled.",
      });
      return;
    }

    setShouldCenter(true);

    toast.success("Current Location", {
      description: "Map centered on your current location.",
    });
  }, [currentLocation]);

  // Create polyline points from route
  const polylinePoints: [number, number][] = routePoints.map((point) => [
    point.lat,
    point.lng,
  ]);

  // TODO change the icon
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
        zoom={DEFAULT_ZOOM}
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

        {routePoints.length === 2 && routePoints[1] && (
          <Marker
            position={[routePoints[1].lat, routePoints[1].lng]}
            icon={
              // TODO change the icon
              new Icon({
                iconUrl:
                  "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Placeholder pin icon
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              })
            }
          />
        )}

        {/* Map event handlers */}
        <MapEventHandler onMapClick={onMapClick} />

        {shouldCenter && <MapCenter center={mapCenter} zoom={CENTER_ZOOM} />}
      </MapContainer>

      {/* Map Controls */}
      {mapRef && (
        <MapControls
          map={mapRef}
          onCenterLocation={handleUserCenter}
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
