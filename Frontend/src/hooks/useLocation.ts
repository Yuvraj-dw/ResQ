import { useState, useEffect, useCallback } from 'react';
import type { Coordinates } from '../types/common';
import { createLocationService } from '../services/location/LocationService';

const locationService = createLocationService();

export function useLocation() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const coords = await locationService.getCurrentPosition();
      setCoordinates(coords);
      return coords;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const calculateDistance = useCallback((target: Coordinates): number => {
    if (!coordinates) return 0;
    return locationService.getDistanceBetween(coordinates, target) / 1000;
  }, [coordinates]);

  const watchLocation = useCallback((callback: (coords: Coordinates) => void) => {
    return locationService.watchPosition(callback);
  }, []);

  return {
    coordinates,
    error,
    isLoading,
    getLocation,
    calculateDistance,
    watchLocation,
  };
}
