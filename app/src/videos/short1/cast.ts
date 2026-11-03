// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, townsfolk, KID, noble, lady, DOCTOR, SERVANT, fxBurst, fxRing, fxContact, fxShadow, fxStink, fxMist, fxBreeze, fxBottle, fxDrop,
  Outfit, Expr, FrontOpts, SideOpts, Prop,
} from "./toon";
import { FPS, D0, PARK, V3, SHOTS, Light, smooth, clamp01, BridgeState, DOC_AT, QUAY_HERO, WADE, SOAP_AT } from "./story";
import { LIGHTS } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: Light = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const SWAPS: Record<number, number[]> = {};
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<Light, [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33], night: [0.3, 0.25, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- crowd by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };

const NOBLES = [0, 1, 2, 3, 4, 5].map((v) => noble(v));
const LADIES = [0, 1, 2, 3, 4, 5].map((v) => lady(v));
const FRONT = { side: false, mirror: false };
const nob = (v: number): Who => ({ i: 300 + v, o: NOBLES[v % 6], okey: `n${v % 6}` });
const lad = (v: number): Who => ({ i: 400 + v, o: LADIES[v % 6], okey: `l${v % 6}` });
const folk = (v: number): Who => ({ i: 200 + v, o: FOLK[v % 6], okey: `f${v % 6}` });
const DOC: Who = { i: 500, o: DOCTOR, okey: "doc" };
const SRV: Who = { i: 501, o: SERVANT, okey: "srv" };
const KIDW: Who = { i: 502, o: KID, okey: "kid" };
const put = (cam: CamInfo, out: Stage, who: Who, x: number, y: number, z: number, fo: FrontOpts, scale = 1, shadow = true) => {
  out.places.push(person(cam, who, x, y, z, FRONT, fo, {}, scale));
  if (shadow) blob(out, x, y, z, scale);
};
const WATERLINE = hexOf([0.3, 0.36, 0.52], 1);
/** unit vector (x, z) from the camera to a point, and the camera-right (x, z): for placing cards around someone */
const around = (cam: CamInfo, x: number, z: number) => {
  const dx = x - cam.pos.x, dz = z - cam.pos.z, l = Math.hypot(dx, dz) || 1;
  return { fx: dx / l, fz: dz / l, rx: cam.right.x, rz: cam.right.z };
};

// ---- fx helpers ----
/** green "mata molhada" breeze around someone; pop in 0.3 s, out 0.4 s */
const brisa = (out: Stage, x: number, y: number, z: number, t: number, t0: number, t1: number, size = 1.7) => {
  const pop = Math.min(1, (t - t0) / 0.3) * Math.min(1, (t1 - t) / 0.4);
  if (pop <= 0.02) return;
  const u = q((t * 0.6) % 1, 30);
  out.fx.push({ key: `breeze${u}`, cw: 420, ch: 420, draw: (p) => fxBreeze(p, u), x, y, z, w: size * pop, h: size * pop });
};
/** pink perfume cloud of growth g (0..1) around the hero, a little behind him; soft see-through cards */
const mistAround = (out: Stage, cam: CamInfo, x: number, y: number, z: number, g: number, fade = 1) => {
  if (g <= 0 || fade <= 0) return;
  const a = around(cam, x, z), gq = q(g, 12);
  const spots: [number, number, number][] = [[-0.7, 0.9, 1.5], [0.75, 1.1, 1.7], [0, 1.7, 1.4], [-0.45, 0.35, 1.3], [0.55, 0.5, 1.4]];
  spots.forEach(([lx, ly, sz], i) => {
    out.fx.push({ key: `mist${gq}`, cw: 420, ch: 320, draw: (p) => fxMist(p, gq),
      x: x + a.rx * lx * (0.6 + 0.6 * g) + a.fx * (0.25 + 0.05 * i), y: y + ly * (0.7 + 0.3 * g), z: z + a.rz * lx * (0.6 + 0.6 * g) + a.fz * (0.25 + 0.05 * i),
      w: sz * (0.5 + 0.7 * g) * fade, h: sz * 0.75 * (0.5 + 0.7 * g) * fade, soft: true });
  });
};
/** three wavy bad-smell lines rising BESIDE someone: clear of the head and body, and 0.35 m behind them (a.f points away from the
 *  lens), so a card never cuts through the character (they used to sit on the body's plane, one right on the head) */
