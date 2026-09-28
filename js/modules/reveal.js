/* Scroll pieces that play once: experience bars draw, skill groups get .in. No fade-up on cards or headings. */
import { doc, root } from '../lib/dom.js';

export function initReveal(){
  if (!root.classList.contains('m-on')) return;
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (!e.isIntersecting) return;
      var el = e.target;
      /* the skills grid marks all its groups at once, so a phone slideshow never shows an empty card */
      if (el.classList.contains('sk-grid')) [].forEach.call(el.children, function(c){ c.classList.add('in'); });
      else el.classList.add('in');
      io.unobserve(el);
    });
  }, { rootMargin:'0px 0px -8% 0px' });
  doc.querySelectorAll('.sk-grid').forEach(function(g){
    g.querySelectorAll('.sk-group').forEach(function(grp){
      grp.querySelectorAll('.sk-chips li').forEach(function(li, j){ li.style.setProperty('--j', Math.min(j, 10)); });
    });
    io.observe(g);
  });
  doc.querySelectorAll('.xp').forEach(function(el){ io.observe(el); });
  root.classList.add('m-ready');
}
