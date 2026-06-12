import { useCallback } from 'react';
import { useAuthStore } from '../../../store/authStore';
import type { AppRegisterRequest, AppRegisterVerifyRequest } from '../../../types/auth';

export function useAuth() {
  const {
    isAuthenticated,
    isLoading,
    user,
    registrationData,
    registerApp,
    verifyAppRegistration,
    sendOtp,
    verifyOtp,
    loadProfile,
    logout,
    setRegistrationData,
    checkAuth,
  } = useAuthStore();

  const handleRegisterApp = useCallback(
    async (data: AppRegisterRequest) => {
      return registerApp(data);
    },
    [registerApp],
  );

  const handleVerifyAppRegistration = useCallback(
    async (data: AppRegisterVerifyRequest) => {
      return verifyAppRegistration(data);
    },
    [verifyAppRegistration],
  );

  const handleSendOtp = useCallback(
    async (phone: string) => {
      return sendOtp(phone);
    },
    [sendOtp],
  );

  const handleVerifyOtp = useCallback(
    async (phone: string, otp: string) => {
      return verifyOtp(phone, otp);
    },
    [verifyOtp],
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleCheckAuth = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    isLoading,
    user,
    registrationData,
    registerApp: handleRegisterApp,
    verifyAppRegistration: handleVerifyAppRegistration,
    sendOtp: handleSendOtp,
    verifyOtp: handleVerifyOtp,
    loadProfile,
    logout: handleLogout,
    setRegistrationData,
    checkAuth: handleCheckAuth,
  };
}
