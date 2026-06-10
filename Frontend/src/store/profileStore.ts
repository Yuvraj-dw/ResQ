import { create } from 'zustand';
import type { UserProfile, UpdateProfileRequest } from '../types/profile';
import profileRepository from '../repositories/ProfileRepository';

interface ProfileStore {
  profile: UserProfile | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<{ success: boolean; error?: string }>;
  setProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
  clearError: () => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  isLoading: false,
  isUpdating: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const local = await profileRepository.getLocalProfile();
      if (local) {
        set({ profile: local });
      }
      const result = await profileRepository.getProfile();
      if (result.success && result.data) {
        set({ profile: result.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load profile',
        isLoading: false,
      });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdating: true, error: null });
    try {
      const result = await profileRepository.updateProfile(data);
      if (result.success && result.data) {
        set({ profile: result.data, isUpdating: false });
        return { success: true };
      }
      set({ isUpdating: false });
      return { success: false, error: result.error || 'Failed to update profile' };
    } catch (error) {
      set({ isUpdating: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  },

  setProfile: (profile) => {
    set({ profile });
  },

  clearProfile: () => {
    set({ profile: null, error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
