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
import type { UpdateProfileRequest } from '../../../types/profile';

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { profile, isUpdating, updateProfile } = useProfile();

  const [formData, setFormData] = useState<Required<UpdateProfileRequest>>({
    fullName: '',
    bloodGroup: '',
    address: '',
    pincode: '',
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        bloodGroup: profile.bloodGroup || '',
        address: profile.address || '',
        pincode: profile.pincode || '',
      });
    }
  }, [profile]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.bloodGroup) newErrors.bloodGroup = 'Blood group is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const result = await updateProfile(formData);
    if (result.success) {
      navigation.goBack();
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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
      >
        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChangeText={(v) => updateField('fullName', v)}
            error={errors.fullName}
            autoCapitalize="words"
            required
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Blood Group <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.bloodPicker}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity key={bg} onPress={() => updateField('bloodGroup', bg)}>
                  <Badge
                    label={bg}
                    variant={formData.bloodGroup === bg ? 'emergency' : 'default'}
                    size="md"
                    style={styles.bloodOption}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {errors.bloodGroup && (
              <Text style={styles.errorText}>{errors.bloodGroup}</Text>
            )}
          </View>

          <Input
            label="Address"
            placeholder="Enter your address"
            value={formData.address}
            onChangeText={(v) => updateField('address', v)}
            error={errors.address}
            multiline
            numberOfLines={2}
            required
          />

          <Input
            label="Pincode"
            placeholder="462001"
            value={formData.pincode}
            onChangeText={(v) => updateField('pincode', v)}
            error={errors.pincode}
            keyboardType="number-pad"
            maxLength={6}
            required
          />

          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="outline"
              size="lg"
              style={styles.cancelButton}
            />
            <Button
              title="Save Changes"
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              loading={isUpdating}
              style={styles.saveButton}
            />
          </View>
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
  form: {
    padding: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  bloodPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  bloodOption: {
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default EditProfileScreen;
