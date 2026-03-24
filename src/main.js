import { initInput, update } from './game.js';
import { draw } from './renderer.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

initInput();

let screenshotFlash = 0;

// Press P to save screenshot for debugging
document.addEventListener('keydown', e => {
  if (e.key === 'p' || e.key === 'P') {
    const dataUrl = canvas.toDataURL('image/png');
    fetch('/save-screenshot', { method: 'POST', body: dataUrl });
    screenshotFlash = 60;
  }
});

function loop() {
  update();
  draw(ctx);
  if (screenshotFlash > 0) {
    ctx.globalAlpha = Math.min(1, screenshotFlash / 30);
    ctx.fillStyle = '#fdebc8';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCREENSHOT SAVED', 160, 230);
    ctx.globalAlpha = 1;
    screenshotFlash--;
  }
  requestAnimationFrame(loop);
}

loop();
