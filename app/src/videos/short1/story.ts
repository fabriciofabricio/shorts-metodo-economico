// Timeline of the soap short "Os nobres que tinham medo de banho": shots timed to the narration words
// (short1/voice/words.json, 59.27 s, 1794 f), and the camera grammar measured in the reference study: continuous
// slow push-ins; symmetric smootherstep glides of 18-40 f; big reframes are hard cuts; impacts are 7-frame kicks that
// flip sign every frame; no hand-held float. The bridge is kept in the world as a still backdrop (no bounce, no fall).
export const FPS = 30;
export const TOTAL = 1794; // ceil(59.27 s x 30) + 15
export const D0 = 6.0; // bank top + deck height (m)
export const HALF = 27; // towers at z = +-27, span 54 m
export const PARK: V3 = [70, D0, -75]; // centre of the ballroom (the old park lawn): x, ground y, z
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- bridge (still backdrop; world.ts still poses it from this state) ----------------
export const SNAP = 1e9; // never
export const shapeZ = (z: number) => (Math.abs(z) < HALF ? Math.cos((Math.PI * z) / (2 * HALF)) : 0);
export const dropW = (z: number) => smooth((20 - z) / 26);
export const DROP_H = 6.6;
export type BridgeState = { bounce: number; drop: number; snap: number; collapsed: boolean };
export const deckY = (z: number, b: BridgeState) => D0 + b.bounce * shapeZ(z) - b.drop * DROP_H * dropW(z);
export const bridgeState = (_id: number, _t: number): BridgeState => ({ bounce: 0, drop: 0, snap: 0, collapsed: false });
// near-left anchorage where the bolt lives, and the free end of the backstay (never snaps here)
export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const snapEnd = (snap: number): V3 => {
  const u = easeOut(snap);
  return [ANCHOR[0] - 0.6 * u, ANCHOR[1] + 5.5 * u - 2.0 * u * u, ANCHOR[2] + 4.5 * u];
};

// ---------------- shots ----------------
// 1 rua (gancho) | 2 cais: cidade e médico | 3 rua: pano, camisa, perfume, cheiro | 4 baile de longe |
// 5 beira do rio: o nobre entra na água | 6 baile: damas e nobres | 7 close do nobre e da barra | 8 pedra molhada: sabonete
export type Light = "day" | "golden" | "night";
export type Crowd = "street" | "quay" | "alley" | "ball" | "river" | "ball2" | "close" | "final";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 130, light: "day", crowd: "street", tau: (t) => t },
  { id: 2, a: 130, b: 330, light: "day", crowd: "quay", tau: (t) => t },
  { id: 3, a: 330, b: 679, light: "day", crowd: "alley", tau: (t) => t },
  { id: 4, a: 679, b: 780, light: "night", crowd: "ball", tau: (t) => t },
  { id: 5, a: 780, b: 1025, light: "golden", crowd: "river", tau: (t) => t },
  { id: 6, a: 1025, b: 1317, light: "night", crowd: "ball2", tau: (t) => t },
  { id: 7, a: 1317, b: 1563, light: "night", crowd: "close", tau: (t) => t },
  { id: 8, a: 1563, b: TOTAL, light: "day", crowd: "final", tau: (t) => t },
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 3: 6, 4: 8, 5: 6, 6: 6, 8: 8 };
export const FLASH_AT = 130;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** layers to draw at frame f: base shot, plus the next shot fading in during a crossfade */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
// Every move is a symmetric smootherstep glide of 18-40 f; a reframe bigger than about half a frame width or 40 % zoom is a
// hard cut on its key frame. Glides are centred on the old key frame. Holds push in (dolly toward the look point or a fov
// zoom near walls): 0.15-0.35 %/f, ~0.6 %/f for ~35 f on the punch words. Rolls of 4-8 deg over >= 18 f on emphasis beats.
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
/** push-in factor since f0: the subject grows ~rate per frame; `punch` raises it (with 8 f soft edges) for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** dolly push: camera slides toward the look point by factor k */
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** zoom push (camera stays put, for lenses next to walls / houses): tan(fov/2) shrinks by k */
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

// ---- places (world coordinates; z grows toward the far bank) ----
export const HERO_ST: V3 = [0, D0, -57]; // street, shots 1 (nobles) and 3 (hero at z -56)
export const HERO_ST3: V3 = [0, D0, -56];
export const DOC_AT: V3 = [1.6, D0, -33.5]; // doctor on the quay at the bridge mouth
export const QUAY_HERO: V3 = [-8.9, D0, -31.5]; // the noble hesitating at the quay edge
export const WADE: V3 = [-8.6, -0.8, -20.4]; // where he stands in the river (feet y under the water line)
export const SOAP_AT: V3 = [-8.0, D0 + 0.75, -30.25]; // soap bar + box on the stone coping (shot 8)

