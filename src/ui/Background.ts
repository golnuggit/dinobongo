import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class Background {
  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;
  private time = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics();
    this.gfx.setDepth(-10);
    this.drawStatic();
  }

  private drawStatic(): void {
    const g = this.gfx;

    // Sky gradient (dark to slightly lighter prehistoric sky)
    for (let y = 0; y < GAME_HEIGHT; y++) {
      const t = y / GAME_HEIGHT;
      const r = Math.floor(15 + t * 10);
      const gr = Math.floor(12 + t * 20);
      const b = Math.floor(30 + t * 15);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b), 1);
      g.fillRect(0, y, GAME_WIDTH, 1);
    }

    // Stars (tiny dots)
    g.fillStyle(0xffffff, 0.4);
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * GAME_WIDTH;
      const sy = Math.random() * (GAME_HEIGHT * 0.4);
      g.fillRect(sx, sy, 1, 1);
    }

    // Moon
    g.fillStyle(0xf5eebb, 0.3);
    g.fillCircle(400, 40, 20);
    g.fillStyle(0xf5eebb, 0.15);
    g.fillCircle(400, 40, 25);

    // Far mountains (silhouette)
    g.fillStyle(0x1a2a15, 0.8);
    this.drawMountain(g, 0, 160, GAME_WIDTH, 50);

    // Mid mountains
    g.fillStyle(0x15220f, 0.9);
    this.drawMountain(g, 30, 175, GAME_WIDTH - 50, 40);

    // Jungle treeline (back layer)
    this.drawTreeline(g, 170, 0x0d1a08, 0.95, 25, 12);

    // Jungle treeline (front layer)
    this.drawTreeline(g, 185, 0x1a2e10, 0.9, 20, 10);

    // Ground
    g.fillStyle(0x1a2e10, 1);
    g.fillRect(0, 200, GAME_WIDTH, GAME_HEIGHT - 200);

    // Ground texture (scattered dots)
    for (let i = 0; i < 40; i++) {
      const gx = Math.random() * GAME_WIDTH;
      const gy = 200 + Math.random() * (GAME_HEIGHT - 200);
      g.fillStyle(0x243a18, 0.5);
      g.fillRect(gx, gy, 2, 1);
    }

    // Foreground plants/ferns
    for (let i = 0; i < 8; i++) {
      this.drawFern(g, 30 + i * 60 + Math.random() * 30, 195 + Math.random() * 20);
    }

    // Volcano in background
    this.drawVolcano(g, 350, 120);
  }

  private drawMountain(g: Phaser.GameObjects.Graphics, xOffset: number, baseY: number, width: number, height: number): void {
    g.beginPath();
    g.moveTo(xOffset, baseY);
    let x = xOffset;
    while (x < xOffset + width) {
      const peakH = height * (0.5 + Math.random() * 0.5);
      const segW = 30 + Math.random() * 40;
      g.lineTo(x + segW / 2, baseY - peakH);
      g.lineTo(x + segW, baseY);
      x += segW;
    }
    g.lineTo(xOffset + width, baseY + 30);
    g.lineTo(xOffset, baseY + 30);
    g.closePath();
    g.fill();
  }

  private drawTreeline(g: Phaser.GameObjects.Graphics, baseY: number, color: number, alpha: number, maxH: number, count: number): void {
    g.fillStyle(color, alpha);
    for (let i = 0; i < count; i++) {
      const tx = (i / count) * GAME_WIDTH + Math.random() * 20;
      const th = 10 + Math.random() * maxH;
      const tw = 8 + Math.random() * 12;

      // Palm/fern tree shape
      g.beginPath();
      g.moveTo(tx - tw / 2, baseY);
      g.lineTo(tx - 2, baseY - th);
      g.lineTo(tx + 2, baseY - th);
      g.lineTo(tx + tw / 2, baseY);
      g.closePath();
      g.fill();

      // Canopy
      g.fillStyle(color, alpha * 0.8);
      g.fillCircle(tx, baseY - th, tw / 2 + 2);
      g.fillStyle(color, alpha);
    }
  }

  private drawFern(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const h = 8 + Math.random() * 12;
    g.lineStyle(1, 0x2d5a1a, 0.7);

    // Stem
    g.lineBetween(x, y, x, y - h);

    // Fronds
    for (let i = 0; i < 4; i++) {
      const fy = y - h * 0.3 - (i / 4) * h * 0.6;
      const dir = i % 2 === 0 ? -1 : 1;
      g.lineBetween(x, fy, x + dir * (5 + Math.random() * 5), fy - 3);
    }
  }

  private drawVolcano(g: Phaser.GameObjects.Graphics, x: number, baseY: number): void {
    // Volcano silhouette
    g.fillStyle(0x1a1510, 0.7);
    g.beginPath();
    g.moveTo(x - 35, baseY);
    g.lineTo(x - 8, baseY - 50);
    g.lineTo(x + 8, baseY - 50);
    g.lineTo(x + 35, baseY);
    g.closePath();
    g.fill();

    // Lava glow at top
    g.fillStyle(0xff4400, 0.2);
    g.fillCircle(x, baseY - 48, 8);
    g.fillStyle(0xff6600, 0.1);
    g.fillCircle(x, baseY - 52, 12);
  }

  update(dt: number, beatPhase: number): void {
    this.time += dt;
    // Could add subtle animated elements later (lava glow pulsing, etc.)
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
