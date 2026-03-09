import { TIMING, SCORE } from '../config';

export type Judgment = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export interface HitResult {
  judgment: Judgment;
  score: number;
  timeDiff: number; // ms, negative = early, positive = late
}

export function judgeHit(noteTime: number, hitTime: number): HitResult {
  const diff = (hitTime - noteTime) * 1000; // convert to ms
  const absDiff = Math.abs(diff);

  if (absDiff <= TIMING.PERFECT) {
    return { judgment: 'PERFECT', score: SCORE.PERFECT, timeDiff: diff };
  } else if (absDiff <= TIMING.GREAT) {
    return { judgment: 'GREAT', score: SCORE.GREAT, timeDiff: diff };
  } else if (absDiff <= TIMING.GOOD) {
    return { judgment: 'GOOD', score: SCORE.GOOD, timeDiff: diff };
  }
  return { judgment: 'MISS', score: SCORE.MISS, timeDiff: diff };
}

export function isWithinWindow(noteTime: number, currentTime: number): boolean {
  return Math.abs(currentTime - noteTime) * 1000 <= TIMING.GOOD;
}

export function isPastWindow(noteTime: number, currentTime: number): boolean {
  return (currentTime - noteTime) * 1000 > TIMING.GOOD;
}
