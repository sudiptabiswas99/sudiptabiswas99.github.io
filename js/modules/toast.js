/* Toast: one short message at the bottom of the screen. */
import { doc } from '../lib/dom.js';

/* ---- toast ---- */
var toastEl = doc.getElementById('toast'), toastTimer = null;
export function toast(msg){
  toastEl.classList.add('on');
  toastEl.textContent = '';
  toastEl.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ toastEl.classList.remove('on'); }, 3200);
}
