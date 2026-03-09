# Dino Bongo - Implementation Plan

## Overview
A browser-based rhythm game where you play as a dinosaur percussionist grooving to bongo music. 3-button input (A/B/X mapped to left hand, right hand, tail). Style over substance - vibes are everything.

## Tech Stack
- **Engine**: Phaser 3 (v3.90+) with TypeScript
- **Bundler**: Vite
- **Audio**: Web Audio API (via Phaser's sound manager)
- **Art**: Programmatic canvas rendering - detailed, shaded dinosaur art generated at runtime
- **Beat Mapping**: Visual tap-along editor (play track, tap buttons, export JSON)

---

## Phase 1: Project Scaffolding
- Initialize npm project with Phaser 3 + Vite + TypeScript
- Set up folder structure:
```
├── public/
│   └── songs/              # MP3 files + beat map JSONs go here
├── src/
│   ├── main.ts             # Bootstrap
│   ├── config.ts           # Phaser game config
│   ├── scenes/
│   │   ├── BootScene.ts    # Asset loading, texture generation
│   │   ├── MenuScene.ts    # Title screen
│   │   ├── SelectScene.ts  # Character + song select
│   │   ├── GameScene.ts    # Core rhythm gameplay
│   │   ├── ResultScene.ts  # Score results
│   │   └── EditorScene.ts  # Beat map visual editor
│   ├── sprites/
│   │   ├── DinoRenderer.ts # Programmatic dino drawing engine
│   │   ├── TRex.ts         # T-Rex specific art
│   │   ├── Triceratops.ts  # Triceratops specific art
│   │   ├── Stegosaurus.ts  # Stegosaurus specific art
│   │   └── Pterodactyl.ts  # Pterodactyl specific art
│   ├── rhythm/
│   │   ├── BeatMap.ts      # Beat map data types + loader
│   │   ├── NoteTrack.ts    # Note spawning + scrolling
│   │   ├── HitDetector.ts  # Timing window judgment
│   │   └── ScoreManager.ts # Scoring, combo, grade
│   ├── audio/
│   │   └── AudioSync.ts    # Precise audio-visual sync
│   ├── effects/
│   │   ├── Particles.ts    # Hit particles, combo effects
│   │   ├── ScreenShake.ts  # Screen shake on hits
│   │   └── GrooveMeter.ts  # Visual groove/energy meter
│   └── ui/
│       ├── HUD.ts          # In-game score/combo display
│       └── Transitions.ts  # Scene transition effects
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Phase 2: Dinosaur Art Engine (THE VIBES PHASE)
This is the heart of the game. Programmatic canvas art with shading and detail.

### Each dinosaur has these animation states:
1. **Idle Groove** - Bobbing/swaying to the beat (looping)
2. **Hit A** - Left hand/foot strikes bongo (quick)
3. **Hit B** - Right hand/foot strikes bongo (quick)
4. **Hit X** - Tail whip/strike (quick)
5. **Miss** - Stumble/fumble reaction (quick)
6. **Combo Fire** - Enhanced groove at high combo (overlay)
7. **Victory** - End-of-song celebration
8. **Defeat** - End-of-song slump

### Character details:
| Dino | Accent Color | Clothing | Personality |
|------|-------------|----------|-------------|
| T-Rex | Red (#E53935) | Aviator sunglasses, leather vest, wristbands | Aggressive drummer, powerful strikes |
| Triceratops | Blue (#1E88E5) | Round glasses, Hawaiian shirt, headband | Chill groove master, smooth style |
| Stegosaurus | Green (#43A047) | Bucket hat, tie-dye shirt, peace necklace | Laid-back hippie, flowing moves |
| Pterodactyl | Yellow (#FDD835) | Star-shaped sunglasses, bomber jacket, scarf | Flashy showoff, dramatic poses |

### Art rendering approach:
- Use Phaser's `CanvasTexture` API to draw each frame
- Each dino drawn with: base body shape → scales/texture detail → shading/highlights → clothing items → accent color details
- Scale factor for crisp rendering at game resolution
- Pre-render all animation frames during BootScene loading

### Stage/background:
- Nightclub/stage setting with colored spotlights
- Bongo drums in front of the dinosaur
- Subtle animated background (pulsing lights synced to beat)
- Floor reflections for extra polish

---

## Phase 3: Core Rhythm Engine

### Beat Map Format (JSON):
```json
{
  "title": "Bongo Blast",
  "artist": "Unknown",
  "audioFile": "bongo-blast.mp3",
  "bpm": 120,
  "offset": 0.0,
  "difficulty": "normal",
  "notes": [
    { "time": 1.000, "lane": "A", "type": "tap" },
    { "time": 1.250, "lane": "B", "type": "tap" },
    { "time": 1.500, "lane": "X", "type": "tap" },
    { "time": 2.000, "lane": "A", "type": "hold", "duration": 0.5 }
  ]
}
```

### Note types:
- **tap** - Single hit, press button at right time
- **hold** - Press and hold for duration (stretch goal)

### Timing windows:
- **PERFECT**: ±30ms (100% score, big visual pop)
- **GREAT**: ±60ms (80% score, good visual)
- **GOOD**: ±100ms (50% score, mild visual)
- **MISS**: >100ms (0 score, miss animation)

### Scoring:
- Base: 100 (PERFECT), 80 (GREAT), 50 (GOOD), 0 (MISS)
- Combo multiplier: 1x → 2x (10 combo) → 3x (25 combo) → 4x (50 combo)
- Grade: S (95%+), A (90%+), B (80%+), C (70%+), D (<70%)

### Visual note track:
- 3 lanes (A/B/X) scrolling from top/right toward hit zone
- Notes styled per-lane with dino accent colors
- Hit zone at bottom with pulsing indicator synced to BPM
- Lane labels show keyboard keys

---

## Phase 4: Beat Map Visual Editor
A separate scene accessible from the menu.

### Editor workflow:
1. Load an MP3 file (drag & drop or file picker)
2. Audio plays back in real-time
3. Player taps A/S/D (or A/B/X) keys in time with the music
4. Each tap records: timestamp + lane
5. Visual waveform/timeline shows placed notes
6. Playback controls: play/pause, rewind, speed adjust (0.5x/0.75x/1x)
7. Fine-tune: click notes to adjust timing, delete notes
8. Export as JSON beat map file
9. Import existing beat maps for editing

### Editor UI:
- Top: Audio waveform visualization
- Middle: 3-lane note timeline (scrolling with playback)
- Bottom: Controls (play/pause/export/import)

---

## Phase 5: Game Flow & Scenes

### Scene flow:
```
Boot → Menu → Select (char + song) → Game → Results
                                         ↑
                  Menu → Editor ─────────┘ (exports beat maps)
```

### Menu Scene:
- Game title "DINO BONGO" in bold, stylized text
- Animated dino silhouette drumming in background
- Options: Play, Editor, (Settings stretch goal)

### Select Scene:
- 4 dino portraits with accent-colored frames
- Hover/select shows dino doing idle groove animation
- Song list below (loaded from public/songs/)

### Game Scene:
- Note track on left/top portion of screen
- Dino and bongos in center-right
- HUD: score, combo counter, groove meter
- Timing feedback text ("PERFECT!", "GREAT!", etc.)

### Results Scene:
- Final score, grade, max combo
- Note breakdown (perfect/great/good/miss counts)
- Dino victory or defeat animation
- Retry / Back to menu options

---

## Phase 6: Polish & Juice

### Visual effects:
- **Hit particles**: Burst of colored particles on successful hits, bigger for PERFECT
- **Screen shake**: Subtle shake on misses, satisfying thump on hits
- **Combo fire**: At 25+ combo, dino gets flame/glow aura
- **Timing flash**: Hit zone flashes on beat
- **Note trail**: Notes leave subtle trails as they scroll
- **Background pulse**: Stage lights pulse with the beat
- **Score pop**: Numbers fly up and fade on each hit

### Audio effects (generated programmatically):
- Hit feedback sounds (subtle click/tap for good timing)
- Miss sound (soft buzz)
- Combo milestone sound
- UI navigation sounds

### Groove Meter:
- Fills up with good hits, drains on misses
- Visual stages: Cold → Warm → Hot → ON FIRE
- Affects background intensity and dino animation energy

---

## Phase 7: Demo Content
- Include 1 built-in demo beat map with a simple auto-generated percussion pattern
- This lets the game be playable immediately without user-supplied MP3s
- Use Web Audio API to generate a simple bongo loop programmatically

---

## Implementation Order (Build Sequence):
1. **Scaffolding** - Project setup, Phaser config, empty scenes (30 min)
2. **Dino Art Engine** - DinoRenderer + T-Rex as first character (2 hrs)
3. **Game Scene skeleton** - Note track, 3 lanes, scrolling notes (1 hr)
4. **Rhythm engine** - Hit detection, timing windows, scoring (1 hr)
5. **Audio sync** - MP3 loading, playback sync with note track (30 min)
6. **HUD + feedback** - Score display, combo, timing text (30 min)
7. **Remaining 3 dinos** - Triceratops, Stego, Pterodactyl art (1.5 hrs)
8. **Menu + Select + Results** - Full game flow (1 hr)
9. **Beat Map Editor** - Visual tap-along editor scene (1.5 hrs)
10. **Polish** - Particles, shake, groove meter, transitions (1 hr)
11. **Demo content** - Built-in beat map + generated audio (30 min)
12. **Testing + fixes** - Play through, tune timing, fix bugs (30 min)

Total estimated: ~11 hours of focused implementation
