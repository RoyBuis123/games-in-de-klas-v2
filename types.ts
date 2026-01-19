export type UserType = 'student' | 'teacher';

export interface User {
  type: UserType;
  id?: string;
  name?: string;
  class?: string;
}

export interface GameProgress {
  unlocked: boolean;
  score?: number;
}

export interface StudentData {
  id: string;
  name: string;
  class: string;
  progress: Record<number, GameProgress>;
  scores: Record<number, number>;
  lastActive: string;
}

export interface GameConfigItem {
  name: string;
  unlocks: number[];
  minScore: number;
}

export interface GameConfig {
  [key: number]: GameConfigItem;
}

export interface Connection {
  from: number;
  to: number;
}