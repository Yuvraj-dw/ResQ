import type { ApiResponse } from '../types/common';
import type { DistanceResult, LocationUpdate } from '../types/common';
import apiClient from '../services/api/ApiClient';

export interface ITrackingRepository {
  updateLocation(data: LocationUpdate): Promise<ApiResponse<{ success: boolean }>>;
  getDistance(requestId: string): Promise<ApiResponse<DistanceResult>>;
}

export class TrackingRepository implements ITrackingRepository {
  async updateLocation(data: LocationUpdate): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>('/tracking/location', data);
  }

  async getDistance(requestId: string): Promise<ApiResponse<DistanceResult>> {
    return apiClient.get<DistanceResult>(`/tracking/${requestId}/distance`);
  }
}

export default new TrackingRepository();
