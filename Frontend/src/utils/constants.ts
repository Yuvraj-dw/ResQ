export const STORAGE_KEYS = {
  USER_PROFILE: '@emergency_connect_user_profile',
  AUTH_TOKENS: '@emergency_connect_auth_tokens',
  PENDING_REQUESTS: '@emergency_connect_pending_requests',
  NOTIFICATION_HISTORY: '@emergency_connect_notification_history',
  ONBOARDING_COMPLETED: '@emergency_connect_onboarding_completed',
  THEME_PREFERENCE: '@emergency_connect_theme_preference',
  EMERGENCY_HISTORY: '@emergency_connect_emergency_history',
};

export const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Emergency Assistance',
    description: 'Get immediate help during emergencies. Connect with nearby responders who can assist you.',
    icon: 'alert-circle',
  },
  {
    id: '2',
    title: 'Real-Time Tracking',
    description: 'Share your location and let responders find you quickly with real-time GPS tracking.',
    icon: 'map-marker-radius',
  },
  {
    id: '3',
    title: 'Offline Mode',
    description: 'No internet? No problem. Send emergency requests via SMS when connectivity is unavailable.',
    icon: 'signal-off',
  },
  {
    id: '4',
    title: 'Community Support',
    description: 'Join a community of helpers. Respond to emergencies near you and make a difference.',
    icon: 'account-group',
  },
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const EMERGENCY_TYPES = [
  'Medical',
  'Blood Requirement',
  'Accident',
  'Transport Assistance',
  'Other',
] as const;

export const SMS_PAYLOAD_PREFIX = {
  REGISTRATION: '/register',
  EMERGENCY: '/emergency',
  HELP_RESPONSE: '/help',
};
