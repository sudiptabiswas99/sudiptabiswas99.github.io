/* Flip cards (css/components/flip.css): the front shows the name, the back the rest. Mouse hover and
   keyboard focus flip them in CSS; this file adds the corner cue, the small name on the back and, on touch
   screens, tap to flip (a second tap flips back). A swipe or a tap on a link, button or the globe never flips. */
import { doc } from '../lib/dom.js';
import { MQ_FINE } from '../config.js';

var CUE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 3.5v4.2h-4.2"/></svg>';

export function initFlip(){
  var fine = window.matchMedia(MQ_FINE);
  doc.querySelectorAll('.flip').forEach(function(card){
    var front = card.querySelector('.flip-front'), back = card.querySelector('.flip-back');
    if (!front || !back) return;
    var k = doc.createElement('span');
    k.className = 'flip-kicker'; k.setAttribute('aria-hidden', 'true');
    k.textContent = [].map.call(front.children, function(c){ return c.textContent.trim(); }).join(' ').replace(/\s+/g, ' ');
    back.insertBefore(k, back.firstChild);
    var cue = doc.createElement('span');
    cue.className = 'flip-cue'; cue.setAttribute('aria-hidden', 'true'); cue.innerHTML = CUE;
    front.appendChild(cue);
    /* a card with nothing to Tab to (the AI tools cards) takes focus itself, so a keyboard can turn it too */
    if (!card.querySelector('a[href], button, input, select, textarea, [tabindex]')) card.tabIndex = 0;
    var x0 = 0, y0 = 0, moved = false;
    card.addEventListener('pointerdown', function(e){ x0 = e.clientX; y0 = e.clientY; moved = false; });
    card.addEventListener('pointercancel', function(){ moved = true; });
    card.addEventListener('click', function(e){
      if (fine.matches) return;
      if (e.target.closest('a, button, input, select, textarea, canvas, .globe')) return;
      if (moved || Math.abs(e.clientX - x0) > 10 || Math.abs(e.clientY - y0) > 10) return;
      card.classList.toggle('is-flipped');
    });
  });
}
