/* Count-up: each stat number counts from 0 to its value once, when it comes into view.
   The markup keeps the real number, so without JS (or with reduced motion) the final value just shows. */
import { doc, reduce } from '../lib/dom.js';

const TARGETS = '.hst .n, .ct-n, .at-n, .xp-num b';
const DURATION = 1100;

/* "63" -> {pre:'', num:63, dec:0, sep:false, post:''}; "’26" -> {pre:'’', num:26, ...}; "5,288" keeps the comma */
function parse(text){
  const m = text.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const raw = m[2];
  return { pre: m[1], num: parseFloat(raw.replace(/,/g, '')), dec: (raw.split('.')[1] || '').length,
           sep: raw.indexOf(',') > -1, pad: /^0\d/.test(raw) ? raw.length : 0, post: m[3] };
}

function format(p, v){
  let s = v.toFixed(p.dec);
  if (p.sep) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec });
  if (p.pad) s = s.padStart(p.pad, '0');
  return p.pre + s + p.post;
}

function run(el, p, final){
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / DURATION);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = k < 1 ? format(p, p.num * eased) : final;
    if (k < 1) requestAnimationFrame(step);
    else el.style.minWidth = '';
  };
  requestAnimationFrame(step);
}

export function initCountUp(){
  if (reduce() || !('IntersectionObserver' in window)) return;
  const els = [].slice.call(doc.querySelectorAll(TARGETS));
  const jobs = new Map();
  els.forEach((el) => {
    if (el.querySelector('.n-txt')) return; /* the 3D stat is a three.js piece, not a number */
    const final = el.textContent.trim();
    const p = parse(final);
    if (!p || !p.num) return;
    jobs.set(el, { p, final });
  });
  if (!jobs.size) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, job = jobs.get(el);
      io.unobserve(el);
      if (!job) return;
      /* lock the width to the final value so the line never shifts while it counts */
      el.style.minWidth = el.getBoundingClientRect().width + 'px';
      el.textContent = format(job.p, 0);
      run(el, job.p, job.final);
    });
  }, { threshold: 0.4 });
  jobs.forEach((_, el) => io.observe(el));
}
