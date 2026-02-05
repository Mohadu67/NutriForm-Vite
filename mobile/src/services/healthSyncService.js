/**
 * Health Sync Service - Automatic synchronization of daily health data to backend
 * Syncs calories from Apple Health / Google Fit to the backend's DailyHealthData
 */

import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import healthService from './healthService';
import client from '../api/client';

const SYNC_STORAGE_KEY = 'health_sync_state';
const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

class HealthSyncService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncTimer = null;
    this.appState = null;
  }

  /**
   * Initialize the sync service
   */
  async initialize(appStateSubscription) {
    try {
      console.log('[HealthSync] Initializing...');

      // Check if health service is available
      const isAvailable = await healthService.initialize();
      if (!isAvailable) {
        console.warn('[HealthSync] Health service not available');
        return false;
      }

      // Check if we have permissions
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.warn('[HealthSync] No health permissions granted');
        return false;
      }

      // Load last sync time
      await this.loadSyncState();

      // Start periodic sync
      this.startPeriodicSync();

      return true;
    } catch (error) {
      console.error('[HealthSync] Initialization error:', error);
      return false;
    }
  }

  /**
   * Check if we have permissions to access health data
   */
  async checkPermissions() {
    try {
      if (Platform.OS === 'android' && healthService.isAvailable) {
        const permissions = await healthService.checkPermissions();
        return permissions && permissions.length > 0;
      }

      // iOS - if healthService is available, assume permissions were granted
      return healthService.isAvailable;
    } catch (error) {
      console.error('[HealthSync] Check permissions error:', error);
      return false;
    }
  }

  /**
   * Request permissions to access health data
   */
  async requestPermissions() {
    try {
      const permissions = await healthService.requestPermissions();
      return permissions && permissions.length > 0;
    } catch (error) {
      console.error('[HealthSync] Request permissions error:', error);
      return false;
    }
  }

  /**
   * Get start of day in local time
   */
  getStartOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get end of day in local time
   */
  getEndOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Sync health data for a specific date
   */
  async syncDateData(date = new Date()) {
    if (!(await this.checkPermissions())) {
      console.warn('[HealthSync] No permissions to sync');
      return null;
    }

    try {
      const startOfDay = this.getStartOfDay(date);
      const endOfDay = this.getEndOfDay(date);

      console.log(`[HealthSync] Syncing data for ${startOfDay.toISOString().split('T')[0]}`);

      // Get health data
      const caloriesData = await healthService.getCaloriesBurned(startOfDay, endOfDay);
      const stepsData = await healthService.getSteps(startOfDay, endOfDay);
      const distanceData = await healthService.getDistance(startOfDay, endOfDay);

      const caloriesBurned = caloriesData?.active || 0;
      const steps = stepsData?.total || 0;
      const distance = distanceData?.meters || 0;

      console.log(`[HealthSync] Data: ${caloriesBurned} cal, ${steps} steps, ${distance}m`);

      // Only sync if we have calorie data
      if (caloriesBurned === 0 && steps === 0) {
        console.log('[HealthSync] No health data to sync for this day');
        return null;
      }

      // Sync to backend
      const response = await client.post('/health/sync', {
        date: startOfDay.toISOString(),
        caloriesBurned: Math.round(caloriesBurned),
        steps: Math.round(steps),
        distance: distance,
        source: Platform.OS === 'ios' ? 'healthkit' : 'googlefit'
      });

      if (response?.data?.success) {
        console.log('[HealthSync] Sync successful for', startOfDay.toISOString().split('T')[0]);
        return response.data.data;
      }

      console.warn('[HealthSync] Sync returned unexpected response:', response?.data);
      return null;
    } catch (error) {
      console.error('[HealthSync] Sync error:', error.message || error);
      return null;
    }
  }

  /**
   * Sync today's health data
   */
  async syncTodayData() {
    return this.syncDateData(new Date());
  }

  /**
   * Sync last N days of health data (for catchup)
   */
  async syncLastNDays(days = 7) {
    console.log(`[HealthSync] Syncing last ${days} days`);

    const results = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      try {
        const result = await this.syncDateData(date);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.warn(`[HealthSync] Failed to sync day ${i}:`, error);
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync() {
    // Clear any existing timer
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // Sync immediately on start
    this.syncTodayData().catch(err => console.error('[HealthSync] Initial sync error:', err));

    // Then sync periodically
    this.syncTimer = setInterval(() => {
      this.syncTodayData().catch(err => console.error('[HealthSync] Periodic sync error:', err));
    }, SYNC_INTERVAL_MS);

    console.log('[HealthSync] Periodic sync started (every 30 minutes)');
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('[HealthSync] Periodic sync stopped');
    }
  }

  /**
   * Handle app state change (foreground/background)
   */
  handleAppStateChange(nextAppState) {
    if (nextAppState === 'active') {
      // App came to foreground - sync immediately
      console.log('[HealthSync] App came to foreground, syncing...');
      this.syncTodayData().catch(err => console.error('[HealthSync] Foreground sync error:', err));
    }
  }

  /**
   * Save sync state to storage
   */
  async saveSyncState() {
    try {
      await AsyncStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify({
        lastSyncTime: this.lastSyncTime,
      }));
    } catch (error) {
      console.error('[HealthSync] Save state error:', error);
    }
  }

  /**
   * Load sync state from storage
   */
  async loadSyncState() {
    try {
      const state = await AsyncStorage.getItem(SYNC_STORAGE_KEY);
      if (state) {
        const parsed = JSON.parse(state);
        this.lastSyncTime = parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null;
      }
    } catch (error) {
      console.error('[HealthSync] Load state error:', error);
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopPeriodicSync();
  }
}

// Singleton instance
const healthSyncService = new HealthSyncService();

export default healthSyncService;
