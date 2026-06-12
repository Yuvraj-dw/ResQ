export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  detail: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceResult {
  distance_km: number;
  estimated_minutes: number;
}

export type ConnectionStatus = 'online' | 'offline' | 'poor';

export interface PendingRequest {
  id: string;
  type: 'emergency' | 'sms' | 'registration' | 'help_response';
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

export interface SyncStatus {
  pending: number;
  synced: number;
  failed: number;
  lastSync: string | null;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
}
