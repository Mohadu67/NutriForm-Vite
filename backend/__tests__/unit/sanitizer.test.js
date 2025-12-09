const { sanitizeProgram, sanitizeShortText, sanitizeLongText } = require('../../utils/sanitizer');

describe('Sanitizer - XSS Protection', () => {
  describe('sanitizeShortText', () => {
    it('devrait supprimer les balises script', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeShortText(input, 100);
      expect(result).toBe('Hello');
      expect(result).not.toContain('<script>');
    });

    it('devrait échapper les balises HTML dangereuses', () => {
      const input = '<img src=x onerror=alert("xss")>';
      const result = sanitizeShortText(input, 100);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('<img');
    });

    it('devrait limiter la longueur', () => {
      const input = 'A'.repeat(200);
      const result = sanitizeShortText(input, 50);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('devrait gérer les valeurs null/undefined', () => {
      expect(sanitizeShortText(null, 100)).toBe('');
      expect(sanitizeShortText(undefined, 100)).toBe('');
    });

    it('devrait supprimer les URLs javascript:', () => {
      const input = 'Click <a href="javascript:alert(1)">here</a>';
      const result = sanitizeShortText(input, 100);
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('<a');
    });

    it('devrait supprimer les attributs style dangereux', () => {
      const input = '<div style="background:url(javascript:alert(1))">Text</div>';
      const result = sanitizeShortText(input, 100);
      expect(result).not.toContain('style');
      expect(result).not.toContain('javascript:');
      expect(result).toBe('Text');
    });

    it('devrait supprimer les balises iframe', () => {
      const input = '<iframe src="https://evil.com"></iframe>Content';
      const result = sanitizeShortText(input, 100);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('evil.com');
      expect(result).toBe('Content');
    });

    it('devrait supprimer les event handlers (onclick, onload, etc.)', () => {
      const input = '<div onclick="alert(1)" onmouseover="alert(2)">Text</div>';
      const result = sanitizeShortText(input, 100);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onmouseover');
      expect(result).toBe('Text');
    });

    it('devrait gérer les tentatives d\'encodage', () => {
      const input = '<script>&#97;lert(1)</script>';
      const result = sanitizeShortText(input, 100);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });
  });

  describe('sanitizeLongText', () => {
    it('devrait autoriser certaines balises HTML basiques', () => {
      const input = '<p>Paragraph</p><b>Bold</b><i>Italic</i>';
      const result = sanitizeLongText(input, 5000);
      expect(result).toContain('<p>');
      expect(result).toContain('<b>');
      expect(result).toContain('<i>');
    });

    it('devrait supprimer les balises script dans longText', () => {
      const input = '<p>Text</p><script>alert("xss")</script>';
      const result = sanitizeLongText(input, 5000);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Text</p>');
    });

    it('devrait limiter la longueur du texte long', () => {
      const input = '<p>' + 'A'.repeat(6000) + '</p>';
      const result = sanitizeLongText(input, 5000);
      expect(result.length).toBeLessThanOrEqual(5000);
    });

    it('devrait autoriser les liens avec protocoles sécurisés', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeLongText(input, 5000);
      expect(result).toContain('https://example.com');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('devrait supprimer les liens javascript:', () => {
      const input = '<a href="javascript:alert(1)">Malicious</a>';
      const result = sanitizeLongText(input, 5000);
      expect(result).not.toContain('javascript:');
    });

    it('devrait autoriser les listes', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeLongText(input, 5000);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
    });
  });

  describe('sanitizeProgram', () => {
    it('devrait sanitizer tous les champs texte', () => {
      const maliciousProgram = {
        name: '<script>alert("xss")</script>Programme',
        description: '<img src=x onerror=alert(1)>Description',
        type: 'hiit',
        cycles: [
          {
            type: 'exercise',
            exerciseName: '<b>Push-up</b>',
            durationSec: 30
          }
        ]
      };

      const sanitized = sanitizeProgram(maliciousProgram);

      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.name).toBe('Programme');
      expect(sanitized.description).not.toContain('onerror');
      expect(sanitized.cycles[0].exerciseName).toBe('Push-up');
    });

    it('devrait limiter le nombre de tags à 10', () => {
      const program = {
        name: 'Test',
        type: 'hiit',
        tags: Array(20).fill('tag'),
        cycles: []
      };

      const sanitized = sanitizeProgram(program);
      expect(sanitized.tags.length).toBeLessThanOrEqual(10);
    });

    it('devrait valider coverImage URL', () => {
      const program1 = {
        name: 'Test',
        type: 'hiit',
        coverImage: 'javascript:alert(1)',
        cycles: []
      };

      const sanitized1 = sanitizeProgram(program1);
      expect(sanitized1.coverImage).toBeUndefined();

      const program2 = {
        name: 'Test',
        type: 'hiit',
        coverImage: 'https://valid.com/image.jpg',
        cycles: []
      };

      const sanitized2 = sanitizeProgram(program2);
      expect(sanitized2.coverImage).toBe('https://valid.com/image.jpg');
    });

    it('devrait limiter estimatedDuration entre 0 et 300', () => {
      const program1 = {
        name: 'Test',
        type: 'hiit',
        estimatedDuration: -10,
        cycles: []
      };

      const sanitized1 = sanitizeProgram(program1);
      expect(sanitized1.estimatedDuration).toBeGreaterThanOrEqual(0);

      const program2 = {
        name: 'Test',
        type: 'hiit',
        estimatedDuration: 500,
        cycles: []
      };

      const sanitized2 = sanitizeProgram(program2);
      expect(sanitized2.estimatedDuration).toBeLessThanOrEqual(300);
    });

    it('devrait limiter estimatedCalories entre 0 et 2000', () => {
      const program1 = {
        name: 'Test',
        type: 'hiit',
        estimatedCalories: -100,
        cycles: []
      };

      const sanitized1 = sanitizeProgram(program1);
      expect(sanitized1.estimatedCalories).toBeGreaterThanOrEqual(0);

      const program2 = {
        name: 'Test',
        type: 'hiit',
        estimatedCalories: 3000,
        cycles: []
      };

      const sanitized2 = sanitizeProgram(program2);
      expect(sanitized2.estimatedCalories).toBeLessThanOrEqual(2000);
    });

    it('devrait sanitizer les champs de cycles', () => {
      const program = {
        name: 'Test',
        type: 'hiit',
        cycles: [
          {
            type: 'exercise',
            exerciseName: '<script>alert("xss")</script>Burpees',
            durationSec: 30,
            notes: '<img src=x onerror=alert(1)>Instructions'
          }
        ]
      };

      const sanitized = sanitizeProgram(program);
      expect(sanitized.cycles[0].exerciseName).not.toContain('<script>');
      expect(sanitized.cycles[0].exerciseName).toBe('Burpees');
      expect(sanitized.cycles[0].notes).not.toContain('onerror');
    });

    it('devrait limiter muscleGroups à 15 items', () => {
      const program = {
        name: 'Test',
        type: 'hiit',
        muscleGroups: Array(20).fill('muscle'),
        cycles: []
      };

      const sanitized = sanitizeProgram(program);
      expect(sanitized.muscleGroups.length).toBeLessThanOrEqual(15);
    });

    it('devrait limiter equipment à 10 items', () => {
      const program = {
        name: 'Test',
        type: 'hiit',
        equipment: Array(15).fill('item'),
        cycles: []
      };

      const sanitized = sanitizeProgram(program);
      expect(sanitized.equipment.length).toBeLessThanOrEqual(10);
    });

    it('devrait accepter les chemins relatifs pour coverImage', () => {
      const program = {
        name: 'Test',
        type: 'hiit',
        coverImage: '/uploads/image.jpg',
        cycles: []
      };

      const sanitized = sanitizeProgram(program);
      expect(sanitized.coverImage).toBe('/uploads/image.jpg');
    });

    it('devrait sanitizer instructions et tips', () => {
      const program = {
        name: 'Test',
        type: 'hiit',
        instructions: '<script>alert(1)</script>Follow these steps',
        tips: '<img src=x onerror=alert(1)>Stay hydrated',
        cycles: []
      };

      const sanitized = sanitizeProgram(program);
      expect(sanitized.instructions).not.toContain('<script>');
      expect(sanitized.tips).not.toContain('onerror');
    });

    it('devrait gérer les valeurs non-string gracieusement', () => {
      const program = {
        name: 123,
        description: null,
        type: 'hiit',
        cycles: []
      };

      const sanitized = sanitizeProgram(program);
      expect(typeof sanitized.name).toBe('string');
      expect(sanitized.description).toBe('');
    });
  });

  describe('Protection contre injection avancée', () => {
    it('devrait protéger contre data URIs malicieuses', () => {
      const input = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
      const result = sanitizeShortText(input, 100);
      expect(result).not.toContain('data:');
    });

    it('devrait protéger contre vbscript:', () => {
      const input = '<a href="vbscript:msgbox(1)">Click</a>';
      const result = sanitizeShortText(input, 100);
      expect(result).not.toContain('vbscript:');
    });

    it('devrait protéger contre les tentatives d\'injection SQL dans les strings', () => {
      const input = "'; DROP TABLE users; --";
      const result = sanitizeShortText(input, 100);
      // Devrait être échappé mais conservé (pas d'exécution SQL dans sanitizer)
      expect(result).toContain("'");
      expect(result.length).toBeLessThan(100);
    });

    it('devrait gérer les caractères Unicode dangereux', () => {
      const input = 'Test\u0000\u0001\u0002';
      const result = sanitizeShortText(input, 100);
      expect(result).not.toContain('\u0000');
    });
  });
});
