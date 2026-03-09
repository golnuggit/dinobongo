export interface Note {
  time: number;   // seconds from audio start
  lane: number;   // 0=left foot, 1=right foot, 2=tail
}

export interface BeatMap {
  title: string;
  artist: string;
  bpm: number;
  offset: number;
  notes: Note[];
}

export interface SongEntry {
  title: string;
  artist: string;
  beatmap: BeatMap;
  audioBlob?: Blob;
  audioUrl?: string;
}

export function createEmptyBeatMap(title: string = 'Untitled', bpm: number = 120): BeatMap {
  return { title, artist: 'Unknown', bpm, offset: 0, notes: [] };
}

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => a.time - b.time);
}

export function generateEasyBeatMap(beatmap: BeatMap, holdThresholdMs: number = 200): BeatMap & { holds: { time: number; lane: number; duration: number }[] } {
  const sorted = sortNotes(beatmap.notes);
  const holds: { time: number; lane: number; duration: number }[] = [];
  const keptNotes: Note[] = [];

  let i = 0;
  while (i < sorted.length) {
    const current = sorted[i];
    let j = i + 1;

    // Find consecutive notes on same lane within threshold
    while (j < sorted.length &&
           sorted[j].lane === current.lane &&
           (sorted[j].time - sorted[j-1].time) * 1000 < holdThresholdMs) {
      j++;
    }

    if (j - i >= 3) {
      // 3+ rapid hits on same lane → convert to hold
      const duration = sorted[j-1].time - current.time;
      holds.push({ time: current.time, lane: current.lane, duration });
    } else {
      // Keep individual notes
      for (let k = i; k < j; k++) {
        keptNotes.push(sorted[k]);
      }
    }
    i = j;
  }

  return { ...beatmap, notes: keptNotes, holds };
}

export function exportBeatMapJSON(beatmap: BeatMap): string {
  return JSON.stringify(beatmap, null, 2);
}

export function importBeatMapJSON(json: string): BeatMap {
  const data = JSON.parse(json);
  return {
    title: data.title || 'Untitled',
    artist: data.artist || 'Unknown',
    bpm: data.bpm || 120,
    offset: data.offset || 0,
    notes: (data.notes || []).map((n: { time: number; lane: number }) => ({
      time: n.time,
      lane: n.lane,
    })),
  };
}
