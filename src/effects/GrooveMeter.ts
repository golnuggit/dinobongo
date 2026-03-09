import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config';

export class GrooveMeter {
  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private value = 0.5; // 0-1
  private targetValue = 0.5;
  private x: number;
  private y: number;
  private width = 6;
  private height = 80;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    this.gfx = scene.add.graphics();
    this.gfx.setDepth(20);

    this.label = scene.add.text(x, y - 8, 'GROOVE', {
      fontFamily: 'monospace',
      fontSize: '5px',
      color: '#888888',
      align: 'center',
    }).setOrigin(0.5).setDepth(20);
  }

  onHit(): void {
    this.targetValue = Math.min(1, this.targetValue + 0.03);
  }

  onMiss(): void {
    this.targetValue = Math.max(0, this.targetValue - 0.1);
  }

  getLevel(): string {
    if (this.value >= 0.85) return 'ON FIRE';
    if (this.value >= 0.6) return 'HOT';
    if (this.value >= 0.35) return 'WARM';
    return 'COLD';
  }

  update(dt: number): void {
    // Smooth interpolation
    this.value += (this.targetValue - this.value) * dt * 5;
    // Slow decay
    this.targetValue = Math.max(0, this.targetValue - dt * 0.01);

    this.draw();
  }

  private draw(): void {
    const g = this.gfx;
    g.clear();

    // Background
    g.fillStyle(0x222222, 0.6);
    g.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

    // Fill color based on level
    let color = 0x4fc3f7; // cold = blue
    if (this.value >= 0.85) color = 0xff5722; // fire = red-orange
    else if (this.value >= 0.6) color = 0xff9800; // hot = orange
    else if (this.value >= 0.35) color = 0xffeb3b; // warm = yellow

    // Filled portion (bottom up)
    const fillH = this.height * this.value;
    g.fillStyle(color, 0.8);
    g.fillRect(this.x - this.width / 2, this.y + this.height - fillH, this.width, fillH);

    // Border
    g.lineStyle(1, 0xffffff, 0.3);
    g.strokeRect(this.x - this.width / 2, this.y, this.width, this.height);

    // Level label
    this.label.setText(this.getLevel());
    this.label.setColor(Phaser.Display.Color.IntegerToColor(color).rgba);
  }

  destroy(): void {
    this.gfx.destroy();
    this.label.destroy();
  }
}
