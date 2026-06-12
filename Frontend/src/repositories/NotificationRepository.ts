import type { ApiResponse } from '../types/common';
import type { AppNotification } from '../types/notification';
import apiClient from '../services/api/ApiClient';

export interface INotificationRepository {
  getAll(): Promise<ApiResponse<AppNotification[]>>;
  markAsRead(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export class NotificationRepository implements INotificationRepository {
  async getAll(): Promise<ApiResponse<AppNotification[]>> {
    return apiClient.get<AppNotification[]>('/notifications/');
  }

  async markAsRead(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.patch<{ success: boolean }>(`/notifications/${id}`);
  }
}

export default new NotificationRepository();
