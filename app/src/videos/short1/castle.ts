// Medieval castle ballroom by NIGHT (shots 4, 6, 7; light preset "night" in lights.ts). Replaces the old park lawn around PARK
// (the centre of the dance floor). Lit from inside: warm key light from the preset, candle flames + additive glow sprites,
// warm light pools on the floor, torch washes on the side walls and cool moonlit stained glass in the windows.
// Local frame: origin = PARK, +x right, -z = far end (the throne dais and the three tall windows, which the ball cameras
// look at), +z = behind the cameras. Everything is merged by material (Batch) and does NOT cast shadows (the low golden
// sun would drop the 9 m walls over the whole floor). Warm candle glow comes from `emissive` on the two-tone materials
// (shade.ts keeps emissive untouched), flames and stained glass are unlit MeshBasicMaterials (bloom picks them up).
import * as THREE from "three";
import { D0, PARK } from "./story";
import { Batch, Kit, V, lam, quad, boxGeo, prop } from "./build";
import { ctex, rep, stoneHD } from "./paint";
import { NOINK } from "./ink";

const X0 = PARK[0], Z0 = PARK[2], Y = D0;
const HW = 12;            // inner half width (x)
const ZB = -12, ZF = 15;  // inner back / front wall (local z)
const H = 9;              // wall height = ceiling
const T = 0.6;            // wall thickness

const T4 = (x: number, y: number, z: number, yaw = 0) => new THREE.Matrix4().makeRotationY(yaw).setPosition(X0 + x, Y + y, Z0 + z);
const rgb = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b);
/** emissive base glow, scaled down: at night the "night" preset already lights the room, the pools do the rest */
const em = (r: number, g: number, b: number) => rgb(r * 0.4, g * 0.4, b * 0.4);
/** axis box in local coordinates */
const box = (b: Batch, mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, tile = 0) =>
  b.add(boxGeo(V(X0 + x0, Y + y0, Z0 + z0), V(X0 + x1, Y + y1, Z0 + z1), tile), mat);

// ---------------- materials ----------------
const stoneTex = () => stoneHD("tstoneHD");
const mStone = () => lam("hallStone", () => ({ map: stoneTex(), emissive: em(0.5, 0.34, 0.2), emissiveMap: stoneTex() }));
const mPlinth = () => lam("hallPlinth", () => ({ color: "#8d7a66", emissive: em(0.3, 0.2, 0.12) }));
const mCornice = () => lam("hallCornice", () => ({ color: "#a98652", emissive: em(0.34, 0.22, 0.1) }));
const mFrame = () => lam("hallFrame", () => ({ color: "#cdbb9c", emissive: em(0.4, 0.28, 0.16) }));
const mWood = () => lam("hallWood", () => ({ color: "#5a3626", emissive: em(0.2, 0.1, 0.05) }));
const mBeam = () => lam("hallBeam", () => ({ color: "#4a3224", emissive: em(0.22, 0.12, 0.06) }));
const mGold = () => lam("hallGold", () => ({ color: "#d1a44a", emissive: em(0.45, 0.3, 0.08) }));
const mRed = () => lam("hallRed", () => ({ color: "#9c3b32", emissive: em(0.28, 0.07, 0.05) }));
const mCandle = () => lam("hallCandle", () => ({ color: "#f3e8cc", emissive: em(0.5, 0.45, 0.3) }));
const mCloth = () => lam("hallCloth", () => ({ color: "#efe5cf", emissive: em(0.3, 0.25, 0.18) }));
const mFruitR = () => lam("hallFruitR", () => ({ color: "#b8402e", emissive: em(0.25, 0.05, 0.03) }));
const mFruitG = () => lam("hallFruitG", () => ({ color: "#7ea04a", emissive: em(0.1, 0.16, 0.05) }));
const mColumn = () => lam("hallColumn", () => {
  const t = rep(stoneHD("copeHD"), 3, 3);
  return { map: t, emissive: em(0.5, 0.34, 0.2), emissiveMap: t };
});
let flameM: THREE.MeshBasicMaterial | null = null;
const mFlame = () => flameM ?? (flameM = new THREE.MeshBasicMaterial({ color: rgb(3.2, 2.0, 0.7) }));

