import type { ApiResponse } from '../types/common';
import type {
  EmergencyRequest,
  CreateEmergencyPayload,
  EmergencyResponse,
  HelpResponsePayload,
  EmergencyCardData,
} from '../types/emergency';
import env from '../config/env';
import apiClient from '../services/api/ApiClient';
import mockApiClient from '../services/api/MockApiClient';

export interface IEmergencyRepository {
  create(data: CreateEmergencyPayload): Promise<ApiResponse<EmergencyRequest>>;
  getAll(): Promise<ApiResponse<EmergencyCardData[]>>;
  getById(id: string): Promise<ApiResponse<EmergencyRequest>>;
  respond(data: HelpResponsePayload): Promise<ApiResponse<EmergencyResponse>>;
  cancel(id: string): Promise<ApiResponse<{ success: boolean }>>;
  getMyEmergencies(): Promise<ApiResponse<EmergencyRequest[]>>;
}

export class EmergencyRepository implements IEmergencyRepository {
  private useMock: boolean;

  constructor(useMock = env.enableMockApi) {
    this.useMock = useMock;
  }

  async create(
    data: CreateEmergencyPayload,
  ): Promise<ApiResponse<EmergencyRequest>> {
    if (this.useMock) {
      return mockApiClient.createEmergency(data);
    }
    return apiClient.post<EmergencyRequest>('/emergency', data);
  }

  async getAll(): Promise<ApiResponse<EmergencyCardData[]>> {
    if (this.useMock) {
      return mockApiClient.getEmergencies();
    }
    return apiClient.get<EmergencyCardData[]>('/emergency');
  }

  async getById(id: string): Promise<ApiResponse<EmergencyRequest>> {
    if (this.useMock) {
      return mockApiClient.getEmergencyById(id);
    }
    return apiClient.get<EmergencyRequest>(`/emergency/${id}`);
  }

  async respond(
    data: HelpResponsePayload,
  ): Promise<ApiResponse<EmergencyResponse>> {
    if (this.useMock) {
      return mockApiClient.respondToEmergency(data);
    }
    return apiClient.post<EmergencyResponse>('/emergency/respond', data);
  }

  async cancel(id: string): Promise<ApiResponse<{ success: boolean }>> {
    if (this.useMock) {
      return mockApiClient.cancelEmergency(id);
    }
    return apiClient.post<{ success: boolean }>(`/emergency/${id}/cancel`);
  }

  async getMyEmergencies(): Promise<ApiResponse<EmergencyRequest[]>> {
    if (this.useMock) {
      return mockApiClient.getMyEmergencies();
    }
    return apiClient.get<EmergencyRequest[]>('/emergency/my');
  }
}

export default new EmergencyRepository();
