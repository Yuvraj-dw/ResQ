import type { NotificationPayload, AppNotification } from '../../types/notification';
import { generateId } from '../../utils/formatters';
import { Platform } from 'react-native';

export interface INotificationService {
  requestPermissions(): Promise<boolean>;
  scheduleLocalNotification(payload: NotificationPayload): Promise<string>;
  getStoredNotifications(): Promise<AppNotification[]>;
  markAsRead(notificationId: string): Promise<void>;
  clearNotifications(): Promise<void>;
}

export class MockNotificationService implements INotificationService {
  private notifications: AppNotification[] = [];
  private permissionGranted = false;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      this.permissionGranted = true;
      return true;
    }
    this.permissionGranted = true;
    return this.permissionGranted;
  }

  async scheduleLocalNotification(payload: NotificationPayload): Promise<string> {
    const notification: AppNotification = {
      id: `notif_${generateId()}`,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      read: false,
      createdAt: new Date().toISOString(),
      emergencyId: payload.emergencyId,
    };

    this.notifications.unshift(notification);
    return notification.id;
  }

  async getStoredNotifications(): Promise<AppNotification[]> {
    return [...this.notifications];
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notif = this.notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.read = true;
    }
  }

  async clearNotifications(): Promise<void> {
    this.notifications = [];
  }
}

export class FcmNotificationService implements INotificationService {
  private notifications: AppNotification[] = [];
  private permissionGranted = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const { Notifications } = require('expo-notifications');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.permissionGranted = finalStatus === 'granted';

      if (this.permissionGranted) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
      }

      return this.permissionGranted;
    } catch {
      this.permissionGranted = false;
      return false;
    }
  }

  async scheduleLocalNotification(payload: NotificationPayload): Promise<string> {
    try {
      const { Notifications } = require('expo-notifications');
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
        },
        trigger: null,
      });

      const notification: AppNotification = {
        id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        read: false,
        createdAt: new Date().toISOString(),
        emergencyId: payload.emergencyId,
      };

      this.notifications.unshift(notification);
      return id;
    } catch {
      const mockService = new MockNotificationService();
      return mockService.scheduleLocalNotification(payload);
    }
  }

  async getStoredNotifications(): Promise<AppNotification[]> {
    return [...this.notifications];
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notif = this.notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.read = true;
    }
  }

  async clearNotifications(): Promise<void> {
    this.notifications = [];
  }
}

export function createNotificationService(): INotificationService {
  const useFcm = process.env.EXPO_PUBLIC_USE_FCM === 'true';
  return useFcm ? new FcmNotificationService() : new MockNotificationService();
}
