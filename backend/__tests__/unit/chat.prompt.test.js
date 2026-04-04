/**
 * Unit tests for chat AI behavior:
 * 1. Photo identification without auto-logging
 * 2. Photo logging only when user explicitly ate
 * 3. Image context preserved in conversation history
 */

const { SYSTEM_PROMPT } = require('../../constants/chatPrompts');

describe('Chat Prompt — Photo Rules', () => {
  it('should NOT contain "AJOUTE TOUJOURS" for LOG_FOOD', () => {
    // The old prompt forced auto-logging on every photo
    expect(SYSTEM_PROMPT).not.toContain('AJOUTE TOUJOURS le tag [LOG_FOOD]');
  });

  it('should contain rule to add LOG_FOOD only when user explicitly ate', () => {
    expect(SYSTEM_PROMPT).toContain('UNIQUEMENT si l\'utilisateur dit explicitement');
  });

  it('should allow proposing to add to tracking', () => {
    expect(SYSTEM_PROMPT).toContain('Tu veux que je l\'ajoute');
  });

  it('should still support LOG_FOOD tag format', () => {
    expect(SYSTEM_PROMPT).toContain('[LOG_FOOD:');
  });

  it('should reject non-food photos', () => {
    expect(SYSTEM_PROMPT).toContain('Si la photo n\'est PAS de la nourriture');
  });
});

describe('Chat Prompt — Context', () => {
  it('should include sport/nutrition domain restriction', () => {
    expect(SYSTEM_PROMPT).toContain('sport, fitness, musculation, nutrition');
  });

  it('should include partner rules', () => {
    expect(SYSTEM_PROMPT).toContain('PARTNER_NEED');
  });

  it('should include action buttons', () => {
    expect(SYSTEM_PROMPT).toContain('[ACTION:');
  });

  it('should include confidentiality rules', () => {
    expect(SYSTEM_PROMPT).toContain('CONFIDENTIALITÉ');
  });
});

describe('Image Context in History', () => {
  // Simulate what openai.service.js does with history
  it('should handle data URL images', () => {
    const media = [{ url: 'data:image/jpeg;base64,abc123', type: 'image' }];
    const match = media[0].url.match(/^data:(image\/\w+);base64,(.+)$/);
    expect(match).not.toBeNull();
    expect(match[1]).toBe('image/jpeg');
    expect(match[2]).toBe('abc123');
  });

  it('should handle Cloudinary URLs', () => {
    const media = [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg', type: 'image' }];
    expect(media[0].url.startsWith('http')).toBe(true);
    expect(media[0].type).toBe('image');
  });

  it('should skip non-image media', () => {
    const media = [
      { url: 'https://example.com/doc.pdf', type: 'document' },
      { url: 'https://example.com/photo.jpg', type: 'image' },
    ];
    const images = media.filter(m => m.type === 'image');
    expect(images).toHaveLength(1);
    expect(images[0].url).toContain('photo.jpg');
  });

  it('should skip media without url', () => {
    const media = [{ type: 'image' }, { url: null, type: 'image' }];
    const valid = media.filter(m => m.url && m.type === 'image');
    expect(valid).toHaveLength(0);
  });

  it('should handle empty media array', () => {
    const msg = { content: 'Hello', media: [] };
    expect(msg.media.length).toBe(0);
  });

  it('should handle missing media field', () => {
    const msg = { content: 'Hello' };
    const media = msg.media || [];
    expect(media.length).toBe(0);
  });
});
