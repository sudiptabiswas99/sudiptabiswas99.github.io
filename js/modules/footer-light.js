/* Footer name: raised letters lit by a light that follows the mouse (SVG lighting filter). */
import { doc, footer, finePtr } from '../lib/dom.js';

export function initFooterLight(){
  /* ---- footer name: raised letters lit by a light that follows the mouse ---- */
  var ftText = doc.querySelector('.ft-word text'), lD = doc.getElementById('ftLightD'), lS = doc.getElementById('ftLightS');
  if (ftText && lD && lS){
    ftText.setAttribute('filter', 'url(#ftEmboss)');
    if (finePtr.matches){
      var ftSvg = doc.querySelector('.ft-word'), lx = 240, ly = -120, lPend = false;
      var setLight = function(){ lPend = false; [lD, lS].forEach(function(l){ l.setAttribute('x', lx.toFixed(0)); l.setAttribute('y', ly.toFixed(0)); }); };
      footer.addEventListener('pointermove', function(e){
        var r = ftSvg.getBoundingClientRect(), k = 1200 / r.width;
        lx = (e.clientX - r.left) * k; ly = (e.clientY - r.top) * k;
        if (!lPend){ lPend = true; requestAnimationFrame(setLight); }
      });
    }
  }
}
