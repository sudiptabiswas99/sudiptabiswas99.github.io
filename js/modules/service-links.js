/* Service cards link to the matching work and switch the filter on. */
import { doc } from '../lib/dom.js';

export function initServiceLinks(){
  /* ---- service cards link to the matching work: the filter is switched on for you ---- */
  doc.querySelectorAll('.svc-go[data-filter]').forEach(function(a){
    a.addEventListener('click', function(){
      var b = doc.querySelector('#wfilter [data-f="' + a.getAttribute('data-filter') + '"]');
      if (b && !b.classList.contains('on')) b.click();
    });
  });
}
