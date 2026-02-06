/**
 * Tests unitaires pour AuthContext
 *
 * Pour lancer les tests :
 * npm test src/contexts/__tests__/AuthContext.test.js
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth, AuthProvider } from '../AuthContext';
import authService from '../../api/auth';
import { secureStorage, storage } from '../../services/storageService';

// Mock des dépendances
jest.mock('../../api/auth');
jest.mock('../../services/storageService');

describe('AuthContext', () => {
  beforeEach(() => {
    // Reset des mocks avant chaque test
    jest.clearAllMocks();
    secureStorage.getToken.mockResolvedValue(null);
    secureStorage.setToken.mockResolvedValue();
    secureStorage.setRefreshToken.mockResolvedValue();
    secureStorage.clearAll.mockResolvedValue();
    storage.get.mockResolvedValue(null);
    storage.set.mockResolvedValue();
    storage.remove.mockResolvedValue();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  describe('Initialisation', () => {
    it('devrait initialiser avec un state non authentifié si pas de token', async () => {
      secureStorage.getToken.mockResolvedValue(null);

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('devrait charger l\'utilisateur si un token existe', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test User' };

      secureStorage.getToken.mockResolvedValue('fake-token');
      storage.get.mockResolvedValue(mockUser);
      authService.getCurrentUser.mockResolvedValue(mockUser);

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Login', () => {
    it('devrait se connecter avec succès', async () => {
      const mockResponse = {
        token: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'test@test.com', name: 'Test User' },
      };

      authService.login.mockResolvedValue(mockResponse);
      secureStorage.getToken.mockResolvedValue(null);

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
      await waitForNextUpdate(); // Attendre l'initialisation

      await act(async () => {
        await result.current.login('test@test.com', 'password');
      });

      expect(authService.login).toHaveBeenCalledWith('test@test.com', 'password');
      expect(secureStorage.setToken).toHaveBeenCalledWith('access-token');
      expect(secureStorage.setRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('devrait gérer les erreurs de connexion', async () => {
      const mockError = {
        response: {
          data: { message: 'Identifiants incorrects' },
        },
      };

      authService.login.mockRejectedValue(mockError);
      secureStorage.getToken.mockResolvedValue(null);

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
      await waitForNextUpdate();

      await act(async () => {
        try {
          await result.current.login('test@test.com', 'wrong-password');
        } catch (error) {
          // Erreur attendue
        }
      });

      expect(result.current.error).toBe('Identifiants incorrects');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Register', () => {
    it('devrait s\'inscrire avec succès', async () => {
      const userData = {
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
      };

      const mockResponse = {
        token: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '2', ...userData },
      };

      authService.register.mockResolvedValue(mockResponse);
      secureStorage.getToken.mockResolvedValue(null);

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
      await waitForNextUpdate();

      await act(async () => {
        await result.current.register(userData);
      });

      expect(authService.register).toHaveBeenCalledWith(userData);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user.email).toBe(userData.email);
    });
  });

  describe('Logout', () => {
    it('devrait se déconnecter avec succès', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test User' };

      secureStorage.getToken.mockResolvedValue('fake-token');
      authService.getCurrentUser.mockResolvedValue(mockUser);
      authService.logout.mockResolvedValue();

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
      await waitForNextUpdate();

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(authService.logout).toHaveBeenCalled();
      expect(secureStorage.clearAll).toHaveBeenCalled();
      expect(storage.remove).toHaveBeenCalledWith('user_data');
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('RefreshUser', () => {
    it('devrait rafraîchir les données utilisateur', async () => {
      const initialUser = { id: '1', email: 'test@test.com', name: 'Test User' };
      const updatedUser = { id: '1', email: 'test@test.com', name: 'Updated User' };

      secureStorage.getToken.mockResolvedValue('fake-token');
      authService.getCurrentUser.mockResolvedValueOnce(initialUser);

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
      await waitForNextUpdate();

      expect(result.current.user.name).toBe('Test User');

      authService.getCurrentUser.mockResolvedValueOnce(updatedUser);

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user.name).toBe('Updated User');
    });
  });

  describe('ClearError', () => {
    it('devrait effacer les erreurs', async () => {
      const mockError = {
        response: {
          data: { message: 'Erreur test' },
        },
      };

      authService.login.mockRejectedValue(mockError);
      secureStorage.getToken.mockResolvedValue(null);

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
      await waitForNextUpdate();

      await act(async () => {
        try {
          await result.current.login('test@test.com', 'wrong');
        } catch (e) {}
      });

      expect(result.current.error).toBe('Erreur test');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});

describe('useAuth Hook', () => {
  it('devrait throw une erreur si utilisé hors AuthProvider', () => {
    // Supprimer les erreurs de console pour ce test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');

    console.error = originalError;
  });
});
