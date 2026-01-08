/**
 * Avatar Utilities
 * Handles username parsing, emoji mappings, and avatar format assignment
 *
 * Usernames are in format: "[fruit] [animal]" e.g. "cherry tiger"
 * Avatar display can be:
 *   Format A: 🍒 tiger  (fruit emoji + animal text)
 *   Format B: cherry 🐯  (fruit text + animal emoji)
 */

// Fruit emoji mappings
const FRUIT_EMOJIS = {
  apple: '🍎',
  banana: '🍌',
  cherry: '🍒',
  grape: '🍇',
  orange: '🍊',
  lemon: '🍋',
  lime: '🍈',
  peach: '🍑',
  pear: '🍐',
  plum: '🫐',
  mango: '🥭',
  coconut: '🥥',
  kiwi: '🥝',
  strawberry: '🍓',
  blueberry: '🫐',
  raspberry: '🍇',
  watermelon: '🍉',
  melon: '🍈',
  pineapple: '🍍',
  avocado: '🥑',
  tomato: '🍅',
  olive: '🫒',
  fig: '🍇',
  date: '🌴',
  papaya: '🥭',
  guava: '🍈',
  passion: '🍑',
  dragon: '🐉',
  star: '⭐',
  berry: '🍓'
};

// Animal emoji mappings
const ANIMAL_EMOJIS = {
  tiger: '🐯',
  lion: '🦁',
  bear: '🐻',
  fox: '🦊',
  wolf: '🐺',
  dog: '🐕',
  cat: '🐱',
  rabbit: '🐰',
  mouse: '🐭',
  hamster: '🐹',
  panda: '🐼',
  koala: '🐨',
  monkey: '🐵',
  gorilla: '🦍',
  elephant: '🐘',
  giraffe: '🦒',
  zebra: '🦓',
  horse: '🐴',
  unicorn: '🦄',
  deer: '🦌',
  cow: '🐄',
  pig: '🐷',
  sheep: '🐑',
  goat: '🐐',
  camel: '🐫',
  llama: '🦙',
  eagle: '🦅',
  owl: '🦉',
  hawk: '🦅',
  falcon: '🦅',
  penguin: '🐧',
  duck: '🦆',
  swan: '🦢',
  parrot: '🦜',
  peacock: '🦚',
  flamingo: '🦩',
  dove: '🕊️',
  crow: '🐦‍⬛',
  chicken: '🐔',
  rooster: '🐓',
  turkey: '🦃',
  shark: '🦈',
  whale: '🐋',
  dolphin: '🐬',
  octopus: '🐙',
  squid: '🦑',
  crab: '🦀',
  lobster: '🦞',
  shrimp: '🦐',
  fish: '🐟',
  turtle: '🐢',
  snake: '🐍',
  lizard: '🦎',
  dragon: '🐉',
  dinosaur: '🦖',
  crocodile: '🐊',
  frog: '🐸',
  bee: '🐝',
  butterfly: '🦋',
  spider: '🕷️',
  ant: '🐜',
  beetle: '🪲',
  cricket: '🦗',
  snail: '🐌',
  hedgehog: '🦔',
  bat: '🦇',
  otter: '🦦',
  beaver: '🦫',
  skunk: '🦨',
  badger: '🦡',
  raccoon: '🦝',
  sloth: '🦥',
  hippo: '🦛',
  rhino: '🦏',
  leopard: '🐆',
  cheetah: '🐆',
  jaguar: '🐆',
  panther: '🐆',
  cougar: '🐆',
  lynx: '🐱',
  bobcat: '🐱',
  moose: '🫎',
  buffalo: '🦬',
  bison: '🦬',
  boar: '🐗',
  ram: '🐏',
  phoenix: '🔥',
  griffin: '🦅',
  pegasus: '🦄',
  mantis: '🦗',
  scorpion: '🦂',
  worm: '🪱'
};

/**
 * Parse a username into fruit and animal parts
 * @param {string} username - e.g. "cherry tiger"
 * @returns {{ fruit: string, animal: string } | null}
 */
function parseUsername(username) {
  if (!username || typeof username !== 'string') return null;

  const parts = username.toLowerCase().trim().split(/\s+/);
  if (parts.length < 2) return null;

  // Assume format is "fruit animal"
  const fruit = parts[0];
  const animal = parts.slice(1).join(' '); // Handle multi-word animals like "polar bear"

  return { fruit, animal };
}

