import * as THREE from './lib/three.module.js';
import { CONFIG } from './config.js';

const $ = (s) => document.querySelector(s);

/* ------------------------------------------------------------------ */
/*  Renderer / scene / camera                                          */
/* ------------------------------------------------------------------ */
const renderer = new THREE.WebGLRenderer({ antialias: true });
const isPhone = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
const isTouch = true; // ekrandagi tugmalar HAR DOIM koʻrinadi (telefon uchun moʻljallangan)
document.body.classList.add('is-touch');
document.body.classList.toggle('is-phone', isPhone);
const stage = $('#stage');
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isPhone ? 1.75 : 2));
renderer.setSize(stage.clientWidth || 1280, stage.clientHeight || 720, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
$('#app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0a12);
scene.fog = new THREE.Fog(0x1a0a12, 20, 64);

const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 200);

scene.add(new THREE.HemisphereLight(0xffe6ee, 0x4a1a2a, 1.1));
scene.add(new THREE.AmbientLight(0xffd8e0, 0.45));

/* ------------------------------------------------------------------ */
/*  Yordamchi funksiyalar                                              */
/* ------------------------------------------------------------------ */
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

function drawHeartPath(g, w, h) {
  g.beginPath();
  g.moveTo(w / 2, h * 0.86);
  g.bezierCurveTo(w * 0.02, h * 0.55, w * 0.1, h * 0.08, w / 2, h * 0.3);
  g.bezierCurveTo(w * 0.9, h * 0.08, w * 0.98, h * 0.55, w / 2, h * 0.86);
  g.closePath();
}

const heartSpriteTex = canvasTex(128, 128, (g, w, h) => {
  const grd = g.createRadialGradient(w / 2, h * 0.45, 4, w / 2, h * 0.5, w * 0.5);
  grd.addColorStop(0, '#ffb3c8'); grd.addColorStop(1, '#e8557a');
  g.fillStyle = grd; drawHeartPath(g, w, h); g.fill();
});

const glowTex = canvasTex(128, 128, (g, w, h) => {
  const grd = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  grd.addColorStop(0, 'rgba(255,220,170,0.9)');
  grd.addColorStop(0.5, 'rgba(255,190,130,0.25)');
  grd.addColorStop(1, 'rgba(255,170,110,0)');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
});

const shadowTex = canvasTex(64, 64, (g, w, h) => {
  const grd = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
});

function makeHeartGeometry(depth = 0.25) {
  const s = new THREE.Shape();
  const x = 0, y = 0;
  s.moveTo(x + 0.25, y + 0.25);
  s.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
  s.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
  s.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
  s.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
  s.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
  s.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.06, bevelThickness: 0.06 });
  geo.rotateZ(Math.PI); // uchi pastga qaragan boʻlishi uchun
  geo.center();
  return geo;
}

