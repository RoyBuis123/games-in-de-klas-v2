import { Connection, GameConfig } from './types';

export const INITIAL_GAMES_CONFIG: GameConfig = {
  1: { name: 'Memory: Termen', unlocks: [2], minScore: 50 },
  2: { name: 'Termen Trainer', unlocks: [3, 6], minScore: 60 },
  3: { name: 'Krachtenspel', unlocks: [4], minScore: 70 },
  4: { name: 'Krachten Tekenen', unlocks: [5], minScore: 65 },
  5: { name: 'Hellingproef', unlocks: [], minScore: 70 },
  6: { name: 'Helling Hero', unlocks: [7], minScore: 55 },
  7: { name: 'Speed Stunt', unlocks: [8], minScore: 70 },
  8: { name: 'Helling Challenge', unlocks: [], minScore: 70 },
  9: { name: 'Finale: Stunt Challenge', unlocks: [], minScore: 90 }
};

export const CONNECTIONS: Connection[] = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 2, to: 6 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 6, to: 7 },
  { from: 7, to: 8 },
  { from: 5, to: 9 },
  { from: 8, to: 9 }
];

export const TERM_PAIRS = [
  { en: "inclined plane",       nl: "hellend vlak" },
  { en: "angle",                nl: "hoek" },
  { en: "distance",             nl: "afstand" },
  { en: "speed",                nl: "snelheid" },
  { en: "acceleration",         nl: "versnelling" },
  { en: "constant speed",       nl: "constante snelheid" },
  { en: "deceleration",         nl: "vertraging" },
  { en: "friction coefficient", nl: "wrijvingscoëfficiënt" }
];