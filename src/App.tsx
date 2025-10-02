import { Toaster, toast } from "sonner";
import { MapView } from "@/components/MapView";
import type { Location } from "@/types";
import { Route, BrowserRouter as Router, Routes } from "react-router";
import useGeolocation from "./hooks/useGeolocation";
import { useEffect, useState, useMemo } from "react";
import RouteInput from "./components/RouteInput";

const basename = (import.meta.env.VITE_BASE_URL || "/") as string;

interface CoordDisplay {
  lat: string;
  lng: string; 
}

export default function App() {
  const { currentLocation, error, isTracking, isLoading } = useGeolocation();

  const [destinationPoint, setDestinationPoint] = useState<Location | null>(
    null
  );

  const activeRoute = useMemo(() => {
    const route: Location[] = [];
    if (currentLocation) {
      route.push(currentLocation);
    }
    if (destinationPoint) {
      route.push(destinationPoint);
    }
    return route;
  }, [currentLocation, destinationPoint]);

  const handleMapClick = (location: Location) => {
    setDestinationPoint(location);
    // TODO remove toast
    toast.success("Destination Set", {
      description: `Lat: ${location.lat.toFixed(
        4
      )}, Lng: ${location.lng.toFixed(4)}`,
    });
  };

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
                isTracking={isTracking}
                className="absolute inset-0"
                onMapClick={handleMapClick}
              />

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white shadow-2xl z-[1000] border-t border-gray-200">
                <h3 className="text-lg font-bold mb-3 text-gray-800">
                  Route Planner
                </h3>

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
