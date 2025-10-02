import { Toaster, toast } from "sonner";
import { MapView } from "@/components/MapView";
import type { Location } from "@/types";
import { Route, BrowserRouter as Router, Routes } from "react-router";
import useGeolocation from "./hooks/useGeolocation";
import { useRoutePlanner } from "./hooks/useRoutePlanner";
import { useEffect, useMemo } from "react";
import RouteInput from "./components/RouteInput";

const basename = (import.meta.env.VITE_BASE_URL || "/") as string;

interface CoordDisplay {
  lat: string;
  lng: string;
}

export default function App() {
  const { currentLocation, error, isLoading } = useGeolocation();

  const {
    destinationPoint,
    routePolyline,
    isRouting,
    routeSummary,
    setDestinationPoint,
    handleMapClick,
  } = useRoutePlanner(currentLocation);

  const activeRoute = useMemo(() => {
    return routePolyline.map(
      ([lat, lng]) => ({ lat, lng, timestamp: Date.now() } as Location)
    );
  }, [routePolyline]);

  const startCoords: CoordDisplay = useMemo(
    () => ({
      lat: currentLocation ? currentLocation.lat.toFixed(6) : "N/A",
      lng: currentLocation ? currentLocation.lng.toFixed(6) : "N/A",
    }),
    [currentLocation]
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
                currentLocation={currentLocation}
                routePoints={activeRoute}
                className="absolute inset-0"
                onMapClick={handleMapClick}
              />

              {isRouting && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] p-4 bg-yellow-500/90 rounded-lg shadow-xl">
                  <p className="text-white font-bold animate-pulse">
                    Calculating Route...
                  </p>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white shadow-2xl z-[1000] border-t border-gray-200">
                <h3 className="text-lg font-bold mb-3 text-gray-800">
                  Route Planner
                </h3>

                {routeSummary && (
                  <div className="flex justify-between items-center mb-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800">
                      Distance: {routeSummary.distance}
                    </p>
                    <p className="text-sm font-semibold text-blue-800">
                      Time: {routeSummary.duration}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <RouteInput
                    title="Start (Your Location)"
                    lat={startCoords.lat}
                    lng={startCoords.lng}
                    isLoading={isLoading && !currentLocation}
                  />

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
