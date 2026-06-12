import type { ApiResponse } from '../types/common';
import type { UserResponse } from '../types/auth';
import type { UpdateProfileRequest } from '../types/profile';
import apiClient from '../services/api/ApiClient';
import storageService from '../services/storage/StorageService';

export interface IProfileRepository {
  getProfile(): Promise<ApiResponse<UserResponse>>;
  updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserResponse>>;
  getLocalProfile(): Promise<UserResponse | null>;
  saveLocalProfile(profile: UserResponse): Promise<void>;
}

export class ProfileRepository implements IProfileRepository {
  async getProfile(): Promise<ApiResponse<UserResponse>> {
    const result = await apiClient.get<UserResponse>('/auth/me');
    if (result.success && result.data) {
      await storageService.setItem('user_profile', JSON.stringify(result.data));
    }
    return result;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserResponse>> {
    const result = await apiClient.patch<UserResponse>('/volunteers/me', data);
    if (result.success && result.data) {
      await storageService.setItem('user_profile', JSON.stringify(result.data));
    }
    return result;
  }

  async getLocalProfile(): Promise<UserResponse | null> {
    try {
      const raw = await storageService.getItem('user_profile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async saveLocalProfile(profile: UserResponse): Promise<void> {
    await storageService.setItem('user_profile', JSON.stringify(profile));
  }
}

export default new ProfileRepository();
