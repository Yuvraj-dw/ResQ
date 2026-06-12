import type { BloodGroup, UserResponse } from './auth';

export type UserProfile = UserResponse & {
  fullName?: string;
  mobileNumber?: string;
  bloodGroup?: BloodGroup | string;
  address?: string;
  pincode?: string;
  isRegistered?: boolean;
};

export interface UpdateProfileRequest {
  name?: string;
  resources?: string[];
  blood_group?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
}
