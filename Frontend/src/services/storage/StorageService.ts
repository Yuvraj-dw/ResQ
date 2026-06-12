import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '../../types/profile';
import type { EmergencyRequest } from '../../types/emergency';
import type { AppNotification } from '../../types/notification';
import type { PendingRequest } from '../../types/common';
import { STORAGE_KEYS } from '../../utils/constants';

export interface IStorageService {
  getUserProfile(): Promise<UserProfile | null>;
  setUserProfile(profile: UserProfile): Promise<void>;
  clearUserProfile(): Promise<void>;
  getPendingRequests(): Promise<PendingRequest[]>;
  addPendingRequest(request: PendingRequest): Promise<void>;
  removePendingRequest(id: string): Promise<void>;
  clearPendingRequests(): Promise<void>;
  getNotificationHistory(): Promise<AppNotification[]>;
  setNotificationHistory(notifications: AppNotification[]): Promise<void>;
  addNotification(notification: AppNotification): Promise<void>;
  getEmergencyHistory(): Promise<EmergencyRequest[]>;
  setEmergencyHistory(emergencies: EmergencyRequest[]): Promise<void>;
  addEmergency(emergency: EmergencyRequest): Promise<void>;
  getOnboardingStatus(): Promise<boolean>;
  setOnboardingStatus(completed: boolean): Promise<void>;
  clearAll(): Promise<void>;
}

class StorageService implements IStorageService {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async setUserProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  }

  async clearUserProfile(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  }

  async getPendingRequests(): Promise<PendingRequest[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_REQUESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async addPendingRequest(request: PendingRequest): Promise<void> {
    const requests = await this.getPendingRequests();
    requests.push(request);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_REQUESTS, JSON.stringify(requests));
  }

  async removePendingRequest(id: string): Promise<void> {
    const requests = await this.getPendingRequests();
    const filtered = requests.filter((r) => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_REQUESTS, JSON.stringify(filtered));
  }

  async clearPendingRequests(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_REQUESTS);
  }

  async getNotificationHistory(): Promise<AppNotification[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async setNotificationHistory(notifications: AppNotification[]): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFICATION_HISTORY,
      JSON.stringify(notifications),
    );
  }

  async addNotification(notification: AppNotification): Promise<void> {
    const notifications = await this.getNotificationHistory();
    notifications.unshift(notification);
    await this.setNotificationHistory(notifications);
  }

  async getEmergencyHistory(): Promise<EmergencyRequest[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async setEmergencyHistory(emergencies: EmergencyRequest[]): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.EMERGENCY_HISTORY,
      JSON.stringify(emergencies),
    );
  }

  async addEmergency(emergency: EmergencyRequest): Promise<void> {
    const emergencies = await this.getEmergencyHistory();
    emergencies.unshift(emergency);
    await this.setEmergencyHistory(emergencies);
  }

  async getOnboardingStatus(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return data === 'true';
    } catch {
      return false;
    }
  }

  async setOnboardingStatus(completed: boolean): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      completed.toString(),
    );
  }

  async clearAll(): Promise<void> {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  }
}

const storageService = new StorageService();
export default storageService;