const stinkAround = (out: Stage, cam: CamInfo, x: number, y: number, z: number, t: number, size = 1, topY = 1.5) => {
  const a = around(cam, x, z), back = 0.35 * size;
  // one on each side (left low, right a bit higher) + one centred ABOVE (the hero's head top is ~2.0 m: topY 2.2 puts the card's bottom at ~2.15 m)
  [[-0.8, 0.55], [0.85, 0.85], [0, topY]].forEach(([lx, ly], i) => {
    const u = q((t * 0.7 + i * 0.33) % 1, 24);
    out.fx.push({ key: `stink${u}`, cw: 300, ch: 360, draw: (p) => fxStink(p, u), x: x + a.rx * lx * size + a.fx * back, y: y + ly * size,
      z: z + a.rz * lx * size + a.fz * back, w: 0.75 * size, h: 0.9 * size });
  });
};
/** a perfume bottle thrown from `from`, landing at (lx, lz) after 0.9 s and lying there */
const bottleFly = (out: Stage, from: V3, lx: number, lz: number, t0: number, t: number, seed: number) => {
  const u = (t - t0) / 0.9;
  if (u < 0) return;
  const rest = D0 + 0.2;
  let x = lx, y = rest, z = lz, rot = (hh(seed) - 0.5) * 1.6;
  if (u < 1) {
    x = from[0] + (lx - from[0]) * u; z = from[2] + (lz - from[2]) * u;
    y = from[1] + (rest - from[1]) * u + 1.5 * 4 * u * (1 - u); rot = u * 9 + hh(seed);
  }
  out.fx.push({ key: "bottle", cw: 120, ch: 200, draw: fxBottle, x, y, z, w: 0.26, h: 0.43, rot });
};

// ---- expressions on cue: reaction lands 0-3 f before the word ----
const on = (t: number, t0: number) => t >= t0 - LEAD;

// ---- shot 1: three nobles in the street ----
const street = (cam: CamInfo, t: number, out: Stage) => {
  const smug = on(t, 3.6);
  const trio: [number, number, number, number][] = [[0, 0, -57, 0], [3, -1.6, -58.3, 1], [1, 1.7, -58.7, 2]];
  for (const [v, x, z, k] of trio) {
    const fo: FrontOpts = { mode: "stand", expr: smug && k === 0 ? "smile_closed" : k ? "stern" : "neutral", headTilt: k === 1 ? -6 : 6, blink: lidAt(t, 300 + v), look: 0 };
    put(cam, out, nob(v), x, D0, z, fo);
  }
};

// ---- shot 2: the quay, the doctor, the villagers ----
// shot 2 camera: 6 m from the doctor along (+0.65, +0.76), doctor centred. Nobody stands on that line in front of him; spot 4 is the
// one villager BEHIND him (1.6 m back, 0.65 m to screen-right), half hidden by his shoulder, as the user asked. Spot 0 keeps the recoil in shot 2c.
const quay = (cam: CamInfo, t: number, out: Stage) => {
  const pointing = on(t, 7.18) && t < 10.4;
  put(cam, out, DOC, DOC_AT[0], D0, DOC_AT[2], { mode: "stand", expr: "stern", wave: pointing ? 0.35 : undefined, blink: lidAt(t, 500), headTilt: pointing ? -4 : 0 }, 1.1);
  const spots: [number, number, number][] = [[-1.4, -34.4, 0], [-2.9, -33.2, 1], [-4.4, -34.8, 2], [3.9, -34.9, 3], [2.15, -31.9, 4], [5.5, -33.9, 5], [-6.0, -33.6, 6]];
  const r = smooth((t - (9.24 - LEAD)) / 0.35);
  spots.forEach(([x, z, i]) => {
    const kid = i === 5, away = Math.sign(x - DOC_AT[0]) || 1;
    const expr: Expr = !on(t, 9.24) ? (i % 2 ? "neutral" : "smile_closed") : on(t, 9.7) && i % 2 === 0 ? "shock" : "nervous";
    const nose: Prop = on(t, 9.98) && i % 3 !== 1 ? ["nose", 1] : null;
    put(cam, out, kid ? KIDW : folk(i), x + away * 0.5 * r, D0, z + 0.2 * r, { mode: "stand", expr, prop: nose, blink: lidAt(t, 200 + i) }, kid ? 0.72 : 1);
  });
  // a busy quay for the aerial opening
  for (let i = 0; i < 14; i++) {
    const x = (i % 2 ? 1 : -1) * (7.5 + (i >> 1) * 2.1), z = -33.2 - hh(i) * 2.4;
    put(cam, out, folk(i + 7), x, D0, z, { mode: "stand", expr: i % 3 ? "smile_closed" : "neutral", blink: lidAt(t, 230 + i) });
  }
};

