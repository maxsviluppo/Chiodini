
export interface Peg {
  id: string;
  x: number;
  y: number;
  color: string;
}

export interface Level {
  id: number;
  gridSize: number;
  name: string;
  description: string;
  targetPattern: Peg[];
  timeLimitSeconds: number;
  bonusPoints: number;
}

export type GameState = 'MENU' | 'PLAYING' | 'LEVEL_START' | 'COMPLETED' | 'GAME_OVER';
export type GameMode = 'FREE' | 'CHALLENGE';

export const COLORS = [
  { name: 'Rosso', hex: '#ef4444' },
  { name: 'Blu', hex: '#3b82f6' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Giallo', hex: '#eab308' },
  { name: 'Bianco', hex: '#ffffff' },
  { name: 'Nero', hex: '#1e293b' },
  { name: 'Viola', hex: '#a855f7' },
  { name: 'Arancione', hex: '#f97316' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Azzurro', hex: '#06b6d4' }
];
