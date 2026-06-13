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
import { BLOOD_GROUPS } from '../../../utils/constants';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../../auth/hooks/useAuth';
import type { UpdateProfileRequest } from '../../../types/profile';

const RESOURCES = ['blood', 'transport', 'medicines', 'food', 'shelter'] as const;

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { profile, isUpdating, updateProfile } = useProfile();
  const { user } = useAuth();

  const displayProfile = profile || user;

  const [formData, setFormData] = useState<UpdateProfileRequest>({
    name: '',
    blood_group: '',
    location_name: '',
    resources: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (displayProfile) {
      setFormData({
        name: displayProfile.name || '',
        blood_group: displayProfile.blood_group || '',
        location_name: displayProfile.location_name || '',
        resources: displayProfile.resources || [],
      });
    }
  }, [displayProfile]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.blood_group) newErrors.bloodGroup = 'Blood group is required';
    if (!formData.location_name?.trim()) newErrors.locationName = 'Location is required';
    if (!formData.resources || formData.resources.length === 0) newErrors.resources = 'Select at least one resource';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleResource = (r: string) => {
    const current = formData.resources || [];
    const updated = current.includes(r)
      ? current.filter((x) => x !== r)
      : [...current, r];
    setFormData((prev) => ({ ...prev, resources: updated }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const result = await updateProfile(formData);
    if (result.success) {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', default: undefined })}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name || ''}
            onChangeText={(v) => { setFormData((p) => ({ ...p, name: v })); if (errors.name) setErrors((p) => ({ ...p, name: '' })); }}
            error={errors.name}
            autoCapitalize="words"
            required
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Blood Group <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerRow}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity key={bg} onPress={() => { setFormData((p) => ({ ...p, blood_group: bg })); if (errors.bloodGroup) setErrors((p) => ({ ...p, bloodGroup: '' })); }}>
                  <Badge label={bg} variant={formData.blood_group === bg ? 'emergency' : 'default'} size="md" style={styles.option} />
                </TouchableOpacity>
              ))}
            </View>
            {errors.bloodGroup && <Text style={styles.errorText}>{errors.bloodGroup}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Resources <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerRow}>
              {RESOURCES.map((r) => (
                <TouchableOpacity key={r} onPress={() => toggleResource(r)}>
                  <Badge label={r} variant={formData.resources?.includes(r) ? 'info' : 'default'} size="md" style={styles.option} />
                </TouchableOpacity>
              ))}
            </View>
            {errors.resources && <Text style={styles.errorText}>{errors.resources}</Text>}
          </View>

          <Input
            label="Location"
            placeholder="e.g., AIIMS Bhopal"
            value={formData.location_name || ''}
            onChangeText={(v) => { setFormData((p) => ({ ...p, location_name: v })); if (errors.locationName) setErrors((p) => ({ ...p, locationName: '' })); }}
            error={errors.locationName}
            required
          />

          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={() => navigation.goBack()} variant="outline" size="lg" style={styles.cancelButton} />
            <Button title="Save Changes" onPress={handleSubmit} variant="primary" size="lg" loading={isUpdating} style={styles.saveButton} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  form: { padding: spacing.lg },
  fieldContainer: { marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  required: { color: colors.error },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  option: { marginBottom: spacing.xs },
  errorText: { fontSize: fontSize.sm, color: colors.error, marginTop: spacing.xs },
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelButton: { flex: 1 },
  saveButton: { flex: 1 },
});

export default EditProfileScreen;