// ---- shot 3: the street again: dry cloth, shirt, perfume bath, bad smell ----
const alley = (cam: CamInfo, t: number, out: Stage) => {
  const hx = 0, hz = -56;
  const cloth = on(t, 11.66) && t < 14.45, spraying = t >= 14.5 && t < 16.6;
  const prop: Prop = cloth ? ["cloth", 0.5 + 0.5 * Math.sin((t - 11.66) * 11)] : spraying ? ["spray", 0.5 + 0.5 * Math.sin((t - 14.5) * 9)] : null;
  const expr: Expr = !on(t, 11.06) ? "stern" : !on(t, 13.88) ? "neutral" : !on(t, 14.7) ? "smile_closed" : !on(t, 17.0) ? "grin" : !on(t, 20.0) ? "smile_closed" : "neutral";
  put(cam, out, nob(0), hx, D0, hz, { mode: "stand", expr, prop, headTilt: on(t, 20.0) ? 6 : 0, blink: lidAt(t, 300) });
  // the servant brings the clean shirt, then backs away
  if (t >= 13.2) {
    const comeIn = smooth((t - 13.2) / 0.7), leave = smooth((t - 14.4) / 0.6);
    const sx = 3.8 - 2.2 * comeIn + 2.0 * leave, moving = (comeIn > 0 && comeIn < 1) || (leave > 0 && leave < 1);
    const sExpr: Expr = on(t, 20.0) ? (on(t, 20.78) ? "pained" : "nervous") : "neutral";
    const sProp: Prop = t < 14.4 ? ["shirt", 1] : on(t, 20.78) ? ["nose", 1] : null;
    put(cam, out, SRV, sx, D0, -55.4, { mode: moving ? "stroll" : "stand", phase: q((t * 1.4) % 1, 60), expr: sExpr, prop: sProp, blink: lidAt(t, 501) });
  }
  // villagers who watch and then pinch their noses
  const spots: [number, number, number][] = [[-2.6, -54.3, 0], [-1.3, -53.8, 1], [1.2, -53.4, 2], [2.7, -54.2, 3], [0.1, -52.0, 4]];
  const rc = smooth((t - (20.0 - LEAD)) / 0.5);
  spots.forEach(([x, z, i]) => {
    const e: Expr = !on(t, 14.7) ? "neutral" : !on(t, 15.9) ? "shock" : !on(t, 20.0) ? "neutral" : !on(t, 20.78) ? "nervous" : "pained";
    const nose: Prop = on(t, 20.78) ? ["nose", 1] : null;
    put(cam, out, folk(i + 2), x + (Math.sign(x - hx) || 1) * 0.35 * rc, D0, z + 0.5 * rc, { mode: "stand", expr: e, prop: nose, blink: lidAt(t, 210 + i) });
  });
  // perfume cloud (grows during the bath, lingers) then the bad smell takes over
  if (t >= 14.55 && t < 20.5) mistAround(out, cam, hx, D0, hz, smooth((t - 14.55) / 1.4), t < 19.9 ? 1 : Math.max(0, (20.4 - t) / 0.5));
  if (on(t, 20.0)) stinkAround(out, cam, hx, D0 + 0.4, hz, t, 1, 2.2);
};

// ---- ballroom (shots 4, 6, 7) ----
const DANCE: { r: number; w: number; th0: number }[] = [
  { r: 2.1, w: 0.55, th0: 0 }, { r: 2.1, w: 0.55, th0: 2.094 }, { r: 2.1, w: 0.55, th0: 4.189 },
  { r: 4.0, w: -0.38, th0: 0.5 }, { r: 4.0, w: -0.38, th0: 2.6 }, { r: 4.0, w: -0.38, th0: 4.7 },
];
/** couples circling the dance floor; pinch = hold the nose (after "De longe") */
const dancers = (cam: CamInfo, t: number, out: Stage, from: number, pinch: boolean) => {
  const [cx, , cz] = PARK;
  DANCE.forEach((c, k) => {
    if (k < from) return;
    const th = c.th0 + c.w * t, dth = 0.8 / c.r, phase = q((t * 1.1 + k * 0.17) % 1, 60);
    const gx = cx + c.r * Math.cos(th), gz = cz + c.r * Math.sin(th), lx = cx + c.r * Math.cos(th + dth), lz = cz + c.r * Math.sin(th + dth);
    const pn = pinch && on(t, 25.16);
    const gp: Prop = pn ? ["nose", 1] : null;
    put(cam, out, nob(k + 1), gx, D0, gz, { mode: "stroll", phase, expr: pn ? "pained" : "smile", prop: gp, blink: lidAt(t, 310 + k) });
    put(cam, out, lad(k), lx, D0, lz, { mode: "stroll", phase: q((phase + 0.5) % 1, 60), expr: pn ? "pained" : "smile_closed", prop: gp, blink: lidAt(t, 410 + k) });
  });
};

