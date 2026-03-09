# Dino Bongo - Implementation Plan

## Overview
A browser-based rhythm game where you play as a dinosaur percussionist grooving to bongo music. 3-lane input (left foot, right foot, tail) mapped to A/S/D keys + mobile touch buttons. Hand-drawn/sketchy art style. Vibes are everything.

## Tech Stack
- **Engine**: Phaser 3 (v3.90+) with TypeScript
- **Bundler**: Vite
- **Resolution**: 480x270 base, pixel-scaled to 1920x1080
- **Audio**: MP3 track loading via file picker + drag-and-drop
- **Art**: Programmatic hand-drawn/sketchy canvas rendering
- **Beat Mapping**: Tap-along recorder (play MP3, tap inputs, save as JSON beatmap)

---

## Design Decisions (Finalized)

### Gameplay
- **3 lanes**: Left foot (A), Right foot (S), Tail (D)
- **Note scroll**: Top to bottom, hit zone at bottom
- **Timing windows** (forgiving):
  - PERFECT: ±100ms
  - GREAT: ±200ms
  - GOOD: ±300ms
  - MISS: >300ms
- **Scoring**: Combo multiplier + accuracy percentage combined
  - Base: 300 (PERFECT), 200 (GREAT), 100 (GOOD), 0 (MISS)
  - Combo multiplier: 1x → 2x (10 combo) → 3x (25 combo) → 4x (50 combo)
  - Accuracy: % of max possible score
  - Grade: S (95%+), A (90%+), B (80%+), C (70%+), D (<70%)

### Difficulty
- Single beatmap per song
- Easy mode: rapid hits on same drum converted to sustained holds (press & hold)
- Normal mode: play the beatmap as recorded

### Modes
- **Play mode**: Play through a beatmap, hit notes in time
- **Record/Create mode**: Play along to an MP3, inputs recorded as beatmap

### Art Style
- Hand-drawn/sketchy programmatic art
- Prehistoric jungle background (parallax layers, canvas primitives)
- Dinosaur character with personality and animation

### Input
- **Desktop**: A/S/D keys (left foot, right foot, tail)
- **Mobile**: 3 touch-controlled on-screen buttons

### Audio
- MP3 tracks loaded via file picker + drag-and-drop
- Synthesized hit feedback sounds (Web Audio API)

### Song Management
- List-based song select menu
- JSON beatmap format
- Songs loaded from user's device

---

## Folder Structure
```
├── public/
│   └── songs/              # Example/demo content
├── src/
│   ├── main.ts             # Bootstrap
│   ├── config.ts           # Phaser game config (480x270 scaled)
│   ├── scenes/
│   │   ├── BootScene.ts    # Asset generation, texture creation
│   │   ├── MenuScene.ts    # Title screen
│   │   ├── SelectScene.ts  # Song select (list-based)
│   │   ├── GameScene.ts    # Core rhythm gameplay
│   │   ├── ResultScene.ts  # Score results
│   │   └── EditorScene.ts  # Beat map tap-along recorder
│   ├── sprites/
│   │   └── DinoRenderer.ts # Sketchy dino drawing engine
│   ├── rhythm/
│   │   ├── BeatMap.ts      # Beat map types + loader
│   │   ├── NoteTrack.ts    # Note spawning + scrolling
│   │   ├── HitDetector.ts  # Timing window judgment
│   │   └── ScoreManager.ts # Scoring, combo, accuracy, grade
│   ├── audio/
│   │   ├── AudioManager.ts # MP3 loading (file picker + drag-drop)
│   │   └── SFX.ts          # Synthesized hit/miss sounds
│   ├── effects/
│   │   ├── Particles.ts    # Hit particles, combo effects
│   │   └── GrooveMeter.ts  # Visual groove/energy meter
│   ├── input/
│   │   └── TouchControls.ts # Mobile 3-button touch UI
│   └── ui/
│       ├── HUD.ts          # Score, combo, accuracy display
│       └── Background.ts   # Prehistoric jungle parallax bg
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Beat Map Format (JSON)
```json
{
  "title": "My Song",
  "artist": "Unknown",
  "bpm": 120,
  "offset": 0.0,
  "notes": [
    { "time": 1.000, "lane": 0 },
    { "time": 1.250, "lane": 1 },
    { "time": 1.500, "lane": 2 },
    { "time": 2.000, "lane": 0 }
  ]
}
```
- lane 0 = left foot, 1 = right foot, 2 = tail
- time = seconds from start of audio

---

## Implementation Order
1. **Scaffolding** - Vite + Phaser 3 + TS, folder structure, game config
2. **Dino Art Engine** - Sketchy hand-drawn dinosaur renderer
3. **Core Game Scene** - Note track, 3 lanes, scrolling notes, hit zone
4. **Rhythm Engine** - Hit detection, timing windows, scoring + accuracy
5. **Audio System** - MP3 file loading, playback sync, hit SFX
6. **HUD + Feedback** - Score, combo, accuracy, timing judgment text
7. **Scene Flow** - Boot → Menu → Select → Game → Results
8. **Beat Map Editor** - Tap-along recorder scene
9. **Mobile Touch** - 3 on-screen buttons for mobile
10. **Background** - Prehistoric jungle parallax
11. **Polish** - Particles, groove meter, screen effects
12. **Testing** - Play through, tune timing, fix bugs
