import type { ApiResponse } from '../types/common';
import type { UserProfile, UpdateProfileRequest } from '../types/profile';
import env from '../config/env';
import apiClient from '../services/api/ApiClient';
import mockApiClient from '../services/api/MockApiClient';
import storageService from '../services/storage/StorageService';

export interface IProfileRepository {
  getProfile(): Promise<ApiResponse<UserProfile>>;
  updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>>;
  getLocalProfile(): Promise<UserProfile | null>;
  saveLocalProfile(profile: UserProfile): Promise<void>;
}

export class ProfileRepository implements IProfileRepository {
  private useMock: boolean;

  constructor(useMock = env.enableMockApi) {
    this.useMock = useMock;
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    if (this.useMock) {
      const result = await mockApiClient.getProfile();
      if (result.success && result.data) {
        await storageService.setUserProfile(result.data);
      }
      return result;
    }
    const result = await apiClient.get<UserProfile>('/profile');
    if (result.success && result.data) {
      await storageService.setUserProfile(result.data);
    }
    return result;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    if (this.useMock) {
      const result = await mockApiClient.updateProfile(data);
      if (result.success && result.data) {
        await storageService.setUserProfile(result.data);
      }
      return result;
    }
    const result = await apiClient.patch<UserProfile>('/profile', data);
    if (result.success && result.data) {
      await storageService.setUserProfile(result.data);
    }
    return result;
  }

  async getLocalProfile(): Promise<UserProfile | null> {
    return storageService.getUserProfile();
  }

  async saveLocalProfile(profile: UserProfile): Promise<void> {
    await storageService.setUserProfile(profile);
  }
}

export default new ProfileRepository();