// ---- shot 5: the quay edge, then the river ----
const river = (cam: CamInfo, t: number, out: Stage) => {
  if (t < 838 / FPS) {
    const hop = t > 27.2 ? Math.max(0, Math.sin((t - 27.2) * 6)) * 0.1 : 0;
    const expr: Expr = on(t, 26.82) ? "nervous" : "neutral";
    put(cam, out, nob(0), QUAY_HERO[0], D0 + hop, QUAY_HERO[2], { mode: "stand", expr, prop: ["soap", 0.25], headTilt: -4, blink: lidAt(t, 300) });
    return;
  }
  const bob = 0.03 * Math.sin(t * 2.2), rise = 0.45 * smooth((t - 31.0) / 1.2), y = WADE[1] + rise + bob;
  const expr: Expr = on(t, 31.22) ? "relief" : on(t, 29.48) ? "grin" : on(t, 28.62) ? "nervous" : "shock";
  const k = on(t, 31.22) ? 0.6 : smooth((t - (29.48 - LEAD)) / 0.7);
  out.places.push(person(cam, nob(0), WADE[0], y, WADE[2], FRONT, { mode: "stand", expr, prop: ["soap", on(t, 29.48) ? k : 0.25], blink: lidAt(t, 300) }, {}, 1));
  const u = q((t * 0.45) % 1, 30);
  out.fx.push({ key: `ring${u}`, cw: 600, ch: 600, draw: (p) => fxRing(p, u), x: WADE[0], y: 0.03, z: WADE[2], w: 2.2, h: 2.2, flat: true });
  out.fx.push({ key: `blob|contact|${WATERLINE}`, cw: 128, ch: 128, draw: (p) => fxContact(p, WATERLINE), x: WADE[0], y: 0.034, z: WADE[2], w: 0.8, h: 0.55, flat: true });
  brisa(out, WADE[0], 0.9 + rise, WADE[2], t, 31.22, 36, 1.9);
};

// ---- shot 6: ladies arrive, nobles jostle, the whole court swaps perfume for soap ----
const LSLOT: [number, number][] = [[-1.5, -1.0], [-1.7, 0.0], [-1.5, 1.0], [-2.6, -0.5], [-2.8, 0.5], [-3.0, 1.4]];
const NSLOT: [number, number][] = [[1.2, -0.9], [1.5, 0.1], [1.2, 1.0], [2.2, -0.4], [2.4, 0.6], [2.8, 1.3]];
const court = (cam: CamInfo, t: number, out: Stage) => {
  const [cx, , cz] = PARK;
  put(cam, out, nob(0), cx, D0, cz, { mode: "stand", expr: "smile_closed", blink: lidAt(t, 300) });
  const lean = smooth((t - 38.44) / 1.0);
  for (let i = 0; i < 6; i++) {
    const [dx, dz] = LSLOT[i], ua = smooth((t - (34.7 + 0.12 * i)) / 1.0), walking = ua > 0 && ua < 1;
    const x = cx + (-9 + (dx + 9) * ua) * (1 - 0.18 * lean) + (ua >= 1 ? 0.03 * Math.sin(t * 5 + i) : 0), z = cz + dz;
    const expr: Expr = ua >= 1 ? (on(t, 41.98) ? "relief_open" : "relief") : "smile";
    put(cam, out, lad(i), x, D0, z, { mode: walking ? "stroll" : "stand", phase: q((t * 1.2 + i * 0.13) % 1, 60), expr, blink: lidAt(t, 410 + i) });
  }
  for (let i = 0; i < 6; i++) {
    const [dx, dz] = NSLOT[i], ub = smooth((t - (36.36 - LEAD + 0.1 * i)) / 1.0), walking = ub > 0 && ub < 1;
    const jost = ub >= 1 ? 0.07 * Math.sin(t * 13 + i * 2) : 0;
    const x = cx + (9 + (dx - 9) * ub) * (1 - 0.2 * lean) + jost, z = cz + dz;
    const soap = on(t, 41.98), k = smooth((t - (41.98 - LEAD)) / 0.5);
    const prop: Prop = soap ? ["soap", k] : null;
    const expr: Expr = soap ? "grin" : ub >= 1 ? (i % 2 ? "stern" : "grin") : "smile";
    put(cam, out, nob(i + 1), x, D0, z, { mode: walking ? "stroll" : "stand", phase: q((t * 1.2 + i * 0.11) % 1, 60), expr, prop, blink: lidAt(t, 310 + i) });
  }
  // the court throws the perfume away: it lies around the dance floor
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.4, tt = 42.3 + 0.08 * i;
    const [sx, sz] = i < 6 ? [cx + NSLOT[i][0], cz + NSLOT[i][1]] : [cx + LSLOT[i - 6][0], cz + LSLOT[i - 6][1]];
    bottleFly(out, [sx, D0 + 1.5, sz], cx + 4.6 * Math.cos(a), cz + 4.6 * Math.sin(a), tt, t, i);
  }
};

