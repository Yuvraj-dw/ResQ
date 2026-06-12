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

  const coords = currentEmergency.location?.coordinates;
  const emergencyLatLng = coords ? { latitude: coords[1], longitude: coords[0] } : null;

  const distance = userLocation && emergencyLatLng
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        emergencyLatLng.latitude,
        emergencyLatLng.longitude,
      )
    : 0;

  const typeVariant = getEmergencyTypeVariant(currentEmergency.resource);
  const statusVariant = getStatusVariant(currentEmergency.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <EmergencyMap
        userLocation={userLocation}
        emergencyLocation={emergencyLatLng}
        emergencyType={currentEmergency.resource}
        height={200}
      />

      <View style={styles.contentCard}>
        <View style={styles.headerRow}>
          <Badge label={currentEmergency.resource} variant={typeVariant} size="md" />
          <Badge label={currentEmergency.status} variant={statusVariant} size="md" />
        </View>

        <Text style={styles.title}>{currentEmergency.location_name}</Text>

        {currentEmergency.blood_group && (
          <Text style={styles.bloodText}>Blood Group: {currentEmergency.blood_group}</Text>
        )}

        <View style={styles.distanceRow}>
          <Text style={styles.distanceIcon}>📍</Text>
          <Text style={styles.distanceText}>
            {formatDistance(distance)} away
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Urgency</Text>
            <Text style={styles.infoValue}>{currentEmergency.urgency}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Contact</Text>
            <Text style={styles.infoValue}>{currentEmergency.requester_phone}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Reported</Text>
            <Text style={styles.infoValue}>{formatDateTime(currentEmergency.created_at)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Source</Text>
            <Text style={styles.infoValue}>{currentEmergency.source}</Text>
          </View>
          {currentEmergency.raw_message && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Raw Message</Text>
              <Text style={styles.infoValue}>{currentEmergency.raw_message}</Text>
            </View>
          )}
        </View>
      </View>

      <HelpActions
        emergencyId={currentEmergency._id}
        contactNumber={currentEmergency.requester_phone}
        latitude={emergencyLatLng?.latitude || 0}
        longitude={emergencyLatLng?.longitude || 0}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  contentCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadows.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  bloodText: { fontSize: fontSize.md, color: colors.emergency, fontWeight: '600', marginBottom: spacing.sm },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  distanceIcon: { fontSize: fontSize.lg },
  distanceText: { fontSize: fontSize.md, color: colors.emergency, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  infoGrid: { gap: spacing.md },
  infoItem: { gap: spacing.xs },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: fontSize.md, color: colors.text },
});

export default EmergencyDetailScreen;
