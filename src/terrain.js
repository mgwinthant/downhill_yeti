const BASE_GROUND = 120;
const SLOPE = 0.25;
const TERRAIN_SEGMENT = 400; // terrain variety segment length
const SEGMENT = 1000;

function seededRand(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const rampCache = {};

// Ramp types: 0 = drop, 1 = kicker, 2 = big air, 3 = gap jump
function getRamp(segIndex) {
  if (segIndex < 1) return null;
  if (rampCache[segIndex]) return rampCache[segIndex];
  const r = seededRand(segIndex);
  const start = segIndex * SEGMENT + 60 + Math.floor(r * 100);
  const type = Math.floor(seededRand(segIndex + 333) * 4);

  let width, height, gapStart, gapEnd, rampLen;
  if (type === 0) {
    // drop — flat then sudden drop
    width = 100 + Math.floor(seededRand(segIndex + 999) * 40);
    height = 20 + Math.floor(seededRand(segIndex + 777) * 15);
  } else if (type === 1) {
    // kicker — moderate length, smaller
    width = 45 + Math.floor(seededRand(segIndex + 999) * 20);
    height = 20 + Math.floor(seededRand(segIndex + 777) * 15);
  } else if (type === 2) {
    // big air — long and tall
    width = 80 + Math.floor(seededRand(segIndex + 999) * 40);
    height = 55 + Math.floor(seededRand(segIndex + 777) * 30);
  } else {
    // gap jump: ramp up → gap → landing ramp down
    rampLen = 40;
    const gap = 130 + Math.floor(seededRand(segIndex + 888) * 80);
    gapStart = start + rampLen;
    gapEnd = gapStart + gap;
    width = rampLen + gap + rampLen;
    height = 35 + Math.floor(seededRand(segIndex + 777) * 20);
  }

  rampCache[segIndex] = { start, end: start + width, height, type, gapStart, gapEnd, rampLen };
  return rampCache[segIndex];
}

export function getNearbyRamps(wx) {
  const seg = Math.floor(wx / SEGMENT);
  const result = [];
  for (let s = seg - 2; s <= seg + 2; s++) {
    const r = getRamp(s);
    if (r) result.push(r);
  }
  return result;
}

// terrain type at position: 0 = flat, 1 = steep, 2 = technical bumps
function getTerrainType(wx) {
  const seg = Math.floor(wx / TERRAIN_SEGMENT);
  return Math.floor(seededRand(seg * 31 + 17) * 3);
}

function getTerrainBlend(wx) {
  const seg = Math.floor(wx / TERRAIN_SEGMENT);
  const t = (wx - seg * TERRAIN_SEGMENT) / TERRAIN_SEGMENT;
  // smooth blend in first/last 15% of segment
  if (t < 0.15) return t / 0.15;
  if (t > 0.85) return 1 - (t - 0.85) / 0.15;
  return 1;
}

export function getGroundY(wx) {
  let y = BASE_GROUND + wx * SLOPE;

  // base rolling
  y += Math.sin(wx * 0.012) * 10;
  y += Math.sin(wx * 0.03) * 5;

  // terrain variety
  const type = getTerrainType(wx);
  const blend = getTerrainBlend(wx);

  if (type === 0) {
    // flat — gentle, mellow terrain
    y += Math.sin(wx * 0.008) * 3 * blend;
  } else if (type === 1) {
    // steep — deep slopes, fast sections
    y += Math.sin(wx * 0.015) * 25 * blend;
    y += Math.sin(wx * 0.04) * 8 * blend;
  } else {
    // technical — rapid bumps and roots
    y += Math.sin(wx * 0.08) * 6 * blend;
    y += Math.sin(wx * 0.15) * 3 * blend;
    y += Math.sin(wx * 0.25) * 2 * blend;
  }

  const nearRamps = getNearbyRamps(wx);
  for (const r of nearRamps) {
    if (r.type === 0) {
      // drop — sudden steep dip, like riding off a ledge
      if (wx >= r.start && wx <= r.end) {
        const t = (wx - r.start) / (r.end - r.start);
        y += Math.sin(t * Math.PI) * r.height;
      }
    } else if (r.type === 3) {
      // gap jump: takeoff ramp → deep gap → landing ramp
      if (wx >= r.start && wx < r.gapStart) {
        const t = (wx - r.start) / r.rampLen;
        y -= Math.pow(t, 1.5) * r.height;
      } else if (wx >= r.gapStart && wx <= r.gapEnd) {
        y += r.height * 3;
      } else if (wx > r.gapEnd && wx <= r.end) {
        const t = 1 - (wx - r.gapEnd) / r.rampLen;
        y -= Math.pow(t, 1.5) * r.height;
      }
    } else if (wx >= r.start && wx <= r.end) {
      const t = (wx - r.start) / (r.end - r.start);
      if (r.type === 1) {
        y -= Math.pow(t, 2) * r.height;
      } else {
        y -= Math.pow(t, 2.5) * r.height;
      }
    }
  }
  return y;
}

export function getGroundSlope(wx) {
  const left = getGroundY(wx - 1);
  const right = getGroundY(wx + 1);
  return Math.atan2(right - left, 2);
}

export function getTreesInRange(startX, endX) {
  const result = [];
  const step = 150;
  const first = Math.floor(startX / step) * step;
  for (let base = first; base <= endX; base += step) {
    const tx = base + Math.floor(seededRand(base * 3 + 7) * 80);
    if (tx >= startX && tx <= endX) {
      result.push(tx);
    }
  }
  return result;
}

export function getCowsInRange(startX, endX) {
  const result = [];
  const step = 250;
  const first = Math.floor(startX / step) * step;
  for (let base = first; base <= endX; base += step) {
    if (seededRand(base * 13 + 41) > 0.5) continue; // only some spots have cows
    const cx = base + Math.floor(seededRand(base * 5 + 19) * 120);
    if (cx >= startX && cx <= endX) {
      result.push(cx);
    }
  }
  return result;
}

export { seededRand };
