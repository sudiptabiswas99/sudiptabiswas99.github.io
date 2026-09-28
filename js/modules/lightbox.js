/* Project viewer: thumbnail first, full screenshot when it lands, the live-demo iframe, and the live-site or code link. */
import { doc, root, header, main, footer, reduce } from '../lib/dom.js';

export function initLightbox(){
  /* ---- lightbox: thumbnail first, full screenshot when it lands ---- */
  var lb = doc.getElementById('lb');
  if (lb){
    var lbImg = doc.getElementById('lbImg'), lbTitle = doc.getElementById('lbTitle'),
        lbDesc = doc.getElementById('lbDesc'),
        box = lb.querySelector('.box'), xBtn = lb.querySelector('.x'),
        opener = null, lbOpen = false, lbTimer = null, ph = null, token = 0;
    /* live demo: the real project page runs in an iframe, only after "Run live demo" */
    var lbDemo = doc.getElementById('lbDemo'), runRow = doc.getElementById('lbRunRow'),
        runBtn = doc.getElementById('lbRun'), lbFull = doc.getElementById('lbFull'), hint = lb.querySelector('.hint');
    var HINT_IMG = hint ? hint.textContent : '';
    /* live site (data-live) or public code (data-code): one link under the caption, opens in a new tab */
    var linkRow = doc.getElementById('lbLinkRow'), lbLink = doc.getElementById('lbLink'), lbLinkTxt = doc.getElementById('lbLinkTxt');
    var stopDemo = function(){
      lb.classList.remove('demo'); if (lbDemo) lbDemo.textContent = '';
      if (hint) hint.textContent = HINT_IMG;
    };
    if (runBtn) runBtn.addEventListener('click', function(){
      var src = opener && opener.getAttribute('data-demo');
      if (!src) return;
      var f = doc.createElement('iframe');
      f.src = src; f.title = 'Live demo: ' + lbTitle.textContent; f.setAttribute('allow', 'fullscreen');
      lbDemo.appendChild(f);
      lb.classList.add('demo'); runBtn.hidden = true;
      if (hint) hint.textContent = 'Live demo of the real project, running inside this page. Close it with the X.';
      lbFull.focus();
    });
    var done = function(t){
      if (t !== token) return;
      box.removeAttribute('aria-busy'); lb.classList.remove('loading');
    };
    var openLb = function(card){
      clearTimeout(lbTimer);
      opener = card; lbOpen = true; token++;
      var t = token, titleEl = card.querySelector('.pt'), thumb = card.querySelector('img');
      var title = titleEl ? titleEl.textContent : '';
      lbTitle.textContent = title;
      lbDesc.textContent = card.getAttribute('data-desc') || '';
      var demo = card.getAttribute('data-demo');
      var live = card.getAttribute('data-live'), code = card.getAttribute('data-code'), url = live || code;
      if (linkRow){
        linkRow.hidden = !url;
        lb.classList.toggle('has-link', !!url);
        if (url){
          lbLink.href = url;
          lbLinkTxt.textContent = live ? 'Visit live site' : 'View the code on GitHub';
          lbLink.setAttribute('aria-label', (live ? 'Visit the live ' + title + ' site' : 'View the ' + title + ' code on GitHub') + ' (opens in a new tab)');
        }
      }
      stopDemo();
      if (runRow){
        runRow.hidden = !demo; runBtn.hidden = false;
        if (demo){
          lbFull.href = demo;
          runBtn.setAttribute('aria-label', 'Run the live demo of ' + title);
          lbFull.setAttribute('aria-label', 'Open ' + title + ' full screen (opens in a new tab)');
        }
      }
      if (!ph){
        ph = doc.createElement('img'); ph.className = 'lb-ph'; ph.alt = ''; ph.setAttribute('aria-hidden', 'true');
        lbImg.parentNode.insertBefore(ph, lbImg);
      }
      if (thumb) ph.setAttribute('src', thumb.getAttribute('src'));
      box.setAttribute('aria-busy', 'true');
      lb.classList.add('loading');
      lbImg.onload = function(){ done(t); };
      lbImg.onerror = function(){ if (t === token){ box.removeAttribute('aria-busy'); } };
      lbImg.loading = 'eager';
      lbImg.removeAttribute('width'); lbImg.removeAttribute('height');
      lbImg.alt = title;
      lbImg.src = card.getAttribute('data-img');
      if (lbImg.complete && lbImg.naturalWidth) done(t);
      lb.classList.remove('closing');
      lb.classList.add('on');
      lb.setAttribute('aria-hidden', 'false');
      root.style.overflow = 'hidden';
      [header, main, footer].forEach(function(el){ if (el) el.inert = true; });
      xBtn.focus();
    };
    var closeLb = function(){
      if (!lbOpen) return;
      lbOpen = false;
      lb.setAttribute('aria-hidden', 'true');
      root.style.overflow = '';
      [header, main, footer].forEach(function(el){ if (el) el.inert = false; });
      var finish = function(){ lb.classList.remove('on', 'closing'); stopDemo(); };
      if (reduce()) finish(); else { lb.classList.add('closing'); lbTimer = setTimeout(finish, 140); }
      if (opener) opener.focus();
    };
    doc.querySelectorAll('#wgrid [data-img]').forEach(function(card){
      card.addEventListener('click', function(e){ e.preventDefault(); openLb(card); });
    });
    lb.querySelectorAll('[data-close]').forEach(function(el){ el.addEventListener('click', closeLb); });
    doc.addEventListener('keydown', function(e){
      if (!lbOpen) return;
      if (e.key === 'Escape'){ e.preventDefault(); closeLb(); }
      else if (e.key === 'Tab'){
        e.preventDefault();
        var items = [xBtn, runBtn, lbFull, lbDemo && lbDemo.querySelector('iframe'), lbLink].filter(function(el){ return el && !el.hidden && el.offsetParent !== null; });
        var i = items.indexOf(doc.activeElement);
        items[e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length].focus();
      }
    });
  }
}
