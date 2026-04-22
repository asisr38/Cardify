// Derive a deterministic card palette from a contact's name so every contact
// gets a distinct "business card" thumbnail in the grid, even when the DB has
// no card image or accent on file. Five bespoke palettes match the Cardify
// mock (Meridian navy, Vaulto ink, Kestrel plum, Ironclad forest, etc.).

export interface CardPalette {
  bg: string;
  accent: string;
}

const PALETTES: CardPalette[] = [
  { bg: '#1B2E48', accent: '#4A9EFF' }, // navy / azure
  { bg: '#1C1C1C', accent: '#E8C547' }, // ink / gold
  { bg: '#2A1030', accent: '#C96BFF' }, // plum / violet
  { bg: '#0E2818', accent: '#3DD68C' }, // forest / mint
  { bg: '#2B120E', accent: '#F08A5D' }, // oxblood / coral
  { bg: '#0E1E2A', accent: '#6FD2E0' }, // slate / cyan
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function cardPalette(seed: string): CardPalette {
  return PALETTES[hash(seed || 'cardify') % PALETTES.length];
}
