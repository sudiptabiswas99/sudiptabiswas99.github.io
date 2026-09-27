/* Confetti: 60 grey pieces after a successful copy in Contact. */
import { doc, reduce } from '../lib/dom.js';

/* ---- confetti: after a successful copy in Contact only ---- */
var cvs = doc.getElementById('confetti'), craf = null;
export function fire(x, y){
  if (!cvs || reduce()) return;
  var ctx = cvs.getContext('2d'); if (!ctx) return;
  cvs.hidden = false;
  var dpr = Math.min(window.devicePixelRatio || 1, 2), W = window.innerWidth, H = window.innerHeight;
  cvs.width = W * dpr; cvs.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  var cols = ['#0b0b0b', '#3a3a3a', '#5e5e5e', '#8a8a8a', '#b0b0b0', '#d6d6d6'], parts = [];
  for (var i = 0; i < 60; i++){
    var a = Math.random() * 6.283, sp = Math.random() * 7 + 3;
    parts.push({x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 5, g: .18 + Math.random() * .1,
                w: Math.random() * 6 + 3, rot: Math.random() * 6, vr: (Math.random() - .5) * .5, c: cols[i % cols.length]});
  }
  var t0 = performance.now(), DUR = 1100;
  cancelAnimationFrame(craf);
  (function tick(now){
    var k = (now - t0) / DUR;
    ctx.clearRect(0, 0, W, H);
    if (k >= 1){ cvs.hidden = true; craf = null; return; }
    for (var j = 0; j < parts.length; j++){
      var p = parts[j];
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 1 - k;
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.w / 2, p.w, p.w * .62); ctx.restore();
    }
    craf = requestAnimationFrame(tick);
  })(t0);
}
