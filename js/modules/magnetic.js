/* Magnetic buttons: mouse only, a few px toward the cursor. */
import { doc, reduce, finePtr } from '../lib/dom.js';

export function initMagnetic(){
  /* ---- magnetic buttons: mouse only, a few px toward the cursor ---- */
  if (finePtr.matches && !reduce()){
    doc.querySelectorAll('.hero .row-a .btn, .contact-row .btn, .showmore').forEach(function(b){
      b.classList.add('mag');
      b.addEventListener('pointermove', function(e){
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        b.style.translate = (dx * 6).toFixed(1) + 'px ' + (dy * 4).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
    });
  }
}
