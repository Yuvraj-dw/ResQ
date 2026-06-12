import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { colors, fontSize, spacing } from '../../../config/theme';
import Button from '../../../components/Button';
import { useEmergency } from '../hooks/useEmergency';

interface HelpActionsProps {
  emergencyId: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
  onHelpResponded?: () => void;
}

const HelpActions: React.FC<HelpActionsProps> = ({
  emergencyId,
  contactNumber,
  latitude,
  longitude,
  onHelpResponded,
}) => {
  const { acceptEmergency, isSubmitting } = useEmergency();
  const [responded, setResponded] = useState(false);

  const handleICanHelp = () => {
    Alert.alert(
      'Confirm Help',
      'Are you sure you can respond to this emergency? Your location will be shared with the requester.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I Can Help',
          style: 'destructive',
          onPress: async () => {
            const result = await acceptEmergency(emergencyId);
            if (result.success) {
              setResponded(true);
              onHelpResponded?.();
            }
          },
        },
      ],
    );
  };

  const handleCallUser = () => {
    const phoneUrl = `tel:${contactNumber}`;
    Linking.canOpenURL(phoneUrl).then((canOpen) => {
      if (canOpen) Linking.openURL(phoneUrl);
    });
  };

  const handleOpenNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.canOpenURL(url).then((canOpen) => {
      if (canOpen) Linking.openURL(url);
    });
  };

  if (responded) {
    return (
      <View style={styles.respondedContainer}>
        <Text style={styles.respondedIcon}>✅</Text>
        <Text style={styles.respondedText}>
          You have responded to this emergency. The requester has been notified.
        </Text>
        <Button
          title="Open Navigation"
          onPress={handleOpenNavigation}
          variant="secondary"
          size="md"
          fullWidth
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Actions</Text>

      <View style={styles.actionsRow}>
        <Button
          title="I Can Help"
          onPress={handleICanHelp}
          variant="primary"
          size="md"
          loading={isSubmitting}
          style={styles.actionButton}
        />
        <Button
          title="Call User"
          onPress={handleCallUser}
          variant="secondary"
          size="md"
          style={styles.actionButton}
        />
      </View>

      <Button
        title="Open Navigation"
        onPress={handleOpenNavigation}
        variant="outline"
        size="md"
        fullWidth
        style={styles.navButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: 12, marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  actionButton: { flex: 1 },
  navButton: { marginBottom: 0 },
  respondedContainer: { padding: spacing.lg, backgroundColor: colors.helpAvailable + '15', borderRadius: 12, alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  respondedIcon: { fontSize: 40 },
  respondedText: { fontSize: fontSize.md, color: colors.helpAvailable, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
});

export default HelpActions;
