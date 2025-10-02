import { useState, useEffect } from "react";
import type { Location } from "@/types";

type PermissionStatus = "prompt" | "granted" | "denied" | "unavailable";

interface GeolocationState {
  currentLocation: Location | null;
  error: string | null;
  isLoading: boolean;
  isTracking: boolean;
  permissionStatus: PermissionStatus;
  startTracking: () => void;
  stopTracking: () => void;
}

interface Position {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number | null;
  };
  timestamp: number;
}

const useGeolocation = (): GeolocationState => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("unavailable");
  const [watchId, setWatchId] = useState<number | null>(null);

  const handleSuccess = (position: Position) => {
    setIsLoading(false);
    setError(null);
    setCurrentLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: position.timestamp,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || 0,
    });
  };

  const handleError = (err: GeolocationPositionError) => {
    setIsLoading(false);
    setIsTracking(false);
    let errorMessage = "";

    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage =
          "Location access denied. Please enable location services.";
        setPermissionStatus("denied");
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = "Location information is unavailable.";
        break;
      case err.TIMEOUT:
        errorMessage = "Location request timed out.";
        break;
      default:
        errorMessage = "An unknown geolocation error occurred.";
    }
    setError(errorMessage);
    console.error("Geolocation Error:", err);
  };

  useEffect(() => {
    if ("geolocation" in navigator && navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (result.state === "granted") {
            setPermissionStatus("granted");
          } else if (result.state === "denied") {
            setPermissionStatus("denied");
          } else {
            setPermissionStatus("prompt");
          }

          result.onchange = () => {
            setPermissionStatus(result.state as PermissionStatus);
          };
        })
        .catch(() => {
          setPermissionStatus("prompt");
        });
    }
  }, []);

  const startTracking = () => {
    if (permissionStatus === "denied") {
      setError(
        "Location access is denied. Please enable it in your device settings."
      );
      return;
    }

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
    setWatchId(id);
    setIsTracking(true);
    setIsLoading(true);

    setPermissionStatus("granted");
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  useEffect(() => {
    if (permissionStatus === "granted" || permissionStatus === "prompt") {
      startTracking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionStatus]);

  return {
    currentLocation,
    error,
    isLoading,
    isTracking,
    permissionStatus,
    startTracking,
    stopTracking,
  };
};

export default useGeolocation;
