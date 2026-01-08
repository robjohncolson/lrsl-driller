/**
 * Avatar Utils Tests
 * Tests for username parsing and avatar display generation
 */

import { describe, it, expect } from 'vitest';
import {
  FRUIT_EMOJIS,
  ANIMAL_EMOJIS,
  parseUsername,
  getFruitEmoji,
  getAnimalEmoji,
  generateAvatarDisplay,
  assignAvatarFormat,
  getUniqueAvatar
} from '../../shared/avatar-utils.js';

describe('parseUsername', () => {
  it('parses "fruit animal" format correctly', () => {
    expect(parseUsername('cherry tiger')).toEqual({
      fruit: 'cherry',
      animal: 'tiger'
    });
  });

  it('handles mixed case', () => {
    expect(parseUsername('Cherry TIGER')).toEqual({
      fruit: 'cherry',
      animal: 'tiger'
    });
  });

  it('handles extra whitespace', () => {
    expect(parseUsername('  cherry   tiger  ')).toEqual({
      fruit: 'cherry',
      animal: 'tiger'
    });
  });

  it('returns null for single word', () => {
    expect(parseUsername('cherry')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseUsername('')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(parseUsername(null)).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(parseUsername(123)).toBeNull();
    expect(parseUsername(undefined)).toBeNull();
  });

  it('handles multi-word animals', () => {
    expect(parseUsername('cherry polar bear')).toEqual({
      fruit: 'cherry',
      animal: 'polar bear'
    });
  });
});

describe('getFruitEmoji', () => {
  it('returns correct emoji for known fruits', () => {
    expect(getFruitEmoji('cherry')).toBe('🍒');
    expect(getFruitEmoji('apple')).toBe('🍎');
    expect(getFruitEmoji('banana')).toBe('🍌');
    expect(getFruitEmoji('grape')).toBe('🍇');
    expect(getFruitEmoji('orange')).toBe('🍊');
  });

  it('handles case insensitivity', () => {
    expect(getFruitEmoji('CHERRY')).toBe('🍒');
    expect(getFruitEmoji('Cherry')).toBe('🍒');
  });

  it('handles whitespace', () => {
    expect(getFruitEmoji('  cherry  ')).toBe('🍒');
  });

  it('returns fallback for unknown fruits', () => {
    expect(getFruitEmoji('unknownfruit')).toBe('🍀');
  });

  it('returns fallback for null/undefined', () => {
    expect(getFruitEmoji(null)).toBe('🍀');
    expect(getFruitEmoji(undefined)).toBe('🍀');
  });
});

describe('getAnimalEmoji', () => {
  it('returns correct emoji for known animals', () => {
    expect(getAnimalEmoji('tiger')).toBe('🐯');
    expect(getAnimalEmoji('lion')).toBe('🦁');
    expect(getAnimalEmoji('bear')).toBe('🐻');
    expect(getAnimalEmoji('fox')).toBe('🦊');
    expect(getAnimalEmoji('wolf')).toBe('🐺');
  });

  it('handles case insensitivity', () => {
    expect(getAnimalEmoji('TIGER')).toBe('🐯');
    expect(getAnimalEmoji('Tiger')).toBe('🐯');
  });

  it('handles multi-word animals by matching first word', () => {
    expect(getAnimalEmoji('polar bear')).toBe('🐾'); // "polar" not in list, fallback
    expect(getAnimalEmoji('tiger shark')).toBe('🐯'); // Matches "tiger"
  });

  it('returns fallback for unknown animals', () => {
    expect(getAnimalEmoji('unknownanimal')).toBe('🐾');
  });

  it('returns fallback for null/undefined', () => {
    expect(getAnimalEmoji(null)).toBe('🐾');
    expect(getAnimalEmoji(undefined)).toBe('🐾');
  });
});

describe('generateAvatarDisplay', () => {
  describe('Format A (fruit emoji + animal text)', () => {
    it('generates correct display', () => {
      const result = generateAvatarDisplay('cherry tiger', 'A');

      expect(result.display).toBe('🍒 tiger');
      expect(result.emoji).toBe('🍒');
      expect(result.text).toBe('tiger');
      expect(result.format).toBe('A');
      expect(result.fruit).toBe('cherry');
      expect(result.animal).toBe('tiger');
    });

    it('uses format A by default', () => {
      const result = generateAvatarDisplay('apple lion');

      expect(result.display).toBe('🍎 lion');
      expect(result.format).toBe('A');
    });
  });

  describe('Format B (fruit text + animal emoji)', () => {
    it('generates correct display', () => {
      const result = generateAvatarDisplay('cherry tiger', 'B');

      expect(result.display).toBe('cherry 🐯');
      expect(result.emoji).toBe('🐯');
      expect(result.text).toBe('cherry');
      expect(result.format).toBe('B');
      expect(result.fruit).toBe('cherry');
      expect(result.animal).toBe('tiger');
    });
  });

  describe('fallback for invalid usernames', () => {
    it('returns generic avatar for single word', () => {
      const result = generateAvatarDisplay('onlyoneword', 'A');

      expect(result.display).toBe('👤 onlyoneword');
      expect(result.emoji).toBe('👤');
      expect(result.text).toBe('onlyoneword');
    });

    it('returns generic avatar for null/undefined', () => {
      const result = generateAvatarDisplay(null);

      expect(result.emoji).toBe('👤');
    });
  });
});

describe('assignAvatarFormat', () => {
  it('returns A when no existing avatars', () => {
    expect(assignAvatarFormat('cherry tiger', [])).toBe('A');
  });

  it('returns A when no conflicts', () => {
    const existing = [
      { username: 'apple lion', format: 'A' }
    ];

    expect(assignAvatarFormat('cherry tiger', existing)).toBe('A');
  });

  it('returns B when format A conflicts exist for same username', () => {
    const existing = [
      { username: 'cherry tiger', format: 'A' }
    ];

    expect(assignAvatarFormat('cherry tiger', existing)).toBe('B');
  });

  it('returns A when both formats conflict (prefers A)', () => {
    const existing = [
      { username: 'cherry tiger', format: 'A' },
      { username: 'cherry tiger', format: 'B' }
    ];

    // Both have conflicts, should return A as default preference
    expect(assignAvatarFormat('cherry tiger', existing)).toBe('A');
  });

  it('handles invalid username', () => {
    expect(assignAvatarFormat('invalid', [])).toBe('A');
  });
});

describe('getUniqueAvatar', () => {
  it('returns format A avatar when no existing', () => {
    const result = getUniqueAvatar('cherry tiger', []);

    expect(result.format).toBe('A');
    expect(result.display).toBe('🍒 tiger');
  });

  it('returns format B when A is taken', () => {
    const existing = [
      { username: 'cherry tiger', format: 'A' }
    ];

    const result = getUniqueAvatar('cherry tiger', existing);

    expect(result.format).toBe('B');
    expect(result.display).toBe('cherry 🐯');
  });

  it('handles different usernames without conflict', () => {
    const existing = [
      { username: 'apple lion', format: 'A' }
    ];

    const result = getUniqueAvatar('cherry tiger', existing);

    expect(result.format).toBe('A');
    expect(result.display).toBe('🍒 tiger');
  });
});

describe('Emoji mappings', () => {
  it('FRUIT_EMOJIS contains common fruits', () => {
    expect(FRUIT_EMOJIS.apple).toBeDefined();
    expect(FRUIT_EMOJIS.banana).toBeDefined();
    expect(FRUIT_EMOJIS.cherry).toBeDefined();
    expect(FRUIT_EMOJIS.grape).toBeDefined();
    expect(FRUIT_EMOJIS.orange).toBeDefined();
    expect(FRUIT_EMOJIS.strawberry).toBeDefined();
    expect(FRUIT_EMOJIS.watermelon).toBeDefined();
  });

  it('ANIMAL_EMOJIS contains common animals', () => {
    expect(ANIMAL_EMOJIS.tiger).toBeDefined();
    expect(ANIMAL_EMOJIS.lion).toBeDefined();
    expect(ANIMAL_EMOJIS.bear).toBeDefined();
    expect(ANIMAL_EMOJIS.fox).toBeDefined();
    expect(ANIMAL_EMOJIS.wolf).toBeDefined();
    expect(ANIMAL_EMOJIS.eagle).toBeDefined();
    expect(ANIMAL_EMOJIS.dolphin).toBeDefined();
  });

  it('all fruit emojis are valid emoji strings', () => {
    for (const [key, emoji] of Object.entries(FRUIT_EMOJIS)) {
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    }
  });

  it('all animal emojis are valid emoji strings', () => {
    for (const [key, emoji] of Object.entries(ANIMAL_EMOJIS)) {
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    }
  });
});

describe('Real-world scenarios', () => {
  it('handles classroom with multiple students', () => {
    const students = [
      'cherry tiger',
      'apple lion',
      'banana bear',
      'grape fox',
      'orange wolf'
    ];

    const avatars = [];
    for (const student of students) {
      const avatar = getUniqueAvatar(student, avatars);
      avatars.push({ username: student, format: avatar.format });

      // All should get format A since they're all unique
      expect(avatar.format).toBe('A');
    }
  });

  it('handles duplicate username detection', () => {
    // First instance gets format A
    const avatar1 = getUniqueAvatar('cherry tiger', []);
    expect(avatar1.format).toBe('A');
    expect(avatar1.display).toBe('🍒 tiger');

    // Second instance (same username) gets format B
    const avatar2 = getUniqueAvatar('cherry tiger', [
      { username: 'cherry tiger', format: 'A' }
    ]);
    expect(avatar2.format).toBe('B');
    expect(avatar2.display).toBe('cherry 🐯');

    // Displays are now distinct
    expect(avatar1.display).not.toBe(avatar2.display);
  });
});
