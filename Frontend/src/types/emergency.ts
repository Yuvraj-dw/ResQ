import type { Coordinates } from './common';

export type EmergencyType = 'Medical' | 'Blood Requirement' | 'Accident' | 'Transport Assistance' | 'Other';

export type EmergencyStatus = 'active' | 'resolved' | 'cancelled' | 'pending';

export interface EmergencyRequest {
  id: string;
  emergencyType: EmergencyType;
  title: string;
  description: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  notes?: string;
  status: EmergencyStatus;
  userId: string;
  userName?: string;
}

export interface EmergencyResponse {
  emergencyId: string;
  responderId: string;
  responderName: string;
  responderMobile: string;
  responderLatitude: number;
  responderLongitude: number;
  timestamp: string;
  status: 'accepted' | 'en_route' | 'arrived' | 'completed';
}

export interface EmergencyFormData {
  emergencyType: EmergencyType;
  title: string;
  description: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  notes?: string;
}

export interface CreateEmergencyPayload {
  emergencyType: EmergencyType;
  title: string;
  description: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  notes?: string;
}

export interface HelpResponsePayload {
  emergencyId: string;
  responderId: string;
  responderName: string;
  responderMobile: string;
  responderLatitude: number;
  responderLongitude: number;
}

export interface EmergencyCardData {
  id: string;
  type: EmergencyType;
  title: string;
  description: string;
  distanceKm: number;
  timeAgo: string;
  status: EmergencyStatus;
  requesterName?: string;
}

export interface EmergencyLocation extends Coordinates {
  emergencyId: string;
  emergencyType: EmergencyType;
  title: string;
}
