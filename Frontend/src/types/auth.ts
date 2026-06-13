export interface AppRegisterRequest {
  phone: string;
  name: string;
  resources: string[];
  blood_group: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
}

export interface AppRegisterVerifyRequest {
  phone: string;
  otp: string;
  name?: string;
  resources?: string[];
  blood_group?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
}

export interface SmsRegisterRequest {
  phone: string;
  name: string;
  resources: string[];
  blood_group: string;
  location_name: string;
}

export interface SendOtpRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  latitude?: number;
  longitude?: number;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface UserResponse {
  _id: string;
  name: string;
  phone: string;
  resources: string[];
  blood_group: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  location_name: string;
  is_volunteer: boolean;
  registration_source: 'app' | 'sms';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  tokens: { access_token: string; token_type: string } | null;
  user: UserResponse | null;
  registrationData: AppRegisterRequest | null;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type Resources = 'blood' | 'transport' | 'medicines' | 'food' | 'shelter';

export interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}
