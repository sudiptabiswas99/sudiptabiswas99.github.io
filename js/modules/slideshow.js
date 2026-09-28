/* Phone slideshows (below 640px): services, work, content results, AI tools, skills and experience. */
import { MQ_SLIDES } from '../config.js';
import { doc, header, reduce } from '../lib/dom.js';

export function initSlideshows(){
  /* Plain horizontal scroll with snap, so swipe, trackpad and keyboard all work; the bar shows
     where you are and gives 44px previous/next buttons. Above 640 the bar is hidden and the grids return. */
  var CHEV = function(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>'; };
  var mqCar = window.matchMedia(MQ_SLIDES);
  function slideshow(track, label, noun){
    if (!track) return;
    track.classList.add('car');
    /* slideshow semantics only while it is one (phones); on wider screens it is a plain grid again */
    var mode = function(){
      if (mqCar.matches){ track.setAttribute('role', 'region'); track.setAttribute('aria-roledescription', 'slideshow'); track.setAttribute('aria-label', label); track.tabIndex = 0; }
      else { ['role', 'aria-roledescription', 'aria-label', 'tabindex'].forEach(function(a){ track.removeAttribute(a); }); }
    };
    mode();
    if (mqCar.addEventListener) mqCar.addEventListener('change', mode); else mqCar.addListener(mode);
    var bar = doc.createElement('div'); bar.className = 'car-bar';
    bar.innerHTML = '<span class="car-count" aria-live="polite"></span><span class="car-line" aria-hidden="true"><i></i></span>' +
      '<button type="button" class="car-btn" aria-label="Previous ' + noun + '">' + CHEV('M15 18l-6-6 6-6') + '</button>' +
      '<button type="button" class="car-btn" aria-label="Next ' + noun + '">' + CHEV('M9 18l6-6-6-6') + '</button>';
    track.parentNode.insertBefore(bar, track.nextSibling);
    var count = bar.querySelector('.car-count'), line = bar.querySelector('.car-line i'), btns = bar.querySelectorAll('.car-btn');
    var items = function(){ return [].filter.call(track.children, function(c){ return c.offsetParent !== null; }); };
    var pad = function(){ return parseFloat(getComputedStyle(track).paddingLeft) || 0; };
    var at = function(){
      var its = items(), x = track.scrollLeft, best = 0, d = Infinity;
      its.forEach(function(c, i){ var dd = Math.abs(c.offsetLeft - pad() - x); if (dd < d){ d = dd; best = i; } });
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) best = its.length - 1;
      return best;
    };
    var pend = false;
    var paint = function(){
      pend = false;
      var n = items().length, i = n ? at() : 0;
      count.textContent = n ? (i + 1) + ' of ' + n : '';
      line.style.setProperty('--w', (n ? 100 / n : 100) + '%');
      line.style.setProperty('--x', (i * 100) + '%');
      btns[0].disabled = i <= 0; btns[1].disabled = i >= n - 1;
      /* the slideshow is as tall as the card in view, so a short card never leaves a gap above the bar */
      var cur = items()[i];
      if (mqCar.matches && cur){
        var cs = getComputedStyle(track);
        track.style.height = (cur.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) + 'px';
      } else track.style.height = '';
    };
    var later = function(){ if (!pend){ pend = true; requestAnimationFrame(paint); } };
    var go = function(i){
      var its = items(); if (!its.length) return;
      i = Math.max(0, Math.min(its.length - 1, i));
      track.scrollTo({ left:its[i].offsetLeft - pad(), behavior:reduce() ? 'auto' : 'smooth' });
      /* after Next at the foot of a long card, scroll up so the new card's top sits under the header */
      var top = track.getBoundingClientRect().top, hh = header ? header.offsetHeight : 64;
      if (top < hh) window.scrollBy({ top:top - hh - 12, behavior:reduce() ? 'auto' : 'smooth' });
    };
    btns[0].addEventListener('click', function(){ go(at() - 1); });
    btns[1].addEventListener('click', function(){ go(at() + 1); });
    track.addEventListener('keydown', function(e){
      if (e.target !== track) return;
      if (e.key === 'ArrowRight'){ e.preventDefault(); go(at() + 1); }
      else if (e.key === 'ArrowLeft'){ e.preventDefault(); go(at() - 1); }
    });
    track.addEventListener('scroll', later, { passive:true });
    new MutationObserver(function(){ later(); }).observe(track, { subtree:false, childList:true, attributes:true, attributeFilter:['class'] });
    [].forEach.call(track.children, function(c){ new MutationObserver(later).observe(c, { attributes:true, attributeFilter:['class'] }); });
    window.addEventListener('resize', later);
    if ('ResizeObserver' in window){ var ro = new ResizeObserver(later); [].forEach.call(track.children, function(c){ ro.observe(c); }); }
    track.addEventListener('car-reset', function(){ track.scrollLeft = 0; later(); });
    paint();
  }
  slideshow(doc.querySelector('.svc-grid'), 'Services', 'service');
  slideshow(doc.getElementById('wgrid'), 'Projects', 'project');
  slideshow(doc.querySelector('.sk-grid'), 'Skill groups', 'skill group');
  slideshow(doc.querySelector('.xp-list'), 'Experience', 'role');
  slideshow(doc.querySelector('.ct-list'), 'Social media results', 'result');
  slideshow(doc.querySelector('.at-grid'), 'AI tools', 'tool');
  var wf = doc.getElementById('wfilter'), wg = doc.getElementById('wgrid');
  if (wf && wg) wf.addEventListener('click', function(){ wg.dispatchEvent(new Event('car-reset')); });
}