function disposeGroup(o) {
  o.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) {
      const ms = Array.isArray(c.material) ? c.material : [c.material];
      ms.forEach((m) => {
        for (const k in m) { if (m[k] && m[k].isTexture && m[k] !== heartSpriteTex && m[k] !== glowTex && m[k] !== shadowTex) m[k].dispose(); }
        m.dispose();
      });
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Rasmlar roʻyxati                                                   */
/* ------------------------------------------------------------------ */
function placeholderURL(i) {
  const c = document.createElement('canvas');
  c.width = 800; c.height = 600;
  const g = c.getContext('2d');
  const hues = [345, 330, 355, 15, 320, 340, 5, 350];
  const h = hues[i % hues.length];
  const grd = g.createLinearGradient(0, 0, 800, 600);
  grd.addColorStop(0, `hsl(${h},70%,82%)`); grd.addColorStop(1, `hsl(${h + 20},65%,60%)`);
  g.fillStyle = grd; g.fillRect(0, 0, 800, 600);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  drawHeartPath(g, 260, 260);
  g.save(); g.translate(270, 90); g.fill(); g.restore();
  g.fillStyle = '#5b1630'; g.textAlign = 'center';
  g.font = 'italic 40px Georgia, serif';
  g.fillText('Bu yerga rasm qoʻying', 400, 420);
  g.font = '28px Georgia, serif';
  g.fillText(`photos/${i + 1}.jpg`, 400, 470);
  return c.toDataURL('image/jpeg', 0.88);
}

function defaultItems() {
  const src = (CONFIG.photos && CONFIG.photos.length) ? CONFIG.photos : null;
  if (src) return src.map((p) => (typeof p === 'string' ? { src: p, caption: '' } : { caption: '', ...p }));
  return Array.from({ length: 8 }, (_, i) => ({ src: placeholderURL(i), caption: `Xotira №${i + 1}`, placeholder: true }));
}
let items = defaultItems();
let userLoaded = false;

/* ------------------------------------------------------------------ */
/*  Panda                                                              */
/* ------------------------------------------------------------------ */
function makePanda() {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
  const black = new THREE.MeshStandardMaterial({ color: 0x17171a, roughness: 0.7 });
  const red = new THREE.MeshStandardMaterial({ color: 0xe8203f, roughness: 0.4, emissive: 0x500010 });
  const green = new THREE.MeshStandardMaterial({ color: 0x2f8a3a, roughness: 0.7 });
  const sph = (r, m, sx = 1, sy = 1, sz = 1) => {
    const me = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), m);
    me.scale.set(sx, sy, sz); return me;
  };

  const body = sph(0.42, white, 1, 1.05, 0.9); body.position.y = 0.62; g.add(body);

  const head = new THREE.Group(); head.position.y = 1.2; g.add(head);
  head.add(sph(0.4, white, 1.06, 0.92, 0.96));
  for (const s of [-1, 1]) {
    const ear = sph(0.14, black); ear.position.set(0.3 * s, 0.31, -0.02); head.add(ear);
    const patch = sph(0.11, black, 1, 1.35, 0.5); patch.position.set(0.16 * s, 0.04, 0.33); patch.rotation.z = -0.45 * s; head.add(patch);
    const eye = sph(0.045, white); eye.position.set(0.17 * s, 0.07, 0.4); head.add(eye);
    const pupil = sph(0.026, black); pupil.position.set(0.17 * s, 0.07, 0.435); head.add(pupil);
    const cheek = sph(0.06, new THREE.MeshStandardMaterial({ color: 0xff9ab0, roughness: 0.9 }), 1.3, 0.8, 0.4);
    cheek.position.set(0.27 * s, -0.08, 0.34); head.add(cheek);
  }
  const nose = sph(0.05, black, 1.3, 0.8, 0.8); nose.position.set(0, -0.06, 0.4); head.add(nose);

  const hb = new THREE.Mesh(makeHeartGeometry(0.12), red);
  hb.scale.setScalar(0.17); hb.position.set(0.24, 0.4, 0.12); hb.rotation.z = -0.4; head.add(hb);

  const arms = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0.43 * s, 0.9, 0.02);
    const a = sph(0.12, black, 1, 2.0, 1); a.position.y = -0.2; piv.add(a);
    g.add(piv); arms.push(piv);
    if (s === 1) { // qoʻlida atirgul
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), green);
      stem.position.set(0, -0.28, 0.14); stem.rotation.x = 0.3; piv.add(stem);
      const bud = sph(0.055, red, 1, 1, 1); bud.position.set(0, -0.06, 0.2); piv.add(bud);
    }
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0.2 * s, 0.34, 0.02);
    const l = sph(0.16, black, 1, 1.6, 1.15); l.position.y = -0.08; piv.add(l);
    g.add(piv); legs.push(piv);
  }

  const floatHeart = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartSpriteTex, transparent: true, depthWrite: false }));
  floatHeart.scale.set(0.34, 0.34, 1); floatHeart.position.set(0, 2.0, 0); g.add(floatHeart);

  return { group: g, head, arms, legs, floatHeart };
}

const panda = makePanda();
scene.add(panda.group);
const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02; scene.add(blob);

/* ------------------------------------------------------------------ */
/*  Muzey                                                              */
/* ------------------------------------------------------------------ */
const M = { group: null, W: 16, L: 30, H: 6.5, colliders: [], frames: [], hearts: null, sculpt: null, lamps: [] };
const textureLoader = new THREE.TextureLoader();

function wallMat(w, h) {
  return new THREE.MeshStandardMaterial({
    roughness: 0.9,
    map: canvasTex(256, 256, (g, W, H) => {
      g.fillStyle = '#5e1a30'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(224,170,120,0.16)'; g.lineWidth = 2;
      for (let x = 0; x <= W; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      g.fillStyle = 'rgba(255,200,170,0.10)';
      for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64) {
        g.beginPath(); g.moveTo(x + 32, y + 12); g.lineTo(x + 52, y + 32); g.lineTo(x + 32, y + 52); g.lineTo(x + 12, y + 32); g.closePath(); g.fill();
      }
    }, [w / 4, h / 4]),
  });
}

function makeCaptionTex(text) {
  return canvasTex(512, 96, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#f1d58a'); grd.addColorStop(1, '#c9973a');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(80,45,10,.6)'; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#4a2a08'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = 42; g.font = `italic ${size}px Georgia, serif`;
    while (g.measureText(text).width > w - 40 && size > 18) { size -= 2; g.font = `italic ${size}px Georgia, serif`; }
    g.fillText(text, w / 2, h / 2 + 2);
  });
}

