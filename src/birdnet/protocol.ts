/** A species the BirdNET model scored for one 3 second window. */
export interface Hit {
  /** Class index in the model output. */
  index: number;
  sci: string;
  en: string;
  af: string;
  /** Model confidence, 0 to 1. */
  score: number;
  /** How likely the species occurs here this week, 0 to 1 (1 when the location model is not loaded). */
  geo: number;
}

export type ToWorker =
  | { type: 'load'; base: string; backend?: 'webgl' | 'cpu' }
  | { type: 'area'; lat: number; lng: number; week: number }
  | { type: 'predict'; id: number; pcm: Float32Array; minScore: number };

export type FromWorker =
  | { type: 'progress'; progress: number }
  | { type: 'ready'; backend: string; classes: number; hasArea: boolean }
  | { type: 'area'; expected: number }
  | { type: 'result'; id: number; hits: Hit[]; ms: number }
  | { type: 'error'; message: string };

/** BirdNET splits the year into 48 weeks, four per month. */
export function birdnetWeek(date: Date): number {
  return date.getMonth() * 4 + Math.min(4, Math.floor((date.getDate() - 1) / 7.75) + 1);
}
