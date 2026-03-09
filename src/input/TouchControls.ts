import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, LANE_COLORS, LANE_NAMES } from '../config';

export class TouchControls {
  private scene: Phaser.Scene;
  private buttons: Phaser.GameObjects.Container[] = [];
  private isVisible = false;
  private onLanePress: (lane: number) => void;

  constructor(scene: Phaser.Scene, onLanePress: (lane: number) => void) {
    this.scene = scene;
    this.onLanePress = onLanePress;

    // Only show on touch devices
    if (scene.sys.game.device.input.touch) {
      this.create();
      this.isVisible = true;
    }
  }

  private create(): void {
    const buttonWidth = 60;
    const buttonHeight = 40;
    const gap = 8;
    const totalWidth = buttonWidth * 3 + gap * 2;
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const y = GAME_HEIGHT - 5;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (buttonWidth + gap) + buttonWidth / 2;
      const container = this.scene.add.container(x, y);
      container.setDepth(30);

      // Button background
      const bg = this.scene.add.graphics();
      bg.fillStyle(LANE_COLORS[i], 0.3);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);
      bg.lineStyle(1, LANE_COLORS[i], 0.6);
      bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);

      // Label
      const label = this.scene.add.text(0, 0, LANE_NAMES[i], {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#ffffff',
        align: 'center',
      }).setOrigin(0.5);

      container.add([bg, label]);

      // Make interactive
      const hitArea = new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight);
      container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

      container.on('pointerdown', () => {
        this.onLanePress(i);
        // Visual feedback
        bg.clear();
        bg.fillStyle(LANE_COLORS[i], 0.6);
        bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);
        bg.lineStyle(2, 0xffffff, 0.8);
        bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);
      });

      container.on('pointerup', () => {
        bg.clear();
        bg.fillStyle(LANE_COLORS[i], 0.3);
        bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);
        bg.lineStyle(1, LANE_COLORS[i], 0.6);
        bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);
      });

      this.buttons.push(container);
    }
  }

  destroy(): void {
    this.buttons.forEach(b => b.destroy());
    this.buttons = [];
  }
}
