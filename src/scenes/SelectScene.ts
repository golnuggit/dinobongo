import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { SongEntry, BeatMap, importBeatMapJSON } from '../rhythm/BeatMap';
import { AudioManager, createFilePicker, setupDragDrop } from '../audio/AudioManager';
import { playUIClick, playUIConfirm } from '../audio/SFX';

export class SelectScene extends Phaser.Scene {
  private songs: SongEntry[] = [];
  private selectedIndex = 0;
  private songListContainer!: Phaser.GameObjects.Container;
  private filePicker!: HTMLInputElement;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SelectScene' });
  }

  init(data: { songs?: SongEntry[] }): void {
    if (data.songs) this.songs = data.songs;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add.text(GAME_WIDTH / 2, 15, 'SELECT SONG', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aed581',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Song list area
    this.songListContainer = this.add.container(0, 0);
    this.renderSongList();

    // Load song button
    const loadBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, '[ LOAD MP3 + BEATMAP ]', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#4fc3f7',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    loadBtn.on('pointerover', () => loadBtn.setColor('#ffeb3b'));
    loadBtn.on('pointerout', () => loadBtn.setColor('#4fc3f7'));
    loadBtn.on('pointerdown', () => this.loadSong());

    // Back button
    const backBtn = this.add.text(20, GAME_HEIGHT - 15, '< Back', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#888888',
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      playUIClick();
      this.scene.start('MenuScene');
    });

    // Status text
    this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35, '', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#ff7043',
    }).setOrigin(0.5);

    // Drag and drop
    const gameCanvas = this.sys.game.canvas;
    setupDragDrop(gameCanvas, (file) => this.handleAudioFile(file));

    // Hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'drag & drop MP3 here or click load', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#444444',
    }).setOrigin(0.5);

    // Demo song
    if (this.songs.length === 0) {
      this.addDemoSong();
    }
  }

  private addDemoSong(): void {
    const demoMap: BeatMap = {
      title: 'Demo Beat',
      artist: 'Built-in',
      bpm: 120,
      offset: 0,
      notes: this.generateDemoNotes(),
    };
    this.songs.push({ title: demoMap.title, artist: demoMap.artist, beatmap: demoMap });
    this.renderSongList();
  }

  private generateDemoNotes(): { time: number; lane: number }[] {
    const notes: { time: number; lane: number }[] = [];
    const bpm = 120;
    const beatDuration = 60 / bpm;

    // Generate 32 bars of simple patterns
    for (let bar = 0; bar < 32; bar++) {
      const barStart = bar * 4 * beatDuration;

      // Basic pattern: alternating lanes with some variation
      const pattern = bar % 4;
      switch (pattern) {
        case 0: // Left-Right alternating
          notes.push({ time: barStart, lane: 0 });
          notes.push({ time: barStart + beatDuration, lane: 1 });
          notes.push({ time: barStart + beatDuration * 2, lane: 0 });
          notes.push({ time: barStart + beatDuration * 3, lane: 1 });
          break;
        case 1: // All three
          notes.push({ time: barStart, lane: 0 });
          notes.push({ time: barStart + beatDuration, lane: 1 });
          notes.push({ time: barStart + beatDuration * 2, lane: 2 });
          notes.push({ time: barStart + beatDuration * 3, lane: 0 });
          break;
        case 2: // Doubles
          notes.push({ time: barStart, lane: 0 });
          notes.push({ time: barStart + beatDuration * 0.5, lane: 0 });
          notes.push({ time: barStart + beatDuration * 2, lane: 1 });
          notes.push({ time: barStart + beatDuration * 2.5, lane: 1 });
          break;
        case 3: // Tail emphasis
          notes.push({ time: barStart, lane: 2 });
          notes.push({ time: barStart + beatDuration, lane: 0 });
          notes.push({ time: barStart + beatDuration * 2, lane: 2 });
          notes.push({ time: barStart + beatDuration * 3, lane: 1 });
          break;
      }
    }
    return notes;
  }

  private renderSongList(): void {
    this.songListContainer.removeAll(true);

    if (this.songs.length === 0) {
      this.songListContainer.add(
        this.add.text(GAME_WIDTH / 2, 80, 'No songs loaded', {
          fontFamily: 'monospace', fontSize: '8px', color: '#666666',
        }).setOrigin(0.5)
      );
      return;
    }

    this.songs.forEach((song, i) => {
      const y = 40 + i * 25;
      const isSelected = i === this.selectedIndex;
      const color = isSelected ? '#ffeb3b' : '#cccccc';

      const bg = this.add.graphics();
      if (isSelected) {
        bg.fillStyle(0xffffff, 0.05);
        bg.fillRoundedRect(30, y - 8, GAME_WIDTH - 60, 22, 3);
      }

      const title = this.add.text(40, y, song.title, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color,
        stroke: '#000000',
        strokeThickness: 1,
      }).setInteractive({ useHandCursor: true });

      const artist = this.add.text(40, y + 12, song.artist + ' | ' + song.beatmap.notes.length + ' notes', {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: '#666666',
      });

      title.on('pointerdown', () => {
        playUIClick();
        this.selectedIndex = i;
        this.renderSongList();
      });

      title.on('pointerdblclick', () => {
        this.startGame(i);
      });

      this.songListContainer.add([bg, title, artist]);
    });

    // Play button for selected song
    const playBtn = this.add.text(GAME_WIDTH - 50, 40 + this.selectedIndex * 25, '> PLAY', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#aed581',
    }).setInteractive({ useHandCursor: true });

    playBtn.on('pointerdown', () => {
      playUIConfirm();
      this.startGame(this.selectedIndex);
    });

    this.songListContainer.add(playBtn);
  }

  private startGame(index: number): void {
    const song = this.songs[index];
    this.scene.start('GameScene', { song, songs: this.songs });
  }

  private loadSong(): void {
    // Create two file pickers - one for audio, one for beatmap
    const audioPicker = createFilePicker((file) => this.handleAudioFile(file));
    audioPicker.click();
  }

  private async handleAudioFile(file: File): Promise<void> {
    this.statusText.setText('Loading: ' + file.name + '...');

    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const title = file.name.replace(/\.(mp3|ogg|wav)$/i, '');

    // Check if there's a matching beatmap JSON
    this.statusText.setText('Audio loaded! Now load a beatmap JSON (or play the demo)');

    // Create a song entry with empty beatmap (user can create one in editor)
    const song: SongEntry = {
      title,
      artist: 'Unknown',
      beatmap: {
        title,
        artist: 'Unknown',
        bpm: 120,
        offset: 0,
        notes: [],
      },
      audioBlob: blob,
    };

    // Also offer to load a JSON beatmap
    const jsonPicker = createFilePicker((jsonFile) => this.handleBeatmapFile(jsonFile, song));
    jsonPicker.accept = '.json';

    // Add song even without beatmap
    this.songs.push(song);
    this.selectedIndex = this.songs.length - 1;
    this.renderSongList();
    this.statusText.setText('Song added! Click to load beatmap JSON or create in editor.');

    // Auto prompt for JSON
    setTimeout(() => jsonPicker.click(), 500);
  }

  private async handleBeatmapFile(file: File, song: SongEntry): Promise<void> {
    try {
      const text = await file.text();
      const beatmap = importBeatMapJSON(text);
      song.beatmap = beatmap;
      song.title = beatmap.title || song.title;
      song.artist = beatmap.artist || song.artist;
      this.renderSongList();
      this.statusText.setText('Beatmap loaded: ' + beatmap.notes.length + ' notes!');
    } catch {
      this.statusText.setText('Error loading beatmap JSON');
    }
  }
}
