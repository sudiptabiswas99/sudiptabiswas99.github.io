/* Underlines that redraw from the left on hover: wraps link text in a span once. */
import { doc, root } from '../lib/dom.js';

export function initUnderlines(){
  /* ---- underlines: links keep a drawn underline that redraws from the left on hover ---- */
  (function(){
    function wrap(el, cls){
      var sp = el.querySelector(':scope > span');
      if (sp && sp.textContent.trim()){ sp.classList.add(cls); return; }
      [].slice.call(el.childNodes).forEach(function(n){
        if (n.nodeType === 3 && n.textContent.trim()){
          var s = doc.createElement('span'); s.className = cls;
          n.parentNode.insertBefore(s, n); s.appendChild(n);
        }
      });
    }
    doc.querySelectorAll('.textlink, .ft-link').forEach(function(el){ wrap(el, 'ul'); });
    doc.querySelectorAll('.wc-cap .t, .mark .sig').forEach(function(el){ wrap(el, 'ud'); });
    root.classList.add('ul-on');
  })();
}