// ---- framings (f -> camera) ----
// shot 1: three nobles in the street, camera inland looking toward the river and the bridge towers
const S1a = (f: number) => dolly([1.8, D0 + 1.55, -66.0], [0, D0 + 1.5, -57.5], pushK(f, 0, 0.0025), { fov: 42 });
const S1b = (f: number) => dolly([0.9, D0 + 1.6, -61.2], [0, D0 + 1.75, -57], pushK(f, 76, 0.002), { fov: 38, roll: -0.03 });
const S1c = (f: number) => dolly([0.35, D0 + 1.75, -59.6], [0, D0 + 1.82, -57], pushK(f, 106, 0.003), { fov: 36, roll: 0.04 });
// shot 2: town aerial, doctor at the quay, villagers recoil
const S2a = (f: number) => zoom([17, 13, -52], [0, 9, 4], 44, pushK(f, 130, 0.002));
// the doctor sits on the centre line of the frame; the camera stands 6 m from him along (+0.65, +0.76) and pushes in a little
const S2b = (f: number) => dolly([DOC_AT[0] - 4.0, D0 + 1.5, DOC_AT[2] - 4.7], [DOC_AT[0], D0 + 1.45, DOC_AT[2]], pushK(f, 176, 0.002), { fov: 38 });
const S2c = (f: number) => dolly([-0.3, D0 + 1.45, -38.6], [-2.6, D0 + 1.4, -34.0], pushK(f, 275, 0.0025, 0.006, 30), { fov: 34, roll: 0.035 });
// shot 3: the street again: dry cloth, shirt, perfume bath, bad smell
const S3a = (f: number) => dolly([1.3, D0 + 1.4, -60.8], [0, D0 + 1.35, -56.2], pushK(f, 330, 0.0025), { fov: 40 });
const S3b = (f: number) => dolly([-1.2, D0 + 1.35, -59.2], [0.7, D0 + 1.4, -55.4], pushK(f, 401, 0.002), { fov: 38 });
const S3c = (f: number) => dolly([1.1, D0 + 1.55, -59.8], [0.1, D0 + 1.6, -56], pushK(f, 437, 0.0025, 0.005, 30), { fov: 38 });
const S3d = (f: number) => dolly([0.45, D0 + 1.78, -58.4], [0, D0 + 1.82, -56], pushK(f, 487, 0.0015), { fov: 34, roll: -0.03 });
const S3e = (f: number) => dolly([3.2, D0 + 1.7, -61.8], [0, D0 + 1.4, -55.6], pushK(f, 600, 0.002), { fov: 44 });
const S3f = (f: number) => dolly([2.0, D0 + 1.5, -60.2], [-0.2, D0 + 1.5, -55.4], pushK(f, 637, 0.0025, 0.006, 32), { fov: 38, roll: 0.035 });
// shot 4: the ball, lovely from far away -> push in: everyone is pinching their nose
const S4a = (f: number) => dolly([66.8, D0 + 2.3, -64.0], [70, D0 + 1.2, -75], pushK(f, 679, 0.002), { fov: 44 });
const S4b = (f: number) => dolly([68.4, D0 + 1.55, -69.0], [70, D0 + 1.45, -74], pushK(f, 755, 0.002), { fov: 40, roll: -0.035 });
// shot 5: quay edge (the noble hesitates) -> wading in the river -> close on him with the green breeze
const S5a = (f: number) => dolly([-8.2, D0 + 1.45, -37.0], [-8.9, D0 + 1.5, -31.5], pushK(f, 780, 0.0025), { fov: 36 });
const S5b = (f: number) => dolly([-6.2, 0.55, -26.0], [-8.6, 0.95, -20.4], pushK(f, 838, 0.002), { fov: 38 });
const S5c = (f: number) => dolly([-7.3, 1.15, -23.8], [-8.6, 1.35, -20.4], pushK(f, 935, 0.0018), { fov: 34, roll: 0.03 });
// shot 6: ladies arrive (low front) -> nobles jostle (from the right) -> the whole court (crane)
const S6a = (f: number) => dolly([66.2, D0 + 1.35, -69.4], [70, D0 + 1.5, -75], pushK(f, 1025, 0.0022), { fov: 40 });
const S6b = (f: number) => dolly([74.0, D0 + 1.45, -69.6], [70.2, D0 + 1.45, -74.6], pushK(f, 1089, 0.0025, 0.005, 30), { fov: 38, roll: -0.03 });
const S6c = (f: number) => dolly([62.5, D0 + 7.0, -62.0], [70, D0 + 1.0, -76], pushK(f, 1195, 0.0018), { fov: 44 });
// shot 7: close on the confident noble -> glide to the green bar in his hand
const S7a = (f: number) => dolly([70.9, D0 + 1.7, -71.6], [70, D0 + 1.75, -75], pushK(f, 1317, 0.002), { fov: 36 });
const S7b = (f: number) => dolly([70.55, D0 + 1.5, -72.8], [70.1, D0 + 1.55, -75], pushK(f, 1430, 0.0018), { fov: 34, roll: 0.03 });
// shot 8: the soap on the wet stone, slow push; the noble far behind, out of focus
const S8a = (f: number) => dolly([-8.0, D0 + 1.1, -28.0], [-8.0, D0 + 1.0, -30.25], pushK(f, 1563, 0.0018), { fov: 34 });

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: S1a },
    { f: 76, cut: true, s: S1b }, // cut on "tomar banho"
    { f: 106, cut: true, s: S1c }, // cut on "De propósito"
  ],
  2: [
    { f: 130, s: S2a },
    { f: 176, cut: true, s: S2b }, // "os médicos juravam"
    { f: 275, cut: true, s: S2c }, // "a peste entra por eles"
  ],
  3: [
    { f: 330, s: S3a },
    { f: 401, cut: true, s: S3b }, // "trocavam de camisa"
    { f: 437, cut: true, s: S3c }, // "banho de perfume"
    { f: 487, cut: true, s: S3d }, // "a boa notícia"
    { f: 600, cut: true, s: S3e }, // "a má notícia"
    { f: 637, cut: true, s: S3f }, // "só disfarçava"
  ],
  4: [
    { f: 679, s: S4a },
    { f: 742, dur: 26, s: S4b }, // centred on 755 ("De longe")
  ],
  5: [
    { f: 780, s: S5a },
    { f: 838, cut: true, s: S5b }, // "entrou na água"
    { f: 935, cut: true, s: S5c }, // "saiu cheirando"
  ],
  6: [
    { f: 1025, s: S6a },
    { f: 1089, cut: true, s: S6b }, // "os nobres, mais perto ainda"
    { f: 1195, cut: true, s: S6c }, // "em uma semana"
  ],
  7: [
    { f: 1317, s: S7a },
    { f: 1415, dur: 30, s: S7b }, // centred on 1430 ("Sabe por quê?")
  ],
  8: [{ f: 1563, s: S8a }],
};

