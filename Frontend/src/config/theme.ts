export const colors = {
  emergency: '#DC143C',
  emergencyLight: '#FF6B6B',
  emergencyDark: '#8B0000',
  helpAvailable: '#2ECC71',
  helpAvailableLight: '#58D68D',
  helpAvailableDark: '#1B7A3D',
  white: '#FFFFFF',
  background: '#F5F6FA',
  backgroundDark: '#1A1A2E',
  surface: '#FFFFFF',
  surfaceDark: '#16213E',
  text: '#2C3E50',
  textDark: '#ECF0F1',
  textSecondary: '#7F8C8D',
  textSecondaryDark: '#95A5A6',
  border: '#E0E0E0',
  borderDark: '#2C3E50',
  error: '#E74C3C',
  warning: '#F39C12',
  success: '#2ECC71',
  info: '#3498DB',
  disabled: '#BDC3C7',
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  inputBackground: '#F8F9FA',
  inputBackgroundDark: '#1E2A3A',
  statusActive: '#2ECC71',
  statusResolved: '#3498DB',
  statusCancelled: '#95A5A6',
  statusPending: '#F39C12',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const darkModeColors = {
  emergency: '#FF4444',
  emergencyLight: '#FF6B6B',
  emergencyDark: '#CC0000',
  helpAvailable: '#00E676',
  helpAvailableLight: '#69F0AE',
  helpAvailableDark: '#00C853',
};

const theme = {
  colors,
  darkModeColors,
  spacing,
  fontSize,
  borderRadius,
  shadows,
};

export default theme;
