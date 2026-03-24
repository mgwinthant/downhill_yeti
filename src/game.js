import { getGroundY, getGroundSlope } from './terrain.js';

// === PHYSICS CONSTANTS ===
const GRAVITY = 0.18;
const FRICTION = 0.97;
const ACCEL = 0.1;
const TURBO_ACCEL = 0.22;       // turbo pedaling (burns heat fast)
const BOUNCE = 0.15;
const MAX_CHARGE = 8;
const MIN_JUMP = -0.5;
const MAX_JUMP = -1.9;
const COYOTE_TIME = 6;
const PUMP_SPEED_BONUS = 0.35;
const PUMP_LAUNCH_MULT = 0.6;

// === OVERHEAT CONSTANTS (Excitebike-style) ===
const MAX_HEAT = 100;
const HEAT_RATE_NORMAL = 0.6;    // heat per frame while pedaling (A/X)
const HEAT_RATE_TURBO = 2.5;     // heat per frame while turbo (hold both X+arrows or double-tap)
const COOL_RATE = 1.2;           // cooling per frame when not pedaling
const COOL_RATE_COASTING = 0.5;  // cooling while moving but not pedaling
const OVERHEAT_PENALTY = 60;     // frames of forced cooldown when overheated

// === CRASH CONSTANTS ===
const CRASH_DURATION = 30;       // frames of crash/tumble
const CRASH_TILT_THRESHOLD = 0.8; // tilt error that triggers a crash

// === TILT CONSTANTS ===
const TILT_SPEED = 0.08;        // how fast tilt responds
const TILT_MAX = 1.0;           // max tilt angle
const TILT_AIR_DRAG = 0.99;     // tilt damping when no input
const TILT_GRAVITY = 0.005;     // slight nose-down tendency in air

export const player = {
  x: 50, y: 100, r: 10, vx: 0, vy: 0,
  onGround: false, angle: 0, tilt: 0,
  jumpCharge: 0, charging: false,
  smoothSlope: 0, coyoteFrames: 0,
  wasOnGround: false, landingVy: 0,
  // new state
  heat: 0,
  overheated: false,
  overheatTimer: 0,
  crashed: false,
  crashTimer: 0,
  crashVx: 0,        // velocity at crash for tumble
};
export const camera = { x: 0, y: 0 };
export const keys = {};
export let particles = [];
export let trail = [];

let jumpKeyWasDown = false;

export function initInput() {
  document.addEventListener('keydown', e => { e.preventDefault(); keys[e.key] = true; });
  document.addEventListener('keyup', e => { e.preventDefault(); keys[e.key] = false; });

  // Touch controls
  const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouchDevice) {
    document.getElementById('touch-controls').classList.add('active');
    function handleTouchZone(zoneId, keyName) {
      const el = document.getElementById(zoneId);
      if (!el) return;
      el.addEventListener('touchstart', e => { e.preventDefault(); keys[keyName] = true; }, { passive: false });
      el.addEventListener('touchend', e => { e.preventDefault(); keys[keyName] = false; }, { passive: false });
      el.addEventListener('touchcancel', e => { keys[keyName] = false; });
    }
    handleTouchZone('zone-left', 'z');   // B button = jump
    handleTouchZone('zone-right', 'x');  // A button = accelerate
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    document.addEventListener('gestureend', e => e.preventDefault());
  }
}

export function spawnParticles(x, y, count, color, spread) {
  spread = spread || 4;
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * spread,
      vy: -Math.random() * 3 - 1,
      life: 15 + Math.random() * 25,
      size: 1 + Math.floor(Math.random() * 2),
      color
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.vx *= 0.97;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  // speed trail
  if (Math.abs(player.vx) > 1.5) {
    trail.push({ x: player.x - player.vx * 2, y: player.y, life: 8 });
  }
  for (let i = trail.length - 1; i >= 0; i--) {
    trail[i].life--;
    if (trail[i].life <= 0) trail.splice(i, 1);
  }
  // ground dust
  if (player.onGround && Math.abs(player.vx) > 2 && Math.random() < 0.4) {
    spawnParticles(player.x - player.vx, player.y + player.r, 1, '#e8d4a8', 2);
  }
}

