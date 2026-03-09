import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TIMING, LANE_COLORS } from '../config';
import { SongEntry, Note } from '../rhythm/BeatMap';
import { NoteTrack, ActiveNote } from '../rhythm/NoteTrack';
import { judgeHit, isPastWindow, Judgment } from '../rhythm/HitDetector';
import { ScoreManager } from '../rhythm/ScoreManager';
import { AudioManager } from '../audio/AudioManager';
import { playHitPerfect, playHitGreat, playHitGood, playMiss, playComboMilestone } from '../audio/SFX';
import { DinoRenderer } from '../sprites/DinoRenderer';
import { HUD } from '../ui/HUD';
import { Background } from '../ui/Background';
import { TouchControls } from '../input/TouchControls';
import { HitParticles } from '../effects/Particles';
import { GrooveMeter } from '../effects/GrooveMeter';

export class GameScene extends Phaser.Scene {
  private song!: SongEntry;
  private songs!: SongEntry[];
  private noteTrack!: NoteTrack;
  private scoreManager!: ScoreManager;
  private audioManager!: AudioManager;
  private dino!: DinoRenderer;
  private hud!: HUD;
  private background!: Background;
  private touchControls!: TouchControls;
  private particles!: HitParticles;
  private grooveMeter!: GrooveMeter;

  private keys!: { A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private gameTime = 0;
  private isPlaying = false;
  private songStarted = false;
  private countdownTimer = 3;
  private countdownText!: Phaser.GameObjects.Text;
  private useDemoAudio = false;
  private demoOsc: OscillatorNode | null = null;
  private demoCtx: AudioContext | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { song: SongEntry; songs?: SongEntry[] }): void {
    this.song = data.song;
    this.songs = data.songs || [];
  }

  create(): void {
    // Background
    this.background = new Background(this);

    // Note track
    this.noteTrack = new NoteTrack(this);

    // Dino
    this.dino = new DinoRenderer(this, 350, 160);

    // Score
    this.scoreManager = new ScoreManager();

    // HUD
    this.hud = new HUD(this);

    // Particles
    this.particles = new HitParticles(this);

    // Groove meter
    this.grooveMeter = new GrooveMeter(this, 260, 50);

    // Audio
    this.audioManager = new AudioManager(this);

    // Keyboard
    if (this.input.keyboard) {
      this.keys = {
        A: this.input.keyboard.addKey('A'),
        S: this.input.keyboard.addKey('S'),
        D: this.input.keyboard.addKey('D'),
      };
    }

    // Touch
    this.touchControls = new TouchControls(this, (lane) => this.handleLanePress(lane));

    // Countdown text
    this.countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffeb3b',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(25);

    // Load audio and start countdown
    this.startCountdown();
  }