function makeFrame(item, i, side, z) {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9aa4c, metalness: 0.75, roughness: 0.35, emissive: 0x3a2808 });
  const outer = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.14), gold);
  const matte = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.15), new THREE.MeshStandardMaterial({ color: 0xfaf3e8, roughness: 0.9 }));
  const img = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x777777, toneMapped: false }));
  img.position.z = 0.085; img.userData.frameIndex = i;
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
    map: glowTex, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  glow.position.z = -0.085;
  const sconce = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 12, 1, true), gold);
  cone.position.set(0, 0, -0.02);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe2a8, toneMapped: false }));
  bulb.position.set(0, -0.08, -0.02);
  sconce.add(cone, bulb);
  g.add(glow, outer, matte, img, sconce);

  let plaque = null;
  if (item.caption) {
    plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.36), new THREE.MeshBasicMaterial({ map: makeCaptionTex(item.caption), toneMapped: false }));
    plaque.position.z = -0.04; g.add(plaque);
  }

  const wallX = (side < 0 ? -1 : 1) * (M.W / 2 - 0.1);
  g.position.set(wallX, 3.2, z);
  g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;

  const f = { item, group: g, outer, matte, img, glow, sconce, plaque, w: 3, h: 2.25, side, center: new THREE.Vector3(wallX, 3.2, z) };
  layoutFrame(f, 3, 2.25);

  const onLoad = (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const r = tex.image.width / tex.image.height;
    const maxW = 3.4, maxH = 2.5;
    let w, h;
    if (r > maxW / maxH) { w = maxW; h = w / r; } else { h = maxH; w = h * r; }
    img.material.map = tex; img.material.color.set(0xffffff); img.material.needsUpdate = true;
    layoutFrame(f, w, h);
  };
  textureLoader.load(item.src, onLoad, undefined, () => {
    textureLoader.load(placeholderURL(i), onLoad);
  });
  return f;
}

function layoutFrame(f, w, h) {
  f.w = w; f.h = h;
  f.outer.scale.set(w + 0.36, h + 0.36, 1);
  f.matte.scale.set(w + 0.16, h + 0.16, 1);
  f.img.scale.set(w, h, 1);
  f.glow.scale.set(w + 4, h + 4, 1);
  f.sconce.position.y = h / 2 + 0.52;
  if (f.plaque) f.plaque.position.y = -(h / 2) - 0.5;
}

