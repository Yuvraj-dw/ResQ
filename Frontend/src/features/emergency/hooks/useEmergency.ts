import { useCallback } from 'react';
import { useEmergencyStore } from '../../../store/emergencyStore';
import type { CreateEmergencyPayload } from '../../../types/emergency';

export function useEmergency() {
  const {
    emergencies,
    myEmergencies,
    currentEmergency,
    isLoading,
    isSubmitting,
    error,
    response,
    syncStatus,
    fetchEmergencies,
    fetchMyEmergencies,
    fetchEmergencyById,
    createEmergency,
    respondToEmergency,
    cancelEmergency,
    clearCurrentEmergency,
    clearResponse,
    clearError,
    getSyncStatus,
  } = useEmergencyStore();

  const handleCreateEmergency = useCallback(
    async (data: CreateEmergencyPayload) => {
      return createEmergency(data);
    },
    [createEmergency],
  );

  const handleRespond = useCallback(
    async (emergencyId: string) => {
      return respondToEmergency(emergencyId);
    },
    [respondToEmergency],
  );

  const handleFetchEmergencies = useCallback(() => {
    fetchEmergencies();
    getSyncStatus();
  }, [fetchEmergencies, getSyncStatus]);

  return {
    emergencies,
    myEmergencies,
    currentEmergency,
    isLoading,
    isSubmitting,
    error,
    response,
    syncStatus,
    fetchEmergencies: handleFetchEmergencies,
    fetchMyEmergencies,
    fetchEmergencyById,
    createEmergency: handleCreateEmergency,
    respondToEmergency: handleRespond,
    cancelEmergency,
    clearCurrentEmergency,
    clearResponse,
    clearError,
    getSyncStatus,
  };
}
