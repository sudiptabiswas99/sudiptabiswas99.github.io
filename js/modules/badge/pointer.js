/* Pointer and keyboard input for one Badge: mouse drag and hover tilt, touch drag and tap, keys.
   Split out of badge.js. Every input calls badge.wake(), so the frame loop in index.js runs while it moves. */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function bindPointer(badge) {
  const card = badge.parts.card;
  const at = (e) => {
    const r = badge.el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  card.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || badge.drag) return;
    // touch leaves the page free to scroll (the card is touch-action: pan-y there)
    const mouse = e.pointerType === 'mouse';
    if (mouse) e.preventDefault();
    try { card.setPointerCapture(e.pointerId); } catch (err) {}
    const p = at(e);
    badge.rig.letGo();
    // a touch only takes hold once it moves sideways; a vertical swipe is the browser's scroll
    badge.drag = { id: e.pointerId, live: mouse, t: badge.rig.along(p.x, p.y), ...p,
      sx: e.clientX, sy: e.clientY, time: performance.now(), moved: false };
    setHover(badge, null);
    badge.el.classList.add('is-dragging');
    badge.wake();
  });

  card.addEventListener('pointermove', (e) => {
    const p = at(e);
    const d = badge.drag;
    if (d && e.pointerId === d.id) {
      Object.assign(d, p);
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (Math.hypot(dx, dy) > 6) {
        if (!d.moved && Math.abs(dx) > Math.abs(dy)) d.live = true;
        d.moved = true;
      }
    } else if (d) {
      return;
    } else if (e.pointerType === 'mouse') {
      setHover(badge, badge.rig.local(p.x, p.y, (badge.size.cardW / 2) * badge.scale));
    }
    badge.wake();
  });

  const end = (e) => {
    if (!badge.drag || e.pointerId !== badge.drag.id) return;
    const tap = !badge.drag.moved && performance.now() - badge.drag.time < 320;
    badge.drag = null;
    badge.rig.release();
    badge.el.classList.remove('is-dragging');
    badge.wake();
    if (tap && e.type === 'pointerup') badge.flip();
  };
  // on window, so a release anywhere ends the drag even if pointer capture was refused
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  card.addEventListener('lostpointercapture', end);
  card.addEventListener('pointerleave', () => { if (!badge.drag) { setHover(badge, null); badge.wake(); } });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); badge.flip(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); badge.sway(e.key === 'ArrowLeft' ? -1 : 1); }
  });
}

function setHover(badge, h) {
  badge.hover = h;
  const style = badge.parts.card.style;
  style.setProperty('--glare', h ? 1 : 0);
  if (!h) return;
  style.setProperty('--mx', `${(clamp(h.x, -1, 1) * 0.5 + 0.5) * 100}%`);
  style.setProperty('--my', `${clamp(h.y, 0, 1) * 100}%`);
}
