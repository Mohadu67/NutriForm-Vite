import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'harmonith_';

// Secure storage for sensitive data (tokens)
export const secureStorage = {
  /**
   * Store authentication token securely
   * @param {string} token - The authentication token
   */
  async setToken(token) {
    try {
      await SecureStore.setItemAsync(`${KEY_PREFIX}auth_token`, token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw new Error('Failed to store authentication token');
    }
  },

  /**
   * Retrieve authentication token
   * @returns {Promise<string|null>} The stored token or null
   */
  async getToken() {
    try {
      return await SecureStore.getItemAsync(`${KEY_PREFIX}auth_token`);
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },

  /**
   * Remove authentication token
   */
  async removeToken() {
    try {
      await SecureStore.deleteItemAsync(`${KEY_PREFIX}auth_token`);
    } catch (error) {
      console.error('Error removing token:', error);
      throw new Error('Failed to remove authentication token');
    }
  },

  /**
   * Store refresh token securely
   * @param {string} token - The refresh token
   */
  async setRefreshToken(token) {
    try {
      await SecureStore.setItemAsync(`${KEY_PREFIX}refresh_token`, token);
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  },

  /**
   * Retrieve refresh token
   * @returns {Promise<string|null>} The stored refresh token or null
   */
  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(`${KEY_PREFIX}refresh_token`);
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  },

  /**
   * Remove refresh token
   */
  async removeRefreshToken() {
    try {
      await SecureStore.deleteItemAsync(`${KEY_PREFIX}refresh_token`);
    } catch (error) {
      console.error('Error removing refresh token:', error);
      throw new Error('Failed to remove refresh token');
    }
  },

  /**
   * Clear all secure storage data
   */
  async clearAll() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(`${KEY_PREFIX}auth_token`).catch(() => {}),
        SecureStore.deleteItemAsync(`${KEY_PREFIX}refresh_token`).catch(() => {}),
      ]);
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      throw new Error('Failed to clear secure storage');
    }
  },
};

// Regular storage for non-sensitive data
export const storage = {
  /**
   * Store data in AsyncStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   */
  async set(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(`${KEY_PREFIX}${key}`, jsonValue);
    } catch (error) {
      console.error(`Error storing data for key "${key}":`, error);
      throw new Error(`Failed to store data for key "${key}"`);
    }
  },

  /**
   * Retrieve data from AsyncStorage
   * @param {string} key - Storage key
   * @returns {Promise<any|null>} The stored value (JSON parsed) or null
   */
  async get(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(`${KEY_PREFIX}${key}`);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving data for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Remove data from AsyncStorage
   * @param {string} key - Storage key
   */
  async remove(key) {
    try {
      await AsyncStorage.removeItem(`${KEY_PREFIX}${key}`);
    } catch (error) {
      console.error(`Error removing data for key "${key}":`, error);
      throw new Error(`Failed to remove data for key "${key}"`);
    }
  },

  /**
   * Clear all AsyncStorage data with harmonith_ prefix
   */
  async clear() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const harmonithKeys = allKeys.filter(key => key.startsWith(KEY_PREFIX));

      if (harmonithKeys.length > 0) {
        await AsyncStorage.multiRemove(harmonithKeys);
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  },
};