// impact kicks: the image offset flips sign every frame (~3 px at 720p per unit), decays to 0 in 7 f. Starts on the first
// frame at/after the event.
const KICKS: [number, number][] = [[14.55, 0.5], [20.84, 0.6], [28.02, 0.7], [41.98, 0.8], [50.9, 0.7]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a; // metres at the look distance for 3 px x a
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
/** frame at which the current key's move has finished (for picking billboard views per key, not per frame) */
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens: depth of field + foreground framing ----------------
/** Lens blur per shot (thin lens). cInf = blur-disc radius in px at 1080x1920 for things at infinity; 0 = all sharp.
 *  Entries switch on cuts (no dur) or ramp with the camera glide they share f/dur with. focus = world point (else the
 *  camera look point). */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const HERO1 = (): V3 => [0, D0 + 1.6, -57];
const HERO3 = (): V3 => [0, D0 + 1.6, -56];
export const DOF: Dof[] = [
  { f: 0, cInf: 15, focus: HERO1 }, // hook: the nobles sharp, the street and the towers soft
  { f: 130, cInf: 0 }, // town aerial (establishing, under the flash)
  { f: 176, cInf: 9, focus: () => [DOC_AT[0], D0 + 1.5, DOC_AT[2]] }, // doctor MS
  { f: 275, cInf: 12 }, // villagers recoil: focus = look
  { f: 330, cInf: 10, focus: HERO3 }, // the street again
  { f: 487, cInf: 13, focus: HERO3 }, // close on the face in the mist
  { f: 600, cInf: 8, focus: HERO3 }, // bad smell
  { f: 679, cInf: 0 }, // ball from afar: sharp, lovely
  { f: 742, dur: 26, cInf: 6 }, // pushing in on the pinched noses
  { f: 780, cInf: 9, focus: () => [QUAY_HERO[0], D0 + 1.5, QUAY_HERO[2]] }, // quay edge
  { f: 838, cInf: 12, focus: () => [WADE[0], 0.9, WADE[2]] }, // river level
  { f: 1025, cInf: 8 }, // ladies arrive
  { f: 1195, cInf: 0 }, // whole court, wide
  { f: 1317, cInf: 12, focus: () => [PARK[0], D0 + 1.7, PARK[2]] }, // close on the noble
  { f: 1415, dur: 30, cInf: 14 }, // glide to the bar: focus = look
  { f: 1563, cInf: 14, focus: () => [SOAP_AT[0], SOAP_AT[1] + 0.12, SOAP_AT[2]] }, // soap sharp, noble far behind soft
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
/** what the lens focuses on (DOF): the DOF table's focus point, else the camera look point */
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

/** near framing objects: visible while a <= f < b; kit = a GLB name accepted by build.ts prop() */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
