import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePremiumStatus } from '../../hooks/usePremiumStatus';

// Mock fetch
global.fetch = vi.fn();

describe('usePremiumStatus', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { mockStorage[key] = value; });
    vi.clearAllMocks();
  });

  describe('isPremium', () => {
    it('should return false when no subscription data', () => {
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.isPremium).toBe(false);
    });

    it('should return true when subscription tier is premium', () => {
      mockStorage['subscriptionStatus'] = JSON.stringify({ tier: 'premium', hasSubscription: true });
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.isPremium).toBe(true);
    });

    it('should return true when user role is admin', () => {
      mockStorage['user'] = JSON.stringify({ role: 'admin' });
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.isPremium).toBe(true);
    });

    it('should return true when user role is coach', () => {
      mockStorage['user'] = JSON.stringify({ role: 'coach' });
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.isPremium).toBe(true);
    });
  });

  describe('roles', () => {
    it('should detect admin role', () => {
      mockStorage['user'] = JSON.stringify({ role: 'admin' });
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isCoach).toBe(false);
      expect(result.current.isStaff).toBe(true);
    });

    it('should detect support role', () => {
      mockStorage['user'] = JSON.stringify({ role: 'support' });
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.isSupport).toBe(true);
      expect(result.current.isStaff).toBe(true);
    });

    it('should return user role by default', () => {
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.role).toBe('user');
    });
  });

  describe('limits', () => {
    it('should return free limits for non-premium users', () => {
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.limits.programs).toBe(3);
      expect(result.current.limits.messages).toBe(50);
      expect(result.current.limits.aiChat).toBe(false);
    });

    it('should return unlimited for premium users', () => {
      mockStorage['subscriptionStatus'] = JSON.stringify({ tier: 'premium' });
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.limits.programs).toBe(Infinity);
      expect(result.current.limits.aiChat).toBe(true);
    });
  });

  describe('canAccess', () => {
    it('should allow free features for all users', () => {
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.canAccess('dashboard')).toBe(true);
      expect(result.current.canAccess('calculators')).toBe(true);
      expect(result.current.canAccess('profile')).toBe(true);
    });

    it('should deny premium features for free users', () => {
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.canAccess('matching')).toBe(false);
      expect(result.current.canAccess('aiChat')).toBe(false);
    });

    it('should allow premium features for premium users', () => {
      mockStorage['subscriptionStatus'] = JSON.stringify({ tier: 'premium' });
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.canAccess('matching')).toBe(true);
      expect(result.current.canAccess('aiChat')).toBe(true);
    });

    it('should allow all features for admin', () => {
      mockStorage['user'] = JSON.stringify({ role: 'admin' });
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.canAccess('matching')).toBe(true);
      expect(result.current.canAccess('aiChat')).toBe(true);
      expect(result.current.canAccess('advancedStats')).toBe(true);
    });
  });

  describe('tier', () => {
    it('should return free tier by default', () => {
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.tier).toBe('free');
    });

    it('should return premium tier when subscribed', () => {
      mockStorage['subscriptionStatus'] = JSON.stringify({ tier: 'premium' });
      const { result } = renderHook(() => usePremiumStatus());
      expect(result.current.tier).toBe('premium');
    });
  });
});
