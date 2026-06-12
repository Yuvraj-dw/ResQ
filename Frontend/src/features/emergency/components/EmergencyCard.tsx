import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontSize, spacing, shadows, borderRadius } from '../../../config/theme';
import Badge, { getEmergencyTypeVariant, getStatusVariant } from '../../../components/Badge';
import type { EmergencyCardData, EmergencyResource } from '../../../types/emergency';
import { formatDistance } from '../../../utils/distance';

interface EmergencyCardProps {
  item: EmergencyCardData;
  onPress: (id: string) => void;
}

const EmergencyCard: React.FC<EmergencyCardProps> = ({ item, onPress }) => {
  const typeVariant = getEmergencyTypeVariant(item.resource);
  const statusVariant = getStatusVariant(item.status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item._id)}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <Badge label={item.resource} variant={typeVariant} size="sm" />
        <Badge label={item.status} variant={statusVariant} size="sm" />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {item.resource} - {item.location_name}
      </Text>

      {item.blood_group && (
        <Text style={styles.bloodGroup}>Blood Group: {item.blood_group}</Text>
      )}

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerIcon}>📍</Text>
          <Text style={styles.footerText}>
            {formatDistance(item.distance_km)}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerIcon}>⏱️</Text>
          <Text style={styles.footerText}>{item.time_ago}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerIcon}>📡</Text>
          <Text style={styles.footerText}>{item.current_radius_km}km</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  bloodGroup: { fontSize: fontSize.md, color: colors.emergency, fontWeight: '600', marginBottom: spacing.xs },
  footer: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerIcon: { fontSize: fontSize.sm },
  footerText: { fontSize: fontSize.sm, color: colors.textSecondary },
});

export default EmergencyCard;