export function update() {
  const slope = getGroundSlope(player.x);

  // === CRASH STATE ===
  if (player.crashed) {
    player.crashTimer--;
    // tumble: spin and decelerate
    player.tilt += 0.15;
    player.vx *= 0.96;
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;
    // terrain collision during crash
    const groundY = getGroundY(player.x);
    if (player.y + player.r >= groundY) {
      player.y = groundY - player.r;
      player.vy = 0;
      player.onGround = true;
    }
    // spawn tumble dust
    if (player.onGround && player.crashTimer % 5 === 0) {
      spawnParticles(player.x, player.y + player.r, 2, '#d4b88a', 2);
    }
    // recovery
    if (player.crashTimer <= 0) {
      player.crashed = false;
      player.tilt = 0;
      player.vx = Math.max(player.vx, 0.5); // minimum speed on recovery
    }
    // still update camera and particles during crash
    player.angle += player.vx * 0.15;
    const targetSlope = player.onGround ? getGroundSlope(player.x) : 0;
    player.smoothSlope += (targetSlope - player.smoothSlope) * 0.15;
    const screenX = player.x - camera.x;
    if (screenX > 120) camera.x = player.x - 120;
    if (camera.x < 0) camera.x = 0;
    const targetCamY = player.y - 120;
    camera.y += (targetCamY - camera.y) * 0.1;
    updateParticles();
    return; // no input during crash
  }

  // === OVERHEAT SYSTEM ===
  if (player.overheated) {
    player.overheatTimer--;
    player.heat = Math.max(0, player.heat - COOL_RATE * 1.5);
    if (player.overheatTimer <= 0) {
      player.overheated = false;
      player.heat = MAX_HEAT * 0.3; // don't fully cool, partial recovery
    }
    // overheat smoke particles
    if (Math.random() < 0.3) {
      spawnParticles(player.x, player.y - 5, 1, '#888', 1);
    }
  }

  // === ACCELERATION (A button = X key) ===
  const accelKey = keys['x'] || keys['X'];

  if (!player.overheated && accelKey && player.onGround) {
    player.vx += ACCEL;
    player.heat += HEAT_RATE_NORMAL;
    // exhaust particles when hot
    if (player.heat > MAX_HEAT * 0.7 && Math.random() < 0.4) {
      spawnParticles(player.x + 8, player.y + 2, 1, '#ff8844', 1.5);
    }
  } else if (!player.overheated && accelKey && !player.onGround) {
    // can pedal in air but less effective
    player.vx += ACCEL * 0.3;
    player.heat += HEAT_RATE_NORMAL * 0.5;
  }

  // cooling
  if (!accelKey) {
    if (player.vx > 0.5) {
      player.heat = Math.max(0, player.heat - COOL_RATE_COASTING);
    } else {
      player.heat = Math.max(0, player.heat - COOL_RATE);
    }
  }

  // overheat trigger
  if (player.heat >= MAX_HEAT && !player.overheated) {
    player.overheated = true;
    player.overheatTimer = OVERHEAT_PENALTY;
    spawnParticles(player.x, player.y - 5, 8, '#ff4422', 3);
  }

  // D-pad Down = brake (ground only)
  if (keys['ArrowDown'] && player.vx > 0 && player.onGround) {
    player.vx *= 0.94;
    if (Math.abs(player.vx) > 1) {
      spawnParticles(player.x, player.y + player.r, 1, '#d4b88a', 2);
    }
  }

  // === AIR TILT (Excitebike-style) ===
  // Right = tilt forward (nose down), Left = tilt back (nose up)
  if (!player.onGround) {
    if (keys['ArrowRight']) {
      player.tilt -= TILT_SPEED;
      if (player.tilt < -TILT_MAX) player.tilt = -TILT_MAX;
    }
    if (keys['ArrowLeft']) {
      player.tilt += TILT_SPEED;
      if (player.tilt > TILT_MAX) player.tilt = TILT_MAX;
    }
    if (!keys['ArrowRight'] && !keys['ArrowLeft']) {
      player.tilt *= TILT_AIR_DRAG;
    }
    // nose-down gravity tendency (bike wants to tip forward)
    player.tilt -= TILT_GRAVITY;
    // tilt affects vertical speed slightly (nose down = faster fall)
    player.vy += player.tilt * -0.02;
  } else {
    player.tilt *= 0.7;
  }

  // friction
  if (player.onGround) {
    player.vx *= player.charging ? 0.98 : FRICTION;
  } else {
    player.vx *= 0.995; // less air drag
  }

  // === COYOTE TIME ===
  if (player.onGround) {
    player.coyoteFrames = COYOTE_TIME;
  } else {
    player.coyoteFrames--;
  }
  const canJump = player.onGround || player.coyoteFrames > 0;

  // B button (Z key) or Space (touch fallback) for jump/pump
  const jumpKey = keys['z'] || keys['Z'] || keys[' '];

  // === PUMP MECHANIC ===
  if (jumpKey && player.onGround && slope > 0.05) {
    player.vx += PUMP_SPEED_BONUS * slope;
    if (Math.random() < 0.3) spawnParticles(player.x, player.y + player.r, 1, '#b8d4a0', 1.5);
  }

  // === CHARGE JUMP ===
  if (jumpKey && canJump && !player.charging) player.charging = true;
  if (jumpKey && player.charging) player.jumpCharge = Math.min(player.jumpCharge + 4, MAX_CHARGE);

  const released = !jumpKey && jumpKeyWasDown;
  if (player.charging && released) {
    const t = player.jumpCharge / MAX_CHARGE;
    const speedBoost = Math.min(Math.abs(player.vx) * 0.3, 2);
    const slopeBoost = slope < 0 ? Math.abs(slope) * player.vx * 0.5 : 0;
    const pumpBoost = slope < -0.05 ? Math.abs(slope) * Math.abs(player.vx) * PUMP_LAUNCH_MULT : 0;
    player.vy += MIN_JUMP + (MAX_JUMP - MIN_JUMP) * t - speedBoost - slopeBoost - pumpBoost;
    player.onGround = false;
    player.coyoteFrames = 0;
    const particleCount = 3 + Math.floor(t * 8) + (pumpBoost > 0.5 ? 5 : 0);
    spawnParticles(player.x, player.y + player.r, particleCount, pumpBoost > 0.5 ? '#ffe066' : '#fdebc8');
    player.charging = false;
    player.jumpCharge = 0;
  }
  jumpKeyWasDown = !!jumpKey;

  player.wasOnGround = player.onGround;

  // gravity
  player.vy += GRAVITY;

  // move
  player.x += player.vx;
  player.y += player.vy;

  // left boundary
  if (player.x - player.r < camera.x) {
    player.x = camera.x + player.r;
    player.vx = 0;
  }

  // terrain collision
  const groundY = getGroundY(player.x);
  if (player.y + player.r >= groundY) {
    player.y = groundY - player.r;
    const landSlope = getGroundSlope(player.x);

    // === LANDING CHECK (Excitebike-style) ===
    if (!player.wasOnGround && player.vy > 1) {
      // ideal tilt: match the ground slope (nose down for downhill)
      const idealTilt = -landSlope * 0.5;
      const tiltError = Math.abs(player.tilt - idealTilt);

      if (tiltError < 0.35) {
        // PERFECT — big speed boost, gold sparks
        const bonus = Math.min(1.0 + Math.abs(landSlope) * 1.5, 3.0);
        player.vx += bonus;
        spawnParticles(player.x, player.y + player.r, 10, '#ffe066', 4);
      } else if (tiltError < 0.6) {
        // DECENT — small boost
        player.vx += 0.4;
        spawnParticles(player.x, player.y + player.r, 4, '#fdebc8', 2);
      } else if (tiltError >= CRASH_TILT_THRESHOLD) {
        // CRASH — wipeout! rider tumbles
        player.crashed = true;
        player.crashTimer = CRASH_DURATION;
        player.crashVx = player.vx;
        player.vx *= 0.5;
        spawnParticles(player.x, player.y + player.r, 12, '#d4886a', 5);
        spawnParticles(player.x, player.y, 6, '#ff8844', 3);
        player.tilt *= 0.3;
      } else {
        // BAD — speed penalty but no crash
        player.vx *= 0.85;
        spawnParticles(player.x, player.y + player.r, 4, '#d4886a', 2);
      }
      player.tilt *= 0.3;
    }

    if (player.vy > 2) {
      player.vy = -player.vy * BOUNCE;
      spawnParticles(player.x, player.y + player.r, 3, '#d4b88a');
    } else {
      player.vy = 0;
      player.onGround = true;
    }
    player.vx += Math.sin(landSlope) * 0.15;
  } else {
    player.onGround = false;
  }

  // wheel rotation
  player.angle += player.vx * 0.15;

  // smooth slope for rendering
  const targetSlope = player.onGround ? getGroundSlope(player.x) : 0;
  player.smoothSlope += (targetSlope - player.smoothSlope) * 0.15;

  // camera
  const screenX = player.x - camera.x;
  if (screenX > 120) camera.x = player.x - 120;
  if (camera.x < 0) camera.x = 0;
  const targetCamY = player.y - 120;
  camera.y += (targetCamY - camera.y) * 0.1;

  updateParticles();
}

export { MAX_CHARGE, MAX_HEAT, CRASH_DURATION };
