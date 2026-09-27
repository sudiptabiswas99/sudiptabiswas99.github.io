/* Hero lanyard badge: hangs from the header's bottom edge (or, on phones, from its own rule), drops in on its
   strap whenever it comes into view, then the frame loop sleeps until the visitor hovers, drags, taps or
   presses a key. .badge-stage sets --badge-pin (header | top) and --badge-scale-max in the CSS. */
import { header, reduce } from '../../lib/dom.js';
import { Badge } from './badge.js';

var PIVOT_Y = 0;                     // px from the stage top
var SWING = 0.17;                    // rad at most: the drop is the entrance, the side swing only adds to it
var RETURN = 0.7;                    // measured: the return swing reaches ~0.6 of the start angle; 0.7 leaves margin
var SEEN = 0.35;                     // share of the stage (or of the screen, if the stage is taller) before it drops
var SLEEP_AFTER = 0.4;               // s the badge must stay still before the loop stops
var MAX_TRIES = 60;                  // frames to wait for the stylesheet before falling back to 'load'

/* geometry at scale 1, from the custom properties on .badge-stage (css owns the sizes) */
function readSize(css){
  var px = function(name){ return parseFloat(css.getPropertyValue(name)); };
  return { cardW:px('--card-w'), cardH:px('--card-h'), ring:px('--ring-y'), strap:px('--strap-len'), clip:px('--clip-len') };
}
function usable(s){ return s.cardW > 0 && s.cardH > s.ring && s.strap > 0 && s.clip >= 0; }

export function initBadge(){
  var stage = document.getElementById('badgeStage');
  var el = stage && stage.querySelector('.badge');
  if (!el) return;
  var rigEl = stage.parentElement;
  var badge = null, size = null, hung = null, shown = false;
  var running = false, raf = 0, last = 0, quiet = 0, tries = 0, queued = false;

  /* ---- frame loop: runs only while something moves, then stops (0 frames at rest) ---- */
  function frame(now){
    var dt = last ? Math.min(.05, Math.max(0, (now - last) / 1000)) : 1 / 60;
    last = now;
    badge.update(dt);
    quiet = badge.resting() ? quiet + dt : 0;
    if (quiet >= SLEEP_AFTER){ running = false; return; }
    raf = requestAnimationFrame(frame);
  }
  function wake(){
    quiet = 0;
    if (running || !badge || !shown) return;
    running = true; last = 0;
    raf = requestAnimationFrame(frame);
  }
  function sleep(){ cancelAnimationFrame(raf); running = false; }

  /* ---- layout: pivot on the header's bottom edge at scroll 0 (header) or the stage's top (top),
     card scaled to fit the stage and capped by --badge-scale-max ---- */
  function layout(){
    if (!badge) return;
    var was = shown;
    shown = stage.clientWidth > 0 && stage.clientHeight > 0;
    if (!shown){ sleep(); arm(); return; }
    var css = getComputedStyle(stage);
    var next = readSize(css);
    if (usable(next)){ size = next; badge.size = next; }
    if (css.getPropertyValue('--badge-pin').trim() === 'top') stage.style.top = '';
    else {
      var headerH = header ? header.getBoundingClientRect().height : 0;
      stage.style.top = (headerH - (rigEl.getBoundingClientRect().top + window.scrollY)) + 'px';
    }
    var max = parseFloat(css.getPropertyValue('--badge-scale-max'));
    var w = stage.clientWidth, h = stage.clientHeight;
    var reach = size.strap + size.clip + size.cardH - size.ring + 12;
    var scale = Math.min(max > 0 ? max : 1, (h - PIVOT_Y) / reach, w / (size.cardW * 1.2));
    if (!(hung && Math.abs(hung.w - w) < .5 && Math.abs(hung.scale - scale) < .001 && hung.strap === size.strap)){
      hung = { w:w, scale:scale, strap:size.strap };
      badge.hang(w / 2, PIVOT_Y, scale);
    }
    if (!was) play();
  }

  /* ---- side angle: as wide as the room allows, so the card's return swing never passes the page edge ---- */
  function enterAngle(){
    var s = hung ? hung.scale : 1;
    var arm = (size.strap + size.clip + size.cardH / 2 - size.ring) * s;   // pivot to card centre
    var r = stage.getBoundingClientRect();
    var room = document.documentElement.clientWidth - (r.left + r.width / 2) - size.cardW * s / 2 - 12;
    return -Math.min(SWING, Math.asin(Math.max(0, Math.min(1, room / (RETURN * arm)))));
  }

  /* ---- the entrance: arm() pulls the card up to the mount while nobody can see it, play() drops it once the
     stage is on screen. Never during a drag (badge.arm checks), never twice (play needs it armed) ---- */
  function onScreen(){
    var r = stage.getBoundingClientRect(), vh = window.innerHeight;
    var seen = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    return r.height > 0 && seen >= SEEN * Math.min(r.height, vh);
  }
  function arm(){ if (badge && !reduce()) badge.arm(); }
  function play(){
    if (!badge || !shown || document.hidden || !badge.armed() || !onScreen()) return;
    badge.drop(enterAngle());
  }

  /* ---- first start, once. WebKit can run this module before the stylesheets apply, so the sizes read
     NaN: then try again on each of the next MAX_TRIES frames, and on 'load' ---- */
  function retry(){ queued = false; init(); }
  function init(){
    if (badge || !stage.clientWidth || !stage.clientHeight) return;
    size = readSize(getComputedStyle(stage));
    if (!usable(size)){
      if (!queued && tries++ < MAX_TRIES){ queued = true; requestAnimationFrame(retry); }
      return;
    }
    badge = new Badge(el, size, wake);
    layout();
    arm();
    stage.classList.add('live');
    play();
  }

  function onResize(){
    if (!badge){ init(); return; }
    layout(); wake();
  }
  var timer = 0;
  window.addEventListener('resize', function(){ clearTimeout(timer); timer = setTimeout(onResize, 60); });
  /* the rig stretches with the hero copy (web fonts landing) and goes 0x0 when a breakpoint hides it */
  if ('ResizeObserver' in window) new ResizeObserver(function(){ if (badge) layout(); else init(); }).observe(rigEl);
  if (document.readyState !== 'complete') window.addEventListener('load', init, { once:true });

  /* replay whenever it is shown again: scrolled back into view, tab back in front, back/forward cache */
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      if (!entries[entries.length - 1].isIntersecting) arm(); else play();
    }, { threshold:[0, .1, .2, SEEN] }).observe(stage);
  }
  document.addEventListener('visibilitychange', function(){ if (document.hidden) arm(); else play(); });
  window.addEventListener('pagehide', arm);
  window.addEventListener('pageshow', function(e){ if (e.persisted) play(); });

  init();
}
