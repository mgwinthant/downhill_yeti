# Yeti Downhill — Mountain Biking Pixel Game

## Overview
Infinite downhill mountain biking game with a yeti rider. HTML5 Canvas at 320x240, CSS-scaled with pixelated rendering. Playable on desktop (keyboard) and iOS (touch).

## How to Run
- **Dev server**: `npm run dev` (Vite, auto-opens browser)
- **iOS testing**: `./serve.sh` (prints local IP URL for same-WiFi access)
- **Standalone**: Open `yeti-downhill.html` directly in any browser (zero dependencies)

## Architecture
All game logic lives in two places that must stay in sync:
1. **Source modules** (`src/`) — used by Vite dev server
   - `palette.js` — color definitions
   - `terrain.js` — procedural terrain, ramps, trees, cows
   - `sprites.js` — pre-rendered canvas sprites (bike+yeti body, yeti head, trees, cows, wheels)
   - `game.js` — physics, input, particles, camera
   - `renderer.js` — draws everything each frame
   - `main.js` — entry point, game loop, screenshot system (P key)
2. **`yeti-downhill.html`** — standalone bundle of all the above in one file. Must be manually updated when source changes.

## Key Design Decisions

### Character
- Yeti with brown fur riding a mountain bike, non-silhouette colored sprites
- Bobblehead proportions: normal body, oversized head
- Head is a separate sprite with "chicken head" stabilization (counter-rotates to stay level)
- Dynamic scarf that waves based on speed (length and amplitude scale with vx)
- Body sprite includes bike frame + yeti torso/arms/legs; head drawn separately in renderer

### Physics (Excitebike-style, tuned extensively)
- GRAVITY=0.18, FRICTION=0.97, ACCEL=0.1, TURBO_ACCEL=0.22, BOUNCE=0.15
- MAX_CHARGE=8, MIN_JUMP=-0.5, MAX_JUMP=-1.9
- Charge jump: hold Z to compress, release to pop (additive `vy +=`, not replacement)
- **Pump mechanic**: hold on downslopes for speed boost, release on upslopes for bigger pop
- **Overheat system**: Pedaling (X) builds heat. Turbo (X+Right) builds fast. MAX_HEAT=100, overheat = 60 frames forced cooldown. Cools passively when not pedaling.
- **Air tilt (Excitebike-style)**: Up/Down arrows tilt bike back/forward in air. Slight nose-down gravity. Tilt affects fall speed.
- **Landing angle check**: Compares bike tilt to ground slope. Perfect (<0.2 error) = big boost. Decent (<0.45) = small boost. Bad (>0.45) = speed penalty. Crash (>0.55) = wipeout with 45-frame tumble recovery.
- **Crash state**: During crash, no input accepted. Bike tumbles, sprite flashes, decelerates. Recovers with minimum speed.
- **Coyote time**: 6 frames grace period after leaving ground
- Smooth slope lerping (0.15 rate) prevents sprite twitching on terrain

### Terrain
- Procedural infinite terrain with seeded random for determinism
- 3 terrain types blending smoothly: flat, steep, technical bumps (TERRAIN_SEGMENT=400)
- 4 ramp types per SEGMENT=1000:
  - Type 0: Drop (bell curve dip)
  - Type 1: Kicker (t^2 curve up)
  - Type 2: Big air (t^2.5 curve up)
  - Type 3: Gap jump (wooden ramp → deep pit → landing ramp). Fall = respawn PAST the gap with minimum speed
- Oak trees (3 variants), cows in background

### Controls (Excitebike NES layout)
- **Desktop**:
  - D-pad Right (→) = Tilt forward / nose down (air only)
  - D-pad Left (←) = Tilt back / nose up (air only)
  - D-pad Down (↓) = Brake
  - A button (X key) = Accelerate (pedal)
  - B button (Z key) = Charge jump (hold & release)
- **Touch/iOS**: Right 70% = accelerate (X), Left 30% = charge jump (Z). No brake/tilt on mobile.

### Visual Style
- Daytime theme: blue sky gradient, green grass hills, warm sun
- 3 parallax mountain layers
- Particle effects: dust, landing sparks, pump dust, gap-fall burst, overheat smoke/flames, crash dust
- HUD: speed (mph), heat gauge (green→yellow→red, flashes when overheated), tilt indicator (airborne), crash text

## Common Pitfalls (from past debugging)
- **Drop ramp "walls"**: Only bell curve dip (`Math.sin(t * PI) * height`) works cleanly. Other approaches create visible walls.
- **Jump not firing on ramps**: `onGround` flickers on bumpy terrain. Coyote time fixes this.
- **Sprite flipping**: Body uses `ctx.scale(-squashX, squashY)`. Don't add extra scale(-1,1) on head/scarf or it double-flips.
- **Screenshot confirmation**: Text after `draw()` gets overwritten next frame. Use a counter (`screenshotFlash`) checked in game loop.
- **Speed/slope boost sign**: These are positive values subtracted from negative jumpPower (more negative = more upward).

## Tools
- `designer.html` — Yeti Posture Studio with sliders for head position, lean, scarf, etc.
- `serve.sh` — Local server script that auto-kills existing server and prints iOS URL
- Press P in dev mode to save screenshot for debugging
