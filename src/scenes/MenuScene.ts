import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { playUIClick, playUIConfirm } from '../audio/SFX';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Draw some decorative elements
    const bg = this.add.graphics();

    // Subtle grid pattern
    bg.lineStyle(1, 0xffffff, 0.03);
    for (let x = 0; x < GAME_WIDTH; x += 20) {
      bg.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 20) {
      bg.lineBetween(0, y, GAME_WIDTH, y);
    }

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 60, 'DINO BONGO', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#aed581',
      stroke: '#1a2e10',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 85, 'a prehistoric rhythm experience', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#666666',
    }).setOrigin(0.5);

    // Bouncy title animation
    this.tweens.add({
      targets: title,
      y: 55,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Menu options
    const options = [
      { text: 'PLAY', scene: 'SelectScene' },
      { text: 'CREATE BEATMAP', scene: 'EditorScene' },
    ];

    options.forEach((opt, i) => {
      const y = 140 + i * 30;
      const btn = this.add.text(GAME_WIDTH / 2, y, opt.text, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        btn.setColor('#ffeb3b');
        btn.setScale(1.1);
        playUIClick();
      });

      btn.on('pointerout', () => {
        btn.setColor('#ffffff');
        btn.setScale(1);
      });

      btn.on('pointerdown', () => {
        playUIConfirm();
        this.scene.start(opt.scene);
      });
    });

    // Controls hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 15, 'Controls: A / S / D  or  Touch', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#444444',
    }).setOrigin(0.5);

    // Mini dino silhouette
    this.drawMiniDino(GAME_WIDTH / 2 - 60, 120);
    this.drawMiniDino(GAME_WIDTH / 2 + 50, 125);
  }

  private drawMiniDino(x: number, y: number): void {
    const g = this.add.graphics();
    g.fillStyle(0xaed581, 0.15);
    g.fillCircle(x, y, 8);
    g.fillCircle(x, y - 10, 5);
    g.lineStyle(1, 0xaed581, 0.15);
    g.lineBetween(x + 6, y + 2, x + 15, y);
  }
}
