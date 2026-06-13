import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors, fontSize, spacing, borderRadius, shadows } from '../../../config/theme';
import Badge from '../../../components/Badge';
import Card from '../../../components/Card';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../../auth/hooks/useAuth';
import { useEmergencyStore } from '../../../store/emergencyStore';
import { useNotificationStore } from '../../../store/notificationStore';
import { formatDateTime } from '../../../utils/formatters';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { profile, isLoading, fetchProfile } = useProfile();
  const { logout, user, isAuthenticated } = useAuth();
  const resetEmergencyStore = useEmergencyStore((s) => s.reset);
  const resetNotificationStore = useNotificationStore((s) => s.reset);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.reset({ index: 0, routes: [{ name: 'Registration' }] });
    }
  }, [isAuthenticated, navigation]);

  const handleLogout = useCallback(async () => {
    resetEmergencyStore();
    resetNotificationStore();
    await logout();
  }, [logout, resetEmergencyStore, resetNotificationStore]);

  const displayProfile = profile || user;

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
            {displayProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{displayProfile?.name || 'User'}</Text>
        <Badge
          label={displayProfile?.registration_source === 'app' ? 'App User' : 'SMS User'}
          variant="info"
          size="md"
        />
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.divider} />
        <InfoRow label="Full Name" value={displayProfile?.name || ''} />
        <InfoRow label="Phone" value={displayProfile?.phone || ''} />
        <InfoRow label="Blood Group" value={displayProfile?.blood_group || ''} />
        <InfoRow label="Location" value={displayProfile?.location_name || ''} />
        <InfoRow label="Resources" value={displayProfile?.resources?.join(', ') || ''} />
        <InfoRow label="Volunteer" value={displayProfile?.is_volunteer ? 'Yes' : 'No'} />
        {displayProfile?.created_at && (
          <InfoRow label="Member Since" value={formatDateTime(displayProfile.created_at)} />
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
        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={() => setShowLogoutModal(true)}>
          <Text style={[styles.actionButtonText, styles.logoutText]}>🚪  Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
              >
                <Text style={styles.modalConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxl },
  profileHeader: { alignItems: 'center', paddingVertical: spacing.xxl, backgroundColor: colors.surface, borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl, ...shadows.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.emergency, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: fontSize.xxxl, fontWeight: '800', color: colors.white },
  name: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  infoCard: { margin: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '50' },
  infoLabel: { fontSize: fontSize.md, color: colors.textSecondary, flex: 1 },
  infoValue: { fontSize: fontSize.md, color: colors.text, fontWeight: '600', flex: 1.5, textAlign: 'right' },
  actions: { padding: spacing.md, gap: spacing.sm },
  actionButton: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
  actionButtonText: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  logoutButton: { backgroundColor: colors.error + '10' },
  logoutText: { color: colors.error },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, marginHorizontal: spacing.xl, width: '90%', maxWidth: 340, alignItems: 'center' },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  modalMessage: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  modalButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  modalCancelButton: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  modalCancelText: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  modalConfirmButton: { backgroundColor: colors.error },
  modalConfirmText: { fontSize: fontSize.md, fontWeight: '700', color: colors.white },
});

export default ProfileScreen;
