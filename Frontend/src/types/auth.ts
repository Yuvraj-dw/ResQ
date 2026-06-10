export interface RegisterRequest {
  fullName: string;
  mobileNumber: string;
  bloodGroup: string;
  address: string;
  pincode: string;
}

export interface OtpVerifyRequest {
  mobileNumber: string;
  otp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isRegistered: boolean;
  isLoading: boolean;
  tokens: AuthTokens | null;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}
