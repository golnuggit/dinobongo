import Phaser from 'phaser';
import { Note } from './BeatMap';
import { LANE_COLORS, HIT_ZONE_Y, NOTE_SPAWN_Y, GAME_WIDTH } from '../config';

const LANE_X = [130, 170, 210]; // x positions for 3 lanes
const NOTE_SIZE = 14;
const LANE_WIDTH = 40;

export interface ActiveNote {
  note: Note;
  sprite: Phaser.GameObjects.Container;
  hit: boolean;
  missed: boolean;
}

export class NoteTrack {
  private scene: Phaser.Scene;
  private activeNotes: ActiveNote[] = [];
  private notePool: Phaser.GameObjects.Container[] = [];
  private laneGraphics!: Phaser.GameObjects.Graphics;

  // Time window: how far ahead (in seconds) to spawn notes
  private spawnAhead = 2.0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.drawLanes();
  }

  private drawLanes(): void {
    this.laneGraphics = this.scene.add.graphics();
    this.laneGraphics.setDepth(0);

    // Lane backgrounds (semi-transparent columns)
    for (let i = 0; i < 3; i++) {
      const x = LANE_X[i];
      this.laneGraphics.fillStyle(LANE_COLORS[i], 0.08);
      this.laneGraphics.fillRect(x - LANE_WIDTH/2, 0, LANE_WIDTH, HIT_ZONE_Y + 20);

      // Lane divider lines (sketchy style)
      this.laneGraphics.lineStyle(1, 0xffffff, 0.15);
      this.laneGraphics.lineBetween(x - LANE_WIDTH/2, 0, x - LANE_WIDTH/2, HIT_ZONE_Y + 20);
      this.laneGraphics.lineBetween(x + LANE_WIDTH/2, 0, x + LANE_WIDTH/2, HIT_ZONE_Y + 20);
    }

    // Hit zone line
    this.laneGraphics.lineStyle(2, 0xffffff, 0.6);
    this.laneGraphics.lineBetween(LANE_X[0] - LANE_WIDTH/2, HIT_ZONE_Y, LANE_X[2] + LANE_WIDTH/2, HIT_ZONE_Y);

    // Hit zone targets (circles at each lane)
    for (let i = 0; i < 3; i++) {
      this.laneGraphics.lineStyle(2, LANE_COLORS[i], 0.5);
      this.laneGraphics.strokeCircle(LANE_X[i], HIT_ZONE_Y, NOTE_SIZE / 2 + 2);
    }
  }

  createNoteSprite(lane: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(LANE_X[lane], NOTE_SPAWN_Y);
    const color = LANE_COLORS[lane];

    const gfx = this.scene.add.graphics();

    // Sketchy note style - slightly rough circle with fill
    gfx.fillStyle(color, 0.9);
    gfx.fillCircle(0, 0, NOTE_SIZE / 2);

    // Sketchy outline - multiple slightly offset strokes
    gfx.lineStyle(2, 0xffffff, 0.8);
    gfx.strokeCircle(0.5, 0.5, NOTE_SIZE / 2);
    gfx.lineStyle(1, color, 0.4);
    gfx.strokeCircle(-0.5, -0.5, NOTE_SIZE / 2 + 1);

    // Inner highlight
    gfx.fillStyle(0xffffff, 0.3);
    gfx.fillCircle(-2, -2, 3);

    container.add(gfx);
    container.setDepth(5);
    return container;
  }

  update(currentTime: number, notes: Note[]): void {
    // Spawn notes that are within the spawn window
    for (const note of notes) {
      const timeDiff = note.time - currentTime;
      if (timeDiff <= this.spawnAhead && timeDiff > -0.5) {
        // Check if already spawned
        if (!this.activeNotes.find(an => an.note === note)) {
          const sprite = this.createNoteSprite(note.lane);
          this.activeNotes.push({ note, sprite, hit: false, missed: false });
        }
      }
    }

    // Update note positions
    const pixelsPerSecond = (HIT_ZONE_Y - NOTE_SPAWN_Y) / this.spawnAhead;

    for (const an of this.activeNotes) {
      if (an.hit || an.missed) continue;

      const timeDiff = an.note.time - currentTime;
      const y = HIT_ZONE_Y - (timeDiff * pixelsPerSecond);
      an.sprite.setY(y);

      // Fade in as approaching
      const alpha = Math.min(1, Math.max(0.3, 1 - timeDiff / this.spawnAhead));
      an.sprite.setAlpha(alpha);
    }
  }

  getHittableNote(lane: number, currentTime: number, windowMs: number): ActiveNote | null {
    let closest: ActiveNote | null = null;
    let closestDiff = Infinity;

    for (const an of this.activeNotes) {
      if (an.hit || an.missed || an.note.lane !== lane) continue;
      const diff = Math.abs(an.note.time - currentTime) * 1000;
      if (diff <= windowMs && diff < closestDiff) {
        closest = an;
        closestDiff = diff;
      }
    }
    return closest;
  }

  markHit(activeNote: ActiveNote): void {
    activeNote.hit = true;
    // Quick scale-up and fade animation
    this.scene.tweens.add({
      targets: activeNote.sprite,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        activeNote.sprite.destroy();
      },
    });
  }

  markMissed(activeNote: ActiveNote): void {
    activeNote.missed = true;
    // Fade down and out
    this.scene.tweens.add({
      targets: activeNote.sprite,
      alpha: 0,
      y: activeNote.sprite.y + 20,
      duration: 300,
      onComplete: () => {
        activeNote.sprite.destroy();
      },
    });
  }

  getMissedNotes(currentTime: number): ActiveNote[] {
    const missed: ActiveNote[] = [];
    for (const an of this.activeNotes) {
      if (!an.hit && !an.missed && (currentTime - an.note.time) * 1000 > 300) {
        missed.push(an);
      }
    }
    return missed;
  }

  cleanup(): void {
    this.activeNotes = this.activeNotes.filter(an => !an.hit && !an.missed);
  }

  destroy(): void {
    for (const an of this.activeNotes) {
      an.sprite.destroy();
    }
    this.activeNotes = [];
    this.laneGraphics.destroy();
  }

  static get LANE_X(): number[] {
    return [...LANE_X];
  }
}
