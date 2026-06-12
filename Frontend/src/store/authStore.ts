import { create } from 'zustand';
import type { AuthState, AppRegisterRequest, AppRegisterVerifyRequest, UserResponse } from '../types/auth';
import authRepository from '../repositories/AuthRepository';
import profileRepository from '../repositories/ProfileRepository';
import { wsService } from '../services/websocket';

interface AuthStore extends AuthState {
  setRegistrationData: (data: AppRegisterRequest) => void;
  registerApp: (data: AppRegisterRequest) => Promise<{ success: boolean; error?: string }>;
  verifyAppRegistration: (data: AppRegisterVerifyRequest) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  loadProfile: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserResponse) => void;
  checkAuth: () => Promise<void>;
  reset: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  tokens: null,
  user: null,
  registrationData: null,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  setRegistrationData: (data) => {
    set({ registrationData: data });
  },

  registerApp: async (data) => {
    set({ isLoading: true });
    try {
      const result = await authRepository.registerApp(data);
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

  verifyAppRegistration: async (data) => {
    set({ isLoading: true });
    try {
      const result = await authRepository.verifyAppRegistration(data);
      if (result.success && result.data) {
        const { access_token, token_type, user } = result.data;
        await profileRepository.saveLocalProfile(user);
        set({
          isAuthenticated: true,
          isLoading: false,
          tokens: { access_token, token_type },
          user,
        });
        wsService.connect(access_token);
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: result.error || 'Verification failed' };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  },

  sendOtp: async (phone) => {
    set({ isLoading: true });
    try {
      const result = await authRepository.sendOtp({ phone });
      if (result.success) {
        set({ isLoading: false });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: result.error || 'Failed to send OTP' };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      };
    }
  },

  verifyOtp: async (phone, otp) => {
    set({ isLoading: true });
    try {
      const result = await authRepository.verifyOtp({ phone, otp });
      if (result.success && result.data) {
        const { access_token, token_type, user } = result.data;
        await profileRepository.saveLocalProfile(user);
        set({
          isAuthenticated: true,
          isLoading: false,
          tokens: { access_token, token_type },
          user,
        });
        wsService.connect(access_token);
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
        set({ user: localProfile });
      }
      const result = await profileRepository.getProfile();
      if (result.success && result.data) {
        set({ user: result.data });
      }
    } catch {
      const localProfile = await profileRepository.getLocalProfile();
      if (localProfile) {
        set({ user: localProfile });
      }
    }
  },

  logout: async () => {
    wsService.disconnect();
    await authRepository.logout();
    set(initialState);
  },

  setUser: (user) => {
    set({ user });
  },

  checkAuth: async () => {
    await authRepository.logout();
    const localProfile = await profileRepository.getLocalProfile();
    if (localProfile) {
      set({
        isAuthenticated: true,
        user: localProfile,
      });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
