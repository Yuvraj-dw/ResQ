import type { Coordinates } from '../../types/common';

export interface ILocationService {
  getCurrentPosition(): Promise<Coordinates>;
  getDistanceBetween(point1: Coordinates, point2: Coordinates): number;
  watchPosition(callback: (coords: Coordinates) => void): () => void;
}

export class MockLocationService implements ILocationService {
  private mockLocation: Coordinates = {
    latitude: 23.2599,
    longitude: 77.4126,
  };

  async getCurrentPosition(): Promise<Coordinates> {
    return { ...this.mockLocation };
  }

  getDistanceBetween(point1: Coordinates, point2: Coordinates): number {
    const R = 6371;
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.latitude)) *
        Math.cos(this.toRad(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  watchPosition(callback: (coords: Coordinates) => void): () => void {
    callback({ ...this.mockLocation });
    const interval = setInterval(() => {
      const offset = () => (Math.random() - 0.5) * 0.001;
      callback({
        latitude: this.mockLocation.latitude + offset(),
        longitude: this.mockLocation.longitude + offset(),
      });
    }, 5000);

    return () => clearInterval(interval);
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export class ExpoLocationService implements ILocationService {
  async getCurrentPosition(): Promise<Coordinates> {
    try {
      const { Location } = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Location fetch failed';
      throw new Error(message);
    }
  }

  getDistanceBetween(point1: Coordinates, point2: Coordinates): number {
    const { Location } = require('expo-location');
    return Location.distanceBetween(
      point1.latitude,
      point1.longitude,
      point2.latitude,
      point2.longitude,
    );
  }

  watchPosition(callback: (coords: Coordinates) => void): () => void {
    let subscription: { remove: () => void };

    (async () => {
      const { Location } = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location: { coords: { latitude: number; longitude: number } }) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        },
      );
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }
}

export function createLocationService(): ILocationService {
  return new ExpoLocationService();
}
