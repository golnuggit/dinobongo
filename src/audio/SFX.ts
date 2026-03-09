let sfxContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!sfxContext) sfxContext = new AudioContext();
  return sfxContext;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15): void {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume: number = 0.1): void {
  const ctx = getContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function playHitPerfect(): void {
  playTone(800, 0.1, 'sine', 0.15);
  playNoise(0.05, 0.08);
}

export function playHitGreat(): void {
  playTone(600, 0.08, 'sine', 0.12);
}

export function playHitGood(): void {
  playTone(400, 0.06, 'triangle', 0.1);
}

export function playMiss(): void {
  playTone(150, 0.15, 'sawtooth', 0.06);
}

export function playComboMilestone(): void {
  playTone(600, 0.05, 'sine', 0.12);
  setTimeout(() => playTone(900, 0.08, 'sine', 0.12), 60);
  setTimeout(() => playTone(1200, 0.1, 'sine', 0.15), 120);
}

export function playUIClick(): void {
  playTone(1000, 0.03, 'sine', 0.08);
}

export function playUIConfirm(): void {
  playTone(500, 0.04, 'sine', 0.1);
  setTimeout(() => playTone(700, 0.06, 'sine', 0.1), 50);
}
