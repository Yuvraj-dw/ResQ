import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { colors, fontSize, spacing } from '../../../config/theme';
import EmergencyCard from '../components/EmergencyCard';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import ErrorState from '../../../components/ErrorState';
import { useEmergency } from '../hooks/useEmergency';

interface EmergencyListScreenProps {
  navigation: any;
}

const EmergencyListScreen: React.FC<EmergencyListScreenProps> = ({ navigation }) => {
  const { emergencies, isLoading, error, fetchEmergencies } = useEmergency();

  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  const onRefresh = useCallback(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  const handleEmergencyPress = (id: string) => {
    navigation.navigate('EmergencyDetail', { emergencyId: id });
  };

  if (isLoading && emergencies.length === 0) {
    return <LoadingSpinner fullScreen message="Loading emergencies..." />;
  }

  if (error && emergencies.length === 0) {
    return <ErrorState message={error} onRetry={onRefresh} fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Emergencies</Text>
        <Text style={styles.subtitle}>
          {emergencies.length} emergency{emergencies.length !== 1 ? 'ies' : 'y'} near you
        </Text>
      </View>

      <FlatList
        data={emergencies}
        renderItem={({ item }) => (
          <EmergencyCard item={item} onPress={handleEmergencyPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.emergency}
            colors={[colors.emergency]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="All Clear"
            message="No active emergencies in your area right now"
            icon="✅"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.xs,
    flexGrow: 1,
  },
});

export default EmergencyListScreen;