function buildMuseum() {
  if (M.group) { scene.remove(M.group); disposeGroup(M.group); }
  const grp = new THREE.Group();
  M.group = grp; M.colliders = []; M.frames = []; M.lamps = [];
  scene.add(grp);

  const perSide = Math.max(2, Math.ceil(items.length / 2));
  const spacing = 6.5;
  const W = M.W = 16;
  const L = M.L = Math.max(30, perSide * spacing + 14);
  const H = M.H = 6.5;

  // Pol
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshStandardMaterial({
    roughness: 0.35, metalness: 0.05,
    map: canvasTex(256, 256, (g, w, h) => {
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
        g.fillStyle = (x + y) % 2 ? '#d9b9b0' : '#f2e6da'; g.fillRect(x * 128, y * 128, 128, 128);
      }
      g.strokeStyle = 'rgba(120,70,60,.25)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
      g.beginPath(); g.moveTo(128, 0); g.lineTo(128, h); g.moveTo(0, 128); g.lineTo(w, 128); g.stroke();
    }, [W / 4, L / 4]),
  }));
  floor.rotation.x = -Math.PI / 2; grp.add(floor);

  // Qizil gilam
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.4, L - 1.6), new THREE.MeshStandardMaterial({ color: 0x9c1b3d, roughness: 0.95 }));
  carpet.rotation.x = -Math.PI / 2; carpet.position.y = 0.012; grp.add(carpet);
  for (const s of [-1, 1]) {
    const bord = new THREE.Mesh(new THREE.PlaneGeometry(0.12, L - 1.6), new THREE.MeshStandardMaterial({ color: 0xd9aa4c, roughness: 0.5, metalness: 0.4 }));
    bord.rotation.x = -Math.PI / 2; bord.position.set(1.4 * s, 0.015, 0); grp.add(bord);
  }

  // Shift
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshStandardMaterial({ color: 0x2a0d18, roughness: 1 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = H; grp.add(ceil);
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x3d1a22, roughness: 0.8 });
  for (let z = -L / 2 + 2; z < L / 2; z += 4) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(W, 0.35, 0.4), beamMat); b.position.set(0, H - 0.17, z); grp.add(b);
  }

  // Devorlar
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(L, H), wallMat(L, H)); wl.position.set(-W / 2, H / 2, 0); wl.rotation.y = Math.PI / 2; grp.add(wl);
  const wr = new THREE.Mesh(new THREE.PlaneGeometry(L, H), wallMat(L, H)); wr.position.set(W / 2, H / 2, 0); wr.rotation.y = -Math.PI / 2; grp.add(wr);
  const wf = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat(W, H)); wf.position.set(0, H / 2, -L / 2); grp.add(wf);
  const wb = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat(W, H)); wb.position.set(0, H / 2, L / 2); wb.rotation.y = Math.PI; grp.add(wb);

  // Pastki panel (wainscot) va plintus
  const panelMat = new THREE.MeshStandardMaterial({ color: 0xf0e2d0, roughness: 0.7 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd9aa4c, roughness: 0.4, metalness: 0.6 });
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, L), panelMat); p.position.set(s * (W / 2 - 0.06), 0.55, 0); grp.add(p);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, L), trimMat); t.position.set(s * (W / 2 - 0.09), 1.12, 0); grp.add(t);
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, L), trimMat); c.position.set(s * (W / 2 - 0.11), H - 0.1, 0); grp.add(c);
  }
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(W, 1.1, 0.12), panelMat); p.position.set(0, 0.55, s * (L / 2 - 0.06)); grp.add(p);
  }

  // Pilastrlar (kadrlar orasida)
  const pilMat = new THREE.MeshStandardMaterial({ color: 0xf0e2d0, roughness: 0.6 });
  const startZ = -(perSide - 1) * spacing / 2;
  for (let k = 0; k <= perSide; k++) {
    const z = startZ + (k - 0.5) * spacing;
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, H, 0.4), pilMat); p.position.set(s * (W / 2 - 0.15), H / 2, z); grp.add(p);
    }
  }

  // Kadrlar
  items.forEach((item, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const idx = Math.floor(i / 2);
    const z = startZ + idx * spacing;
    const f = makeFrame(item, i, side, z);
    grp.add(f.group); M.frames.push(f);
  });

  // Chiroqlar (kandil)
  const nLamps = Math.min(5, Math.max(3, Math.round(L / 10)));
  for (let k = 0; k < nLamps; k++) {
    const z = -L / 2 + (L / nLamps) * (k + 0.5);
    const lamp = new THREE.Group(); lamp.position.set(0, H - 1.3, z);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), trimMat); chain.position.y = 0.8; lamp.add(chain);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 28), trimMat); ring.rotation.x = Math.PI / 2; lamp.add(ring);
    for (let a = 0; a < 6; a++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe0a8, toneMapped: false }));
      b.position.set(Math.cos(a * Math.PI / 3) * 0.5, 0.1, Math.sin(a * Math.PI / 3) * 0.5); lamp.add(b);
    }
    const pl = new THREE.PointLight(0xffd2a0, 70, 0, 2); pl.position.y = -0.2; lamp.add(pl);
    grp.add(lamp); M.lamps.push(lamp);
  }

  // Oxirgi devordagi yozuv
  const txt = canvasTex(1024, 320, (g, w, h) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = '#ff4f86'; g.shadowBlur = 28; g.fillStyle = '#ffd9e6';
    g.font = '150px "Great Vibes", "Brush Script MT", cursive';
    g.fillText(CONFIG.wallText || 'Seni sevaman', w / 2, CONFIG.herName ? h * 0.38 : h / 2);
    if (CONFIG.herName) {
      g.shadowBlur = 14; g.fillStyle = '#e0b45a'; g.font = 'italic 56px Georgia, serif';
      g.fillText(`${CONFIG.herName} uchun`, w / 2, h * 0.82);
    }
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.8), new THREE.MeshBasicMaterial({ map: txt, transparent: true, depthWrite: false, toneMapped: false }));
  sign.position.set(0, 4.5, -L / 2 + 0.06); grp.add(sign);

  // Yurak haykali + poydevor
  const zS = -L / 2 + 4.6;
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 1.1, 28), new THREE.MeshStandardMaterial({ color: 0xf6eee4, roughness: 0.4 }));
  ped.position.set(0, 0.55, zS); grp.add(ped);
  const pedTop = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 28), trimMat); pedTop.position.set(0, 1.12, zS); grp.add(pedTop);
  const sculpt = new THREE.Mesh(makeHeartGeometry(0.3), new THREE.MeshStandardMaterial({ color: 0xe0214b, roughness: 0.18, metalness: 0.25, emissive: 0x7a0a25, emissiveIntensity: 0.9 }));
  sculpt.scale.setScalar(1.25); sculpt.position.set(0, 2.25, zS); grp.add(sculpt); M.sculpt = sculpt;
  const hl = new THREE.PointLight(0xff5c8a, 40, 0, 2); hl.position.set(0, 2.4, zS + 1.2); grp.add(hl);
  M.colliders.push({ minx: -0.95, maxx: 0.95, minz: zS - 0.95, maxz: zS + 0.95 });

  // Skameykalar
  for (const zz of [-L * 0.12, L * 0.2]) {
    const bench = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a2418, roughness: 0.6 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.8), wood); seat.position.y = 0.5; bench.add(seat);
    const cush = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 0.7), new THREE.MeshStandardMaterial({ color: 0xb02a52, roughness: 0.9 })); cush.position.y = 0.63; bench.add(cush);
    for (const lx of [-1.0, 1.0]) for (const lz of [-0.3, 0.3]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.1), wood); leg.position.set(lx, 0.25, lz); bench.add(leg);
    }
    bench.position.set(0, 0, zz); grp.add(bench);
    M.colliders.push({ minx: -1.25, maxx: 1.25, minz: zz - 0.45, maxz: zz + 0.45 });
  }

  // Atirgul guldonlari
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const vx = sx * (W / 2 - 1.1), vz = sz * (L / 2 - 1.1);
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.8, 14), new THREE.MeshStandardMaterial({ color: 0xf3ece2, roughness: 0.3 }));
    vase.position.set(vx, 0.4, vz); grp.add(vase);
    const rm = new THREE.MeshStandardMaterial({ color: 0xd8203f, roughness: 0.45, emissive: 0x3a0610 });
    for (let k = 0; k < 7; k++) {
      const a = k * 2.4, r = 0.18 * Math.sqrt(k);
      const rose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), rm);
      rose.position.set(vx + Math.cos(a) * r, 1.0 + (k % 3) * 0.1, vz + Math.sin(a) * r); grp.add(rose);
    }
    M.colliders.push({ minx: vx - 0.35, maxx: vx + 0.35, minz: vz - 0.35, maxz: vz + 0.35 });
  }

  // Suzuvchi yuraklar
  const N = 150;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    pos[k * 3] = (Math.random() - 0.5) * (W - 2);
    pos[k * 3 + 1] = Math.random() * (H - 0.5);
    pos[k * 3 + 2] = (Math.random() - 0.5) * (L - 2);
    seed[k] = Math.random() * 10;
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ map: heartSpriteTex, size: 0.36, transparent: true, depthWrite: false, opacity: 0.9, sizeAttenuation: true }));
  pts.frustumCulled = false; grp.add(pts);
  M.hearts = { pts, seed, N };
}

