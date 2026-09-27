/* Phone menu sheet (below 1024px): open, close, focus trap, page lock. */
import { MQ_DESK } from '../config.js';
import { doc, root, main, footer, reduce } from '../lib/dom.js';

export function initMenu(){
  /* ---- phone menu sheet (below 1024px) ---- */
  var menuBtn = doc.getElementById('menuBtn'), siteNav = doc.getElementById('siteNav'), themeBtn = doc.getElementById('themeBtn');
  var mqDesk = window.matchMedia(MQ_DESK);
  var menuOpen = false, closeTimer = null;
  function trapList(){
    return [menuBtn].concat([].slice.call(siteNav.querySelectorAll('a[href]'))).concat([themeBtn]);
  }
  function lockPage(on){
    root.style.overflow = on ? 'hidden' : '';
    doc.body.style.overflow = on ? 'hidden' : '';
    if (main) main.inert = on;
    if (footer) footer.inert = on;
  }
  function openMenu(){
    clearTimeout(closeTimer);
    siteNav.classList.remove('closing');
    siteNav.hidden = false;
    siteNav.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close menu');
    lockPage(true);
    menuOpen = true;
    var first = siteNav.querySelector('a[href]'); if (first) first.focus();
  }
  function closeMenu(returnFocus){
    if (!menuOpen) return;
    menuOpen = false;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
    lockPage(false);
    siteNav.classList.remove('open');
    if (reduce() || mqDesk.matches){ siteNav.hidden = true; }
    else {
      siteNav.classList.add('closing');
      closeTimer = setTimeout(function(){ siteNav.classList.remove('closing'); siteNav.hidden = true; }, 140);
    }
    if (returnFocus && !mqDesk.matches) menuBtn.focus();
  }
  menuBtn.addEventListener('click', function(){ menuOpen ? closeMenu(true) : openMenu(); });
  siteNav.addEventListener('click', function(e){
    var a = e.target.closest('a[href]'); if (!a || !menuOpen) return;
    var href = a.getAttribute('href');
    closeMenu(false);
    if (href.charAt(0) === '#'){
      var target = doc.querySelector(href);
      var h2 = target && target.querySelector('h2');
      if (h2) setTimeout(function(){ h2.focus({preventScroll: true}); }, 0);
    }
  });
  doc.querySelector('.mark').addEventListener('click', function(){ closeMenu(false); });
  var onDesk = function(){ if (mqDesk.matches) closeMenu(false); };
  if (mqDesk.addEventListener) mqDesk.addEventListener('change', onDesk); else mqDesk.addListener(onDesk);
  doc.addEventListener('keydown', function(e){
    if (!menuOpen) return;
    if (e.key === 'Escape'){ closeMenu(true); return; }
    if (e.key !== 'Tab') return;
    var list = trapList(), i = list.indexOf(doc.activeElement);
    e.preventDefault();
    var next = i === -1 ? 0 : (i + (e.shiftKey ? -1 : 1) + list.length) % list.length;
    list[next].focus();
  });
}
