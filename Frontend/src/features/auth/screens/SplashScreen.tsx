import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fontSize, spacing } from '../../../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../../utils/constants';

interface SplashScreenProps {
  navigation: any;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const init = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKENS);
      const onboardingDone = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);

      setTimeout(() => {
        if (stored) {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        } else if (onboardingDone === 'true') {
          navigation.reset({ index: 0, routes: [{ name: 'Registration' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        }
      }, 1500);
    };

    init();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚨</Text>
      <Text style={styles.title}>Emergency Connect</Text>
      <Text style={styles.subtitle}>Community Response Network</Text>
      <ActivityIndicator color={colors.white} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.emergency, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 64, marginBottom: spacing.md },
  title: { fontSize: fontSize.xxxl, fontWeight: '800', color: colors.white, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.white + 'CC', marginBottom: spacing.xl },
  loader: { marginTop: spacing.lg },
});

export default SplashScreen;
