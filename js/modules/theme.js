/* Theme: bright default, dark saved in localStorage; the switch spreads in a circle from the toggle. */
import { doc, root, reduce } from '../lib/dom.js';

export function initTheme(){
  /* ---- theme: bright default, dark saved in localStorage['pf-theme'] ---- */
  var themeBtn = doc.getElementById('themeBtn');
  function applyTheme(t){
    if (t === 'dark') root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
    themeBtn.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' theme');
    var m = doc.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
    doc.dispatchEvent(new Event('pf-theme'));
  }
  /* the new theme spreads in a circle from the toggle (View Transitions); instant where unsupported */
  themeBtn.addEventListener('click', function(){
    var next = root.getAttribute('data-theme') === 'dark' ? 'bright' : 'dark';
    try { localStorage.setItem('pf-theme', next); } catch(e){}
    if (!doc.startViewTransition || reduce()){ applyTheme(next); return; }
    var r = themeBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.remove('theme-ready');
    var vt = doc.startViewTransition(function(){ applyTheme(next); });
    vt.ready.then(function(){
      root.animate({ clipPath:['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration:560, easing:'cubic-bezier(.2,.7,.2,1)', pseudoElement:'::view-transition-new(root)' });
    }).catch(function(){});
    var ready = function(){ root.classList.add('theme-ready'); };
    vt.finished.then(ready, ready);
  });
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'bright');
  requestAnimationFrame(function(){ root.classList.add('theme-ready'); });
}
