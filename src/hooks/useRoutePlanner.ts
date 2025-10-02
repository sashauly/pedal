import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Location } from "@/types";

// Define the OSRM base URL for the cycling profile
const OSRM_URL = "https://router.project-osrm.org/route/v1/cycling/";

// 1. OSRM API Response Interface
interface OSRMRouteResponse {
  code: string;
  routes: Array<{
    distance: number; // in meters
    duration: number; // in seconds
    geometry: {
      coordinates: [number, number][]; // [lng, lat] pairs
    };
  }>;
}

// 2. Hook Output Interface
interface RoutePlannerState {
  destinationPoint: Location | null;
  routePolyline: [number, number][];
  isRouting: boolean;
  routeSummary: { distance: string; duration: string } | null;
  setDestinationPoint: (location: Location | null) => void;
  handleMapClick: (location: Location) => void;
}

// 3. The Hook
export function useRoutePlanner(
  currentLocation: Location | null
): RoutePlannerState {
  const [destinationPoint, setDestinationPoint] = useState<Location | null>(
    null
  );
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [isRouting, setIsRouting] = useState(false);
  const [routeSummary, setRouteSummary] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  // --- ASYNC FUNCTION: Fetches the route from OSRM (memoized) ---
  const fetchRoute = useCallback(async (start: Location, end: Location) => {
    setIsRouting(true);
    setRoutePolyline([]);
    setRouteSummary(null);

    const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
    const url = `${OSRM_URL}${coordinates}?geometries=geojson&overview=full`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as OSRMRouteResponse;

      if (data.code === "Ok" && data.routes.length > 0) {
        const routeData = data.routes[0];
        const geojsonCoordinates = routeData.geometry.coordinates;

        // OSRM returns [lng, lat], Leaflet needs [lat, lng]
        const leafletPolyline: [number, number][] = geojsonCoordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );

        setRoutePolyline(leafletPolyline);

        // Update summary
        const distanceKm = (routeData.distance / 1000).toFixed(2);
        const durationMin = Math.round(routeData.duration / 60);

        setRouteSummary({
          distance: `${distanceKm} km`,
          duration: `${durationMin} min`,
        });
      } else {
        toast.error("Routing Failed", {
          description: "Could not find a route between the points.",
        });
        setRoutePolyline([]);
      }
    } catch (e) {
      console.error("OSRM API Error:", e);
      const errorMessage =
        e instanceof Error ? e.message : "An unknown routing error occurred.";
      toast.error("Routing Error", {
        description: `Network error: ${errorMessage}`,
      });
    } finally {
      setIsRouting(false);
    }
  }, []);

  // --- EFFECT: Trigger the API call when start or end points change ---
  useEffect(() => {
    if (currentLocation && destinationPoint) {
      // Use void to mark the promise as intentionally unawaited (ESLint rule)
      void fetchRoute(currentLocation, destinationPoint);
    } else {
      setRoutePolyline([]);
      setRouteSummary(null);
    }
  }, [currentLocation, destinationPoint, fetchRoute]);

  // --- Public Handler for Map Clicks ---
  const handleMapClick = useCallback((location: Location) => {
    setDestinationPoint(location);
    toast.success("Destination Set", {
      description: `Calculating route to Lat: ${location.lat.toFixed(
        4
      )}, Lng: ${location.lng.toFixed(4)}`,
    });
  }, []);

  return {
    destinationPoint,
    routePolyline,
    isRouting,
    routeSummary,
    setDestinationPoint, // Expose the setter for the "Clear" button
    handleMapClick, // Expose the click handler for MapView
  };
}
