import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fontSize, borderRadius, spacing } from '../config/theme';
import type { EmergencyType, EmergencyStatus } from '../types/emergency';

type BadgeVariant = 'emergency' | 'success' | 'warning' | 'info' | 'default' | 'danger';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  emergency: { bg: colors.emergencyLight + '20', text: colors.emergency },
  success: { bg: colors.helpAvailableLight + '20', text: colors.helpAvailable },
  warning: { bg: colors.warning + '20', text: colors.warning },
  info: { bg: colors.info + '20', text: colors.info },
  default: { bg: colors.border, text: colors.textSecondary },
  danger: { bg: colors.error + '20', text: colors.error },
};

export function getEmergencyTypeVariant(type: EmergencyType): BadgeVariant {
  const map: Record<EmergencyType, BadgeVariant> = {
    Medical: 'danger',
    'Blood Requirement': 'emergency',
    Accident: 'warning',
    'Transport Assistance': 'info',
    Other: 'default',
  };
  return map[type];
}

export function getStatusVariant(status: EmergencyStatus): BadgeVariant {
  const map: Record<EmergencyStatus, BadgeVariant> = {
    active: 'emergency',
    resolved: 'success',
    cancelled: 'default',
    pending: 'warning',
  };
  return map[status];
}

const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', size = 'sm', style }) => {
  const colors_ = variantColors[variant];

  return (
    <View
      style={[
        styles.badge,
        styles[`size_${size}`],
        { backgroundColor: colors_.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          styles[`labelSize_${size}`],
          { color: colors_.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.md,
  },
  size_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    fontWeight: '600',
  },
  labelSize_sm: {
    fontSize: fontSize.xs,
  },
  labelSize_md: {
    fontSize: fontSize.sm,
  },
});

export default Badge;
