import { Toaster, toast } from "sonner";
import { MapView } from "@/components/MapView";
import type { Location } from "@/types";
import type { PointTuple } from "leaflet";
import { Route, BrowserRouter as Router, Routes } from "react-router";
import useGeolocation from "./hooks/useGeolocation";
import { useEffect, useState } from "react";

const basename = (import.meta.env.VITE_BASE_URL || "/") as string;

export const MOSCOW_COORDS: PointTuple = [55.7558, 37.6176];

export default function App() {
  const {
    currentLocation,
    error,
    isLoading,
    isTracking,
    startTracking,
    stopTracking,
  } = useGeolocation();

  const [routePoints, setRoutePoints] = useState<Location[]>([]);

  useEffect(() => {
    if (error) {
      toast.error("Geolocation Error", { description: error });
    }
  }, [error]);

  useEffect(() => {
    if (currentLocation) {
      const startPoint: Location = currentLocation;

      const endPoint: Location = {
        lat: MOSCOW_COORDS[0],
        lng: MOSCOW_COORDS[1],
        timestamp: Date.now(),
      };

      setRoutePoints([startPoint, endPoint]);
    }
  }, [currentLocation]);

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
      toast.info("Tracking Stopped", {
        description: "Geolocation watch disabled.",
      });
    } else {
      startTracking();
      toast.success("Tracking Started", {
        description: "Attempting to acquire location.",
      });
    }
  };

  return (
    <Router basename={basename}>
      <Routes>
        <Route
          path="/"
          element={
            <div className="relative w-full h-screen overflow-hidden">
              <MapView
                currentLocation={currentLocation}
                routePoints={routePoints}
                isTracking={isTracking}
                className="absolute inset-0"
              />

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000]">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={handleToggleTracking}
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Loading GPS..."
                    : isTracking
                    ? "Stop Tracking"
                    : "Start Tracking"}
                </button>
              </div>
            </div>
          }
        />
      </Routes>
      <Toaster position="top-center" richColors closeButton />
    </Router>
  );
}
