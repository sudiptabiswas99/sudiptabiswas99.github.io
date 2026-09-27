/* Work: category filters and Show more. */
import { doc, reduce } from '../lib/dom.js';

export function initWork(){
  /* ---- work: filters and show more ---- */
  var f = doc.getElementById('wfilter'), g = doc.getElementById('wgrid'),
      smBtn = doc.getElementById('showmore'), smTxt = doc.getElementById('smtext'),
      smWrap = smBtn ? smBtn.parentNode : null;
  if (f && g && smBtn){
    var cards = [].slice.call(g.querySelectorAll('.wc'));
    var extras = cards.filter(function(c){ return c.classList.contains('extra'); });
    var open = false, filter = 'all';
    var closedLabel = function(){ return 'Show ' + extras.length + ' more projects'; };
    smTxt.textContent = closedLabel();
    var show = function(list){ list.forEach(function(c){ c.classList.add('shown'); }); };
    var collapse = function(){ extras.forEach(function(c){ c.classList.remove('shown'); }); };
    smBtn.addEventListener('click', function(){
      open = !open;
      smBtn.classList.toggle('open', open);
      smBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open){ show(extras.filter(function(c){ return !c.classList.contains('hide'); })); smTxt.textContent = 'Show fewer projects'; }
      else { collapse(); smTxt.textContent = closedLabel(); g.scrollIntoView({behavior: reduce() ? 'auto' : 'smooth', block: 'start'}); }
    });
    f.addEventListener('click', function(e){
      var b = e.target.closest('button'); if (!b) return;
      f.querySelectorAll('button').forEach(function(x){ x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
      filter = b.getAttribute('data-f');
      cards.forEach(function(c){ c.classList.toggle('hide', filter !== 'all' && c.getAttribute('data-cat') !== filter); });
      if (filter === 'all'){
        smWrap.style.display = '';
        if (!open) collapse(); else show(extras);
      } else {
        smWrap.style.display = 'none';
        show(extras.filter(function(c){ return !c.classList.contains('hide'); }));
      }
    });
  }
}
