import { create } from 'zustand';
import type {
  EmergencyRequest,
  CreateEmergencyPayload,
  EmergencyCardData,
  EmergencyResponse,
} from '../types/emergency';
import type { SyncStatus } from '../types/common';
import emergencyRepository from '../repositories/EmergencyRepository';
import storageService from '../services/storage/StorageService';
import syncManager from '../services/sync/SyncManager';
import connectivityService from '../services/connectivity/ConnectivityService';

interface EmergencyStore {
  emergencies: EmergencyCardData[];
  myEmergencies: EmergencyRequest[];
  currentEmergency: EmergencyRequest | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  response: EmergencyResponse | null;
  syncStatus: SyncStatus;

  fetchEmergencies: () => Promise<void>;
  fetchMyEmergencies: () => Promise<void>;
  fetchEmergencyById: (id: string) => Promise<void>;
  createEmergency: (data: CreateEmergencyPayload) => Promise<{ success: boolean; error?: string }>;
  respondToEmergency: (emergencyId: string) => Promise<{ success: boolean; error?: string }>;
  cancelEmergency: (id: string) => Promise<void>;
  clearCurrentEmergency: () => void;
  clearResponse: () => void;
  clearError: () => void;
  getSyncStatus: () => Promise<void>;
  reset: () => void;
}

const initialSyncStatus: SyncStatus = {
  pending: 0,
  synced: 0,
  failed: 0,
  lastSync: null,
};

export const useEmergencyStore = create<EmergencyStore>((set, get) => ({
  emergencies: [],
  myEmergencies: [],
  currentEmergency: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  response: null,
  syncStatus: initialSyncStatus,

  fetchEmergencies: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await emergencyRepository.getAll();
      if (result.success && result.data) {
        set({ emergencies: result.data, isLoading: false });
      } else {
        set({ error: result.error || 'Failed to fetch emergencies', isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch emergencies',
        isLoading: false,
      });
    }
  },

  fetchMyEmergencies: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await emergencyRepository.getMyEmergencies();
      if (result.success && result.data) {
        set({ myEmergencies: result.data, isLoading: false });
      } else {
        set({ error: result.error || 'Failed to fetch your emergencies', isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch your emergencies',
        isLoading: false,
      });
    }
  },

  fetchEmergencyById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await emergencyRepository.getById(id);
      if (result.success && result.data) {
        set({ currentEmergency: result.data, isLoading: false });
      } else {
        set({ error: result.error || 'Emergency not found', isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch emergency',
        isLoading: false,
      });
    }
  },

  createEmergency: async (data) => {
    set({ isSubmitting: true, error: null });
    try {
      const isOnline = await connectivityService.isOnline();

      if (isOnline) {
        const result = await emergencyRepository.create(data);
        if (result.success && result.data) {
          await storageService.addEmergency(result.data);
          set({ isSubmitting: false });
          return { success: true };
        }
        set({ isSubmitting: false });
        return { success: false, error: result.error || 'Failed to create emergency' };
      } else {
        await syncManager.addPendingRequest({
          id: `emergency_${Date.now()}`,
          type: 'emergency',
          payload: data as unknown as Record<string, unknown>,
          createdAt: new Date().toISOString(),
          retryCount: 0,
        });
        set({ isSubmitting: false });
        return {
          success: true,
          error: 'Emergency saved offline. Will be sent when connection is restored.',
        };
      }
    } catch (error) {
      set({ isSubmitting: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create emergency',
      };
    }
  },

  respondToEmergency: async (emergencyId) => {
    set({ isSubmitting: true, error: null });
    try {
      const isOnline = await connectivityService.isOnline();
      const payload = {
        emergencyId,
        responderId: 'responder_mock',
        responderName: 'Current User',
        responderMobile: '+919999999999',
        responderLatitude: 23.2599,
        responderLongitude: 77.4126,
      };

      if (isOnline) {
        const result = await emergencyRepository.respond(payload);
        if (result.success && result.data) {
          set({ response: result.data, isSubmitting: false });
          return { success: true };
        }
        set({ isSubmitting: false });
        return { success: false, error: result.error || 'Failed to respond' };
      } else {
        await syncManager.addPendingRequest({
          id: `response_${Date.now()}`,
          type: 'help_response',
          payload: payload as unknown as Record<string, unknown>,
          createdAt: new Date().toISOString(),
          retryCount: 0,
        });
        set({ isSubmitting: false });
        return {
          success: true,
          error: 'Response saved offline. Will be sent when connection is restored.',
        };
      }
    } catch (error) {
      set({ isSubmitting: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to respond',
      };
    }
  },

  cancelEmergency: async (id) => {
    try {
      await emergencyRepository.cancel(id);
      const emergencies = get().emergencies.filter((e) => e.id !== id);
      set({ emergencies });
    } catch {
      set({ error: 'Failed to cancel emergency' });
    }
  },

  clearCurrentEmergency: () => {
    set({ currentEmergency: null });
  },

  clearResponse: () => {
    set({ response: null });
  },

  clearError: () => {
    set({ error: null });
  },

  getSyncStatus: async () => {
    const status = await syncManager.getSyncStatus();
    set({
      syncStatus: {
        pending: status.pending,
        synced: 0,
        failed: 0,
        lastSync: status.lastSync,
      },
    });
  },

  reset: () => {
    set({
      emergencies: [],
      myEmergencies: [],
      currentEmergency: null,
      isLoading: false,
      isSubmitting: false,
      error: null,
      response: null,
    });
  },
}));
