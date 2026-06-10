import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { colors, fontSize, spacing, borderRadius } from '../../../config/theme';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';
import { EMERGENCY_TYPES } from '../../../utils/constants';
import { useEmergency } from '../hooks/useEmergency';
import { useLocation } from '../../../hooks/useLocation';
import { useConnectivity } from '../../../hooks/useConnectivity';
import type { EmergencyType, CreateEmergencyPayload } from '../../../types/emergency';

interface EmergencyFormScreenProps {
  navigation: any;
}

const EmergencyFormScreen: React.FC<EmergencyFormScreenProps> = ({ navigation }) => {
  const { createEmergency, isSubmitting } = useEmergency();
  const { coordinates, getLocation, isLoading: locLoading } = useLocation();
  const { isOnline } = useConnectivity();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emergencyType, setEmergencyType] = useState<EmergencyType | null>(null);
  const [contactNumber, setContactNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!emergencyType) newErrors.emergencyType = 'Select emergency type';
    if (!contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
    if (!coordinates) newErrors.location = 'Unable to get your location';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !emergencyType || !coordinates) return;

    const payload: CreateEmergencyPayload = {
      emergencyType,
      title: title.trim(),
      description: description.trim(),
      contactNumber: contactNumber.trim(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timestamp: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    const result = await createEmergency(payload);

    if (result.success) {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!isOnline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineBannerText}>
                📡 Offline mode - Emergency will be sent via SMS
              </Text>
            </View>
          )}

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Emergency Type</Text>
          <View style={styles.typeContainer}>
            {EMERGENCY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  setEmergencyType(type as EmergencyType);
                  if (errors.emergencyType) {
                    setErrors((prev) => ({ ...prev, emergencyType: '' }));
                  }
                }}
              >
                <Badge
                  label={type}
                  variant={emergencyType === type ? 'emergency' : 'default'}
                  size="md"
                  style={styles.typeBadge}
                />
              </TouchableOpacity>
            ))}
          </View>
          {errors.emergencyType && (
            <Text style={styles.errorText}>{errors.emergencyType}</Text>
          )}

          <Input
            label="Emergency Title"
            placeholder="e.g., Heart Attack, Road Accident"
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            error={errors.title}
            required
          />

          <Input
            label="Description"
            placeholder="Describe the emergency situation"
            value={description}
            onChangeText={(v) => {
              setDescription(v);
              if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
            }}
            error={errors.description}
            multiline
            numberOfLines={4}
            required
          />

          <Input
            label="Contact Number"
            placeholder="Your contact number for responders"
            value={contactNumber}
            onChangeText={(v) => {
              setContactNumber(v);
              if (errors.contactNumber) setErrors((prev) => ({ ...prev, contactNumber: '' }));
            }}
            error={errors.contactNumber}
            keyboardType="phone-pad"
            required
          />

          <Input
            label="Optional Notes"
            placeholder="Any additional information"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />

          <View style={styles.locationBox}>
            <Text style={styles.locationLabel}>
              {locLoading ? '📡 Getting your location...' : '📍 Location captured'}
            </Text>
            {coordinates && (
              <Text style={styles.locationCoords}>
                {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
              </Text>
            )}
            {errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}
            <Button
              title="Refresh Location"
              onPress={getLocation}
              variant="ghost"
              size="sm"
            />
          </View>

          <Button
            title="Submit Emergency Request"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  offlineBanner: {
    backgroundColor: colors.warning + '20',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  offlineBannerText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typeBadge: {
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  locationBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  locationCoords: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

export default EmergencyFormScreen;
