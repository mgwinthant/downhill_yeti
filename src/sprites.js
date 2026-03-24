import { P } from './palette.js';
import { seededRand } from './terrain.js';

function createCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { canvas: c, ctx: c.getContext('2d') };
}

// === TREE SPRITES (oak trees) ===
export const treeSprites = [0, 1, 2].map(v => {
  const { canvas, ctx } = createCanvas(28, 52);
  const trunk = '#5a3a1e';
  const canopyDark = '#2a5e1a';
  const canopyMid = '#3a7a28';
  const canopyLight = '#4a9035';

  if (v === 0) {
    ctx.fillStyle = trunk;
    ctx.fillRect(12, 24, 4, 28);
    ctx.fillStyle = canopyDark;
    ctx.beginPath(); ctx.arc(14, 16, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = canopyMid;
    ctx.beginPath(); ctx.arc(12, 14, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = canopyLight;
    ctx.beginPath(); ctx.arc(11, 12, 7, 0, Math.PI * 2); ctx.fill();
  } else if (v === 1) {
    ctx.fillStyle = trunk;
    ctx.fillRect(12, 28, 4, 24);
    ctx.fillStyle = canopyDark;
    ctx.beginPath(); ctx.arc(14, 20, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = canopyMid;
    ctx.beginPath(); ctx.arc(16, 18, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = canopyLight;
    ctx.beginPath(); ctx.arc(13, 16, 7, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = trunk;
    ctx.fillRect(12, 32, 3, 20);
    ctx.fillStyle = canopyDark;
    ctx.beginPath(); ctx.arc(13, 26, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = canopyMid;
    ctx.beginPath(); ctx.arc(12, 24, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = canopyLight;
    ctx.beginPath(); ctx.arc(11, 23, 5, 0, Math.PI * 2); ctx.fill();
  }
  return canvas;
});

// === YETI + MOUNTAIN BIKE SPRITE ===
const SPRITE_W = 44, SPRITE_H = 62;
export const SPRITE_OX = 22, SPRITE_OY = 42;

// White frame bike
const FRAME_COLOR = '#e8e8e8';
const FRAME_HI = '#ffffff';
const SEAT_COLOR = '#3a3a3a';
const CHAIN_COLOR = '#888';
const HANDLEBAR = '#ccc';

// Brown yeti fur
const FUR_MAIN = '#8b5e3c';
const FUR_SHADOW = '#6d4528';
const FUR_DARK = '#4a2f1a';
const BELLY = '#a07050';
const FACE_SKIN = '#c49a6c';
const EYE_COLOR = '#222';
const NOSE_COLOR = '#8a6a5a';
const SCARF_COLOR = '#c75b7a';

export const bikeFrameSprite = (() => {
  const { canvas, ctx } = createCanvas(SPRITE_W, SPRITE_H);
  ctx.translate(SPRITE_OX, SPRITE_OY);
  const rwx = 10, rwy = 5, fwx = -10, fwy = 5;

  // === BIKE FRAME (white) ===
  ctx.strokeStyle = FRAME_COLOR;
  ctx.lineWidth = 2;
  // chain stay (BB to rear axle)
  ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(rwx, rwy); ctx.stroke();
  // seat stay
  ctx.beginPath(); ctx.moveTo(7, -7); ctx.lineTo(rwx, rwy); ctx.stroke();
  // seat tube
  ctx.beginPath(); ctx.moveTo(7, -7); ctx.lineTo(2, 2); ctx.stroke();
  // top tube
  ctx.beginPath(); ctx.moveTo(7, -7); ctx.lineTo(-5, -9); ctx.stroke();
  // down tube
  ctx.beginPath(); ctx.moveTo(-5, -9); ctx.lineTo(2, 2); ctx.stroke();
  // frame highlight
  ctx.strokeStyle = FRAME_HI;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(7, -8); ctx.lineTo(-4, -10); ctx.stroke();
  // head tube + fork
  ctx.strokeStyle = FRAME_COLOR;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-5, -9); ctx.lineTo(-7, -4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(fwx, fwy); ctx.stroke();
  // seat
  ctx.fillStyle = SEAT_COLOR;
  ctx.fillRect(4, -12, 6, 2);
  ctx.fillRect(6, -10, 2, 4);
  // handlebar stem + bar
  ctx.strokeStyle = HANDLEBAR;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-5, -9); ctx.lineTo(-7, -13); ctx.stroke();
  ctx.fillStyle = HANDLEBAR;
  ctx.fillRect(-9, -15, 4, 2);
  // grips
  ctx.fillStyle = '#333';
  ctx.fillRect(-9, -15, 2, 2);
  // pedal/crank
  ctx.fillStyle = FRAME_COLOR;
  ctx.fillRect(1, 3, 3, 2);
  // chain
  ctx.strokeStyle = CHAIN_COLOR;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(2, 3); ctx.lineTo(rwx - 2, rwy); ctx.stroke();

  // === YETI BODY ===
  // back arm (shadow)
  ctx.fillStyle = FUR_SHADOW;
  ctx.fillRect(5, -17, 3, 3);
  ctx.fillRect(6, -14, 2, 4);
  // torso
  ctx.fillStyle = FUR_MAIN;
  ctx.fillRect(-1, -20, 7, 12);
  // belly
  ctx.fillStyle = BELLY;
  ctx.fillRect(0, -18, 5, 8);
  // shoulders
  ctx.fillStyle = FUR_MAIN;
  ctx.fillRect(-2, -19, 2, 4);
  ctx.fillRect(5, -19, 2, 4);
  // lower torso shadow
  ctx.fillStyle = FUR_SHADOW;
  ctx.fillRect(-1, -10, 7, 2);
  // front arm
  ctx.fillStyle = FUR_MAIN;
  ctx.fillRect(-4, -18, 4, 3);
  ctx.fillRect(-7, -16, 4, 3);
  // hand/grip
  ctx.fillStyle = FUR_DARK;
  ctx.fillRect(-9, -15, 3, 3);
  // legs
  ctx.fillStyle = FUR_MAIN;
  ctx.fillRect(0, -8, 3, 5);
  ctx.fillRect(3, -8, 3, 4);
  ctx.fillStyle = FUR_SHADOW;
  ctx.fillRect(1, -5, 3, 3);
  ctx.fillRect(3, -5, 3, 3);
  // feet
  ctx.fillStyle = FUR_DARK;
  ctx.fillRect(0, -3, 4, 2);
  ctx.fillRect(2, -3, 4, 2);

  return canvas;
})();

// === YETI HEAD (separate sprite for chicken-head stabilization) ===
const HEAD_W = 32, HEAD_H = 30;
export const HEAD_OX = 16, HEAD_OY = 22;

export const yetiHeadSprite = (() => {
  const { canvas, ctx } = createCanvas(HEAD_W, HEAD_H);
  ctx.translate(HEAD_OX, HEAD_OY);

  // back fur shadow
  ctx.fillStyle = FUR_SHADOW;
  ctx.fillRect(4, -16, 6, 14);
  ctx.fillRect(3, -14, 2, 10);
  // main fur
  ctx.fillStyle = FUR_MAIN;
  ctx.fillRect(-4, -16, 12, 14);
  ctx.fillRect(-5, -14, 1, 10);
  ctx.fillRect(-3, -17, 8, 1);
  ctx.fillRect(-3, -2, 10, 1);
  // face skin
  ctx.fillStyle = FACE_SKIN;
  ctx.fillRect(-6, -12, 5, 8);
  ctx.fillRect(-4, -14, 4, 2);
  ctx.fillRect(-5, -4, 4, 2);
  ctx.fillRect(-8, -10, 3, 5);
  // nose
  ctx.fillStyle = NOSE_COLOR;
  ctx.fillRect(-9, -10, 2, 2);
  // eye white
  ctx.fillStyle = '#fff';
  ctx.fillRect(-4, -14, 3, 4);
  // eye pupil
  ctx.fillStyle = EYE_COLOR;
  ctx.fillRect(-4, -13, 2, 3);
  // eye shine
  ctx.fillStyle = '#fff';
  ctx.fillRect(-4, -13, 1, 1);
  // brow / fur detail
  ctx.fillStyle = FUR_DARK;
  ctx.fillRect(-5, -15, 4, 1);
  ctx.fillRect(-7, -6, 4, 1);
  // top fur tuft
  ctx.fillStyle = FUR_MAIN;
  ctx.fillRect(-2, -20, 3, 4);
  ctx.fillRect(1, -21, 3, 5);
  ctx.fillRect(4, -19, 3, 3);
  ctx.fillRect(7, -18, 2, 3);
  ctx.fillStyle = BELLY;
  ctx.fillRect(-1, -20, 2, 2);
  ctx.fillRect(2, -21, 2, 2);
  // back shadow
  ctx.fillStyle = FUR_SHADOW;
  ctx.fillRect(6, -16, 3, 4);
  ctx.fillStyle = FACE_SKIN;
  ctx.fillRect(7, -15, 1, 2);
  // chin/jaw
  ctx.fillStyle = BELLY;
  ctx.fillRect(-6, -4, 3, 2);
  ctx.fillRect(-5, -2, 2, 1);

  return canvas;
})();

export { SPRITE_W, SPRITE_H, SCARF_COLOR };

// Draw wheel
export function drawWheel(ctx, wx, wy, r, angle) {
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath(); ctx.arc(wx, wy, r + 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#888';
  ctx.beginPath(); ctx.arc(wx, wy, r - 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.arc(wx, wy, r - 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#aaa';
  ctx.beginPath(); ctx.arc(wx, wy, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.8;
  for (let s = 0; s < 6; s++) {
    const a = angle + s * Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + Math.cos(a) * (r - 1), wy + Math.sin(a) * (r - 1));
    ctx.stroke();
  }
}

export function getTreeVariant(tx) {
  return Math.floor(seededRand(tx * 7) * 100) % 3;
}

// === COW SPRITE ===
export const cowSprite = (() => {
  const { canvas, ctx } = createCanvas(20, 14);
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(4, 3, 12, 7);
  ctx.fillStyle = '#222';
  ctx.fillRect(5, 4, 4, 3);
  ctx.fillRect(11, 5, 3, 3);
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(1, 2, 4, 5);
  ctx.fillStyle = '#e8b8a0';
  ctx.fillRect(0, 4, 2, 3);
  ctx.fillStyle = '#222';
  ctx.fillRect(2, 3, 1, 1);
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(1, 1, 2, 2);
  ctx.fillRect(4, 1, 2, 2);
  ctx.fillStyle = '#222';
  ctx.fillRect(5, 10, 2, 4);
  ctx.fillRect(9, 10, 2, 4);
  ctx.fillRect(13, 10, 2, 4);
  ctx.fillStyle = '#222';
  ctx.fillRect(16, 3, 3, 1);
  ctx.fillRect(18, 4, 1, 2);
  ctx.fillStyle = '#e8b8a0';
  ctx.fillRect(10, 9, 3, 2);
  return canvas;
})();
