import type { ApiResponse } from '../../types/common';
import type {
  RegisterRequest,
  OtpVerifyRequest,
  AuthTokens,
} from '../../types/auth';
import type {
  EmergencyRequest,
  CreateEmergencyPayload,
  EmergencyResponse,
  HelpResponsePayload,
  EmergencyCardData,
} from '../../types/emergency';
import type { AppNotification, NotificationPayload } from '../../types/notification';
import type { UserProfile, UpdateProfileRequest } from '../../types/profile';
import { generateId } from '../../utils/formatters';

const MOCK_DELAY = 800;
const MOCK_USER_ID = 'user_mock_001';

const mockProfile: UserProfile = {
  id: MOCK_USER_ID,
  fullName: 'John Doe',
  mobileNumber: '+919876543210',
  bloodGroup: 'O+',
  address: '123, Main Street, Bhopal',
  pincode: '462001',
  isRegistered: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockEmergencies: EmergencyRequest[] = [
  {
    id: 'emergency_001',
    emergencyType: 'Medical',
    title: 'Heart Attack',
    description: 'Elderly person having heart attack, need immediate medical assistance',
    contactNumber: '+919876543211',
    latitude: 23.2599,
    longitude: 77.4126,
    timestamp: new Date(Date.now() - 600000).toISOString(),
    status: 'active',
    userId: 'user_mock_002',
    userName: 'Rahul S.',
  },
  {
    id: 'emergency_002',
    emergencyType: 'Accident',
    title: 'Road Accident',
    description: 'Two-wheeler accident near Hoshangabad road, need help',
    contactNumber: '+919876543212',
    latitude: 23.2378,
    longitude: 77.4308,
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    status: 'active',
    userId: 'user_mock_003',
    userName: 'Priya M.',
  },
  {
    id: 'emergency_003',
    emergencyType: 'Transport Assistance',
    title: 'Need Vehicle',
    description: 'Need transport to hospital for pregnant woman',
    contactNumber: '+919876543213',
    latitude: 23.2217,
    longitude: 77.3975,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'active',
    userId: 'user_mock_004',
    userName: 'Amit K.',
  },
];

const mockNotifications: AppNotification[] = [
  {
    id: 'notif_001',
    type: 'emergency',
    title: 'Emergency Near You',
    body: 'Medical emergency reported 2.3 km away',
    read: false,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    emergencyId: 'emergency_001',
  },
  {
    id: 'notif_002',
    type: 'help_response',
    title: 'Help is Coming',
    body: 'A responder has accepted your emergency request',
    read: false,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    emergencyId: 'emergency_002',
  },
];

function delay(ms = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface MockApiClientInterface {
  register(data: RegisterRequest): Promise<ApiResponse<{ message: string }>>;
  verifyOtp(data: OtpVerifyRequest): Promise<ApiResponse<AuthTokens>>;
  getProfile(): Promise<ApiResponse<UserProfile>>;
  updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>>;
  createEmergency(data: CreateEmergencyPayload): Promise<ApiResponse<EmergencyRequest>>;
  getEmergencies(): Promise<ApiResponse<EmergencyCardData[]>>;
  getEmergencyById(id: string): Promise<ApiResponse<EmergencyRequest>>;
  respondToEmergency(data: HelpResponsePayload): Promise<ApiResponse<EmergencyResponse>>;
  getNotifications(): Promise<ApiResponse<AppNotification[]>>;
  markNotificationRead(id: string): Promise<ApiResponse<{ success: boolean }>>;
  cancelEmergency(id: string): Promise<ApiResponse<{ success: boolean }>>;
  getMyEmergencies(): Promise<ApiResponse<EmergencyRequest[]>>;
}

export class MockApiClient implements MockApiClientInterface {
  private userState: UserProfile = { ...mockProfile };
  private emergencyState: EmergencyRequest[] = [...mockEmergencies];
  private notificationState: AppNotification[] = [...mockNotifications];
  private registeredUsers: Map<string, string> = new Map();

  async register(data: RegisterRequest): Promise<ApiResponse<{ message: string }>> {
    await delay(500);
    this.userState = {
      ...this.userState,
      fullName: data.fullName,
      mobileNumber: data.mobileNumber,
      bloodGroup: data.bloodGroup,
      address: data.address,
      pincode: data.pincode,
      isRegistered: false,
    };
    this.registeredUsers.set(data.mobileNumber, generateId());
    return {
      success: true,
      data: { message: 'OTP sent to registered mobile number' },
    };
  }

  async verifyOtp(data: OtpVerifyRequest): Promise<ApiResponse<AuthTokens>> {
    await delay();
    if (!data.otp || data.otp.length < 4) {
      return { success: false, error: 'Invalid OTP' };
    }
    this.userState.isRegistered = true;
    const tokens: AuthTokens = {
      accessToken: `mock_access_${generateId()}`,
      refreshToken: `mock_refresh_${generateId()}`,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    return { success: true, data: tokens };
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    await delay();
    return { success: true, data: { ...this.userState } };
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    await delay();
    this.userState = {
      ...this.userState,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: { ...this.userState } };
  }

  async createEmergency(
    payload: CreateEmergencyPayload,
  ): Promise<ApiResponse<EmergencyRequest>> {
    await delay();
    const emergency: EmergencyRequest = {
      id: `emergency_${generateId()}`,
      ...payload,
      status: 'active',
      userId: MOCK_USER_ID,
    };
    this.emergencyState.unshift(emergency);
    return { success: true, data: emergency };
  }

  async getEmergencies(): Promise<ApiResponse<EmergencyCardData[]>> {
    await delay();
    const cards: EmergencyCardData[] = this.emergencyState
      .filter((e) => e.status === 'active')
      .map((e) => ({
        id: e.id,
        type: e.emergencyType,
        title: e.title,
        description: e.description.substring(0, 60),
        distanceKm: Math.random() * 10 + 0.5,
        timeAgo: `${Math.floor(Math.random() * 60) + 1}m ago`,
        status: e.status,
        requesterName: e.userName || 'Unknown',
      }));
    return { success: true, data: cards };
  }

  async getEmergencyById(id: string): Promise<ApiResponse<EmergencyRequest>> {
    await delay();
    const emergency = this.emergencyState.find((e) => e.id === id);
    if (!emergency) {
      return { success: false, error: 'Emergency not found' };
    }
    return { success: true, data: { ...emergency } };
  }

  async respondToEmergency(
    data: HelpResponsePayload,
  ): Promise<ApiResponse<EmergencyResponse>> {
    await delay();
    const emergency = this.emergencyState.find((e) => e.id === data.emergencyId);
    if (!emergency) {
      return { success: false, error: 'Emergency not found' };
    }
    const response: EmergencyResponse = {
      emergencyId: data.emergencyId,
      responderId: data.responderId,
      responderName: data.responderName,
      responderMobile: data.responderMobile,
      responderLatitude: data.responderLatitude,
      responderLongitude: data.responderLongitude,
      timestamp: new Date().toISOString(),
      status: 'accepted',
    };
    return { success: true, data: response };
  }

  async getNotifications(): Promise<ApiResponse<AppNotification[]>> {
    await delay();
    return { success: true, data: [...this.notificationState] };
  }

  async markNotificationRead(id: string): Promise<ApiResponse<{ success: boolean }>> {
    await delay(300);
    const notif = this.notificationState.find((n) => n.id === id);
    if (notif) notif.read = true;
    return { success: true, data: { success: true } };
  }

  async cancelEmergency(id: string): Promise<ApiResponse<{ success: boolean }>> {
    await delay();
    const emergency = this.emergencyState.find((e) => e.id === id);
    if (emergency) emergency.status = 'cancelled';
    return { success: true, data: { success: true } };
  }

  async getMyEmergencies(): Promise<ApiResponse<EmergencyRequest[]>> {
    await delay();
    const myEmergencies = this.emergencyState.filter(
      (e) => e.userId === MOCK_USER_ID,
    );
    return { success: true, data: myEmergencies };
  }
}

const mockApiClient = new MockApiClient();
export default mockApiClient;
