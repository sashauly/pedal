import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { Location } from "@/types";

// Define the OSRM base URL for the cycling profile
const OSRM_URL = "https://router.project-osrm.org/route/v1/cycling/";

interface OSRMRouteResponse {
  code: string;
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
}

type StartSource = "gps" | "custom" | "none";

interface RoutePlannerState {
  destinationPoint: Location | null;
  routePolyline: [number, number][];
  isRouting: boolean;
  routeSummary: { distance: string; duration: string } | null;
  startPoint: Location | null;
  startSource: StartSource;
  isRouteLocked: boolean;
  isSettingStartPoint: boolean;
  setDestinationPoint: (location: Location | null) => void;
  handleMapClick: (location: Location) => void;
  lockRoute: () => void;
  clearAllPoints: () => void;
  setGpsStartPoint: () => void;
  enterStartPointSelectionMode: () => void;
}

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

  const [startSource, setStartSource] = useState<StartSource>("none");
  const [customStartPoint, setCustomStartPoint] = useState<Location | null>(
    null
  );
  const [isRouteLocked, setIsRouteLocked] = useState(false);
  const [isSettingStartPoint, setIsSettingStartPoint] = useState(false);

  const startPoint = useMemo(() => {
    if (isRouteLocked && startSource === "custom") {
      return customStartPoint;
    }
    if (isRouteLocked && startSource === "gps") {
      return customStartPoint || currentLocation;
    }
    if (startSource === "custom") {
      return customStartPoint;
    }
    return currentLocation;
  }, [startSource, customStartPoint, currentLocation, isRouteLocked]);

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

        const leafletPolyline: [number, number][] = geojsonCoordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );

        setRoutePolyline(leafletPolyline);

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

  useEffect(() => {
    if (currentLocation && startSource === "none") {
      setStartSource("gps");
    }
  }, [currentLocation, startSource]);

  useEffect(() => {
    if (startPoint && destinationPoint) {
      void fetchRoute(startPoint, destinationPoint);
    } else {
      setRoutePolyline([]);
      setRouteSummary(null);
    }
  }, [startPoint, destinationPoint, fetchRoute]);

  const lockRoute = useCallback(() => {
    if (startPoint && destinationPoint) {
      if (startSource === "gps" && currentLocation) {
        setCustomStartPoint(currentLocation);
      }
      setIsRouteLocked(true);
      toast.info("Route Locked", {
        description: "Starting point is fixed for the duration of the ride.",
      });
    } else {
      toast.warning("Cannot Lock", {
        description: "Set a destination before locking the route.",
      });
    }
  }, [startPoint, destinationPoint, startSource, currentLocation]);

  const handleMapClick = useCallback(
    (location: Location) => {
      if (isSettingStartPoint) {
        setCustomStartPoint(location);
        setStartSource("custom");
        setIsSettingStartPoint(false);
        setIsRouteLocked(false);
        toast.success("Start Point Set", {
          description: "Route will begin from this clicked location.",
        });
        return;
      }

      setIsRouteLocked(false);
      setDestinationPoint(location);
      toast.success("Destination Set", {
        description: `Route start point is now defined by the selected source.`,
      });
    },
    [isSettingStartPoint]
  );

  const enterStartPointSelectionMode = useCallback(() => {
    setIsSettingStartPoint(true);
    toast.info("Selecting Start Point", {
      description: "Click anywhere on the map to set the starting location.",
    });
  }, []);

  const setGpsStartPoint = useCallback(() => {
    setStartSource("gps");
    setCustomStartPoint(null);
    setIsSettingStartPoint(false);
    setIsRouteLocked(false);
    toast.info("Start Source Changed", {
      description: "Route start point is following your current GPS location.",
    });
  }, []);

  const setDestinationPointAndUnlock = useCallback(
    (location: Location | null) => {
      setDestinationPoint(location);
      setIsRouteLocked(false);
    },
    []
  );

  const clearAllPoints = useCallback(() => {
    setDestinationPoint(null);
    setCustomStartPoint(null);
    setStartSource("gps");
    setIsRouteLocked(false);
    setIsSettingStartPoint(false);
    toast.info("Cleared", {
      description: "All planning points have been reset.",
    });
  }, []);

  return {
    destinationPoint,
    routePolyline,
    isRouting,
    routeSummary,
    setDestinationPoint: setDestinationPointAndUnlock,
    handleMapClick,
    lockRoute,
    clearAllPoints,
    setGpsStartPoint,
    enterStartPointSelectionMode,
    startPoint,
    startSource,
    isRouteLocked,
    isSettingStartPoint,
  };
}
