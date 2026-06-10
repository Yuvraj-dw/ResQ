import { useCallback } from 'react';
import { useAuthStore } from '../../../store/authStore';
import type { RegisterRequest, OtpVerifyRequest } from '../../../types/auth';

export function useAuth() {
  const {
    isAuthenticated,
    isRegistered,
    isLoading,
    userProfile,
    registrationData,
    register,
    verifyOtp,
    loadProfile,
    logout,
    setRegistrationData,
    checkAuth,
  } = useAuthStore();

  const handleRegister = useCallback(
    async (data: RegisterRequest) => {
      return register(data);
    },
    [register],
  );

  const handleVerifyOtp = useCallback(
    async (data: OtpVerifyRequest) => {
      return verifyOtp(data);
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
    isRegistered,
    isLoading,
    userProfile,
    registrationData,
    register: handleRegister,
    verifyOtp: handleVerifyOtp,
    loadProfile,
    logout: handleLogout,
    setRegistrationData,
    checkAuth: handleCheckAuth,
  };
}
