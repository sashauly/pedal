// src/components/MapView.tsx

// START: Preserve spaces to avoid auto-sorting
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "leaflet-defaulticon-compatibility";
// END: Preserve spaces to avoid auto-sorting

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  Icon,
  Map as LeafletMap,
  type PointTuple,
  latLngBounds,
  type LatLngExpression,
} from "leaflet";
import type { Location } from "@/types";
import { cn } from "@/lib/utils";
import { MapControls } from "./MapControls";
import { toast } from "sonner";

const DEFAULT_CENTER: PointTuple = [55.751244, 37.618423]; // Moscow, Russia
const DEFAULT_ZOOM = 13;
const CENTER_ZOOM = 16;

// --- CUSTOM ICONS ---

// 1. Current Location (Blue Dot) Icon - Using DivIcon for smoother pulse/look
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
});

// 2. Start Point (Bicycle Icon)
const startPointIcon = new Icon({
  // Use a simple bicycle SVG (Ensure public/bicycle-start.svg exists or use an inline SVG)
  // For this example, we'll use an inline simplified bicycle for robustness:
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike-icon lucide-bike"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// 3. Destination Point (Red Pin - Simple marker)
const destinationIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#EF4444" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// --- COMPONENT PROPS ---

interface MapViewProps {
  currentLocation: Location | null;
  routePoints: Location[];
  onMapClick: (location: Location) => void;
  className?: string;
  startPoint: Location | null;
  destinationPoint: Location | null;
  isSettingStartPoint: boolean;
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
  onMapClick,
  className,
  startPoint,
  destinationPoint,
  isSettingStartPoint,
}: MapViewProps) {
  console.log(
    isSettingStartPoint
      ? "Map Click Mode: Setting Start Point"
      : "Map Click Mode: Setting Destination Point"
  );
  const [mapRef, setMapRef] = useState<LeafletMap | null>(null);
  const [mapCenter, setMapCenter] = useState<PointTuple>(DEFAULT_CENTER);
  const [shouldCenter, setShouldCenter] = useState(false);
  const [hasInitialCentered, setHasInitialCentered] = useState(false);

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

  useEffect(() => {
    if (!mapRef) return;

    if (routePoints.length > 1) {
      const latLngs = routePoints.map(
        (p) => [p.lat, p.lng] as LatLngExpression
      );
      const bounds = latLngBounds(latLngs);
      mapRef.fitBounds(bounds, { padding: [50, 50] });
    } else if (startPoint && destinationPoint) {
      const bounds = latLngBounds([
        [startPoint.lat, startPoint.lng],
        [destinationPoint.lat, destinationPoint.lng],
      ]);
      mapRef.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routePoints, startPoint, destinationPoint, mapRef]);

  const polylinePoints: [number, number][] = useMemo(
    () => routePoints.map((point) => [point.lat, point.lng]),
    [routePoints]
  );

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

        {startPoint && (
          <Marker
            position={[startPoint.lat, startPoint.lng]}
            icon={startPointIcon}
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

        {/* Destination Marker */}
        {destinationPoint && (
          <Marker
            position={[destinationPoint.lat, destinationPoint.lng]}
            icon={destinationIcon}
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