/**
 * Get emoji for a fruit
 * @param {string} fruit
 * @returns {string} emoji or fallback
 */
function getFruitEmoji(fruit) {
  const key = fruit?.toLowerCase().trim();
  return FRUIT_EMOJIS[key] || '🍀'; // Fallback to clover
}

/**
 * Get emoji for an animal
 * @param {string} animal
 * @returns {string} emoji or fallback
 */
function getAnimalEmoji(animal) {
  // Handle multi-word animals - try full match first, then first word
  const key = animal?.toLowerCase().trim();
  if (ANIMAL_EMOJIS[key]) return ANIMAL_EMOJIS[key];

  const firstWord = key?.split(/\s+/)[0];
  return ANIMAL_EMOJIS[firstWord] || '🐾'; // Fallback to paw prints
}

/**
 * Generate avatar display for a user
 * @param {string} username
 * @param {'A' | 'B'} format - A = emoji fruit, B = emoji animal
 * @returns {{ display: string, emoji: string, text: string }}
 */
function generateAvatarDisplay(username, format = 'A') {
  const parsed = parseUsername(username);
  if (!parsed) {
    return {
      display: `👤 ${username}`,
      emoji: '👤',
      text: username,
      format: 'A'
    };
  }

  const { fruit, animal } = parsed;

  if (format === 'A') {
    // Format A: 🍒 tiger (fruit emoji + animal text)
    const emoji = getFruitEmoji(fruit);
    return {
      display: `${emoji} ${animal}`,
      emoji,
      text: animal,
      format: 'A',
      fruit,
      animal
    };
  } else {
    // Format B: cherry 🐯 (fruit text + animal emoji)
    const emoji = getAnimalEmoji(animal);
    return {
      display: `${fruit} ${emoji}`,
      emoji,
      text: fruit,
      format: 'B',
      fruit,
      animal
    };
  }
}

/**
 * Determine which format to assign to avoid collisions
 * @param {string} username
 * @param {Array<{ username: string, format: string }>} existingAvatars
 * @returns {'A' | 'B'}
 */
function assignAvatarFormat(username, existingAvatars = []) {
  const parsed = parseUsername(username);
  if (!parsed) return 'A';

  const { fruit, animal } = parsed;

  // Check what formats are already taken for similar avatars
  const conflictsA = existingAvatars.filter(a => {
    const p = parseUsername(a.username);
    // Format A conflict: same fruit emoji + same animal text
    return p && a.format === 'A' && p.fruit === fruit && p.animal === animal;
  });

  const conflictsB = existingAvatars.filter(a => {
    const p = parseUsername(a.username);
    // Format B conflict: same fruit text + same animal emoji
    return p && a.format === 'B' && p.fruit === fruit && p.animal === animal;
  });

  // Prefer format with fewer conflicts
  // For same username, they'd have same fruit+animal, so check which format is free
  if (conflictsA.length === 0) return 'A';
  if (conflictsB.length === 0) return 'B';

  // Both have conflicts (shouldn't happen with unique usernames), prefer A
  return 'A';
}

/**
 * Get a unique avatar for a user, avoiding visual collisions
 * @param {string} username
 * @param {Array<{ username: string, format: string }>} existingAvatars
 * @returns {object} avatar data
 */
function getUniqueAvatar(username, existingAvatars = []) {
  const format = assignAvatarFormat(username, existingAvatars);
  return generateAvatarDisplay(username, format);
}

// Export for Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FRUIT_EMOJIS,
    ANIMAL_EMOJIS,
    parseUsername,
    getFruitEmoji,
    getAnimalEmoji,
    generateAvatarDisplay,
    assignAvatarFormat,
    getUniqueAvatar
  };
}

// For browser ES modules, use window global
if (typeof window !== 'undefined') {
  window.AvatarUtils = {
    FRUIT_EMOJIS,
    ANIMAL_EMOJIS,
    parseUsername,
    getFruitEmoji,
    getAnimalEmoji,
    generateAvatarDisplay,
    assignAvatarFormat,
    getUniqueAvatar
  };
}