/* ------------------------------------------------------------------ */
/*  Oʻyinchi, kamera, boshqaruv                                        */
/* ------------------------------------------------------------------ */
const player = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), heading: Math.PI, phase: 0, amount: 0 };
const cam = { yaw: 0, pitch: 0.38, dist: 5.6 };
const keys = new Set();
const joy = { x: 0, y: 0 };
let started = false;
let lightboxOpen = false;
let nearest = -1;

function resetPlayer() {
  player.pos.set(0, 0, M.L / 2 - 6.5);
  player.vel.set(0, 0, 0);
  player.heading = Math.PI; // yuzi -z tomonga qaraydi (zalga)
  cam.yaw = 0; cam.pitch = 0.38;
}

addEventListener('keydown', (e) => {
  if (!started) return;
  if (lightboxOpen) {
    if (e.code === 'Escape') closeLightbox();
    else if (e.code === 'ArrowRight') stepLightbox(1);
    else if (e.code === 'ArrowLeft') stepLightbox(-1);
    return;
  }
  keys.add(e.code);
  if (e.code === 'KeyF' && nearest >= 0) openLightbox(nearest);
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// Sichqoncha / sensor bilan qarash + kadrni bosish
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let drag = null;
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!started || lightboxOpen) return;
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
  cam.yaw -= dx * 0.0055;
  cam.pitch = THREE.MathUtils.clamp(cam.pitch + dy * 0.004, 0.05, 1.2);
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  const wasClick = drag.moved < 8;
  drag = null;
  if (!wasClick) return;
  const rc = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(M.frames.map((f) => f.img), false);
  if (hits.length) openLightbox(hits[0].object.userData.frameIndex);
});
renderer.domElement.addEventListener('wheel', (e) => {
  cam.dist = THREE.MathUtils.clamp(cam.dist + e.deltaY * 0.005, 3, 9);
}, { passive: true });

