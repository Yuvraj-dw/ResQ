import type { BloodGroup } from './auth';

export interface UserProfile {
  id: string;
  fullName: string;
  mobileNumber: string;
  bloodGroup: BloodGroup | string;
  address: string;
  pincode: string;
  isRegistered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  bloodGroup?: string;
  address?: string;
  pincode?: string;
}
