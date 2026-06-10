import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { colors, fontSize, spacing, borderRadius, shadows } from '../../../config/theme';
import Badge, { getEmergencyTypeVariant, getStatusVariant } from '../../../components/Badge';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorState from '../../../components/ErrorState';
import EmergencyMap from '../components/EmergencyMap';
import HelpActions from '../components/HelpActions';
import { useEmergency } from '../hooks/useEmergency';
import { useLocation } from '../../../hooks/useLocation';
import { formatDateTime } from '../../../utils/formatters';
import { calculateDistance, formatDistance } from '../../../utils/distance';

interface EmergencyDetailScreenProps {
  navigation: any;
  route: any;
}

const EmergencyDetailScreen: React.FC<EmergencyDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { emergencyId } = route.params || {};
  const { currentEmergency, isLoading, error, fetchEmergencyById, clearCurrentEmergency } =
    useEmergency();
  const { coordinates: userLocation } = useLocation();

  useEffect(() => {
    if (emergencyId) {
      fetchEmergencyById(emergencyId);
    }
    return () => clearCurrentEmergency();
  }, [emergencyId, fetchEmergencyById, clearCurrentEmergency]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading emergency details..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => fetchEmergencyById(emergencyId)}
        fullScreen
      />
    );
  }

  if (!currentEmergency) {
    return <ErrorState message="Emergency not found" fullScreen />;
  }

  const distance = userLocation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        currentEmergency.latitude,
        currentEmergency.longitude,
      )
    : 0;

  const typeVariant = getEmergencyTypeVariant(currentEmergency.emergencyType);
  const statusVariant = getStatusVariant(currentEmergency.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <EmergencyMap
        userLocation={userLocation}
        emergencyLocation={{
          latitude: currentEmergency.latitude,
          longitude: currentEmergency.longitude,
        }}
        emergencyType={currentEmergency.emergencyType}
        emergencyTitle={currentEmergency.title}
        height={200}
      />

      <View style={styles.contentCard}>
        <View style={styles.headerRow}>
          <Badge label={currentEmergency.emergencyType} variant={typeVariant} size="md" />
          <Badge label={currentEmergency.status} variant={statusVariant} size="md" />
        </View>

        <Text style={styles.title}>{currentEmergency.title}</Text>

        <View style={styles.distanceRow}>
          <Text style={styles.distanceIcon}>📍</Text>
          <Text style={styles.distanceText}>
            {formatDistance(distance)} away
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{currentEmergency.description}</Text>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Contact</Text>
            <Text style={styles.infoValue}>{currentEmergency.contactNumber}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Reported</Text>
            <Text style={styles.infoValue}>
              {formatDateTime(currentEmergency.timestamp)}
            </Text>
          </View>
          {currentEmergency.userName && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Reported by</Text>
              <Text style={styles.infoValue}>{currentEmergency.userName}</Text>
            </View>
          )}
          {currentEmergency.notes && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{currentEmergency.notes}</Text>
            </View>
          )}
        </View>
      </View>

      <HelpActions
        emergencyId={currentEmergency.id}
        contactNumber={currentEmergency.contactNumber}
        latitude={currentEmergency.latitude}
        longitude={currentEmergency.longitude}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  distanceIcon: {
    fontSize: fontSize.lg,
  },
  distanceText: {
    fontSize: fontSize.md,
    color: colors.emergency,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  infoGrid: {
    gap: spacing.md,
  },
  infoItem: {
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
  },
});

export default EmergencyDetailScreen;