const floorTex = () => ctex("hallFloor", 512, 512, (g, r) => {
  const n = 2, s = 512 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const dark = (i + j) % 2 === 1;
    g.fillStyle = dark ? "#a9826f" : "#eadfc6"; g.fillRect(i * s, j * s, s, s);
    for (let k = 0; k < 260; k++) {
      g.fillStyle = `rgba(${dark ? "60,30,25" : "120,100,70"},${0.05 + 0.07 * r()})`;
      g.fillRect(i * s + r() * s, j * s + r() * s, 2 + r() * 3, 2 + r() * 3);
    }
  }
  g.strokeStyle = "rgba(90,65,50,0.55)"; g.lineWidth = 4;
  for (let i = 0; i <= n; i++) {
    g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 512); g.stroke();
    g.beginPath(); g.moveTo(0, i * s); g.lineTo(512, i * s); g.stroke();
  }
});
const medalTex = () => ctex("hallMedal", 512, 512, (g) => {
  const c = 256;
  g.fillStyle = "#efe3c8"; g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#c79a45"; g.lineWidth = 22; g.beginPath(); g.arc(c, c, c - 14, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = "#8c3b3a"; g.lineWidth = 8; g.beginPath(); g.arc(c, c, c - 46, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#a8505a";
  for (let k = 0; k < 8; k++) {
    g.save(); g.translate(c, c); g.rotate((k * Math.PI) / 4);
    g.beginPath(); g.moveTo(0, -175); g.lineTo(28, -42); g.lineTo(-28, -42); g.closePath(); g.fill();
    g.restore();
  }
  g.fillStyle = "#c79a45"; g.beginPath(); g.arc(c, c, 38, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#8c3b3a"; g.beginPath(); g.arc(c, c, 16, 0, Math.PI * 2); g.fill();
});
const glassTex = () => ctex("hallGlass", 256, 512, (g, r) => {
  const W = 256, Hh = 512;
  const gr = g.createLinearGradient(0, Hh, 0, 0);
  gr.addColorStop(0, "#4a6bb8"); gr.addColorStop(0.55, "#2a3f8a"); gr.addColorStop(1, "#16225a");
  g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
  const tints = ["rgba(120,160,255,0.22)", "rgba(70,90,200,0.25)", "rgba(190,210,255,0.18)", "rgba(110,70,190,0.2)"];
  for (let y = 0; y < Hh; y += 32) for (let x = 0; x < W; x += 32) {
    g.fillStyle = tints[Math.floor(r() * tints.length) % tints.length]; g.fillRect(x, y, 32, 32);
  }
  for (let k = 0; k < 26; k++) { g.fillStyle = `rgba(255,255,240,${0.5 + 0.5 * r()})`; g.fillRect(r() * W, r() * Hh * 0.7, 2.5, 2.5); } // stars
  g.fillStyle = "rgba(255,248,225,0.9)"; g.beginPath(); g.arc(W * 0.7, 150, 17, 0, Math.PI * 2); g.fill();                                   // moon
  g.strokeStyle = "#2c2030"; g.lineWidth = 3;
  for (let x = 0; x <= W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); }
  for (let y = 0; y <= Hh; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.lineWidth = 10; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, Hh); g.stroke();      // centre mullion
  g.beginPath(); g.moveTo(0, Hh * 0.62); g.lineTo(W, Hh * 0.62); g.stroke();                  // transom
  g.lineWidth = 6; g.beginPath(); g.arc(W / 2, 112, 56, 0, Math.PI * 2); g.stroke();          // rose in the arch
});
let glassM: THREE.MeshBasicMaterial | null = null;
const mGlass = () => glassM ?? (glassM = new THREE.MeshBasicMaterial({ map: glassTex(), color: rgb(1.1, 1.2, 1.6) }));

// ---------------- pieces ----------------
/** flat arch shape (round top), base at y = 0, facing +z, uv covering 0..1 */
const archGeo = (w: number, hr: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, hr); s.absarc(0, hr, w / 2, 0, Math.PI, false); s.lineTo(-w / 2, 0);
  const g = new THREE.ShapeGeometry(s, 24);
  const p = g.attributes.position as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute, th = hr + w / 2;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / th);
  return g;
};
/** tall arched window with glowing stained glass, centred at (x, z) on a wall; yaw 0 faces +z, PI/2 faces +x, -PI/2 faces -x */
const windowAt = (b: Batch, x: number, z: number, yaw: number) => {
  const fr = archGeo(3.1, 3.6), gl = archGeo(2.4, 3.25);
  b.add(fr, mFrame(), T4(x, 1.6, z, yaw));
  b.add(gl, mGlass(), T4(x, 1.6, z, yaw).multiply(new THREE.Matrix4().makeTranslation(0, 0.35, 0.03)));
  const sill = boxGeo(V(-1.75, 0, -0.1), V(1.75, 0.16, 0.3));
  b.add(sill, mFrame(), T4(x, 1.5, z, yaw).multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.02)));
};
const flame = (b: Batch, x: number, y: number, z: number, s = 1) =>
  b.add(new THREE.ConeGeometry(0.07 * s, 0.26 * s, 8).translate(0, 0.13 * s, 0), mFlame(), T4(x, y, z));
