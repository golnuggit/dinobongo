import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { ScoreManager } from '../rhythm/ScoreManager';
import { SongEntry } from '../rhythm/BeatMap';
import { playUIClick, playUIConfirm } from '../audio/SFX';

export class ResultScene extends Phaser.Scene {
  private scoreManager!: ScoreManager;
  private song!: SongEntry;
  private songs!: SongEntry[];

  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data: { scoreManager: ScoreManager; song: SongEntry; songs: SongEntry[] }): void {
    this.scoreManager = data.scoreManager;
    this.song = data.song;
    this.songs = data.songs || [];
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const sm = this.scoreManager;

    // Grade (big centered)
    const gradeColors: Record<string, string> = {
      S: '#ffeb3b', A: '#aed581', B: '#4fc3f7', C: '#ff7043', D: '#ef5350',
    };
    const grade = sm.grade;

    this.add.text(GAME_WIDTH / 2, 30, grade, {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: gradeColors[grade] || '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Song title
    this.add.text(GAME_WIDTH / 2, 65, this.song.title, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Score
    this.add.text(GAME_WIDTH / 2, 90, sm.score.toLocaleString(), {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Accuracy
    this.add.text(GAME_WIDTH / 2, 110, 'Accuracy: ' + sm.accuracy.toFixed(1) + '%', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#cccccc',
    }).setOrigin(0.5);

    // Max combo
    this.add.text(GAME_WIDTH / 2, 125, 'Max Combo: ' + sm.maxCombo, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffd740',
    }).setOrigin(0.5);

    // Note breakdown
    const breakdown = [
      { label: 'PERFECT', count: sm.counts.PERFECT, color: '#ffeb3b' },
      { label: 'GREAT', count: sm.counts.GREAT, color: '#4fc3f7' },
      { label: 'GOOD', count: sm.counts.GOOD, color: '#aed581' },
      { label: 'MISS', count: sm.counts.MISS, color: '#ef5350' },
    ];

    breakdown.forEach((b, i) => {
      const y = 150 + i * 14;
      this.add.text(GAME_WIDTH / 2 - 50, y, b.label, {
        fontFamily: 'monospace', fontSize: '8px', color: b.color,
      });
      this.add.text(GAME_WIDTH / 2 + 50, y, b.count.toString(), {
        fontFamily: 'monospace', fontSize: '8px', color: '#ffffff', align: 'right',
      }).setOrigin(1, 0);
    });

    // Buttons
    const retryBtn = this.add.text(GAME_WIDTH / 2 - 50, GAME_HEIGHT - 30, 'RETRY', {
      fontFamily: 'monospace', fontSize: '10px', color: '#4fc3f7',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setColor('#ffeb3b'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#4fc3f7'));
    retryBtn.on('pointerdown', () => {
      playUIConfirm();
      this.scene.start('GameScene', { song: this.song, songs: this.songs });
    });

    const menuBtn = this.add.text(GAME_WIDTH / 2 + 50, GAME_HEIGHT - 30, 'MENU', {
      fontFamily: 'monospace', fontSize: '10px', color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#ffeb3b'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
    menuBtn.on('pointerdown', () => {
      playUIClick();
      this.scene.start('SelectScene', { songs: this.songs });
    });
  }
}
