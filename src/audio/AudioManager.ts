import Phaser from 'phaser';

export class AudioManager {
  private scene: Phaser.Scene;
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private gainNode: GainNode | null = null;
  private startTime = 0;
  private pauseOffset = 0;
  private _isPlaying = false;
  private _duration = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get isPlaying(): boolean { return this._isPlaying; }
  get duration(): number { return this._duration; }

  get currentTime(): number {
    if (!this.audioContext || !this._isPlaying) return this.pauseOffset;
    return this.audioContext.currentTime - this.startTime + this.pauseOffset;
  }

  async loadFromBlob(blob: Blob): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    const arrayBuffer = await blob.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this._duration = this.audioBuffer.duration;
    this.pauseOffset = 0;

    if (!this.gainNode) {
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
  }

  play(offset: number = 0): void {
    if (!this.audioContext || !this.audioBuffer) return;

    this.stop();
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode!);

    this.pauseOffset = offset;
    this.startTime = this.audioContext.currentTime;
    this.sourceNode.start(0, offset);
    this._isPlaying = true;

    this.sourceNode.onended = () => {
      this._isPlaying = false;
    };
  }

  pause(): void {
    if (!this._isPlaying) return;
    this.pauseOffset = this.currentTime;
    this.sourceNode?.stop();
    this._isPlaying = false;
  }

  resume(): void {
    if (this._isPlaying || !this.audioBuffer) return;
    this.play(this.pauseOffset);
  }

  stop(): void {
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch {}
      this.sourceNode = null;
    }
    this._isPlaying = false;
  }

  setVolume(vol: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, vol));
    }
  }

  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export function setupDragDrop(
  element: HTMLElement,
  onFile: (file: File) => void
): void {
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  element.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.ogg') || file.name.endsWith('.wav')) {
        onFile(file);
      }
    }
  });
}

export function createFilePicker(onFile: (file: File) => void): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'audio/*,.mp3,.ogg,.wav';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', () => {
    if (input.files && input.files.length > 0) {
      onFile(input.files[0]);
    }
    input.value = '';
  });
  return input;
}
