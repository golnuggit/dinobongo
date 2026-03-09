import { COMBO_THRESHOLDS } from '../config';
import { Judgment } from './HitDetector';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export class ScoreManager {
  score = 0;
  combo = 0;
  maxCombo = 0;
  totalNotes = 0;
  maxPossibleScore = 0;

  counts: Record<Judgment, number> = {
    PERFECT: 0,
    GREAT: 0,
    GOOD: 0,
    MISS: 0,
  };

  get multiplier(): number {
    for (const t of COMBO_THRESHOLDS) {
      if (this.combo >= t.combo) return t.multiplier;
    }
    return 1;
  }

  get accuracy(): number {
    if (this.totalNotes === 0) return 100;
    return (this.score / this.maxPossibleScore) * 100;
  }

  get grade(): Grade {
    const acc = this.accuracy;
    if (acc >= 95) return 'S';
    if (acc >= 90) return 'A';
    if (acc >= 80) return 'B';
    if (acc >= 70) return 'C';
    return 'D';
  }

  registerHit(judgment: Judgment, baseScore: number): number {
    this.totalNotes++;
    this.maxPossibleScore += 300; // max possible per note (PERFECT)
    this.counts[judgment]++;

    if (judgment === 'MISS') {
      this.combo = 0;
      return 0;
    }

    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    const earned = baseScore * this.multiplier;
    this.score += earned;
    return earned;
  }

  registerMiss(): void {
    this.registerHit('MISS', 0);
  }

  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalNotes = 0;
    this.maxPossibleScore = 0;
    this.counts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
  }
}
