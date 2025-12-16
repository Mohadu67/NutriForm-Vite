/**
 * Utilitaires pour gérer le SSR (Server-Side Rendering)
 */
import React from 'react';

// Vérifie si le code s'exécute côté client (navigateur)
export const isClient = typeof window !== 'undefined';

// Vérifie si le code s'exécute côté serveur
export const isServer = !isClient;

// Accès sécurisé à localStorage (retourne null côté serveur)
export const safeLocalStorage = {
  getItem: (key) => {
    if (isClient) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('localStorage.getItem failed:', e);
        return null;
      }
    }
    return null;
  },
  setItem: (key, value) => {
    if (isClient) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('localStorage.setItem failed:', e);
      }
    }
  },
  removeItem: (key) => {
    if (isClient) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('localStorage.removeItem failed:', e);
      }
    }
  },
  clear: () => {
    if (isClient) {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('localStorage.clear failed:', e);
      }
    }
  }
};

// Accès sécurisé à sessionStorage (retourne null côté serveur)
export const safeSessionStorage = {
  getItem: (key) => {
    if (isClient) {
      try {
        return sessionStorage.getItem(key);
      } catch (e) {
        console.warn('sessionStorage.getItem failed:', e);
        return null;
      }
    }
    return null;
  },
  setItem: (key, value) => {
    if (isClient) {
      try {
        sessionStorage.setItem(key, value);
      } catch (e) {
        console.warn('sessionStorage.setItem failed:', e);
      }
    }
  },
  removeItem: (key) => {
    if (isClient) {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn('sessionStorage.removeItem failed:', e);
      }
    }
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
