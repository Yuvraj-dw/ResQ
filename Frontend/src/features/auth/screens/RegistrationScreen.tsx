import React, { useState } from 'react';
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
import { useAuth } from '../hooks/useAuth';
import type { RegisterRequest } from '../../../types/auth';

interface RegistrationScreenProps {
  navigation: any;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => {
  const { register, isLoading, setRegistrationData } = useAuth();

  const [formData, setFormData] = useState<RegisterRequest>({
    fullName: '',
    mobileNumber: '',
    bloodGroup: '',
    address: '',
    pincode: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterRequest, string>>>({});
  const [showBloodPicker, setShowBloodPicker] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterRequest, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\+?\d{10,13}$/.test(formData.mobileNumber.replace(/[\s\-]/g, ''))) {
      newErrors.mobileNumber = 'Enter a valid mobile number';
    }

    if (!formData.bloodGroup) {
      newErrors.bloodGroup = 'Blood group is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

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

    setRegistrationData(formData);
    navigation.navigate('OtpVerification', { mobileNumber: formData.mobileNumber });
  };

  const updateField = (field: keyof RegisterRequest, value: string) => {
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register to start receiving and providing emergency assistance
          </Text>
        </View>

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

          <Input
            label="Mobile Number"
            placeholder="+91 9876543210"
            value={formData.mobileNumber}
            onChangeText={(v) => updateField('mobileNumber', v)}
            error={errors.mobileNumber}
            keyboardType="phone-pad"
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

          <Button
            title="Register"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            style={styles.submitButton}
          />

          <Text style={styles.termsText}>
            By registering, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    paddingHorizontal: spacing.xl,
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
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bloodBadge: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bloodBadgeSelected: {
    borderColor: colors.emergency,
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
  submitButton: {
    marginTop: spacing.lg,
  },
  termsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
});

export default RegistrationScreen;