const candle = (b: Batch, x: number, y: number, z: number, h = 0.22) => {
  b.add(new THREE.CylinderGeometry(0.045, 0.045, h, 8).translate(0, h / 2, 0), mCandle(), T4(x, y, z));
  flame(b, x, y + h, z);
};
/** standing banner (Kenney painted cloth) with its pole at (px, pz), cloth facing +z / +x / -x */
const banner = (b: Batch, kit: Kit, name: string, px: number, pz: number, h: number, face: "+z" | "+x" | "-x") => {
  const off = 0.4 * (h / 0.84);
  if (face === "+z") prop(b, kit, name, X0 + px, Y, Z0 + pz - off, h, -Math.PI / 2);
  else if (face === "+x") prop(b, kit, name, X0 + px - off, Y, Z0 + pz, h, 0);
  else prop(b, kit, name, X0 + px + off, Y, Z0 + pz, h, -Math.PI);
};
const chandelier = (b: Batch, x: number, z: number, y: number) => {
  const gold = mGold();
  b.add(new THREE.TorusGeometry(1.0, 0.05, 8, 28).rotateX(Math.PI / 2), gold, T4(x, y, z));
  b.add(new THREE.TorusGeometry(0.55, 0.04, 8, 24).rotateX(Math.PI / 2), gold, T4(x, y - 0.25, z));
  b.add(new THREE.CylinderGeometry(0.025, 0.025, H - y, 6).translate(0, (H - y) / 2, 0), gold, T4(x, y, z));
  b.add(new THREE.SphereGeometry(0.12, 12, 8), gold, T4(x, y - 0.5, z));
  b.add(new THREE.CylinderGeometry(0.02, 0.05, 0.25, 6).translate(0, -0.12, 0), gold, T4(x, y - 0.25, z));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    candle(b, x + Math.cos(a), y + 0.05, z + Math.sin(a));
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4;
    candle(b, x + 0.55 * Math.cos(a), y - 0.2, z + 0.55 * Math.sin(a), 0.18);
  }
};
const candelabra = (b: Batch, x: number, z: number) => {
  const gold = mGold();
  b.add(new THREE.CylinderGeometry(0.3, 0.34, 0.08, 14).translate(0, 0.04, 0), gold, T4(x, 0, z));
  b.add(new THREE.CylinderGeometry(0.035, 0.06, 1.7, 8).translate(0, 0.85, 0), gold, T4(x, 0, z));
  b.add(new THREE.SphereGeometry(0.09, 10, 8), gold, T4(x, 0.95, z));
  box(b, gold, x - 0.5, x + 0.5, 1.7, 1.76, z - 0.03, z + 0.03);
  for (const dx of [-0.45, -0.225, 0, 0.225, 0.45]) candle(b, x + dx, 1.76, z, 0.2);
};
const column = (b: Batch, x: number, z: number) => {
  const st = mColumn();
  b.add(new THREE.CylinderGeometry(0.42, 0.46, H - 0.9, 16).translate(0, 0.45 + (H - 0.9) / 2, 0), st, T4(x, 0, z));
  box(b, st, x - 0.6, x + 0.6, 0, 0.45, z - 0.6, z + 0.6, 2);
  box(b, st, x - 0.6, x + 0.6, H - 0.45, H, z - 0.6, z + 0.6, 2);
  b.add(new THREE.TorusGeometry(0.46, 0.05, 6, 16).rotateX(Math.PI / 2), mGold(), T4(x, 0.5, z));
  b.add(new THREE.TorusGeometry(0.43, 0.05, 6, 16).rotateX(Math.PI / 2), mGold(), T4(x, H - 0.5, z));
};
/** wall torch on a column, on its side facing the hall centre */
const sconce = (b: Batch, cx: number, z: number) => {
  const dir = cx < 0 ? 1 : -1, x = cx + dir * 0.6;
  box(b, mGold(), x - 0.05, x + 0.05, 3.1, 3.4, z - 0.05, z + 0.05);
  b.add(new THREE.CylinderGeometry(0.1, 0.06, 0.14, 8).translate(0, 0.07, 0), mGold(), T4(x, 3.4, z));
  flame(b, x, 3.54, z, 1.6);
};
const table = (b: Batch, cx: number, cz: number) => {
  box(b, mCloth(), cx - 2.0, cx + 2.0, 0, 0.92, cz - 0.5, cz + 0.5);
  box(b, mRed(), cx - 2.0, cx + 2.0, 0.78, 0.84, cz - 0.52, cz + 0.52);
  for (const dx of [-1.4, 1.4]) candle(b, cx + dx, 0.92, cz - 0.1, 0.26);
  for (const [dx, m] of [[-0.55, mFruitR()], [0, mFruitG()], [0.55, mFruitR()]] as const) {
    b.add(new THREE.CylinderGeometry(0.25, 0.22, 0.04, 14).translate(0, 0.02, 0), mGold(), T4(cx + dx, 0.92, cz + 0.12));
    b.add(new THREE.SphereGeometry(0.09, 10, 8), m, T4(cx + dx - 0.07, 1.0, cz + 0.12));
    b.add(new THREE.SphereGeometry(0.09, 10, 8), m, T4(cx + dx + 0.08, 1.0, cz + 0.16));
  }
  for (const dx of [-0.9, 0.9, 1.0]) b.add(new THREE.CylinderGeometry(0.045, 0.035, 0.15, 8).translate(0, 0.075, 0), mGold(), T4(cx + dx, 0.92, cz - 0.3));
};
const throne = (b: Batch) => {
  const wood = mWood(), gold = mGold(), red = mRed(), z0 = -11.6, y = 0.6;
  box(b, wood, -0.5, 0.5, y, y + 0.45, z0, z0 + 0.9);                // seat block
  box(b, red, -0.4, 0.4, y + 0.45, y + 0.55, z0 + 0.12, z0 + 0.88);  // cushion
  box(b, wood, -0.5, 0.5, y + 0.45, y + 2.4, z0, z0 + 0.15);         // back
  box(b, red, -0.38, 0.38, y + 0.9, y + 2.0, z0 + 0.15, z0 + 0.21);  // back cushion
  for (const s of [-1, 1]) {
    box(b, wood, s * 0.5 - (s < 0 ? 0.12 : 0), s * 0.5 + (s > 0 ? 0.12 : 0), y + 0.45, y + 0.95, z0 + 0.1, z0 + 0.9);
    box(b, gold, s * 0.5 - (s < 0 ? 0.14 : 0), s * 0.5 + (s > 0 ? 0.14 : 0), y + 0.95, y + 1.01, z0 + 0.08, z0 + 0.92);
    b.add(new THREE.SphereGeometry(0.1, 10, 8), gold, T4(s * 0.5, y + 2.5, z0 + 0.07));
  }
  b.add(new THREE.ConeGeometry(0.5, 0.9, 4).rotateY(Math.PI / 4).translate(0, 0.45, 0), gold, T4(0, y + 2.4, z0 + 0.07));
  box(b, gold, -0.52, 0.52, y + 2.38, y + 2.44, z0 - 0.02, z0 + 0.17);
};
const shield = (b: Batch, y: number, s: number, mat: THREE.Material, z: number) => {
  const sh = new THREE.Shape();
  sh.moveTo(-0.8, 1); sh.lineTo(0.8, 1); sh.lineTo(0.8, 0);
  sh.bezierCurveTo(0.8, -0.6, 0.3, -0.9, 0, -1); sh.bezierCurveTo(-0.3, -0.9, -0.8, -0.6, -0.8, 0); sh.lineTo(-0.8, 1);
  b.add(new THREE.ShapeGeometry(sh, 16), mat, T4(0, y, z).multiply(new THREE.Matrix4().makeScale(s, s, 1)));
};
/** ring of boxes just inside the walls: depth d inward, from y0 to y1 */
const ring = (b: Batch, mat: THREE.Material, y0: number, y1: number, d: number) => {
  box(b, mat, -HW, HW, y0, y1, ZB, ZB + d);
  box(b, mat, -HW, HW, y0, y1, ZF - d, ZF);
  box(b, mat, -HW, -HW + d, y0, y1, ZB + d, ZF - d);
  box(b, mat, HW - d, HW, y0, y1, ZB + d, ZF - d);
};