// Virtual joystick (telefon)
const joyEl = $('#joy'), stickEl = $('#stick');
let joyId = null;
function joyMove(e) {
  const r = joyEl.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const max = (r.width - stickEl.offsetWidth) / 2, len = Math.hypot(dx, dy);
  if (len > max) { dx = dx / len * max; dy = dy / len * max; }
  stickEl.style.transform = `translate(${dx}px,${dy}px)`;
  joy.x = dx / max; joy.y = dy / max;
}
joyEl.addEventListener('pointerdown', (e) => { joyId = e.pointerId; joyEl.setPointerCapture(joyId); joyMove(e); });
joyEl.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = (e) => { if (e.pointerId !== joyId) return; joyId = null; joy.x = joy.y = 0; stickEl.style.transform = ''; };
joyEl.addEventListener('pointerup', joyEnd); joyEl.addEventListener('pointercancel', joyEnd);
joyEl.addEventListener('lostpointercapture', joyEnd);

// Telefon tugmalari
const touch = { rotL: false, rotR: false, run: false, up: false, down: false, left: false, right: false };
function holdBtn(sel, key) {
  const el = $(sel);
  const on = (e) => { e.preventDefault(); touch[key] = true; el.classList.add('on'); };
  const off = () => { touch[key] = false; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on);
  ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach((n) => el.addEventListener(n, off));
}
holdBtn('#btnL', 'rotL'); holdBtn('#btnR', 'rotR');
holdBtn('#dUp', 'up'); holdBtn('#dDown', 'down'); holdBtn('#dLeft', 'left'); holdBtn('#dRight', 'right');
$('#padBtn').onclick = () => document.body.classList.toggle('use-joy');
$('#runBtn').addEventListener('click', () => { touch.run = !touch.run; $('#runBtn').classList.toggle('on', touch.run); });
$('#actBtn').addEventListener('click', () => { if (nearest >= 0) openLightbox(nearest); });

