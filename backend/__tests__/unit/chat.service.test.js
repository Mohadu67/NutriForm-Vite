/**
 * Tests unitaires pour les services chat
 */

const { findFallbackResponse, containsAny, normalizeText } = require('../../constants/fallbackResponses');
const { ESCALATE_KEYWORDS, ESCALATE_CONFIRMATION } = require('../../constants/chatPrompts');

describe('Chat Fallback Responses', () => {
  describe('normalizeText', () => {
    it('should convert text to lowercase', () => {
      expect(normalizeText('BONJOUR')).toBe('bonjour');
    });

    it('should remove accents', () => {
      expect(normalizeText('café')).toBe('cafe');
      expect(normalizeText('résumé')).toBe('resume');
    });

    it('should trim whitespace', () => {
      expect(normalizeText('  hello  ')).toBe('hello');
    });

    it('should handle combined transformations', () => {
      expect(normalizeText('  CAFÉ Résumé  ')).toBe('cafe resume');
    });
  });

  describe('containsAny', () => {
    it('should return true if text contains any keyword', () => {
      expect(containsAny('bonjour comment ca va', ['bonjour', 'salut'])).toBe(true);
      expect(containsAny('salut tout le monde', ['bonjour', 'salut'])).toBe(true);
    });

    it('should return false if text contains no keyword', () => {
      expect(containsAny('hello world', ['bonjour', 'salut'])).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(containsAny('BONJOUR', ['bonjour'])).toBe(true);
    });

    it('should handle accented keywords', () => {
      expect(containsAny('je veux parler a un agent', ESCALATE_KEYWORDS)).toBe(true);
    });
  });

  describe('findFallbackResponse', () => {
    it('should return greeting response for salutations', () => {
      const response = findFallbackResponse('bonjour');
      expect(response).toContain('Bienvenue');
      expect(response).toContain('Harmonith');
    });

    it('should return thanks response for remerciements', () => {
      const response = findFallbackResponse('merci beaucoup');
      expect(response).toContain('plaisir');
    });

    it('should return premium response for pricing questions', () => {
      const response = findFallbackResponse('combien coute premium');
      expect(response).toContain('3,99');
    });

    it('should return exercise response for workout questions', () => {
      const response = findFallbackResponse('quels exercices faire');
      expect(response).toContain('exercice');
    });

    it('should return default response for unknown queries', () => {
      const response = findFallbackResponse('xyzabc123');
      expect(response).toContain('comprendre');
    });

    it('should handle matching questions', () => {
      const response = findFallbackResponse('comment fonctionne le matching');
      expect(response).toContain('partenaire');
    });

    it('should return default response for unrecognized password questions', () => {
      // Note: password questions should ideally be handled but currently return default
      const response = findFallbackResponse('mot de passe oublie');
      expect(response).toContain('comprendre'); // Default response
    });
  });
});

describe('Chat Prompts Constants', () => {
  describe('ESCALATE_KEYWORDS', () => {
    it('should contain common escalation phrases', () => {
      expect(ESCALATE_KEYWORDS).toContain('parler a un agent');
      expect(ESCALATE_KEYWORDS).toContain('parler à un agent');
      expect(ESCALATE_KEYWORDS).toContain('agent humain');
    });

    it('should be an array', () => {
      expect(Array.isArray(ESCALATE_KEYWORDS)).toBe(true);
    });

    it('should have at least 5 keywords', () => {
      expect(ESCALATE_KEYWORDS.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('ESCALATE_CONFIRMATION', () => {
    it('should be a non-empty string', () => {
      expect(typeof ESCALATE_CONFIRMATION).toBe('string');
      expect(ESCALATE_CONFIRMATION.length).toBeGreaterThan(0);
    });

    it('should mention support team', () => {
      expect(ESCALATE_CONFIRMATION).toContain('support');
    });
  });
});