// ---------------- glow: additive light that is not geometry ----------------
const glowTex = () => ctex("hallGlow", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.45)");
  gr.addColorStop(0.6, "rgba(255,255,255,0.12)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const glowMats = new Map<string, THREE.Material>();
const glowMat = (c: [number, number, number], sprite: boolean) => {
  const key = (sprite ? "s" : "q") + c.join(",");
  let m = glowMats.get(key);
  if (!m) {
    const o = { map: glowTex(), color: rgb(...c), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false };
    m = sprite ? new THREE.SpriteMaterial(o) : new THREE.MeshBasicMaterial(o);
    glowMats.set(key, m);
  }
  return m;
};
const WARM: [number, number, number] = [0.55, 0.33, 0.14];
/** soft halo that always faces the lens (around flames, chandeliers, windows) */
const halo = (root: THREE.Object3D, x: number, y: number, z: number, size: number, c: [number, number, number]) => {
  const sp = new THREE.Sprite(glowMat(c, true) as THREE.SpriteMaterial);
  sp.position.set(X0 + x, Y + y, Z0 + z); sp.scale.setScalar(size); sp.layers.set(NOINK); root.add(sp);
};
/** flat light pool: on the floor (yaw undefined) or on a wall (facing yaw, 0 = +z) */
const pool = (root: THREE.Object3D, x: number, y: number, z: number, size: number, c: [number, number, number], yaw?: number) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), glowMat(c, false));
  if (yaw === undefined) m.rotation.x = -Math.PI / 2; else m.rotation.y = yaw;
  m.position.set(X0 + x, Y + y, Z0 + z); m.layers.set(NOINK); m.renderOrder = 1; root.add(m);
};
const lightUp = (root: THREE.Object3D) => {
  pool(root, 0, 0.018, 0, 13, [0.2, 0.12, 0.05]);                                   // the dance floor, warm all over
  for (const [x, z] of [[-5.5, -3.5], [5.5, -3.5], [-5.5, 4], [5.5, 4]]) {          // chandeliers
    halo(root, x, 5.1, z, 5.2, [0.6, 0.36, 0.15]);
    pool(root, x, 0.018, z, 10, [0.34, 0.2, 0.08]);
  }
  for (const [x, z] of [[-8.3, -7.5], [8.3, -7.5], [-8.3, 6.5], [8.3, 6.5], [-5.4, -10.4], [5.4, -10.4]]) { // candelabras
    halo(root, x, 1.95, z, 2.6, [0.55, 0.32, 0.13]);
    pool(root, x, 0.018, z, 4.6, [0.26, 0.15, 0.06]);
  }
  for (const z of [-9.75, -3.25, 3.25, 9.75]) for (const sx of [-1, 1]) {            // wall torches on the columns
    const cx = sx * 10.5, tx = cx - sx * 0.6;
    halo(root, tx, 3.55, z, 2.4, [0.6, 0.34, 0.12]);
    pool(root, sx * (HW - 0.03), 3.4, z, 4.2, [0.34, 0.2, 0.07], sx < 0 ? Math.PI / 2 : -Math.PI / 2);
  }
  for (const x of [-9.6, -6.8, 6.8, 9.6]) halo(root, x, 1.25, -11.1, 1.3, [0.5, 0.3, 0.12]); // banquet candles
  halo(root, 0, 2.6, ZB + 0.5, 4.5, [0.5, 0.3, 0.12]);                                // behind the throne
  pool(root, 0, 0.018, ZB + 2.5, 6, [0.28, 0.16, 0.06]);
  for (const x of [-8, 0, 8]) halo(root, x, 4.0, ZB + 0.3, 6.5, [0.07, 0.13, 0.34]);  // cool moonlight spilling from the windows
  for (const z of [-6.5, 0, 6.5]) for (const sx of [-1, 1]) halo(root, sx * (HW - 0.3), 4.0, z, 6.5, [0.07, 0.13, 0.34]);
};

