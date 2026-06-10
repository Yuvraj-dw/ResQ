import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import type { ConnectionStatus } from '../../types/common';

export interface IConnectivityService {
  isOnline(): Promise<boolean>;
  getConnectionStatus(): Promise<ConnectionStatus>;
  subscribe(callback: (status: ConnectionStatus) => void): () => void;
}

class ConnectivityService implements IConnectivityService {
  async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch {
      return true;
    }
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) return 'offline';
      if (state.isInternetReachable === false) return 'poor';
      return 'online';
    } catch {
      return 'online';
    }
  }

  subscribe(callback: (status: ConnectionStatus) => void): () => void {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (!state.isConnected) {
        callback('offline');
      } else if (state.isInternetReachable === false) {
        callback('poor');
      } else {
        callback('online');
      }
    });
    return unsubscribe;
  }
}

const connectivityService = new ConnectivityService();
export default connectivityService;
