/* Shared by the 3D pieces: lazy three.js import, WebGL check, on-demand render loop, drag input. */
import { doc } from './dom.js';

/* ---- 3D: three.js loads only when a 3D piece nears the screen, and renders only while it moves ---- */
export var hasGL = (function(){ try { var c = doc.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch(e){ return false; } })();
var threeP = null;
export function three(){ return threeP || (threeP = import('three')); }
export function whenNear(el, fn){
  var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); fn(); } }, { rootMargin:'300px 0px' });
  io.observe(el);
}
export function onDemand(step){
  var on = false;
  function tick(){ if (step()) requestAnimationFrame(tick); else on = false; }
  return function(){ if (!on){ on = true; requestAnimationFrame(tick); } };
}
export function view(THREE, parent, before, fov){
  var renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  var cv = renderer.domElement; cv.setAttribute('aria-hidden', 'true');
  parent.insertBefore(cv, before || null);
  var cam = new THREE.PerspectiveCamera(fov, 1, .1, 5000);
  var v = { THREE:THREE, renderer:renderer, scene:new THREE.Scene(), cam:cam, cv:cv };
  v.size = function(){ var w = cv.clientWidth, h = cv.clientHeight; if (w && h){ renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } };
  v.draw = function(){ renderer.render(v.scene, cam); };
  return v;
}
export function dragX(cv, onMove, onEnd){
  var down = false, lx = 0, lt = 0, vel = 0;
  cv.addEventListener('pointerdown', function(e){ down = true; lx = e.clientX; lt = e.timeStamp; vel = 0; try { cv.setPointerCapture(e.pointerId); } catch(err){} });
  cv.addEventListener('pointermove', function(e){
    if (!down) return;
    var dx = e.clientX - lx; vel = dx / Math.max(e.timeStamp - lt, 1) * 16; lx = e.clientX; lt = e.timeStamp;
    onMove(dx);
  });
  var up = function(){ if (down){ down = false; onEnd(vel); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  return function(){ return down; };
}
