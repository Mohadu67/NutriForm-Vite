/**
 * Utilitaires pour gérer le SSR (Server-Side Rendering)
 */
import React from 'react';
import { storage, sessionStorage as sessionStore } from '../shared/utils/storage.js';

// Vérifie si le code s'exécute côté client (navigateur)
export const isClient = typeof window !== 'undefined';

// Vérifie si le code s'exécute côté serveur
export const isServer = !isClient;

// Accès sécurisé à localStorage (retourne null côté serveur)
// DEPRECATED: Utiliser directement storage de shared/utils/storage.js
export const safeLocalStorage = {
  getItem: (key) => {
    if (!isClient) return null;
    try {
      // Retourner la valeur brute pour compatibilité (storage.get parse le JSON)
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage.getItem failed:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    if (!isClient) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage.setItem failed:', e);
    }
  },
  removeItem: (key) => {
    if (!isClient) return;
    storage.remove(key);
  },
  clear: () => {
    if (!isClient) return;
    storage.clear();
  }
};

// Accès sécurisé à sessionStorage (retourne null côté serveur)
// DEPRECATED: Utiliser directement sessionStore de shared/utils/storage.js
export const safeSessionStorage = {
  getItem: (key) => {
    if (!isClient) return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      console.warn('sessionStorage.getItem failed:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    if (!isClient) return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('sessionStorage.setItem failed:', e);
    }
  },
  removeItem: (key) => {
    if (!isClient) return;
    sessionStore.remove(key);
  }
};

// Hook personnalisé pour exécuter du code uniquement côté client
export function useClientEffect(effect, deps) {
  if (isClient && typeof React !== 'undefined') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(effect, deps);
  }
}

// Wrapper pour window (retourne undefined côté serveur)
export const safeWindow = isClient ? window : undefined;
