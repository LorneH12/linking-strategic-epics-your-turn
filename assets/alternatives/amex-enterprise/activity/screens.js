// ACTIVITY · SCREENS: what the monitor and laptop show, plus the cursor, click ripple and
// highlight ring drawn on top of each screen. Works on the room as it is: it finds the two
// screen meshes by name and swaps their picture (no changes to room/ needed).
import * as THREE from 'three';
import { SCREENS } from './steps.js';

const MESH = { monitor: 'Targetprocess screen socket', laptop: 'Jira screen socket' };
const PIC_W = 2400, PIC_H = 1500;                 // the recreation screenshots are 2400 × 1500
const BLUE = new THREE.Color('#006FCF'), GOLD = new THREE.Color('#F2B544');
const images = {};

const load = src => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(new Error(`missing ${src}`)); i.src = src; });
export async function loadScreens(base) {
  await Promise.all([700, 800].map(w => document.fonts.load(`${w} 40px Manrope`)));   // for words drawn onto screens
  await Promise.all(Object.entries(SCREENS).map(async ([id, s]) => { images[id] = await load(`${base}${s.file}`); }));
}

// a rounded-rectangle outline (the highlight ring) of size w × h
function ring(w, h, t, r) {
  const shape = (W, H, R) => { const s = new THREE.Shape(), x = -W / 2, y = -H / 2;
    s.moveTo(x + R, y); s.lineTo(x + W - R, y); s.quadraticCurveTo(x + W, y, x + W, y + R); s.lineTo(x + W, y + H - R);
    s.quadraticCurveTo(x + W, y + H, x + W - R, y + H); s.lineTo(x + R, y + H); s.quadraticCurveTo(x, y + H, x, y + H - R); s.lineTo(x, y + R); s.quadraticCurveTo(x, y, x + R, y); return s; };
  const outer = shape(w + 2 * t, h + 2 * t, r + t), inner = shape(w, h, r);
  outer.holes.push(new THREE.Path(inner.getPoints(12)));
  return new THREE.ShapeGeometry(outer, 12);
}

// one device's screen: a canvas picture, a cursor, a ripple and a highlight ring
function makeScreen(mesh) {
  const { width: W, height: H } = mesh.geometry.parameters;
  const canvas = document.createElement('canvas'); canvas.width = PIC_W; canvas.height = PIC_H;
  const ctx = canvas.getContext('2d'), tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  mesh.material.map = tex; mesh.material.needsUpdate = true;
  const layer = new THREE.Group(); mesh.add(layer);
  const z = 0.0015;
  // the cursor: a white arrow with a dark edge, sized to the screen
  const arrow = new THREE.Shape([[0, 0], [0, -1], [0.27, -0.76], [0.47, -1.18], [0.63, -1.1], [0.44, -0.69], [0.76, -0.69]].map(([x, y]) => new THREE.Vector2(x, y)));
  const cursor = new THREE.Group(), s = W * 0.024;
  const edge = new THREE.Mesh(new THREE.ShapeGeometry(arrow), new THREE.MeshBasicMaterial({ color: 0x0b1222, toneMapped: false }));
  const fill = new THREE.Mesh(new THREE.ShapeGeometry(arrow), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
  edge.scale.setScalar(1.22); edge.position.set(-0.06, 0.08, 0); fill.position.z = 0.0002;
  cursor.add(edge, fill); cursor.scale.setScalar(s); cursor.position.set(W * 0.25, -H * 0.3, z * 2); cursor.visible = false; layer.add(cursor);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 48), new THREE.MeshBasicMaterial({ color: BLUE, toneMapped: false, transparent: true, opacity: 0 }));
  ripple.position.z = z * 1.5; layer.add(ripple);
  const hl = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: BLUE, toneMapped: false, transparent: true, opacity: 0 }));
  hl.position.z = z; layer.add(hl);

  const scr = { mesh, W, H, id: null, cursor, ripple, hl };
  // a point on the picture -> a position on the screen surface
  scr.at = (pt, [ox, oy] = [0.5, 0.5]) => { const [x, y, w, h] = pt; return new THREE.Vector3(-W / 2 + (x + w * ox) * W, H / 2 - (y + h * oy) * H, z * 2); };
  scr.point = name => SCREENS[scr.id]?.points?.[name];
  scr.show = id => {
    const pic = SCREENS[id]; scr.id = id;
    ctx.drawImage(images[id], 0, 0, PIC_W, PIC_H);
    for (const [x, y, w, h] of pic.cover ?? []) {   // hide parts that belong to a later state
      const px = ctx.getImageData(Math.max(0, x * PIC_W - 6), y * PIC_H + 2, 1, 1).data;
      ctx.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`; ctx.fillRect(x * PIC_W, y * PIC_H, w * PIC_W, h * PIC_H);
    }
    // replace words on a picture (another Feature's name, another Jira key): [x, y, w, h, text, weight, colour]
    for (const [x, y, w, h, text, weight = 700, colour = '#1B2B3C', family = 'Manrope, Arial, sans-serif'] of pic.text ?? []) {
      const px = ctx.getImageData(Math.max(0, x * PIC_W - 6), y * PIC_H + 2, 1, 1).data;
      ctx.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`; ctx.fillRect(x * PIC_W, y * PIC_H, w * PIC_W, h * PIC_H);
      ctx.fillStyle = colour; ctx.font = `${weight} ${Math.round(h * PIC_H * 0.72)}px ${family}`; ctx.textBaseline = 'middle';
      ctx.fillText(text, x * PIC_W + 2, (y + h / 2) * PIC_H);
    }
    tex.needsUpdate = true; scr.unhighlight();
  };
  scr.highlight = (name, color = BLUE) => {
    const pt = scr.point(name); if (!pt) return;
    const [, , w, h] = pt, pad = 0.008;
    hl.geometry.dispose(); hl.geometry = ring(w * W + pad * W, h * H + pad * W, 0.0035 * W, 0.006 * W);
    const c = scr.at(pt); hl.position.set(c.x, c.y, z); hl.material.color.copy(color); hl.material.opacity = 1; hl.userData.pulse = 0;
  };
  scr.unhighlight = () => { hl.material.opacity = 0; };
  return scr;
}

export function attachScreens(roomRoot) {
  const out = {};
  for (const [device, name] of Object.entries(MESH)) {
    const mesh = roomRoot.getObjectByName(name);
    if (!mesh) throw new Error(`the room has no screen called "${name}"`);
    out[device] = makeScreen(mesh);
  }
  return out;
}
export const COLORS = { BLUE, GOLD };