// ---- shot 7: close on the confident noble ----
const closeUp = (cam: CamInfo, t: number, out: Stage) => {
  const [cx, , cz] = PARK;
  const expr: Expr = on(t, 47.45) ? "grin" : on(t, 45.38) ? "laugh" : "smile_closed";
  const prop: Prop = on(t, 47.45) ? ["soap", smooth((t - (47.45 - LEAD)) / 0.9)] : null;
  put(cam, out, nob(0), cx, D0, cz, { mode: "stand", expr, prop, headTilt: on(t, 45.38) && !on(t, 47.45) ? Math.sin(t * 9) * 3 : 0, blink: lidAt(t, 300) });
  // soft, out-of-focus court behind
  dancers(cam, t, out, 3, false);
  brisa(out, cx, D0 + 1.1, cz, t, 46.4, 48.2, 1.9);
  // "perfume só esconde o cheiro": bottle + smell beside him; "sabonete tira a causa": a fresh burst clears it
  if (t >= 48.34 && t < 50.9) {
    out.fx.push({ key: "bottle", cw: 120, ch: 200, draw: fxBottle, x: cx - 1.1, y: D0 + 0.25, z: cz + 0.2, w: 0.4, h: 0.66, rot: 0.25 });
    stinkAround(out, cam, cx - 1.1, D0 + 0.5, cz + 0.2, t, 0.9);
  }
  if (t >= 50.9 && t < 50.9 + 6 / FPS) {
    const u = q((t - 50.9) / (6 / FPS), 30), a = around(cam, cx, cz);
    out.fx.push({ key: `burstg${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#d4f5c4", 12, 40, 230), x: cx + a.rx * 0.3, y: D0 + 1.65, z: cz + a.rz * 0.3, w: 1.1, h: 1.1 });
  }
};

// ---- shot 8: the soap on the wet stone, the court far behind ----
const SOAP_FACE: V3 = [SOAP_AT[0] - 0.17, SOAP_AT[1], SOAP_AT[2] + 0.07]; // just in front of the bar's face (see soap.ts)
const finale = (cam: CamInfo, t: number, out: Stage) => {
  put(cam, out, nob(0), -9.6, D0, -34.0, { mode: "stand", expr: "smile_closed", blink: lidAt(t, 300) });
  put(cam, out, lad(1), -6.4, D0, -34.8, { mode: "stand", expr: "smile", blink: lidAt(t, 411) });
  put(cam, out, nob(2), -12.2, D0, -35.2, { mode: "stand", expr: "grin", blink: lidAt(t, 312) });
  const [sx, sy, sz] = SOAP_FACE;
  [[-0.07, 0.19, 0.9], [0.05, 0.14, 1.1], [-0.03, 0.08, 0.8], [0.08, 0.05, 1.0], [-0.09, 0.03, 0.7], [0.0, 0.11, 0.8]].forEach(([dx, dy, s], i) => {
    const drip = ((t * 0.18 + i * 0.37) % 1) * 0.06;
    out.fx.push({ key: "drop", cw: 60, ch: 80, draw: fxDrop, x: sx + dx, y: sy + dy - drip, z: sz, w: 0.034 * s, h: 0.045 * s });
  });
  for (const [tw, ox, oy] of [[55.46, 0.1, 0.2], [58.68, -0.11, 0.18]]) if (t >= tw && t < tw + 6 / FPS) {
    const u = q((t - tw) / (6 / FPS), 30);
    out.fx.push({ key: `burstw${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#ffffff", 8, 40, 230), x: sx + ox, y: sy + oy, z: sz + 0.02, w: 0.2, h: 0.2 });
  }
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, _b: BridgeState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.crowd) {
    case "street": street(cam, t, out); break;
    case "quay": quay(cam, t, out); break;
    case "alley": alley(cam, t, out); break;
    case "ball": dancers(cam, t, out, 0, true); break;
    case "river": river(cam, t, out); break;
    case "ball2": court(cam, t, out); break;
    case "close": closeUp(cam, t, out); break;
    case "final": finale(cam, t, out); break;
  }
  return out;
};
export { FPS };
