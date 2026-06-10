import type { ApiResponse } from '../../types/common';
import type { AuthTokens } from '../../types/auth';
import { STORAGE_KEYS } from '../../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  body?: unknown;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private tokens: AuthTokens | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async setTokens(tokens: AuthTokens): Promise<void> {
    this.tokens = tokens;
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
  }

  async loadTokens(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKENS);
      if (stored) {
        this.tokens = JSON.parse(stored);
      }
    } catch {
      this.tokens = null;
    }
  }

  async clearTokens(): Promise<void> {
    this.tokens = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKENS);
  }

  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { method, endpoint, body, headers = {}, requiresAuth = false } = config;

    if (requiresAuth && !this.tokens) {
      return { success: false, error: 'Authentication required' };
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requiresAuth && this.tokens) {
      requestHeaders.Authorization = `Bearer ${this.tokens.accessToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network request failed';
      return { success: false, error: message };
    }
  }

  get<T>(endpoint: string, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', endpoint, requiresAuth });
  }

  post<T>(endpoint: string, body?: unknown, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', endpoint, body, requiresAuth });
  }

  put<T>(endpoint: string, body?: unknown, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', endpoint, body, requiresAuth });
  }

  patch<T>(endpoint: string, body?: unknown, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', endpoint, body, requiresAuth });
  }

  delete<T>(endpoint: string, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', endpoint, requiresAuth });
  }

  isAuthenticated(): boolean {
    return this.tokens !== null;
  }
}

const apiClient = new ApiClient(
  process.env.EXPO_PUBLIC_API_URL || 'https://api.emergencyconnect.dev/v1',
);

export { ApiClient };
export default apiClient;
