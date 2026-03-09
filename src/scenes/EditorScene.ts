import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, LANE_COLORS, LANE_NAMES } from '../config';
import { BeatMap, Note, createEmptyBeatMap, exportBeatMapJSON, sortNotes } from '../rhythm/BeatMap';
import { AudioManager, createFilePicker, setupDragDrop } from '../audio/AudioManager';
import { playUIClick, playUIConfirm } from '../audio/SFX';

export class EditorScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private beatmap!: BeatMap;
  private isRecording = false;
  private isPlaying = false;
  private gameTime = 0;
  private recordedNotes: Note[] = [];

  private statusText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private noteCountText!: Phaser.GameObjects.Text;
  private waveformGfx!: Phaser.GameObjects.Graphics;
  private notesGfx!: Phaser.GameObjects.Graphics;
  private playheadGfx!: Phaser.GameObjects.Graphics;

  private keys!: { A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key };
  private audioLoaded = false;
  private fileName = '';

  constructor() {
    super({ key: 'EditorScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.audioManager = new AudioManager(this);
    this.beatmap = createEmptyBeatMap();
    this.recordedNotes = [];

    // Title
    this.add.text(GAME_WIDTH / 2, 10, 'BEATMAP EDITOR', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ff7043',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Instructions
    this.add.text(GAME_WIDTH / 2, 25, 'Load an MP3, then press SPACE to play & record. Tap A/S/D in time!', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#666666',
    }).setOrigin(0.5);

    // Load button
    const loadBtn = this.add.text(60, 40, '[ LOAD MP3 ]', {
      fontFamily: 'monospace', fontSize: '8px', color: '#4fc3f7',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    loadBtn.on('pointerdown', () => this.loadAudio());

    // Play/Record button
    const recordBtn = this.add.text(160, 40, '[ SPACE: PLAY/RECORD ]', {
      fontFamily: 'monospace', fontSize: '8px', color: '#aed581',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    recordBtn.on('pointerdown', () => this.togglePlayRecord());

    // Stop button
    const stopBtn = this.add.text(280, 40, '[ STOP ]', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ef5350',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    stopBtn.on('pointerdown', () => this.stopPlayback());

    // Export button
    const exportBtn = this.add.text(360, 40, '[ EXPORT JSON ]', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ffeb3b',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    exportBtn.on('pointerdown', () => this.exportBeatmap());

    // Clear button
    const clearBtn = this.add.text(450, 40, '[ CLEAR ]', {
      fontFamily: 'monospace', fontSize: '8px', color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    clearBtn.on('pointerdown', () => {
      this.recordedNotes = [];
      this.updateNoteDisplay();
    });

    // Timeline area
    this.waveformGfx = this.add.graphics().setDepth(1);
    this.notesGfx = this.add.graphics().setDepth(2);
    this.playheadGfx = this.add.graphics().setDepth(3);

    // Draw timeline background
    this.drawTimelineBackground();

    // Status
    this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'Load an MP3 to begin', {
      fontFamily: 'monospace', fontSize: '8px', color: '#888888',
    }).setOrigin(0.5);

    this.timeText = this.add.text(20, GAME_HEIGHT - 25, '0:00 / 0:00', {
      fontFamily: 'monospace', fontSize: '7px', color: '#666666',
    });

    this.noteCountText = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 25, 'Notes: 0', {
      fontFamily: 'monospace', fontSize: '7px', color: '#666666',
    }).setOrigin(1, 0);

    // Lane labels on timeline
    for (let i = 0; i < 3; i++) {
      this.add.text(12, 70 + i * 50, LANE_NAMES[i], {
        fontFamily: 'monospace', fontSize: '6px', color: '#' + LANE_COLORS[i].toString(16).padStart(6, '0'),
      }).setOrigin(0, 0.5);
    }

    // Keyboard
    if (this.input.keyboard) {
      this.keys = {
        A: this.input.keyboard.addKey('A'),
        S: this.input.keyboard.addKey('S'),
        D: this.input.keyboard.addKey('D'),
        SPACE: this.input.keyboard.addKey('SPACE'),
      };
    }

    // Back button
    const backBtn = this.add.text(20, GAME_HEIGHT - 10, '< Back', {
      fontFamily: 'monospace', fontSize: '7px', color: '#888888',
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      this.stopPlayback();
      this.audioManager.destroy();
      this.scene.start('MenuScene');
    });

    // Drag and drop
    setupDragDrop(this.sys.game.canvas, (file) => this.handleAudioFile(file));
  }

  private drawTimelineBackground(): void {
    const g = this.waveformGfx;
    g.clear();

    // Timeline area background
    g.fillStyle(0x111122, 0.8);
    g.fillRect(40, 55, GAME_WIDTH - 60, 160);

    // Lane separators
    g.lineStyle(1, 0xffffff, 0.1);
    for (let i = 0; i < 3; i++) {
      const y = 70 + i * 50;
      g.lineBetween(40, y, GAME_WIDTH - 20, y);
    }

    // Border
    g.lineStyle(1, 0xffffff, 0.15);
    g.strokeRect(40, 55, GAME_WIDTH - 60, 160);
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    // Space to toggle play/record
    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.togglePlayRecord();
    }

    if (this.isPlaying) {
      this.gameTime = this.audioManager.currentTime;

      // Record notes
      if (this.isRecording && this.keys) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.A)) this.recordNote(0);
        if (Phaser.Input.Keyboard.JustDown(this.keys.S)) this.recordNote(1);
        if (Phaser.Input.Keyboard.JustDown(this.keys.D)) this.recordNote(2);
      }

      // Update playhead
      this.updatePlayhead();

      // Update time display
      const current = this.formatTime(this.gameTime);
      const total = this.formatTime(this.audioManager.duration);
      this.timeText.setText(current + ' / ' + total);

      // Check if audio ended
      if (!this.audioManager.isPlaying && this.gameTime > 0.5) {
        this.stopPlayback();
      }
    }
  }

  private togglePlayRecord(): void {
    if (!this.audioLoaded) {
      this.statusText.setText('Load an MP3 first!');
      return;
    }

    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.isPlaying = true;
      this.isRecording = true;
      this.audioManager.play(0);
      this.gameTime = 0;
      this.statusText.setText('RECORDING... Tap A/S/D in time with the music!');
      this.statusText.setColor('#ef5350');
    }
  }

  private stopPlayback(): void {
    this.isPlaying = false;
    this.isRecording = false;
    this.audioManager.stop();
    this.statusText.setText('Stopped. ' + this.recordedNotes.length + ' notes recorded.');
    this.statusText.setColor('#888888');
    this.updateNoteDisplay();
  }

  private recordNote(lane: number): void {
    const note: Note = { time: this.gameTime, lane };
    this.recordedNotes.push(note);
    this.noteCountText.setText('Notes: ' + this.recordedNotes.length);

    // Visual flash feedback
    const flashColor = LANE_COLORS[lane];
    const flash = this.add.graphics();
    flash.fillStyle(flashColor, 0.5);
    flash.fillCircle(GAME_WIDTH / 2, 70 + lane * 50, 8);
    flash.setDepth(10);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    playUIClick();
  }

  private updatePlayhead(): void {
    const g = this.playheadGfx;
    g.clear();

    if (!this.audioLoaded) return;

    const timelineWidth = GAME_WIDTH - 80;
    const x = 40 + (this.gameTime / Math.max(1, this.audioManager.duration)) * timelineWidth;

    g.lineStyle(1, 0xff5722, 0.8);
    g.lineBetween(x, 55, x, 215);
  }

  private updateNoteDisplay(): void {
    const g = this.notesGfx;
    g.clear();

    if (!this.audioLoaded || this.recordedNotes.length === 0) return;

    const duration = Math.max(1, this.audioManager.duration);
    const timelineWidth = GAME_WIDTH - 80;

    for (const note of this.recordedNotes) {
      const x = 40 + (note.time / duration) * timelineWidth;
      const y = 70 + note.lane * 50;
      const color = LANE_COLORS[note.lane];

      g.fillStyle(color, 0.8);
      g.fillCircle(x, y, 3);
      g.lineStyle(1, 0xffffff, 0.4);
      g.strokeCircle(x, y, 3);
    }
  }

  private loadAudio(): void {
    const picker = createFilePicker((file) => this.handleAudioFile(file));
    picker.click();
  }

  private async handleAudioFile(file: File): Promise<void> {
    this.statusText.setText('Loading: ' + file.name + '...');
    this.fileName = file.name.replace(/\.(mp3|ogg|wav)$/i, '');

    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      await this.audioManager.loadFromBlob(blob);
      this.audioLoaded = true;
      this.statusText.setText('Loaded! Press SPACE to play & record.');
      this.statusText.setColor('#aed581');

      this.drawTimelineBackground();
    } catch {
      this.statusText.setText('Error loading audio file');
      this.statusText.setColor('#ef5350');
    }
  }

  private exportBeatmap(): void {
    if (this.recordedNotes.length === 0) {
      this.statusText.setText('No notes to export!');
      return;
    }

    const beatmap: BeatMap = {
      title: this.fileName || 'Untitled',
      artist: 'Unknown',
      bpm: 120,
      offset: 0,
      notes: sortNotes(this.recordedNotes),
    };

    const json = exportBeatMapJSON(beatmap);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName || 'beatmap') + '.json';
    a.click();
    URL.revokeObjectURL(url);

    this.statusText.setText('Exported ' + beatmap.notes.length + ' notes!');
    this.statusText.setColor('#ffeb3b');
    playUIConfirm();
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + secs.toString().padStart(2, '0');
  }

  shutdown(): void {
    this.audioManager?.destroy();
  }
}
