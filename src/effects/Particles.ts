import Phaser from 'phaser';
import { LANE_COLORS } from '../config';
import { Judgment } from '../rhythm/HitDetector';

export class HitParticles {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  emit(x: number, y: number, lane: number, judgment: Judgment): void {
    const color = LANE_COLORS[lane];
    const count = judgment === 'PERFECT' ? 12 : judgment === 'GREAT' ? 8 : 4;
    const speed = judgment === 'PERFECT' ? 80 : 50;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const spd = speed * (0.5 + Math.random() * 0.5);
      const size = 1 + Math.random() * 2;

      const particle = this.scene.add.graphics();
      particle.setDepth(15);
      particle.fillStyle(color, 0.9);
      particle.fillCircle(0, 0, size);

      // Add a white core for PERFECT hits
      if (judgment === 'PERFECT') {
        particle.fillStyle(0xffffff, 0.7);
        particle.fillCircle(0, 0, size * 0.5);
      }

      particle.setPosition(x, y);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * spd,
        y: y + Math.sin(angle) * spd - 10,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 300 + Math.random() * 200,
        onComplete: () => particle.destroy(),
      });
    }
  }
}
