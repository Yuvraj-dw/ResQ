export type NotificationType = 'emergency' | 'help_response' | 'info' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  emergencyId?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  type: NotificationType;
  emergencyId?: string;
}
