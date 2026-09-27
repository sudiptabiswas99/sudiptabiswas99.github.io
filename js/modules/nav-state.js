/* Header hairline once the hero passes under it, and the current section marked in the nav. */
import { doc, header } from '../lib/dom.js';

export function initNavState(){
  /* ---- header hairline once the hero's first line passes under it ---- */
  var sentinel = doc.querySelector('.hero-sentinel');
  if ('IntersectionObserver' in window && sentinel){
    new IntersectionObserver(function(es){ header.classList.toggle('solid', !es[0].isIntersecting); }).observe(sentinel);
  }

  /* ---- current section in the nav ---- */
  var links = [].slice.call(doc.querySelectorAll('#siteNav .nl'));
  if ('IntersectionObserver' in window){
    var byId = {};
    links.forEach(function(a){ byId[a.getAttribute('href').slice(1)] = a; });
    var secIo = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        links.forEach(function(a){ a.removeAttribute('aria-current'); });
        var a = byId[e.target.id]; if (a) a.setAttribute('aria-current', 'true');
      });
    }, {rootMargin: '-45% 0px -50% 0px'});
    ['top','about','services','projects','content','automation','skillstory','experience','contact'].forEach(function(id){
      var s = doc.getElementById(id); if (s) secIo.observe(s);
    });
  }
}
