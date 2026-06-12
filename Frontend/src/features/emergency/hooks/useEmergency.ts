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
    syncStatus,
    fetchEmergencies,
    fetchMyEmergencies,
    fetchEmergencyById,
    createEmergency,
    acceptEmergency,
    updateEmergencyStatus,
    cancelEmergency,
    clearCurrentEmergency,
    clearError,
    getSyncStatus,
  } = useEmergencyStore();

  const handleCreateEmergency = useCallback(
    async (data: CreateEmergencyPayload) => {
      return createEmergency(data);
    },
    [createEmergency],
  );

  const handleAccept = useCallback(
    async (id: string) => {
      return acceptEmergency(id);
    },
    [acceptEmergency],
  );

  const handleUpdateStatus = useCallback(
    async (id: string, status: string) => {
      return updateEmergencyStatus(id, status);
    },
    [updateEmergencyStatus],
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
    syncStatus,
    fetchEmergencies: handleFetchEmergencies,
    fetchMyEmergencies,
    fetchEmergencyById,
    createEmergency: handleCreateEmergency,
    acceptEmergency: handleAccept,
    updateEmergencyStatus: handleUpdateStatus,
    cancelEmergency,
    clearCurrentEmergency,
    clearError,
    getSyncStatus,
  };
}
