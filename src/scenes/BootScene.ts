import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Simple loading text
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'DINO BONGO', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#aed581',
      stroke: '#1a2e10',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const sub = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'loading...', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#666666',
    }).setOrigin(0.5);

    // Short delay then go to menu
    this.time.delayedCall(800, () => {
      this.scene.start('MenuScene');
    });
  }
}
