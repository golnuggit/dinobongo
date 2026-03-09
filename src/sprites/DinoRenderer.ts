import Phaser from 'phaser';

type AnimState = 'idle' | 'hitL' | 'hitR' | 'hitT' | 'miss' | 'victory' | 'defeat';

export class DinoRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private gfx: Phaser.GameObjects.Graphics;
  private state: AnimState = 'idle';
  private stateTimer = 0;
  private idleBob = 0;
  private seed: number;

  // Body proportions
  private bodyX: number;
  private bodyY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.bodyX = 0;
    this.bodyY = 0;
    this.seed = Math.random() * 1000;
    this.container = scene.add.container(x, y);
    this.gfx = scene.add.graphics();
    this.container.add(this.gfx);
    this.container.setDepth(10);
  }

  setState(state: AnimState): void {
    this.state = state;
    this.stateTimer = 0;
  }

  update(dt: number, beatPhase: number): void {
    this.stateTimer += dt;
    this.idleBob += dt * 3;

    // Return to idle after hit animations
    if ((this.state === 'hitL' || this.state === 'hitR' || this.state === 'hitT' || this.state === 'miss')
        && this.stateTimer > 0.2) {
      this.state = 'idle';
    }

    this.draw(beatPhase);
  }

  private draw(beatPhase: number): void {
    const g = this.gfx;
    g.clear();

    const bob = Math.sin(this.idleBob) * 2;
    const beatBounce = Math.sin(beatPhase * Math.PI * 2) * 1.5;
    const baseY = this.bodyY + bob + beatBounce;

    // Sketchy line helper - draws a line with slight wobble
    const sketchLine = (x1: number, y1: number, x2: number, y2: number, color: number, alpha: number = 0.9, width: number = 1.5) => {
      const wobble = () => (Math.random() - 0.5) * 1.5;
      g.lineStyle(width, color, alpha);
      g.lineBetween(x1 + wobble(), y1 + wobble(), x2 + wobble(), y2 + wobble());
      // Double stroke for sketchiness
      g.lineStyle(width * 0.6, color, alpha * 0.5);
      g.lineBetween(x1 + wobble(), y1 + wobble(), x2 + wobble(), y2 + wobble());
    };

    const sketchCircle = (cx: number, cy: number, r: number, color: number, alpha: number = 0.9, width: number = 1.5) => {
      const wobble = () => (Math.random() - 0.5) * 1;
      g.lineStyle(width, color, alpha);
      g.strokeCircle(cx + wobble(), cy + wobble(), r);
      g.lineStyle(width * 0.5, color, alpha * 0.4);
      g.strokeCircle(cx + wobble(), cy + wobble(), r + 0.5);
    };

    const sketchFill = (cx: number, cy: number, r: number, color: number, alpha: number = 0.7) => {
      g.fillStyle(color, alpha);
      g.fillCircle(cx, cy, r);
    };

    // Colors
    const bodyColor = 0x5d8a3e;
    const bellyColor = 0x8db86e;
    const outlineColor = 0x2d4a1e;
    const accentColor = 0xe8a435;

    // State offsets
    let leftArmY = 0, rightArmY = 0, tailAngle = 0;
    let squash = 1, stretch = 1;

    switch (this.state) {
      case 'hitL':
        leftArmY = 8;
        squash = 1.05; stretch = 0.95;
        break;
      case 'hitR':
        rightArmY = 8;
        squash = 1.05; stretch = 0.95;
        break;
      case 'hitT':
        tailAngle = 0.5;
        squash = 0.95; stretch = 1.05;
        break;
      case 'miss':
        squash = 0.9; stretch = 1.1;
        break;
      case 'victory':
        leftArmY = -10;
        rightArmY = -10;
        break;
      case 'defeat':
        squash = 1.1; stretch = 0.85;
        break;
    }

    // Transform for squash/stretch
    g.save();

    // === TAIL ===
    const tailBaseX = 20;
    const tailBaseY = baseY + 5;
    const tailTipX = 42 + Math.sin(this.idleBob * 0.7 + tailAngle) * 5;
    const tailTipY = baseY + Math.sin(this.idleBob * 0.5) * 3 + tailAngle * 15;

    sketchFill(tailTipX - 5, tailTipY, 5, bodyColor, 0.6);
    sketchLine(tailBaseX, tailBaseY, tailTipX - 10, tailTipY + 2, outlineColor, 0.8, 3);
    sketchLine(tailTipX - 10, tailTipY + 2, tailTipX, tailTipY, outlineColor, 0.8, 2);

    // Tail spikes
    for (let i = 0; i < 3; i++) {
      const t = (i + 1) / 4;
      const sx = tailBaseX + (tailTipX - tailBaseX) * t;
      const sy = tailBaseY + (tailTipY - tailBaseY) * t - 4;
      sketchLine(sx, sy, sx + 2, sy - 5, accentColor, 0.7, 1.5);
    }

    // === BODY ===
    // Main body (ellipse-ish shape using filled circles)
    sketchFill(0, baseY, 18 * squash, bodyColor, 0.8);
    sketchFill(0, baseY + 2, 15 * squash, bodyColor, 0.9);

    // Belly
    sketchFill(2, baseY + 5, 10, bellyColor, 0.6);

    // Body outline
    sketchCircle(0, baseY, 18 * squash, outlineColor, 0.7, 1.5);

    // === HEAD ===
    const headY = baseY - 22 * stretch;
    const headX = -2;

    // Neck
    sketchLine(0, baseY - 14, headX, headY + 8, outlineColor, 0.6, 2);

    // Head shape
    sketchFill(headX, headY, 10, bodyColor, 0.85);
    sketchCircle(headX, headY, 10, outlineColor, 0.7, 1.5);

    // Snout
    sketchFill(headX - 8, headY + 2, 6, bodyColor, 0.8);
    sketchCircle(headX - 8, headY + 2, 6, outlineColor, 0.6, 1);

    // Eye
    sketchFill(headX - 3, headY - 3, 3, 0xffffff, 0.9);
    sketchFill(headX - 3.5, headY - 2.5, 1.5, 0x111111, 1);

    // Mouth (sketchy grin)
    sketchLine(headX - 12, headY + 4, headX - 5, headY + 5, outlineColor, 0.7, 1);

    // Head spikes/crest
    sketchLine(headX + 3, headY - 7, headX + 7, headY - 14, accentColor, 0.8, 1.5);
    sketchLine(headX + 1, headY - 8, headX + 4, headY - 13, accentColor, 0.6, 1);

    // === ARMS (front feet) ===
    // Left arm
    const lArmX = -12;
    const lArmY = baseY - 5 + leftArmY;
    sketchLine(lArmX, baseY - 2, lArmX - 6, lArmY, outlineColor, 0.8, 2);
    sketchLine(lArmX - 6, lArmY, lArmX - 10, lArmY + 3, outlineColor, 0.8, 1.5);
    // Foot/hand
    sketchFill(lArmX - 10, lArmY + 3, 3, bodyColor, 0.8);

    // Right arm
    const rArmX = 8;
    const rArmY = baseY - 5 + rightArmY;
    sketchLine(rArmX, baseY - 2, rArmX + 6, rArmY, outlineColor, 0.8, 2);
    sketchLine(rArmX + 6, rArmY, rArmX + 10, rArmY + 3, outlineColor, 0.8, 1.5);
    sketchFill(rArmX + 10, rArmY + 3, 3, bodyColor, 0.8);

    // === LEGS ===
    const legY = baseY + 14;
    // Left leg
    sketchLine(-8, baseY + 12, -12, legY + 8, outlineColor, 0.8, 2);
    sketchFill(-12, legY + 10, 4, bodyColor, 0.7);
    // Right leg
    sketchLine(8, baseY + 12, 12, legY + 8, outlineColor, 0.8, 2);
    sketchFill(12, legY + 10, 4, bodyColor, 0.7);

    // === BONGO DRUMS ===
    const bongoY = baseY + 10;

    // Left bongo
    this.drawBongo(g, -20, bongoY, 0xc8782a, this.state === 'hitL');
    // Right bongo
    this.drawBongo(g, 20, bongoY, 0xa06020, this.state === 'hitR');

    g.restore();
  }

  private drawBongo(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, isHit: boolean): void {
    const hitScale = isHit ? 1.1 : 1;

    // Bongo body
    g.fillStyle(color, 0.9);
    g.fillEllipse(x, y + 4, 16 * hitScale, 12 * hitScale);

    // Bongo top (drum head)
    g.fillStyle(0xf5e6c8, 0.9);
    g.fillEllipse(x, y, 16 * hitScale, 6 * hitScale);

    // Outline
    g.lineStyle(1, 0x3a2510, 0.7);
    g.strokeEllipse(x, y + 4, 16 * hitScale, 12 * hitScale);
    g.strokeEllipse(x, y, 16 * hitScale, 6 * hitScale);

    // Hit flash
    if (isHit) {
      g.fillStyle(0xffffff, 0.4);
      g.fillEllipse(x, y, 12, 4);
    }
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  destroy(): void {
    this.container.destroy();
  }
}
