/* The hero "3D" stat: real Literata glyphs, extruded; drag to turn, it springs back. */
import { FONT_3D } from '../config.js';
import { doc, reduce, cssVar } from '../lib/dom.js';
import { hasGL, three, whenNear, onDemand, view, dragX } from '../lib/three-kit.js';

export function initStat3d(){
  /* the "3D" stat: the real glyphs of Literata, extruded; drag to turn, it swings back to face you */
  var stat = doc.querySelector('.hst-3d');
  if (stat && hasGL) whenNear(stat, function(){
    Promise.all([three(), import('three/addons/loaders/FontLoader.js'), import('three/addons/geometries/TextGeometry.js'),
      fetch(FONT_3D).then(function(r){ return r.json(); })]).then(function(m){
      var THREE = m[0], font = new m[1].FontLoader().parse(m[3]);
      var n = stat.querySelector('.n'), v = view(THREE, n, null, 30);
      var fs0 = parseFloat(getComputedStyle(n).fontSize);
      var geo = new m[2].TextGeometry('3D', { font:font, size:fs0, depth:fs0 * .3, curveSegments:10, bevelEnabled:true, bevelThickness:fs0 * .012, bevelSize:fs0 * .005, bevelSegments:2 });
      geo.center();
      /* face = the text colour, sides = the page's muted grey, so the depth reads when it turns */
      var mat = new THREE.MeshStandardMaterial({ color:cssVar('--text'), roughness:.42, metalness:.2 });
      var side = new THREE.MeshStandardMaterial({ color:cssVar('--text-3'), roughness:.6, metalness:.1 });
      var mesh = new THREE.Mesh(geo, [mat, side]);
      v.scene.add(mesh, new THREE.AmbientLight(0xffffff, 1.1));
      var lamp = new THREE.DirectionalLight(0xffffff, 2.2); lamp.position.set(-.6, .9, 1.2); v.scene.add(lamp);
      var rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(1, -.2, -.6); v.scene.add(rim);
      var place = function(){
        v.size();
        var W = v.cv.clientWidth, H = v.cv.clientHeight, fs = parseFloat(getComputedStyle(n).fontSize);
        /* the mesh stays on the camera axis (no side faces at rest); a view offset moves it to where the text was */
        var Wf = W * 3, Hf = H * 3;
        v.cam.aspect = Wf / Hf; v.cam.position.set(0, 0, (Hf / 2) / Math.tan(15 * Math.PI / 180));
        var c = doc.createElement('canvas').getContext('2d');
        c.font = getComputedStyle(n).fontWeight + ' ' + fs + 'px ' + getComputedStyle(n).fontFamily;
        var t = c.measureText('3D');
        var inkX = (t.actualBoundingBoxRight - t.actualBoundingBoxLeft) / 2;
        var asc = t.fontBoundingBoxAscent || fs * .9, des = t.fontBoundingBoxDescent || fs * .25;
        var base = (fs - (asc + des)) / 2 + asc;
        var inkY = base - (t.actualBoundingBoxAscent - t.actualBoundingBoxDescent) / 2;
        var s = fs / fs0; mesh.scale.set(s, s, s);
        var px = (n.getBoundingClientRect().left - v.cv.getBoundingClientRect().left) + inkX, py = H / 2 + (inkY - fs / 2);
        v.cam.setViewOffset(Wf, Hf, Wf / 2 - px, Hf / 2 - py, W, H);
      };
      place();
      var rot = reduce() ? 0 : -1.25, vel = 0, dragging;
      var step = function(){
        if (!dragging()){ vel += -rot * .05; vel *= .84; rot += vel; }
        mesh.rotation.y = rot; v.draw();
        return dragging() || Math.abs(rot) > .0005 || Math.abs(vel) > .0005;
      };
      var kick = onDemand(step);
      dragging = dragX(v.cv, function(dx){ rot += dx * .012; kick(); }, function(vv){ vel = vv * .012; kick(); });
      mesh.rotation.y = rot; v.draw(); stat.classList.add('live'); kick();
      new ResizeObserver(function(){ place(); v.draw(); }).observe(n);
      doc.addEventListener('pf-theme', function(){ mat.color.set(cssVar('--text')); side.color.set(cssVar('--text-3')); v.draw(); });
    }).catch(function(){ stat.classList.remove('live'); });
  });
}
