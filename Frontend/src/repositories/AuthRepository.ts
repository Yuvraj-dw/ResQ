import type { ApiResponse } from '../types/common';
import type { RegisterRequest, OtpVerifyRequest, AuthTokens } from '../types/auth';
import env from '../config/env';
import apiClient from '../services/api/ApiClient';
import mockApiClient from '../services/api/MockApiClient';

export interface IAuthRepository {
  register(data: RegisterRequest): Promise<ApiResponse<{ message: string }>>;
  verifyOtp(data: OtpVerifyRequest): Promise<ApiResponse<AuthTokens>>;
  logout(): Promise<ApiResponse<{ success: boolean }>>;
  refreshToken(): Promise<ApiResponse<AuthTokens>>;
}

export class AuthRepository implements IAuthRepository {
  private useMock: boolean;

  constructor(useMock = env.enableMockApi) {
    this.useMock = useMock;
  }

  async register(data: RegisterRequest): Promise<ApiResponse<{ message: string }>> {
    if (this.useMock) {
      return mockApiClient.register(data);
    }
    return apiClient.post<{ message: string }>('/auth/register', data, false);
  }

  async verifyOtp(data: OtpVerifyRequest): Promise<ApiResponse<AuthTokens>> {
    if (this.useMock) {
      const result = await mockApiClient.verifyOtp(data);
      if (result.success && result.data) {
        await apiClient.setTokens(result.data);
      }
      return result;
    }
    const result = await apiClient.post<AuthTokens>('/auth/verify-otp', data, false);
    if (result.success && result.data) {
      await apiClient.setTokens(result.data);
    }
    return result;
  }

  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    if (this.useMock) {
      await apiClient.clearTokens();
      return { success: true, data: { success: true } };
    }
    await apiClient.clearTokens();
    return apiClient.post<{ success: boolean }>('/auth/logout');
  }

  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    if (this.useMock) {
      return {
        success: true,
        data: {
          accessToken: 'mock_refreshed_token',
          refreshToken: 'mock_refreshed_refresh',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
      };
    }
    return apiClient.post<AuthTokens>('/auth/refresh');
  }
}

export default new AuthRepository();
