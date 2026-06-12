import type { ApiResponse } from '../types/common';
import type {
  AppRegisterRequest,
  AppRegisterVerifyRequest,
  SmsRegisterRequest,
  SendOtpRequest,
  VerifyOtpRequest,
  AuthTokens,
  UserResponse,
} from '../types/auth';
import env from '../config/env';
import apiClient from '../services/api/ApiClient';

export interface IAuthRepository {
  registerApp(data: AppRegisterRequest): Promise<ApiResponse<{ message: string; phone: string; requires_verification: boolean }>>;
  verifyAppRegistration(data: AppRegisterVerifyRequest): Promise<ApiResponse<AuthTokens>>;
  registerSms(data: SmsRegisterRequest): Promise<ApiResponse<AuthTokens>>;
  sendOtp(data: SendOtpRequest): Promise<ApiResponse<{ message: string }>>;
  verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse<AuthTokens>>;
  getMe(): Promise<ApiResponse<UserResponse>>;
  logout(): Promise<void>;
}

export class AuthRepository implements IAuthRepository {
  async registerApp(data: AppRegisterRequest): Promise<ApiResponse<{ message: string; phone: string; requires_verification: boolean }>> {
    const result = await apiClient.post<{ message: string; phone: string; requires_verification: boolean }>(
      '/auth/register/app', data, false,
    );
    return result;
  }

  async verifyAppRegistration(data: AppRegisterVerifyRequest): Promise<ApiResponse<AuthTokens>> {
    const result = await apiClient.post<AuthTokens>('/auth/register/app/verify', data, false);
    if (result.success && result.data) {
      await apiClient.setTokens(result.data);
    }
    return result;
  }

  async registerSms(data: SmsRegisterRequest): Promise<ApiResponse<AuthTokens>> {
    const result = await apiClient.post<AuthTokens>('/auth/register/sms', data, false);
    if (result.success && result.data) {
      await apiClient.setTokens(result.data);
    }
    return result;
  }

  async sendOtp(data: SendOtpRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/send-otp', data, false);
  }

  async verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse<AuthTokens>> {
    const result = await apiClient.post<AuthTokens>('/auth/verify-otp', data, false);
    if (result.success && result.data) {
      await apiClient.setTokens(result.data);
    }
    return result;
  }

  async getMe(): Promise<ApiResponse<UserResponse>> {
    return apiClient.get<UserResponse>('/auth/me');
  }

  async logout(): Promise<void> {
    await apiClient.clearTokens();
  }
}

export default new AuthRepository();