/* Toʻqnashuv: doira va toʻgʻri toʻrtburchak */
function collide(p, r) {
  const mx = M.W / 2 - 0.55, mz = M.L / 2 - 0.55;
  p.x = THREE.MathUtils.clamp(p.x, -mx, mx);
  p.z = THREE.MathUtils.clamp(p.z, -mz, mz);
  for (const c of M.colliders) {
    const cx = THREE.MathUtils.clamp(p.x, c.minx, c.maxx);
    const cz = THREE.MathUtils.clamp(p.z, c.minz, c.maxz);
    let dx = p.x - cx, dz = p.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-6) { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
      else {
        const l = p.x - c.minx, rr = c.maxx - p.x, t = p.z - c.minz, b = c.maxz - p.z;
        const m = Math.min(l, rr, t, b);
        if (m === l) p.x = c.minx - r; else if (m === rr) p.x = c.maxx + r;
        else if (m === t) p.z = c.minz - r; else p.z = c.maxz + r;
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Rasmni kattalashtirish (lightbox)                                  */
/* ------------------------------------------------------------------ */
let lbIndex = 0;
function openLightbox(i) {
  lbIndex = (i + items.length) % items.length;
  const it = items[lbIndex];
  $('#lbImg').src = it.src;
  $('#lbCap').textContent = it.caption || '';
  $('#lightbox').classList.remove('hidden');
  lightboxOpen = true; keys.clear(); joy.x = joy.y = 0;
}
function closeLightbox() { $('#lightbox').classList.add('hidden'); lightboxOpen = false; }
function stepLightbox(d) { openLightbox(lbIndex + d); }
$('#lbClose').onclick = closeLightbox;
$('#lbPrev').onclick = () => stepLightbox(-1);
$('#lbNext').onclick = () => stepLightbox(1);
$('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLightbox(); });
$('#hint').onclick = () => { if (nearest >= 0) openLightbox(nearest); };

/* ------------------------------------------------------------------ */
/*  Oʻz rasmlarini yuklash                                             */
/* ------------------------------------------------------------------ */
function loadFiles(fileList) {
  const imgs = [...fileList].filter((f) => f.type.startsWith('image/'));
  if (!imgs.length) return;
  imgs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  userLoaded = true;
  items = imgs.map((f) => ({ src: URL.createObjectURL(f), caption: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') }));
  buildMuseum(); resetPlayer();
}
$('#addBtn').onclick = () => $('#fileInput').click();
$('#fileInput').onchange = (e) => { loadFiles(e.target.files); e.target.value = ''; };
addEventListener('dragover', (e) => { e.preventDefault(); $('#dropHint').classList.remove('hidden'); });
addEventListener('dragleave', (e) => { if (!e.relatedTarget) $('#dropHint').classList.add('hidden'); });
addEventListener('drop', (e) => { e.preventDefault(); $('#dropHint').classList.add('hidden'); if (e.dataTransfer) loadFiles(e.dataTransfer.files); });

/* ------------------------------------------------------------------ */
/*  Musiqa (ixtiyoriy)                                                 */
/* ------------------------------------------------------------------ */
let audio = null;
if (CONFIG.music) {
  audio = new Audio(CONFIG.music); audio.loop = true; audio.volume = 0.45;
  $('#musicBtn').classList.remove('hidden');
  $('#musicBtn').onclick = () => {
    if (audio.paused) { audio.play(); $('#musicBtn').textContent = '🔊'; }
    else { audio.pause(); $('#musicBtn').textContent = '🔇'; }
  };
}

/* ------------------------------------------------------------------ */
/*  Asosiy sikl                                                        */
/* ------------------------------------------------------------------ */
const clock = new THREE.Clock();
const tmpDir = new THREE.Vector3();
const camTarget = new THREE.Vector3();

function update(dt, t) {
  // Kirish
  let ix = 0, iz = 0;
  if (started && !lightboxOpen) {
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    ix += joy.x; iz += joy.y;
    if (touch.up) iz -= 1;
    if (touch.down) iz += 1;
    if (touch.left) ix -= 1;
    if (touch.right) ix += 1;
    if (keys.has('KeyQ')) cam.yaw += 1.8 * dt;
    if (keys.has('KeyE')) cam.yaw -= 1.8 * dt;
    if (touch.rotL) cam.yaw += 1.9 * dt;
    if (touch.rotR) cam.yaw -= 1.9 * dt;
  }
  const len = Math.hypot(ix, iz);
  if (len > 1) { ix /= len; iz /= len; }
  const run = keys.has('ShiftLeft') || keys.has('ShiftRight') || touch.run;
  const speed = (run ? 6.2 : 3.4) * Math.min(1, len);

  // Kameraga nisbatan yoʻnalish
  const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw);
  tmpDir.set(ix * cy + iz * sy, 0, -ix * sy + iz * cy);
  if (len > 0.05) tmpDir.normalize().multiplyScalar(speed); else tmpDir.set(0, 0, 0);
  player.vel.lerp(tmpDir, 1 - Math.exp(-12 * dt));

  player.pos.addScaledVector(player.vel, dt);
  collide(player.pos, 0.45);

  const sp = player.vel.length();
  if (sp > 0.15) {
    const target = Math.atan2(player.vel.x, player.vel.z);
    let d = target - player.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    player.heading += d * (1 - Math.exp(-14 * dt));
  }
  player.amount += (Math.min(1, sp / 3.2) - player.amount) * (1 - Math.exp(-10 * dt));
  player.phase += sp * dt * 3.0;

  // Panda animatsiyasi
  const sw = Math.sin(player.phase * 2.2) * 0.85 * player.amount;
  panda.legs[0].rotation.x = sw; panda.legs[1].rotation.x = -sw;
  panda.arms[0].rotation.x = -sw * 0.8; panda.arms[1].rotation.x = sw * 0.8;
  const bob = Math.abs(Math.sin(player.phase * 2.2)) * 0.07 * player.amount + Math.sin(t * 2) * 0.012;
  panda.group.position.set(player.pos.x, bob, player.pos.z);
  panda.group.rotation.y = player.heading;
  panda.head.rotation.z = Math.sin(t * 1.6) * 0.04;
  panda.head.rotation.y = Math.sin(t * 0.8) * 0.15 * (1 - player.amount);
  panda.floatHeart.position.y = 2.0 + Math.sin(t * 2.4) * 0.07;
  const hs = 0.34 + Math.sin(t * 5) * 0.025; panda.floatHeart.scale.set(hs, hs, 1);
  blob.position.x = player.pos.x; blob.position.z = player.pos.z;

  // Kamera
  camTarget.set(player.pos.x, 1.25, player.pos.z);
  const cp = Math.cos(cam.pitch);
  camera.position.set(
    camTarget.x + Math.sin(cam.yaw) * cp * cam.dist,
    camTarget.y + Math.sin(cam.pitch) * cam.dist,
    camTarget.z + Math.cos(cam.yaw) * cp * cam.dist);
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -M.W / 2 + 0.4, M.W / 2 - 0.4);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -M.L / 2 + 0.4, M.L / 2 - 0.4);
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.6, M.H - 0.4);
  camera.lookAt(camTarget);

  // Eng yaqin kadr
  let best = -1, bd = 4.6;
  M.frames.forEach((f, i) => {
    const d = Math.hypot(f.center.x - player.pos.x, f.center.z - player.pos.z);
    if (d < bd) { bd = d; best = i; }
  });
  nearest = best;
  const near = started && !lightboxOpen && best >= 0;
  const hint = $('#hint');
  const cap = near ? (items[best].caption || '') : '';
  hint.classList.toggle('hidden', !near || (isTouch && !cap));
  if (near) hint.textContent = isTouch ? cap : ('F — rasmni kattalashtirish' + (cap ? `  ·  ${cap}` : ''));
  $('#actBtn').classList.toggle('hidden', !(isTouch && near));
  M.frames.forEach((f, i) => {
    const target = i === best ? 1.0 : 0.5;
    f.glow.material.opacity += (target - f.glow.material.opacity) * Math.min(1, dt * 6);
  });

  // Yurak haykali va suzuvchi yuraklar
  if (M.sculpt) {
    M.sculpt.rotation.y = t * 0.8;
    M.sculpt.position.y = 2.25 + Math.sin(t * 1.4) * 0.12;
    const s = 1.25 + Math.sin(t * 4) * 0.03; M.sculpt.scale.setScalar(s);
  }
  if (M.hearts) {
    const a = M.hearts.pts.geometry.attributes.position;
    for (let k = 0; k < M.hearts.N; k++) {
      let y = a.getY(k) + dt * (0.18 + (M.hearts.seed[k] % 1) * 0.22);
      if (y > M.H - 0.3) y = 0.2;
      a.setY(k, y);
      a.setX(k, a.getX(k) + Math.sin(t * 0.7 + M.hearts.seed[k]) * dt * 0.12);
    }
    a.needsUpdate = true;
  }
  M.lamps.forEach((l, k) => { l.rotation.y = t * 0.2 + k; });
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt, clock.elapsedTime);
  renderer.render(scene, camera);
});

function resize() {
  const w = stage.clientWidth || 1280, h = stage.clientHeight || 720;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 250));
