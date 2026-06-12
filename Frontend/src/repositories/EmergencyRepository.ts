import type { ApiResponse } from '../types/common';
import type {
  EmergencyRequest,
  CreateEmergencyPayload,
  EmergencyCardData,
} from '../types/emergency';
import apiClient from '../services/api/ApiClient';

export interface IEmergencyRepository {
  create(data: CreateEmergencyPayload): Promise<ApiResponse<EmergencyRequest>>;
  getAll(): Promise<ApiResponse<EmergencyCardData[]>>;
  getById(id: string): Promise<ApiResponse<EmergencyRequest>>;
  accept(id: string): Promise<ApiResponse<EmergencyRequest>>;
  updateStatus(id: string, status: string): Promise<ApiResponse<EmergencyRequest>>;
  getMyEmergencies(): Promise<ApiResponse<EmergencyRequest[]>>;
}

export class EmergencyRepository implements IEmergencyRepository {
  async create(data: CreateEmergencyPayload): Promise<ApiResponse<EmergencyRequest>> {
    return apiClient.post<EmergencyRequest>('/requests/', data);
  }

  async getAll(): Promise<ApiResponse<EmergencyCardData[]>> {
    // The backend GET /requests/ returns the user's requests
    // For the volunteer feed, we might need a separate endpoint
    // Using GET /notifications/ could give nearby emergencies
    return apiClient.get<EmergencyCardData[]>('/requests/');
  }

  async getById(id: string): Promise<ApiResponse<EmergencyRequest>> {
    return apiClient.get<EmergencyRequest>(`/requests/${id}`);
  }

  async accept(id: string): Promise<ApiResponse<EmergencyRequest>> {
    return apiClient.post<EmergencyRequest>(`/requests/${id}/accept`);
  }

  async updateStatus(id: string, status: string): Promise<ApiResponse<EmergencyRequest>> {
    return apiClient.patch<EmergencyRequest>(`/requests/${id}/status?status=${status}`);
  }

  async getMyEmergencies(): Promise<ApiResponse<EmergencyRequest[]>> {
    return apiClient.get<EmergencyRequest[]>('/requests/');
  }
}

export default new EmergencyRepository();
