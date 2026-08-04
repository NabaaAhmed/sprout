// `icon` refers to a key in src/components/icons/iconGrids.js — small
// hand-drawn pixel icons in the game's own palette (no emoji).
export const SHOP_ITEMS = [
  // Food — boosts affection when fed
  {
    id: 'food-berry',
    category: 'food',
    name: 'Sunberry',
    icon: 'berry',
    cost: 15,
    affectionBoost: 12,
    description: 'A sweet little berry. +12 affection when fed.',
  },
  {
    id: 'food-mushroom',
    category: 'food',
    name: 'Cozy Mushroom',
    icon: 'mushroom',
    cost: 25,
    affectionBoost: 20,
    description: 'Earthy and filling. +20 affection when fed.',
  },
  {
    id: 'food-honey',
    category: 'food',
    name: 'Golden Honey',
    icon: 'honey',
    cost: 45,
    affectionBoost: 35,
    description: 'A rare treat. +35 affection when fed.',
  },

  // Decor — for the pet's room
  {
    id: 'decor-lamp',
    category: 'decor',
    name: 'Paper Lantern',
    icon: 'lantern',
    cost: 40,
    description: 'A warm little glow for the room.',
  },
  {
    id: 'decor-plant',
    category: 'decor',
    name: 'Potted Fern',
    icon: 'plant',
    cost: 35,
    description: 'Greenery makes everything cozier.',
  },
  {
    id: 'decor-books',
    category: 'decor',
    name: 'Book Stack',
    icon: 'books',
    cost: 30,
    description: 'For a very studious room.',
  },
  {
    id: 'decor-rug',
    category: 'decor',
    name: 'Round Rug',
    icon: 'rug',
    cost: 20,
    description: 'Softens up the floor.',
  },

  // Outfits — cosmetic, equip one at a time
  {
    id: 'outfit-scarf',
    category: 'outfits',
    name: 'Tiny Scarf',
    icon: 'scarf',
    cost: 50,
    description: 'Stylish and warm.',
  },
  {
    id: 'outfit-hat',
    category: 'outfits',
    name: 'Acorn Cap',
    icon: 'acorn',
    cost: 60,
    description: 'A jaunty little hat.',
  },
  {
    id: 'outfit-glasses',
    category: 'outfits',
    name: 'Study Glasses',
    icon: 'glasses',
    cost: 55,
    description: 'For serious focus energy.',
  },

  // Seasonal — limited-vibe cosmetics, still simple items for MVP
  {
    id: 'seasonal-snow',
    category: 'seasonal',
    name: 'Snow Cap Room',
    icon: 'snowflake',
    cost: 70,
    description: 'A dusting of pixel snow for the room.',
  },
  {
    id: 'seasonal-lights',
    category: 'seasonal',
    name: 'Firefly Jar',
    icon: 'fireflyjar',
    cost: 65,
    description: 'Little glowing friends for the shelf.',
  },
]

export const SHOP_CATEGORIES = [
  { id: 'food', label: 'Food', icon: 'berry' },
  { id: 'decor', label: 'Decor', icon: 'plant' },
  { id: 'outfits', label: 'Outfits', icon: 'scarf' },
  { id: 'seasonal', label: 'Seasonal', icon: 'snowflake' },
]
