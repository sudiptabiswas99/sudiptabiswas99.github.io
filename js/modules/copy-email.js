/* Copy email buttons (#copyHero, #celebrate): clipboard, execCommand fallback, toast with the address. */
import { ADDR } from '../config.js';
import { doc } from '../lib/dom.js';
import { toast } from './toast.js';

export function initCopyEmail(){
  /* copy email: #copyHero (hero) and #celebrate (contact). The label says Copied and the toast shows the address. */
  function copyEmail(btn, selectEl){
    var lbl = btn.querySelector('.lbl') || btn;
    function ok(){
      if (!btn._w){ btn._w = true; btn.style.minWidth = btn.offsetWidth + 'px'; }
      lbl.textContent = 'Copied';
      clearTimeout(btn._t);
      btn._t = setTimeout(function(){ lbl.textContent = 'Copy email'; }, 2000);
      toast('Email address copied: ' + ADDR);
    }
    function fail(){
      toast('Your browser blocked copying. Here is the address: ' + ADDR);
      try { var sel = window.getSelection(); sel.removeAllRanges(); sel.selectAllChildren(selectEl); } catch(e){}
    }
    function fallback(){
      var done = false, ta = doc.createElement('textarea');
      ta.value = ADDR; ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true');
      ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
      doc.body.appendChild(ta); ta.select();
      try { done = doc.execCommand('copy'); } catch(e){ done = false; }
      doc.body.removeChild(ta);
      try { btn.focus({preventScroll: true}); } catch(e){}
      done ? ok() : fail();
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext){
        navigator.clipboard.writeText(ADDR).then(ok, fallback);
      } else { fallback(); }
    } catch(e){ fallback(); }
  }
  var copyHero = doc.getElementById('copyHero'), celebrate = doc.getElementById('celebrate');
  if (copyHero) copyHero.addEventListener('click', function(){ copyEmail(copyHero, doc.querySelector('.hero .addr')); });
  if (celebrate) celebrate.addEventListener('click', function(){ copyEmail(celebrate, doc.querySelector('#contact .mail-txt')); });
}
