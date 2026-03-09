import Phaser from 'phaser';

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

export const LANE_NAMES = ['Left Foot', 'Right Foot', 'Tail'] as const;
export const LANE_KEYS = ['A', 'S', 'D'] as const;
export const LANE_COLORS = [0x4fc3f7, 0xff7043, 0xaed581]; // blue, orange, green

export const TIMING = {
  PERFECT: 100,  // ms
  GREAT: 200,
  GOOD: 300,
} as const;

export const SCORE = {
  PERFECT: 300,
  GREAT: 200,
  GOOD: 100,
  MISS: 0,
} as const;

export const COMBO_THRESHOLDS = [
  { combo: 50, multiplier: 4 },
  { combo: 25, multiplier: 3 },
  { combo: 10, multiplier: 2 },
  { combo: 0, multiplier: 1 },
] as const;

export const NOTE_SPEED = 120; // pixels per second at 480x270
export const HIT_ZONE_Y = 240; // y position of the hit zone
export const NOTE_SPAWN_Y = -20; // y position where notes spawn

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    keyboard: true,
    touch: true,
  },
};
