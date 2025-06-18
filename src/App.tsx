import { Toaster } from "sonner";
import { MapView } from "@/components/MapView";
import type { Location } from "@/types";
import type { PointTuple } from "leaflet";
import { Route, BrowserRouter as Router, Routes } from "react-router";

const basename = (import.meta.env.VITE_BASE_URL || "/") as string;

export const KOLOMNA_COORDS: PointTuple = [55.095276, 38.765574];
export const MOSCOW_COORDS: PointTuple = [55.7558, 37.6176];

const currentLocation: Location = {
  lat: KOLOMNA_COORDS[0],
  lng: KOLOMNA_COORDS[1],
  timestamp: 1662368000,
};

const routePoints: Location[] = [
  {
    lat: KOLOMNA_COORDS[0],
    lng: KOLOMNA_COORDS[1],
    timestamp: 1662368000,
  },
  {
    lat: MOSCOW_COORDS[0],
    lng: MOSCOW_COORDS[1],
    timestamp: 1662368000,
  },
];

const mockData = {
  currentLocation,
  routePoints,
  isTracking: true,
};

function App() {
  const { currentLocation, routePoints, isTracking } = mockData;

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
            </div>
          }
        />
      </Routes>
      <Toaster position="top-center" richColors closeButton />
    </Router>
  );
}

export default App;
