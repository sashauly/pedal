// src/hooks/useThrottledLocation.ts

import { useState, useEffect } from 'react';
import type { Location } from '@/types';

/**
 * Throttles location updates to prevent frequent component re-renders and excessive API calls.
 * * @param location The raw location received from useGeolocation.
 * @param intervalMs The minimum time interval (in milliseconds) between updates. Default is 3000ms (3 seconds).
 * @returns The throttled Location object.
 */
export function useThrottledLocation(location: Location | null, intervalMs: number = 3000): Location | null {
  const [throttledLocation, setThrottledLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (!location) return;

    // Set the initial location immediately
    if (!throttledLocation) {
      setThrottledLocation(location);
      return;
    }

    // Set a timer to update the location after the specified interval
    const timer = setTimeout(() => {
      // If the timer fires, update the throttled location to the latest raw location
      setThrottledLocation(location);
    }, intervalMs);

    // Cleanup: If a new raw location comes in before the timer fires, 
    // clear the previous timer. This is the throttling mechanism.
    return () => clearTimeout(timer);

  }, [location, intervalMs, throttledLocation]);

  return throttledLocation;
}