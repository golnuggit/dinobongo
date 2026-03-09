import Phaser from 'phaser';
import { ScoreManager } from '../rhythm/ScoreManager';
import { Judgment } from '../rhythm/HitDetector';
import { LANE_COLORS } from '../config';

export class HUD {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private accuracyText!: Phaser.GameObjects.Text;
  private judgmentText!: Phaser.GameObjects.Text;
  private judgmentTimer = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    };

    // Score - top right
    this.scoreText = this.scene.add.text(470, 5, '0', {
      ...textStyle, fontSize: '14px', align: 'right',
    }).setOrigin(1, 0).setDepth(20);

    // Accuracy - below score
    this.accuracyText = this.scene.add.text(470, 22, '100.0%', {
      ...textStyle, fontSize: '8px', color: '#aaaaaa', align: 'right',
    }).setOrigin(1, 0).setDepth(20);

    // Combo - center-ish
    this.comboText = this.scene.add.text(170, 200, '', {
      ...textStyle, fontSize: '16px', align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(20).setAlpha(0);

    // Multiplier
    this.multiplierText = this.scene.add.text(170, 215, '', {
      ...textStyle, fontSize: '8px', color: '#ffd740', align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(20).setAlpha(0);

    // Judgment text (PERFECT!, GREAT!, etc.)
    this.judgmentText = this.scene.add.text(170, 180, '', {
      ...textStyle, fontSize: '12px', align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(20).setAlpha(0);
  }

  showJudgment(judgment: Judgment): void {
    const colors: Record<Judgment, string> = {
      PERFECT: '#ffeb3b',
      GREAT: '#4fc3f7',
      GOOD: '#aed581',
      MISS: '#ef5350',
    };

    this.judgmentText.setText(judgment + '!');
    this.judgmentText.setColor(colors[judgment]);
    this.judgmentText.setAlpha(1);
    this.judgmentText.setScale(1.3);
    this.judgmentTimer = 0;

    this.scene.tweens.add({
      targets: this.judgmentText,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
    });
  }

  update(dt: number, scoreManager: ScoreManager): void {
    this.scoreText.setText(scoreManager.score.toLocaleString());
    this.accuracyText.setText(scoreManager.accuracy.toFixed(1) + '%');

    // Combo display
    if (scoreManager.combo > 1) {
      this.comboText.setText(scoreManager.combo.toString());
      this.comboText.setAlpha(1);
      this.multiplierText.setText('x' + scoreManager.multiplier);
      this.multiplierText.setAlpha(1);
    } else {
      this.comboText.setAlpha(0);
      this.multiplierText.setAlpha(0);
    }

    // Fade judgment text
    this.judgmentTimer += dt;
    if (this.judgmentTimer > 0.5) {
      this.judgmentText.setAlpha(Math.max(0, this.judgmentText.alpha - dt * 3));
    }
  }

  destroy(): void {
    this.scoreText.destroy();
    this.comboText.destroy();
    this.multiplierText.destroy();
    this.accuracyText.destroy();
    this.judgmentText.destroy();
  }
}
