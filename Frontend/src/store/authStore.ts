import { create } from 'zustand';
import type { AuthState, RegisterRequest, OtpVerifyRequest } from '../types/auth';
import type { UserProfile } from '../types/profile';
import authRepository from '../repositories/AuthRepository';
import profileRepository from '../repositories/ProfileRepository';

interface AuthStore extends AuthState {
  userProfile: UserProfile | null;
  registrationData: RegisterRequest | null;

  setRegistrationData: (data: RegisterRequest) => void;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (data: OtpVerifyRequest) => Promise<{ success: boolean; error?: string }>;
  loadProfile: () => Promise<void>;
  logout: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  checkAuth: () => Promise<void>;
  reset: () => void;
}

const initialState: AuthState & { userProfile: UserProfile | null; registrationData: RegisterRequest | null } = {
  isAuthenticated: false,
  isRegistered: false,
  isLoading: false,
  tokens: null,
  userProfile: null,
  registrationData: null,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  setRegistrationData: (data) => {
    set({ registrationData: data });
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const result = await authRepository.register(data);
      if (result.success) {
        set({
          registrationData: data,
          isLoading: false,
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: result.error || 'Registration failed' };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  },

  verifyOtp: async (data) => {
    set({ isLoading: true });
    try {
      const result = await authRepository.verifyOtp(data);
      if (result.success && result.data) {
        const regData = get().registrationData;
        const profile: UserProfile = {
          id: 'user_' + Date.now(),
          fullName: regData?.fullName || '',
          mobileNumber: data.mobileNumber,
          bloodGroup: regData?.bloodGroup || '',
          address: regData?.address || '',
          pincode: regData?.pincode || '',
          isRegistered: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await profileRepository.saveLocalProfile(profile);
        set({
          isAuthenticated: true,
          isRegistered: true,
          isLoading: false,
          tokens: result.data,
          userProfile: profile,
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: result.error || 'OTP verification failed' };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OTP verification failed',
      };
    }
  },

  loadProfile: async () => {
    try {
      const localProfile = await profileRepository.getLocalProfile();
      if (localProfile) {
        set({ userProfile: localProfile, isRegistered: localProfile.isRegistered });
      }
      const result = await profileRepository.getProfile();
      if (result.success && result.data) {
        set({
          userProfile: result.data,
          isRegistered: result.data.isRegistered,
        });
      }
    } catch {
      const localProfile = await profileRepository.getLocalProfile();
      if (localProfile) {
        set({ userProfile: localProfile });
      }
    }
  },

  logout: async () => {
    await authRepository.logout();
    set(initialState);
  },

  setUserProfile: (profile) => {
    set({ userProfile: profile });
  },

  checkAuth: async () => {
    const localProfile = await profileRepository.getLocalProfile();
    if (localProfile && localProfile.isRegistered) {
      set({
        isAuthenticated: true,
        isRegistered: true,
        userProfile: localProfile,
      });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
