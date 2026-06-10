export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceResult {
  distanceKm: number;
  estimatedMinutes: number;
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
