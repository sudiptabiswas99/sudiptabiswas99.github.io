/* The globe in the "3D and motion" card: drag to spin, dot on Dhaka. */
import { doc, reduce, cssVar } from '../lib/dom.js';
import { hasGL, three, whenNear, onDemand, view, dragX } from '../lib/three-kit.js';

export function initGlobe(){
  /* the globe in the "3D and motion" card: drag to spin, with the dot on Dhaka */
  var gHost = doc.querySelector('.svc-3d .globe');
  if (gHost && hasGL) whenNear(gHost.closest('.svc-3d'), function(){
    three().then(function(THREE){
      var card = gHost.closest('.svc-3d'); card.classList.add('live');
      var v = view(THREE, gHost, gHost.firstChild, 28); v.size();
      var ll = function(lat, lon){ var a = lat * Math.PI / 180, b = lon * Math.PI / 180; return new THREE.Vector3(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)); };
      var pts = [], la, lo;
      for (la = -60; la <= 60; la += 30) for (lo = 0; lo < 360; lo += 6) pts.push(ll(la, lo), ll(la, lo + 6));
      for (lo = 0; lo < 360; lo += 30) for (la = -90; la < 90; la += 6) pts.push(ll(la, lo), ll(la + 6, lo));
      var lineMat = new THREE.LineBasicMaterial({ color:cssVar('--text-2') });
      var dotMat = new THREE.MeshBasicMaterial({ color:cssVar('--text') });
      var rimMat = new THREE.LineBasicMaterial({ color:cssVar('--text-2'), fog:false });
      var spin = new THREE.Group();
      spin.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
      var dot = new THREE.Mesh(new THREE.SphereGeometry(.06, 16, 12), dotMat); dot.position.copy(ll(23.8, 90.4)); spin.add(dot);
      var tilt = new THREE.Group(); tilt.rotation.set(.18, 0, -.41); tilt.add(spin);
      var circ = []; for (var i = 0; i <= 96; i++){ var a = i / 96 * Math.PI * 2; circ.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0)); }
      var dist = 1.06 / Math.tan(14 * Math.PI / 180);
      v.cam.position.set(0, 0, dist);
      v.scene.add(tilt, new THREE.Line(new THREE.BufferGeometry().setFromPoints(circ), rimMat));
      v.scene.fog = new THREE.Fog(cssVar('--surface'), dist - 1, dist + 1.5);
      var home = -90.4 * Math.PI / 180, rot = reduce() ? home : home - 1.6, vel = 0, intro = !reduce(), dragging;
      var step = function(){
        if (!dragging()){
          if (intro){ vel += (home - rot) * .035; vel *= .86; } else vel *= .95;
          rot += vel;
        }
        spin.rotation.y = rot; v.draw();
        var moving = dragging() || Math.abs(vel) > .0004 || (intro && Math.abs(home - rot) > .0005);
        if (!moving) intro = false;
        return moving;
      };
      var kick = onDemand(step);
      dragging = dragX(v.cv, function(dx){ intro = false; rot += dx * .01; kick(); }, function(vv){ vel = vv * .01; kick(); });
      spin.rotation.y = rot; v.draw(); kick();
      new ResizeObserver(function(){ v.size(); v.draw(); }).observe(v.cv);
      doc.addEventListener('pf-theme', function(){
        lineMat.color.set(cssVar('--text-2')); rimMat.color.set(cssVar('--text-2')); dotMat.color.set(cssVar('--text'));
        v.scene.fog.color.set(cssVar('--surface')); v.draw();
      });
    }).catch(function(){ gHost.closest('.svc-3d').classList.remove('live'); });
  });
}
