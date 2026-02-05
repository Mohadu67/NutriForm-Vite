/**
 * useHealthSync - Hook for automatic health data synchronization
 * Handles permission requests, periodic syncing, and app state changes
 */

import { useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import healthSyncService from '../services/healthSyncService';

export default function useHealthSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);

  /**
   * Initialize health sync on mount
   */
  useEffect(() => {
    let mounted = true;
    let appStateSubscription = null;

    const initSync = async () => {
      try {
        console.log('[useHealthSync] Initializing health sync...');

        // Initialize health sync service
        const initialized = await healthSyncService.initialize();

        if (mounted) {
          setIsInitialized(initialized);

          if (initialized) {
            // Check permissions
            const hasPerms = await healthSyncService.checkPermissions();
            setHasPermission(hasPerms);

            if (hasPerms) {
              // Start listening for app state changes
              appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

              // Update status
              const status = healthSyncService.getStatus();
              setLastSyncTime(status.lastSyncTime);
            }
          } else {
            setError('Health service not available');
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('[useHealthSync] Init error:', err);
          setError(err.message || 'Failed to initialize health sync');
        }
      }
    };

    initSync();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
    };
  }, []);

  /**
   * Handle app state changes (foreground/background)
   */
  const handleAppStateChange = useCallback((nextAppState) => {
    setAppState(nextAppState);

    if (nextAppState === 'active') {
      // App came to foreground
      console.log('[useHealthSync] App is active, syncing health data...');
      syncNow();
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background
      console.log('[useHealthSync] App is in background');
    }
  }, []);

  /**
   * Request health data permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      setError(null);
      setIsSyncing(true);

      const granted = await healthSyncService.requestPermissions();

      if (granted) {
        setHasPermission(true);

        // Start sync after permissions granted
        const status = healthSyncService.getStatus();
        setLastSyncTime(status.lastSyncTime);

        // Set up app state listener
        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        // Perform initial sync
        await syncNow();

        return true;
      } else {
        setError('Permissions not granted');
        return false;
      }
    } catch (err) {
      console.error('[useHealthSync] Request permissions error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [handleAppStateChange]);

  /**
   * Manually trigger sync
   */
  const syncNow = useCallback(async () => {
    if (!hasPermission) {
      console.warn('[useHealthSync] No permissions to sync');
      return false;
    }

    try {
      setIsSyncing(true);
      setError(null);

      const result = await healthSyncService.syncTodayData();

      if (result) {
        const status = healthSyncService.getStatus();
        setLastSyncTime(status.lastSyncTime);
        console.log('[useHealthSync] Sync successful');
        return true;
      } else {
        console.warn('[useHealthSync] Sync returned no data');
        return false;
      }
    } catch (err) {
      console.error('[useHealthSync] Sync error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [hasPermission]);

  /**
   * Sync last N days
   */
  const syncLastDays = useCallback(async (days = 7) => {
    if (!hasPermission) {
      console.warn('[useHealthSync] No permissions to sync');
      return false;
    }

    try {
      setIsSyncing(true);
      setError(null);

      await healthSyncService.syncLastNDays(days);

      const status = healthSyncService.getStatus();
      setLastSyncTime(status.lastSyncTime);
      console.log(`[useHealthSync] Synced last ${days} days`);
      return true;
    } catch (err) {
      console.error('[useHealthSync] Sync days error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [hasPermission]);

  return {
    // State
    isInitialized,
    isSyncing,
    hasPermission,
    lastSyncTime,
    appState,
    error,

    // Actions
    requestPermissions,
    syncNow,
    syncLastDays,
  };
}
