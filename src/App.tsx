import { Toaster, toast } from "sonner";
import { MapView } from "@/components/MapView";
import type { Location } from "@/types";
import { Route, BrowserRouter as Router, Routes } from "react-router";
import useGeolocation from "./hooks/useGeolocation";
import { useRoutePlanner } from "./hooks/useRoutePlanner";
import { useThrottledLocation } from "./hooks/useThrottledLocation";
import { useEffect, useMemo, useCallback } from "react";
import RouteInput from "./components/RouteInput";

const basename = (import.meta.env.VITE_BASE_URL || "/") as string;

interface CoordDisplay {
  lat: string;
  lng: string;
}

export default function App() {
  const {
    currentLocation: rawLocation,
    error,
    isLoading,
    permissionStatus,
  } = useGeolocation();

  const throttledLocation = useThrottledLocation(rawLocation, 3000);

  const {
    destinationPoint,
    routePolyline,
    isRouting,
    routeSummary,
    setDestinationPoint,
    handleMapClick: hookHandleMapClick,
    startPoint,
    isRouteLocked,
    lockRoute,
    startSource,
    isSettingStartPoint,
    setGpsStartPoint,
    enterStartPointSelectionMode,
    clearAllPoints,
  } = useRoutePlanner(throttledLocation);

  const isPermissionDenied = permissionStatus === "denied";

  const handleMapClick = useCallback(
    (location: Location) => {
      if (isPermissionDenied) {
        toast.warning("Cannot Plan Route", {
          description:
            "Location access is denied. Please enable it to set a destination.",
        });
        return;
      }
      hookHandleMapClick(location);
    },
    [isPermissionDenied, hookHandleMapClick]
  );

  const activeRoute = useMemo(() => {
    return routePolyline.map(
      ([lat, lng]) => ({ lat, lng, timestamp: Date.now() } as Location)
    );
  }, [routePolyline]);

  const startCoords: CoordDisplay = useMemo(
    () => ({
      lat: startPoint ? startPoint.lat.toFixed(6) : "N/A",
      lng: startPoint ? startPoint.lng.toFixed(6) : "N/A",
    }),
    [startPoint]
  );

  const endCoords: CoordDisplay = useMemo(
    () => ({
      lat: destinationPoint ? destinationPoint.lat.toFixed(6) : "Click Map",
      lng: destinationPoint ? destinationPoint.lng.toFixed(6) : "to set End",
    }),
    [destinationPoint]
  );

  useEffect(() => {
    if (error) {
      toast.error("Geolocation Error", { description: error });
    }
  }, [error]);

  return (
    <Router basename={basename}>
      <Routes>
        <Route
          path="/"
          element={
            <div className="relative w-full h-screen overflow-hidden">
              <MapView
                currentLocation={rawLocation}
                routePoints={activeRoute}
                className="absolute inset-0"
                onMapClick={handleMapClick}
                startPoint={startPoint}
                destinationPoint={destinationPoint}
                isSettingStartPoint={isSettingStartPoint}
              />

              {isPermissionDenied && (
                <div className="absolute inset-0 z-[2500] bg-black/70 flex items-center justify-center p-8">
                  <div className="bg-white p-6 rounded-lg shadow-2xl text-center">
                    <h4 className="text-xl font-bold text-red-600 mb-2">
                      Location Required
                    </h4>
                    <p className="text-gray-700">
                      Please enable geolocation access in your device settings
                      to plan a route.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      The map is currently disabled.
                    </p>
                  </div>
                </div>
              )}

              {isRouting && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] p-4 bg-yellow-500/90 rounded-lg shadow-xl">
                  <p className="text-white font-bold animate-pulse">
                    Calculating Route...
                  </p>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white shadow-2xl z-[1000] border-t border-gray-200">
                <h3 className="text-lg font-bold mb-3 text-gray-800 flex justify-between items-center">
                  Route Planner
                  <button
                    onClick={clearAllPoints}
                    className="text-sm text-red-500 hover:text-red-700 font-semibold"
                  >
                    Clear All
                  </button>
                </h3>

                {routeSummary && (
                  <div className="flex justify-between items-center mb-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800">
                      Distance: {routeSummary.distance}
                    </p>
                    <p className="text-sm font-semibold text-blue-800">
                      Time: {routeSummary.duration}
                    </p>

                    <button
                      onClick={lockRoute}
                      disabled={isRouteLocked}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                        isRouteLocked
                          ? "bg-green-500 text-white cursor-default"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {isRouteLocked ? "Route Locked" : "Lock Route"}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={setGpsStartPoint}
                        disabled={startSource === "gps"}
                        className={`w-full p-2 rounded-lg text-sm font-semibold transition-colors ${
                          startSource === "gps"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        }`}
                      >
                        Use GPS (Current)
                      </button>
                      <button
                        onClick={enterStartPointSelectionMode}
                        disabled={isSettingStartPoint}
                        className={`w-full p-2 rounded-lg text-sm font-semibold transition-colors ${
                          isSettingStartPoint
                            ? "bg-yellow-100 text-yellow-800 animate-pulse border border-yellow-300"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        }`}
                      >
                        {isSettingStartPoint
                          ? "Click Map..."
                          : "Set by Map Click"}
                      </button>
                    </div>
                    <RouteInput
                      title={`Start (${
                        startSource === "custom" ? "Custom" : "GPS"
                      } ${isRouteLocked ? "FIXED" : "Active"})`}
                      lat={startCoords.lat}
                      lng={startCoords.lng}
                      isLoading={isLoading && startSource === "gps"}
                    />
                  </div>
                  <RouteInput
                    title="End (Clicked Destination)"
                    lat={endCoords.lat}
                    lng={endCoords.lng}
                    isEnd={true}
                    onClear={() => setDestinationPoint(null)}
                  />
                </div>
              </div>
            </div>
          }
        />
      </Routes>
      <Toaster position="top-center" richColors closeButton />
    </Router>
  );
}
