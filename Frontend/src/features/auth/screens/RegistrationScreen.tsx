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
import type { AppRegisterRequest } from '../../../types/auth';

const RESOURCES = ['blood', 'transport', 'medicines', 'food', 'shelter'] as const;

interface RegistrationScreenProps {
  navigation: any;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => {
  const { registerApp, isLoading, setRegistrationData } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [locationName, setLocationName] = useState('');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleResource = (r: string) => {
    setSelectedResources((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
    if (errors.resources) setErrors((prev) => ({ ...prev, resources: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\+?\d{10,13}$/.test(phone.replace(/[\s\-]/g, ''))) {
      newErrors.phone = 'Enter a valid phone number';
    }
    if (!bloodGroup) newErrors.bloodGroup = 'Blood group is required';
    if (!locationName.trim()) newErrors.locationName = 'Location is required';
    if (selectedResources.length === 0) newErrors.resources = 'Select at least one resource';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: AppRegisterRequest = {
      phone: phone.trim(),
      name: name.trim(),
      resources: selectedResources,
      blood_group: bloodGroup,
      location_name: locationName.trim(),
    };

    setRegistrationData(data);
    const result = await registerApp(data);
    if (result.success) {
      navigation.navigate('OtpVerification', { phone: data.phone });
    } else {
      setErrors({ submit: result.error || 'Registration failed' });
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
            value={name}
            onChangeText={(v) => { setName(v); if (errors.name) setErrors((p) => ({ ...p, name: '' })); }}
            error={errors.name}
            autoCapitalize="words"
            required
          />

          <Input
            label="Phone Number"
            placeholder="+919876543210"
            value={phone}
            onChangeText={(v) => { setPhone(v); if (errors.phone) setErrors((p) => ({ ...p, phone: '' })); }}
            error={errors.phone}
            keyboardType="phone-pad"
            required
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Blood Group <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerRow}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity key={bg} onPress={() => { setBloodGroup(bg); if (errors.bloodGroup) setErrors((p) => ({ ...p, bloodGroup: '' })); }}>
                  <Badge
                    label={bg}
                    variant={bloodGroup === bg ? 'emergency' : 'default'}
                    size="md"
                    style={styles.option}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {errors.bloodGroup && <Text style={styles.errorText}>{errors.bloodGroup}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              I can help with <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerRow}>
              {RESOURCES.map((r) => (
                <TouchableOpacity key={r} onPress={() => toggleResource(r)}>
                  <Badge
                    label={r}
                    variant={selectedResources.includes(r) ? 'info' : 'default'}
                    size="md"
                    style={styles.option}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {errors.resources && <Text style={styles.errorText}>{errors.resources}</Text>}
          </View>

          <Input
            label="Location"
            placeholder="e.g., AIIMS Bhopal"
            value={locationName}
            onChangeText={(v) => { setLocationName(v); if (errors.locationName) setErrors((p) => ({ ...p, locationName: '' })); }}
            error={errors.locationName}
            required
          />

          {errors.submit && (
            <Text style={styles.errorText}>{errors.submit}</Text>
          )}

          <Button
            title="Register"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  title: { fontSize: fontSize.xxxl, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  form: { paddingHorizontal: spacing.xl },
  fieldContainer: { marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  required: { color: colors.error },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  option: { marginBottom: spacing.xs },
  errorText: { fontSize: fontSize.sm, color: colors.error, marginTop: spacing.xs },
  submitButton: { marginTop: spacing.lg },
});

export default RegistrationScreen;