  private async startCountdown(): Promise<void> {
    // Load audio if we have a blob
    if (this.song.audioBlob) {
      try {
        await this.audioManager.loadFromBlob(this.song.audioBlob);
      } catch (err) {
        console.warn('Failed to load audio, using demo mode');
        this.useDemoAudio = true;
      }
    } else {
      this.useDemoAudio = true;
    }

    this.countdownTimer = 3;
    this.isPlaying = false;
    this.songStarted = false;
    this.gameTime = -3; // 3 seconds before song starts

    // Start countdown
    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        this.countdownTimer--;
        if (this.countdownTimer <= 0) {
          this.countdownText.setText('GO!');
          this.tweens.add({
            targets: this.countdownText,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 500,
          });
          this.startSong();
        } else {
          this.countdownText.setText(this.countdownTimer.toString());
          this.tweens.add({
            targets: this.countdownText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 100,
            yoyo: true,
          });
        }
      },
    });

    this.countdownText.setText('3');
  }

  private startSong(): void {
    this.isPlaying = true;
    this.songStarted = true;
    this.gameTime = 0;

    if (!this.useDemoAudio) {
      this.audioManager.play(0);
    } else {
      this.startDemoAudio();
    }
  }

  private startDemoAudio(): void {
    // Simple metronome click for demo
    this.demoCtx = new AudioContext();
    const bpm = this.song.beatmap.bpm || 120;
    const interval = 60000 / bpm;

    this.time.addEvent({
      delay: interval,
      repeat: -1,
      callback: () => {
        if (!this.isPlaying || !this.demoCtx) return;
        const osc = this.demoCtx.createOscillator();
        const gain = this.demoCtx.createGain();
        osc.frequency.value = 200;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, this.demoCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.demoCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.demoCtx.destination);
        osc.start();
        osc.stop(this.demoCtx.currentTime + 0.05);
      },
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    if (this.isPlaying) {
      if (this.useDemoAudio) {
        this.gameTime += dt;
      } else {
        this.gameTime = this.audioManager.currentTime;
      }

      // Update note track
      this.noteTrack.update(this.gameTime, this.song.beatmap.notes);

      // Check for missed notes
      const missed = this.noteTrack.getMissedNotes(this.gameTime);
      for (const an of missed) {
        this.noteTrack.markMissed(an);
        this.scoreManager.registerMiss();
        this.hud.showJudgment('MISS');
        this.dino.setState('miss');
        this.grooveMeter.onMiss();
        playMiss();
      }

      // Check keyboard input
      if (this.keys) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.A)) this.handleLanePress(0);
        if (Phaser.Input.Keyboard.JustDown(this.keys.S)) this.handleLanePress(1);
        if (Phaser.Input.Keyboard.JustDown(this.keys.D)) this.handleLanePress(2);
      }

      // Check if song is over
      this.checkSongEnd();
    }

    // Update beat phase for animations
    const bpm = this.song.beatmap.bpm || 120;
    const beatPhase = (this.gameTime * bpm / 60) % 1;

    // Update visuals
    this.dino.update(dt, beatPhase);
    this.hud.update(dt, this.scoreManager);
    this.background.update(dt, beatPhase);
    this.grooveMeter.update(dt);
    this.noteTrack.cleanup();
  }

  private handleLanePress(lane: number): void {
    if (!this.isPlaying) return;

    const activeNote = this.noteTrack.getHittableNote(lane, this.gameTime, TIMING.GOOD);

    if (activeNote) {
      const result = judgeHit(activeNote.note.time, this.gameTime);
      this.noteTrack.markHit(activeNote);
      const earned = this.scoreManager.registerHit(result.judgment, result.score);

      // Visual/audio feedback
      this.hud.showJudgment(result.judgment);
      const laneX = NoteTrack.LANE_X[lane];
      this.particles.emit(laneX, 240, lane, result.judgment);

      // Dino animation
      if (lane === 0) this.dino.setState('hitL');
      else if (lane === 1) this.dino.setState('hitR');
      else this.dino.setState('hitT');

      // SFX
      if (result.judgment === 'PERFECT') playHitPerfect();
      else if (result.judgment === 'GREAT') playHitGreat();
      else playHitGood();

      // Groove meter
      this.grooveMeter.onHit();

      // Combo milestones
      if (this.scoreManager.combo === 10 || this.scoreManager.combo === 25 || this.scoreManager.combo === 50) {
        playComboMilestone();
      }
    }
  }

  private checkSongEnd(): void {
    const lastNote = this.song.beatmap.notes[this.song.beatmap.notes.length - 1];
    if (!lastNote) return;

    // Song ends 2 seconds after last note
    if (this.gameTime > lastNote.time + 2) {
      this.endSong();
    }
  }

  private endSong(): void {
    this.isPlaying = false;
    this.audioManager.stop();
    if (this.demoCtx) {
      this.demoCtx.close();
      this.demoCtx = null;
    }

    this.scene.start('ResultScene', {
      scoreManager: this.scoreManager,
      song: this.song,
      songs: this.songs,
    });
  }

  shutdown(): void {
    this.noteTrack?.destroy();
    this.dino?.destroy();
    this.hud?.destroy();
    this.background?.destroy();
    this.touchControls?.destroy();
    this.grooveMeter?.destroy();
    this.audioManager?.destroy();
    if (this.demoCtx) {
      this.demoCtx.close();
      this.demoCtx = null;
    }
  }
}
