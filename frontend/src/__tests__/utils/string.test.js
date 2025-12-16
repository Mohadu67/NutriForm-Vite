import { describe, it, expect } from 'vitest';
import { capitalize, capitalizeWords, formatDisplayName } from '../../shared/utils/string';

describe('string utilities', () => {
  describe('capitalize', () => {
    it('capitalizes first letter of a word', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('lowercases remaining letters', () => {
      expect(capitalize('HELLO')).toBe('Hello');
    });

    it('handles mixed case', () => {
      expect(capitalize('hELLo')).toBe('Hello');
    });

    it('returns empty string for null', () => {
      expect(capitalize(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(capitalize(undefined)).toBe('');
    });

    it('returns original value for non-string', () => {
      expect(capitalize(123)).toBe(123);
    });

    it('handles single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('handles empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('capitalizeWords', () => {
    it('capitalizes each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
    });

    it('handles single word', () => {
      expect(capitalizeWords('hello')).toBe('Hello');
    });

    it('lowercases other letters in each word', () => {
      expect(capitalizeWords('HELLO WORLD')).toBe('Hello World');
    });

    it('handles mixed case', () => {
      expect(capitalizeWords('hELLo wORLD')).toBe('Hello World');
    });

    it('returns empty string for null', () => {
      expect(capitalizeWords(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(capitalizeWords(undefined)).toBe('');
    });

    it('handles multiple spaces correctly', () => {
      expect(capitalizeWords('hello  world')).toBe('Hello  World');
    });
  });

  describe('formatDisplayName', () => {
    it('returns pseudo when available', () => {
      const user = { pseudo: 'john_doe', prenom: 'John', email: 'john@example.com' };
      expect(formatDisplayName(user)).toBe('John_doe');
    });

    it('returns prenom when no pseudo', () => {
      const user = { prenom: 'john', email: 'john@example.com' };
      expect(formatDisplayName(user)).toBe('John');
    });

    it('returns email username when no pseudo or prenom', () => {
      const user = { email: 'john.doe@example.com' };
      expect(formatDisplayName(user)).toBe('John.doe');
    });

    it('returns fallback when user is null', () => {
      expect(formatDisplayName(null)).toBe('Utilisateur');
    });

    it('returns fallback when user is undefined', () => {
      expect(formatDisplayName(undefined)).toBe('Utilisateur');
    });

    it('returns custom fallback', () => {
      expect(formatDisplayName(null, 'Anonymous')).toBe('Anonymous');
    });

    it('returns fallback when no name available', () => {
      const user = {};
      expect(formatDisplayName(user)).toBe('Utilisateur');
    });

    it('capitalizes compound names', () => {
      const user = { prenom: 'jean pierre' };
      expect(formatDisplayName(user)).toBe('Jean Pierre');
    });
  });
});
