import type { ApiResponse } from '../types/common';
import type { AppNotification } from '../types/notification';
import env from '../config/env';
import apiClient from '../services/api/ApiClient';
import mockApiClient from '../services/api/MockApiClient';

export interface INotificationRepository {
  getAll(): Promise<ApiResponse<AppNotification[]>>;
  markAsRead(id: string): Promise<ApiResponse<{ success: boolean }>>;
  markAllAsRead(): Promise<ApiResponse<{ success: boolean }>>;
  delete(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export class NotificationRepository implements INotificationRepository {
  private useMock: boolean;

  constructor(useMock = env.enableMockApi) {
    this.useMock = useMock;
  }

  async getAll(): Promise<ApiResponse<AppNotification[]>> {
    if (this.useMock) {
      return mockApiClient.getNotifications();
    }
    return apiClient.get<AppNotification[]>('/notifications');
  }

  async markAsRead(id: string): Promise<ApiResponse<{ success: boolean }>> {
    if (this.useMock) {
      return mockApiClient.markNotificationRead(id);
    }
    return apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<ApiResponse<{ success: boolean }>> {
    if (this.useMock) {
      return { success: true, data: { success: true } };
    }
    return apiClient.patch<{ success: boolean }>('/notifications/read-all');
  }

  async delete(id: string): Promise<ApiResponse<{ success: boolean }>> {
    if (this.useMock) {
      return { success: true, data: { success: true } };
    }
    return apiClient.delete<{ success: boolean }>(`/notifications/${id}`);
  }
}

export default new NotificationRepository();
