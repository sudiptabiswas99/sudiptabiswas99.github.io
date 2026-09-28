/* Scroll reveals: headings rise, card groups come up in order, experience bars draw. Each plays once. */
import { doc, root } from '../lib/dom.js';

export function initReveal(){
  /* ---- scroll: headings rise, cards and tiles come up, experience bars draw. Each plays once. ---- */
  if (root.classList.contains('m-on')){
    var rvIo = new IntersectionObserver(function(es){
      var k = 0;
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.hasAttribute('data-rv-box')){
          /* a card group reveals as one: its cards come up in order, so a phone slideshow never shows blank cards */
          [].forEach.call(el.children, function(c){ if (c.classList.contains('rv')){ c.style.setProperty('--i', c.offsetParent ? Math.min(k++, 8) : 0); c.classList.add('in'); } });
          rvIo.unobserve(el); return;
        }
        el.classList.add('in');
        rvIo.unobserve(el);
        if (el.classList.contains('rh')){
          var fin = function(){ el.classList.add('done'); };
          el.firstChild.addEventListener('transitionend', fin, { once:true });
          setTimeout(fin, 1500);
        }
      });
    }, { rootMargin:'0px 0px -8% 0px' });
    doc.querySelectorAll('.sh h2, .contact h2').forEach(function(h){
      var w = doc.createElement('span'); w.className = 'h2w';
      while (h.firstChild) w.appendChild(h.firstChild);
      h.appendChild(w); h.classList.add('rh'); rvIo.observe(h);
    });
    doc.querySelectorAll('.svc-grid, .wgrid, .sk-grid, .at-grid, .ct-list, .ct-ads').forEach(function(box){
      box.setAttribute('data-rv-box', '');
      [].forEach.call(box.children, function(c){ c.classList.add('rv'); });
      rvIo.observe(box);
    });
    doc.querySelectorAll('.sk-group').forEach(function(g){
      g.querySelectorAll('.sk-chips li').forEach(function(li, j){ li.style.setProperty('--j', Math.min(j, 10)); });
    });
    doc.querySelectorAll('.xp').forEach(function(el){ rvIo.observe(el); });
    root.classList.add('m-ready');
  }
}
