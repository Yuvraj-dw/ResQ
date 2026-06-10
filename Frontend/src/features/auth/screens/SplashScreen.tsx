import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fontSize, spacing } from '../../../config/theme';
import { useAuth } from '../hooks/useAuth';

interface SplashScreenProps {
  navigation: any;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const { checkAuth, isAuthenticated, isRegistered } = useAuth();

  useEffect(() => {
    const init = async () => {
      await checkAuth();
    };
    init();
  }, [checkAuth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && isRegistered) {
        navigation.replace('MainTabs');
      } else {
        navigation.replace('Onboarding');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, isAuthenticated, isRegistered]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>EC</Text>
        </View>
        <Text style={styles.title}>Emergency</Text>
        <Text style={styles.subtitle}>Connect</Text>
      </View>
      <Text style={styles.tagline}>Community Emergency Assistance</Text>
      <ActivityIndicator
        size="large"
        color={colors.emergency}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.emergency,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconText: {
    fontSize: fontSize.xxxl,
    fontWeight: '800',
    color: colors.white,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: '800',
    color: colors.emergency,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: fontSize.display,
    fontWeight: '300',
    color: colors.text,
    letterSpacing: 8,
    marginTop: -8,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  loader: {
    marginTop: spacing.xxl,
  },
});

export default SplashScreen;
