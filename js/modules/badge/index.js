/* Hero lanyard badge: hangs from just under the fixed header, swings in once on load, then the frame loop
   sleeps until the visitor hovers, drags, taps or presses a key. Hidden below 640px (the rig is display:none). */
import { header, reduce } from '../../lib/dom.js';
import { Badge } from './badge.js';

var MQ_WIDE = '(min-width: 640px)';  // same edge as .portrait-rig's display:none in css/components/hero.css
var PIVOT_Y = 0;                     // px from the stage top, which sits on the header's bottom edge
var ENTER_ANGLE = -0.62;             // rad, at most; starts out over the text side, away from the page edge
var RETURN = 0.7;                    // measured: the return swing reaches ~0.6 of the start angle; 0.7 leaves margin
var SLEEP_AFTER = 0.4;               // s the badge must stay still before the loop stops
var MAX_TRIES = 60;                  // frames to wait for the stylesheet before falling back to 'load'

/* geometry at scale 1, from the custom properties on .badge-stage (css owns the sizes) */
function readSize(stage){
  var css = getComputedStyle(stage);
  var px = function(name){ return parseFloat(css.getPropertyValue(name)); };
  return { cardW:px('--card-w'), cardH:px('--card-h'), ring:px('--ring-y'), strap:px('--strap-len'), clip:px('--clip-len') };
}
function usable(s){ return s.cardW > 0 && s.cardH > s.ring && s.strap > 0 && s.clip >= 0; }

export function initBadge(){
  var stage = document.getElementById('badgeStage');
  var el = stage && stage.querySelector('.badge');
  if (!el) return;
  var rigEl = stage.parentElement;
  var wide = window.matchMedia(MQ_WIDE);
  var badge = null, size = null, hung = null;
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
    if (running || !badge || !wide.matches) return;
    running = true; last = 0;
    raf = requestAnimationFrame(frame);
  }
  function sleep(){ cancelAnimationFrame(raf); running = false; }

  /* ---- layout: stage top on the header's bottom edge (at scroll 0), card scaled to fit the stage ---- */
  function layout(){
    if (!badge || !wide.matches || !rigEl.clientWidth) return;
    var headerH = header ? header.getBoundingClientRect().height : 0;
    stage.style.top = (headerH - (rigEl.getBoundingClientRect().top + window.scrollY)) + 'px';
    var w = stage.clientWidth, h = stage.clientHeight;
    var reach = size.strap + size.clip + size.cardH - size.ring + 12;
    var scale = Math.min(1, (h - PIVOT_Y) / reach, w / (size.cardW * 1.2));
    if (hung && Math.abs(hung.w - w) < .5 && Math.abs(hung.scale - scale) < .001) return;
    hung = { w:w, scale:scale };
    badge.hang(w / 2, PIVOT_Y, scale);
  }

  /* ---- entrance angle: as wide as the room allows, so the card's return swing never passes the page edge ---- */
  function enterAngle(){
    var s = hung ? hung.scale : 1;
    var arm = (size.strap + size.clip + size.cardH / 2 - size.ring) * s;   // pivot to card centre
    var r = stage.getBoundingClientRect();
    var room = document.documentElement.clientWidth - (r.left + r.width / 2) - size.cardW * s / 2 - 12;
    return -Math.min(Math.abs(ENTER_ANGLE), Math.asin(Math.max(0, Math.min(1, room / (RETURN * arm)))));
  }

  /* ---- first start, once. WebKit can run this module before the stylesheets apply, so the sizes read
     NaN: then try again on each of the next MAX_TRIES frames, and on 'load' ---- */
  function retry(){ queued = false; init(); }
  function init(){
    if (badge || !wide.matches) return;
    size = readSize(stage);
    if (!usable(size)){
      if (!queued && tries++ < MAX_TRIES){ queued = true; requestAnimationFrame(retry); }
      return;
    }
    badge = new Badge(el, size, wake);
    layout();
    if (!reduce()){ badge.enter(enterAngle()); wake(); }
    stage.classList.add('live');
  }

  function onWidth(){
    if (!wide.matches){ sleep(); return; }
    if (!badge){ init(); return; }
    layout(); wake();
  }
  if (wide.addEventListener) wide.addEventListener('change', onWidth); else wide.addListener(onWidth);

  var timer = 0;
  window.addEventListener('resize', function(){ clearTimeout(timer); timer = setTimeout(onWidth, 60); });
  /* the rig stretches with the hero copy, so web fonts landing can change its height without a resize */
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(rigEl);
  if (document.readyState !== 'complete') window.addEventListener('load', init, { once:true });

  init();
}
