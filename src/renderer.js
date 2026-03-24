import { P } from './palette.js';
import { getGroundY, getGroundSlope, getNearbyRamps, getTreesInRange, getCowsInRange, seededRand } from './terrain.js';
import { treeSprites, cowSprite, bikeFrameSprite, yetiHeadSprite, drawWheel, getTreeVariant, SPRITE_OX, SPRITE_OY, HEAD_OX, HEAD_OY, SCARF_COLOR } from './sprites.js';
import { player, camera, particles, trail, MAX_CHARGE, MAX_HEAT, CRASH_DURATION } from './game.js';

export function draw(ctx) {
  // === SKY ===
  const sky = P.sky;
  const bandH = 240 / (sky.length - 1);
  for (let i = 0; i < sky.length - 1; i++) {
    const y0 = Math.floor(i * bandH);
    const y1 = Math.floor((i + 1) * bandH);
    ctx.fillStyle = sky[i];
    ctx.fillRect(0, y0, 320, y1 - y0);
  }

  // === SUN ===
  const sunX = Math.floor(250 - camera.x * 0.001);
  const sunY = 45;
  ctx.fillStyle = '#ffe066';
  ctx.beginPath(); ctx.arc(sunX, sunY, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff8cc';
  ctx.beginPath(); ctx.arc(sunX, sunY, 8, 0, Math.PI * 2); ctx.fill();

  // === MOUNTAINS ===
  drawMountainLayer(ctx, P.mtn1, 0.02, 100, 80, 0.008);
  drawMountainLayer(ctx, P.mtn2, 0.04, 120, 60, 0.012);
  drawMountainLayer(ctx, P.mtn3, 0.07, 140, 45, 0.018);

  // === TREES ===
  const visibleTrees = getTreesInRange(camera.x - 30, camera.x + 350);
  for (const tx of visibleTrees) {
    const sx = Math.floor(tx - camera.x);
    const ty = Math.floor(getGroundY(tx) - camera.y);
    const v = getTreeVariant(tx);
    ctx.drawImage(treeSprites[v], sx - 12, ty - 46);
  }

  // === COWS ===
  const visibleCows = getCowsInRange(camera.x - 20, camera.x + 340);
  for (const cx of visibleCows) {
    const sx = Math.floor(cx - camera.x);
    const cy = Math.floor(getGroundY(cx) - camera.y);
    ctx.drawImage(cowSprite, sx - 10, cy - 14);
  }

  // === TERRAIN ===
  for (let i = 0; i < 320; i++) {
    const wx = i + camera.x;
    const gy = Math.floor(getGroundY(wx) - camera.y);
    ctx.fillStyle = P.snow1;
    ctx.fillRect(i, gy, 1, 3);
    ctx.fillStyle = P.snow2;
    ctx.fillRect(i, gy + 3, 1, 4);
    ctx.fillStyle = P.snow3;
    ctx.fillRect(i, gy + 7, 1, 6);
    ctx.fillStyle = P.ground;
    ctx.fillRect(i, gy + 13, 1, 240 - gy);
    if ((i + Math.floor(wx)) % 6 === 0) {
      ctx.fillStyle = P.snow2;
      ctx.fillRect(i, gy + 1, 1, 1);
    }
  }

  // === RAMP MARKERS ===
  const visibleRamps = getNearbyRamps(camera.x + 160);
  for (const r of visibleRamps) {
    const mx = Math.floor(r.start - 25 - camera.x);
    const my = Math.floor(getGroundY(r.start - 25) - camera.y);
    if (mx < -20 || mx > 340) continue;
    ctx.fillStyle = P.mtn3;
    ctx.fillRect(mx + 4, my - 18, 2, 18);
    ctx.fillStyle = '#c75b7a';
    ctx.fillRect(mx + 6, my - 18, 8, 5);
  }

  // === SPEED TRAIL ===
  for (const t of trail) {
    ctx.fillStyle = P.dustLight;
    ctx.globalAlpha = t.life / 8 * 0.25;
    ctx.fillRect(Math.floor(t.x - camera.x), Math.floor(t.y - camera.y) - 4, 3, 1);
    ctx.fillRect(Math.floor(t.x - camera.x) - 2, Math.floor(t.y - camera.y) - 2, 2, 1);
  }
  ctx.globalAlpha = 1;

  // === PARTICLES ===
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.min(1, p.life / 20);
    ctx.fillRect(Math.floor(p.x - camera.x), Math.floor(p.y - camera.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // === PLAYER ===
  const px = Math.floor(player.x - camera.x);
  const py = Math.floor(player.y - camera.y);
  const slope = player.smoothSlope;
  const chargeT = player.jumpCharge / MAX_CHARGE;
  const squashY = 1 - chargeT * 0.35;
  const squashX = 1 + chargeT * 0.15;
  const bodyRotation = slope * 0.47 - player.tilt;
  const speed = Math.abs(player.vx);
  const leanAngle = Math.min(speed * 0.01, 0.80);

  const crashVisible = !player.crashed || (player.crashTimer % 6 < 4);

  if (crashVisible) {
    // Body + bike
    ctx.save();
    ctx.translate(px, py + chargeT * 6);

    if (player.crashed) {
      const crashProgress = 1 - (player.crashTimer / CRASH_DURATION);
      ctx.rotate(bodyRotation + crashProgress * Math.PI * 3);
    } else {
      ctx.rotate(bodyRotation);
    }
    ctx.scale(-squashX, squashY);

    drawWheel(ctx, 10, 5, 7, player.angle);
    drawWheel(ctx, -10, 5, 7, player.angle);
    ctx.drawImage(bikeFrameSprite, -SPRITE_OX, -SPRITE_OY);

    // Chicken-head: counter-rotate to stay level
    ctx.translate(-3, -15);
    ctx.rotate(bodyRotation + leanAngle);
    ctx.drawImage(yetiHeadSprite, -HEAD_OX, -HEAD_OY);

    ctx.restore();

    // === SCARF ===
    ctx.save();
    ctx.translate(px, py + chargeT * 6);
    if (player.crashed) {
      const crashProgress = 1 - (player.crashTimer / CRASH_DURATION);
      ctx.rotate(bodyRotation + crashProgress * Math.PI * 3);
    } else {
      ctx.rotate(bodyRotation);
    }
    ctx.scale(-squashX, squashY);
    ctx.translate(0, -17);

    ctx.fillStyle = SCARF_COLOR;
    ctx.fillRect(-3, -1, 7, 2);
    ctx.fillStyle = '#d87a94';
    ctx.fillRect(-2, -1, 5, 1);

    const tailLen = Math.min(3 + speed * 1.5, 29);
    const wave = Math.sin(Date.now() * 0.008) * Math.min(speed * 0.5, 2);
    ctx.fillStyle = SCARF_COLOR;
    for (let i = 0; i < tailLen; i++) {
      const sy = -1 + Math.sin(i * 0.5 + Date.now() * 0.006) * wave * (i / tailLen);
      ctx.fillRect(4 + i, Math.floor(sy), 1, 2);
    }
    if (tailLen > 5) {
      const endWave = Math.sin(Date.now() * 0.01) * Math.min(speed * 0.4, 3);
      ctx.fillRect(4 + Math.floor(tailLen), Math.floor(-1 + endWave), 2, 1);
    }
    ctx.restore();
  }

  // === HUD ===
  ctx.fillStyle = P.white;
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  const mph = Math.abs(Math.round(player.vx * 3.5));
  ctx.fillText(mph + ' mph', 4, 12);

  // === HEAT GAUGE ===
  const heatBarX = 4, heatBarY = 16;
  const heatBarW = 40, heatBarH = 4;
  const heatT = player.heat / MAX_HEAT;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(heatBarX, heatBarY, heatBarW, heatBarH);
  if (heatT < 0.5) {
    ctx.fillStyle = '#4a9035';
  } else if (heatT < 0.8) {
    ctx.fillStyle = '#ffe066';
  } else {
    ctx.fillStyle = player.overheated ? ((Date.now() % 300 < 150) ? '#ff4422' : '#ff8844') : '#ff4422';
  }
  ctx.fillRect(heatBarX, heatBarY, Math.floor(heatBarW * heatT), heatBarH);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 1; i < 4; i++) {
    ctx.fillRect(heatBarX + Math.floor(heatBarW * i / 4), heatBarY, 1, heatBarH);
  }

  if (player.overheated) {
    ctx.fillStyle = '#ff4422';
    ctx.font = '8px monospace';
    ctx.fillText('HOT!', heatBarX + heatBarW + 3, heatBarY + 4);
  }

  // === CRASH TEXT ===
  if (player.crashed && player.crashTimer > CRASH_DURATION * 0.5) {
    ctx.fillStyle = '#ff4422';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CRASH!', 160, 100);
    ctx.textAlign = 'left';
  }
}

function drawMountainLayer(ctx, color, parallax, baseY, height, freq) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 240);
  for (let x = 0; x <= 320; x += 2) {
    const wx = x + camera.x * parallax;
    const y = baseY
      - Math.sin(wx * freq) * height * 0.5
      - Math.sin(wx * freq * 2.3 + 1) * height * 0.25
      - Math.sin(wx * freq * 0.7 + 3) * height * 0.25;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(320, 240);
  ctx.closePath();
  ctx.fill();
}
