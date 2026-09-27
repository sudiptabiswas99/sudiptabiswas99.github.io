/* Work: the "Live demo" tag on tiles that carry data-demo, "Live site" on tiles that carry data-live. */
import { doc } from '../lib/dom.js';

export function initLiveTags(){
  /* ---- work: the 3D tiles say they run live ---- */
  doc.querySelectorAll('#wgrid .wc[data-demo] .wc-media').forEach(function(m){
    var t = doc.createElement('span'); t.className = 'wc-live'; t.textContent = 'Live demo'; m.appendChild(t);
  });
  /* ---- work: the redesigns that are live on Vercel say so ---- */
  doc.querySelectorAll('#wgrid .wc[data-live] .wc-media').forEach(function(m){
    var t = doc.createElement('span'); t.className = 'wc-live'; t.textContent = 'Live site'; m.appendChild(t);
  });
}
