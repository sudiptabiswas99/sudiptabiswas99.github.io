(function () {
  'use strict';

  var canvas = document.getElementById('cyberbg');
  if (!canvas) return;
  var ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- grid params (trimmed for perf; still reads as a dense floor) ----
  var AMOUNTX = 60;   // dots across
  var AMOUNTZ = 38;   // dots into distance
  var AMP     = 10;   // wave amplitude
  var MAX_R   = 3.0;

  var CAM_Y = 60, HORIZON = 0.28, NEAR_Z = 90, GRID_SPAN = 900;
  var W = 0, H = 0, dpr = 1, FOCAL = 1, GRID_W = 1500, stepX = 1, stepZ = 1;

  // ---- pre-render ONE glow dot to an offscreen sprite (drawn once) ----
  // Per-frame we drawImage() this sprite instead of building a radial
  // gradient per dot — the single biggest perf win vs the old version.
  var SPR = 64;
  var sprite = document.createElement('canvas');
  sprite.width = sprite.height = SPR;
  (function buildSprite() {
    var s = sprite.getContext('2d');
    var g = s.createRadialGradient(SPR / 2, SPR / 2, 0, SPR / 2, SPR / 2, SPR / 2);
    g.addColorStop(0.0, 'rgba(150,196,255,1)');   // hot core
    g.addColorStop(0.4, 'rgba(59,130,246,0.55)'); // neon body
    g.addColorStop(1.0, 'rgba(59,130,246,0)');
    s.fillStyle = g;
    s.beginPath();
    s.arc(SPR / 2, SPR / 2, SPR / 2, 0, 6.2832);
    s.fill();
  })();

  function resize() {
    // soft background: 1.5x DPR is plenty and roughly halves fill cost vs 2x
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.max(1, Math.floor(W * dpr));
    canvas.height = Math.max(1, Math.floor(H * dpr));
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    FOCAL  = H * 0.9;
    GRID_W = Math.max(1400, W * 1.6);
    stepX  = GRID_W / (AMOUNTX - 1);
    stepZ  = GRID_SPAN / (AMOUNTZ - 1);
  }

  function project(x, y, z) {
    if (z <= 1) return null;
    var s = FOCAL / z;
    return { sx: W / 2 + x * s, sy: H * HORIZON - (y - CAM_Y) * s, s: s };
  }

  var count = 0, running = true, rafId = null;

  function frame() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter'; // additive glow
    for (var iz = AMOUNTZ - 1; iz >= 0; iz--) {
      var z = NEAR_Z + iz * stepZ;
      var depthT = iz / (AMOUNTZ - 1);
      var fog = 1 - depthT;
      var nearFade = depthT < 0.12 ? (depthT / 0.12) : 1;
      var baseA = (Math.pow(fog, 1.5) * 0.62 + 0.03) * nearFade;
      if (baseA < 0.015) continue;
      // wave phase shared across the row (depends on iz + count)
      var rowWave = Math.sin((iz + count) * 0.5) * AMP;
      for (var ix = 0; ix < AMOUNTX; ix++) {
        var x = (ix - (AMOUNTX - 1) / 2) * stepX;
        var y = Math.sin((ix + count) * 0.3) * AMP + rowWave;
        var p = project(x, y, z);
        if (!p) continue;
        if (p.sx < -40 || p.sx > W + 40 || p.sy < -40 || p.sy > H + 40) continue;
        var r = p.s * 1.15; if (r > MAX_R) r = MAX_R; else if (r < 0.45) r = 0.45;
        var d = r * 4.4; // glow diameter drawn from the sprite
        ctx.globalAlpha = baseA;
        ctx.drawImage(sprite, p.sx - d / 2, p.sy - d / 2, d, d);
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    var vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0,    'rgba(5,7,13,0.82)');
    vg.addColorStop(0.32, 'rgba(5,7,13,0.30)');
    vg.addColorStop(0.6,  'rgba(5,7,13,0)');
    vg.addColorStop(1,    'rgba(5,7,13,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    count += 0.06;
    if (!reduce && running) rafId = requestAnimationFrame(frame);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (reduce) frame();
    }, 120);
  });

  // Pause the loop when the tab is hidden (frees the CPU, no wasted frames).
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else if (!reduce && !running) {
      running = true;
      rafId = requestAnimationFrame(frame);
    }
  });

  resize();
  frame();
})();
