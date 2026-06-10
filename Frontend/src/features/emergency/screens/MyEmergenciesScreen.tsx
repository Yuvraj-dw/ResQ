import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { colors, fontSize, spacing, borderRadius, shadows } from '../../../config/theme';
import Badge, { getEmergencyTypeVariant, getStatusVariant } from '../../../components/Badge';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import { useEmergency } from '../hooks/useEmergency';
import { formatDateTime } from '../../../utils/formatters';

interface MyEmergenciesScreenProps {
  navigation: any;
}

const MyEmergenciesScreen: React.FC<MyEmergenciesScreenProps> = ({ navigation }) => {
  const { myEmergencies, isLoading, fetchMyEmergencies } = useEmergency();

  useEffect(() => {
    fetchMyEmergencies();
  }, [fetchMyEmergencies]);

  const onRefresh = useCallback(() => {
    fetchMyEmergencies();
  }, [fetchMyEmergencies]);

  if (isLoading && myEmergencies.length === 0) {
    return <LoadingSpinner fullScreen message="Loading your emergencies..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={myEmergencies}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('EmergencyDetail', { emergencyId: item.id })
            }
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Badge
                label={item.emergencyType}
                variant={getEmergencyTypeVariant(item.emergencyType)}
                size="sm"
              />
              <Badge
                label={item.status}
                variant={getStatusVariant(item.status)}
                size="sm"
              />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardTime}>
                🕐 {formatDateTime(item.timestamp)}
              </Text>
            </View>
          </TouchableOpacity>
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
            title="No Requests"
            message="You haven't created any emergency requests yet"
            actionLabel="Create Emergency"
            onAction={() => navigation.navigate('EmergencyForm')}
            icon="📋"
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
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

export default MyEmergenciesScreen;