if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
resize();

/* ------------------------------------------------------------------ */
/*  Ishga tushirish                                                    */
/* ------------------------------------------------------------------ */
$('#introTitle').textContent = CONFIG.title || 'Sevgi Muzeyi';
$('#introSub').textContent = CONFIG.herName ? `${CONFIG.herName} uchun` : (CONFIG.subtitle || '');
$('#introText').textContent = CONFIG.intro || '';
$('#hudTitle').textContent = CONFIG.title || 'Sevgi Muzeyi';
document.title = CONFIG.title || 'Sevgi Muzeyi';

buildMuseum();
resetPlayer();
// Kirish oynasi fonida kamera sekin aylanib tursin
cam.yaw = 0.5;

function goFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req || document.fullscreenElement) return;
  try {
    const p = req.call(el);
    const lock = () => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} };
    if (p && p.then) p.then(lock).catch(() => {}); else lock();
  } catch (e) { /* ruxsat berilmadi */ }
}
if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) $('#fsBtn').classList.add('hidden');
$('#fsBtn').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else goFullscreen(); };

// Rasm oynasida barmoq bilan surib keyingisiga oʻtish
let swipeX = null;
$('#lightbox').addEventListener('touchstart', (e) => { swipeX = e.touches[0].clientX; }, { passive: true });
$('#lightbox').addEventListener('touchend', (e) => {
  if (swipeX == null) return;
  const dx = e.changedTouches[0].clientX - swipeX; swipeX = null;
  if (Math.abs(dx) > 60) stepLightbox(dx < 0 ? 1 : -1);
}, { passive: true });

$('#startBtn').onclick = () => {
  started = true;
  if (isPhone) goFullscreen();
  $('#intro').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  cam.yaw = 0;
  if (audio) audio.play().catch(() => {});
};

// Shriftlar yuklangach, devordagi yozuvni qayta chizish
if (document.fonts && document.fonts.load) {
  document.fonts.load('80px "Great Vibes"').then(() => { buildMuseum(); }).catch(() => {});
}

/* ------------------------------------------------------------------ */
/*  photos/ papkadagi rasmlarni avtomatik topish                       */
/*  (config.js da photos boʻsh boʻlsa): 1.jpg, 2.jpg, 3.png ...        */
/* ------------------------------------------------------------------ */
function probeImage(url) {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(true);
    im.onerror = () => resolve(false);
    im.src = url;
  });
}
async function autoDetectPhotos() {
  if (CONFIG.photos && CONFIG.photos.length) return;
  const exts = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];
  const caps = CONFIG.captions || [];
  const found = [];
  let misses = 0;
  for (let n = 1; n <= 60 && misses < 3; n++) {
    let url = null;
    for (const e of exts) {
      const u = `photos/${n}.${e}`;
      if (await probeImage(u)) { url = u; break; }
    }
    if (url) { found.push({ src: url, caption: caps[n - 1] || '' }); misses = 0; }
    else misses++;
  }
  if (!found.length || userLoaded) return;
  items = found;
  buildMuseum();
  if (!started) resetPlayer();
}
autoDetectPhotos();