/** builds the whole ballroom into `root` */
export const buildCastle = (root: THREE.Object3D, kit: Kit) => {
  const b = new Batch();
  const stone = mStone();

  // floor: marble chessboard (1.5 m squares) + round medallion under the dancers
  const fw = HW * 2, fd = ZF - ZB;
  b.add(quad(V(X0 - HW, Y + 0.012, Z0 + ZF), V(X0 + HW, Y + 0.012, Z0 + ZF), V(X0 + HW, Y + 0.012, Z0 + ZB), V(X0 - HW, Y + 0.012, Z0 + ZB), fw / 3, fd / 3),
    lam("hallFloorMat", () => ({ map: floorTex(), emissive: em(0.18, 0.12, 0.07), emissiveMap: floorTex() })));
  b.add(new THREE.CircleGeometry(5.6, 56).rotateX(-Math.PI / 2),
    lam("hallMedalMat", () => ({ map: medalTex(), emissive: em(0.2, 0.14, 0.08), emissiveMap: medalTex() })), T4(0, 0.016, 0));

  // walls (boxes, stone courses ~0.4 m), plinth and cornice
  box(b, stone, -HW - T, HW + T, 0, H, ZB - T, ZB, 6);   // back
  box(b, stone, -HW - T, HW + T, 0, H, ZF, ZF + T, 6);   // front
  box(b, stone, -HW - T, -HW, 0, H, ZB, ZF, 6);          // left
  box(b, stone, HW, HW + T, 0, H, ZB, ZF, 6);            // right
  ring(b, mPlinth(), 0, 0.9, 0.12);
  ring(b, mCornice(), H - 0.45, H, 0.3);

  // ceiling: dark timber with cross beams and three long beams
  const beam = mBeam();
  b.add(quad(V(X0 - HW, Y + H, Z0 + ZB), V(X0 + HW, Y + H, Z0 + ZB), V(X0 + HW, Y + H, Z0 + ZF), V(X0 - HW, Y + H, Z0 + ZF)), beam);
  for (const z of [-9, -3, 3, 9, 14]) box(b, beam, -HW, HW, H - 0.6, H, z - 0.25, z + 0.25);
  for (const x of [-6, 0, 6]) box(b, beam, x - 0.2, x + 0.2, H - 0.45, H, ZB, ZF);

  // back wall: three tall windows, crest above the middle one, standards between
  for (const x of [-8, 0, 8]) windowAt(b, x, ZB + 0.02, 0);
  const gold = mGold();
  shield(b, 7.85, 0.78, gold, ZB + 0.03);
  shield(b, 7.85, 0.68, mRed(), ZB + 0.05);
  banner(b, kit, "banner-red", -4, ZB + 0.6, 5.2, "+z");
  banner(b, kit, "banner-red", 4, ZB + 0.6, 5.2, "+z");
  banner(b, kit, "banner-green", -10.8, ZB + 0.6, 5.2, "+z");
  banner(b, kit, "banner-green", 10.8, ZB + 0.6, 5.2, "+z");

  // side walls: three windows each, columns with torches in between
  for (const z of [-6.5, 0, 6.5]) { windowAt(b, -HW + 0.02, z, Math.PI / 2); windowAt(b, HW - 0.02, z, -Math.PI / 2); }
  for (const z of [-9.75, -3.25, 3.25, 9.75]) for (const x of [-10.5, 10.5]) { column(b, x, z); sconce(b, x, z); }

  // dais with three steps, red carpet, throne
  const stepM = lam("hallStep", () => ({ map: rep(stoneHD("copeHD"), 1, 1), emissive: em(0.4, 0.28, 0.16), emissiveMap: rep(stoneHD("copeHD"), 1, 1) }));
  const tiers: [number, number, number][] = [[4.5, -9.2, 0.2], [3.8, -9.8, 0.4], [3.1, -10.4, 0.6]];
  for (const [hw, zf, hh] of tiers) {
    box(b, stepM, -hw, hw, 0, hh, ZB, zf, 2);
    box(b, mRed(), -1.0, 1.0, 0, hh + 0.01, ZB, zf);
  }
  b.add(quad(V(X0 - 1.0, Y + 0.034, Z0 - 5.4), V(X0 + 1.0, Y + 0.034, Z0 - 5.4), V(X0 + 1.0, Y + 0.034, Z0 - 9.2), V(X0 - 1.0, Y + 0.034, Z0 - 9.2)), mRed());
  throne(b);

  // chandeliers, candelabras, banquet tables
  for (const [x, z] of [[-5.5, -3.5], [5.5, -3.5], [-5.5, 4], [5.5, 4]]) chandelier(b, x, z, 5.2);
  for (const [x, z] of [[-8.3, -7.5], [8.3, -7.5], [-8.3, 6.5], [8.3, 6.5], [-5.4, -10.4], [5.4, -10.4]]) candelabra(b, x, z);
  table(b, -8.2, -11.0);
  table(b, 8.2, -11.0);

  b.build(root, false);
  lightUp(root);
};
