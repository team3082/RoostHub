import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export function useTabletConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkConnection = async () => {
    try {
      const connected = await invoke<boolean>('is_tablet_connected');
      setIsConnected(connected);
    } catch (error) {
      console.error('Failed to check tablet connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Check connection immediately
    checkConnection();

    // Listen for connection change events
    const unlisten = listen<boolean>('tablet-connection-changed', (event) => {
      console.log('Tablet connection changed:', event.payload);
      setIsConnected(event.payload);
      setIsLoading(false);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return { isConnected, isLoading, refresh: checkConnection };
}