import { useState, useEffect, useCallback } from 'react';
import type { ConnectionStatus } from '../types/common';
import connectivityService from '../services/connectivity/ConnectivityService';

export function useConnectivity() {
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = connectivityService.subscribe((newStatus) => {
      setStatus(newStatus);
      setIsOnline(newStatus === 'online');
    });

    connectivityService.getConnectionStatus().then((s) => {
      setStatus(s);
      setIsOnline(s === 'online');
    });

    return unsubscribe;
  }, []);

  const checkNow = useCallback(async () => {
    const s = await connectivityService.getConnectionStatus();
    setStatus(s);
    setIsOnline(s === 'online');
  }, []);

  return { status, isOnline, checkNow };
}
