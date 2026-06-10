import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, fontSize, spacing, borderRadius, shadows } from '../../../config/theme';
import Badge from '../../../components/Badge';
import Card from '../../../components/Card';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../../auth/hooks/useAuth';
import { maskMobileNumber, formatDateTime } from '../../../utils/formatters';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { profile, isLoading, fetchProfile } = useProfile();
  const { logout, userProfile } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const displayProfile = profile || userProfile;

  if (isLoading && !displayProfile) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not set'}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayProfile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{displayProfile?.fullName || 'User'}</Text>
        <Badge
          label={displayProfile?.isRegistered ? 'Registered' : 'Not Registered'}
          variant={displayProfile?.isRegistered ? 'success' : 'warning'}
          size="md"
        />
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.divider} />
        <InfoRow label="Full Name" value={displayProfile?.fullName || ''} />
        <InfoRow
          label="Mobile Number"
          value={maskMobileNumber(displayProfile?.mobileNumber || '')}
        />
        <InfoRow label="Blood Group" value={displayProfile?.bloodGroup || ''} />
        <InfoRow label="Address" value={displayProfile?.address || ''} />
        <InfoRow label="Pincode" value={displayProfile?.pincode || ''} />
        {displayProfile?.createdAt && (
          <InfoRow
            label="Member Since"
            value={formatDateTime(displayProfile.createdAt)}
          />
        )}
      </Card>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.actionButtonText}>✏️  Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('MyEmergencies')}>
          <Text style={styles.actionButtonText}>🚨  My Emergencies</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={logout}>
          <Text style={[styles.actionButtonText, styles.logoutText]}>🚪  Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.emergency,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xxxl,
    fontWeight: '800',
    color: colors.white,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoCard: {
    margin: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
  },
  infoLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  actions: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: colors.error + '10',
  },
  logoutText: {
    color: colors.error,
  },
});

export default ProfileScreen;
