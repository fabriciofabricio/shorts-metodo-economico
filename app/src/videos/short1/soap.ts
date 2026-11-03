// The soap "Sabonete Frescor da Mata" (O Aristocrata) for the last shot, as ONE swappable component.
//  - If the user saved the real model as app/public/short1/sabonete.glb, world.ts' loadKit() puts it in the kit as
//    "sabonete" and it is used here (scaled to ~0.3 m, base on y = 0, centred on x = z = 0).
//  - Otherwise: a PLACEHOLDER with no art and no text: a smooth sage-green bar standing on its edge (9 x 9 x 3.5 cm
//    shown at 2.4x so it reads in a close-up at ~2 m) and a plain kraft box with a dark-brown band, side by side.
// The group's origin is the base point on the stone coping; cast.ts' SOAP_FACE (drops, twinkles) expects the bar's face
// at x = -0.17, z = +0.042 from that origin. When the real model arrives: check that the logo faces +z (toward the
// camera of shot 8), and give any text/logo an unlit material (a plate under a side sun goes grey and unreadable).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { lam, Kit } from "./build";
import { ctex } from "./paint";

/** the box front: public/short1/embalagem_frente.png (the user's packaging photo, perspective-corrected), set by world.ts loadKit */
let packFront: THREE.Texture | null = null;
export const setPackFront = (t: THREE.Texture) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; packFront = t; };
/** same look as the bar the hero holds (toon.ts "soap" prop): sage green, darker herb flecks, one pale highlight stroke */
const barTex = () => ctex("soapBarTex", 512, 512, (g, r) => {
  g.fillStyle = "#8fae86"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 22; i++) {
    g.fillStyle = "#6f8c68"; g.beginPath(); g.arc(30 + r() * 452, 30 + r() * 452, 7 + r() * 5, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = "#c7dcc0"; g.lineWidth = 22; g.lineCap = "round";
  g.beginPath(); g.moveTo(110, 70); g.lineTo(200, 58); g.stroke();
});

export const buildSoap = (kit: Kit): THREE.Object3D => {
  const g = new THREE.Group();
  const real = kit["sabonete"];
  if (real) {
    const m = real.clone(true);
    const box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3());
    const k = 0.3 / Math.max(size.x, size.y, size.z, 1e-6);
    m.scale.multiplyScalar(k);
    const b2 = new THREE.Box3().setFromObject(m), c = b2.getCenter(new THREE.Vector3());
    m.position.set(-c.x, -b2.min.y, -c.z);
    m.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    g.add(m);
    return g;
  }
  const barM = lam("soapBar", () => ({ map: barTex() })), boxM = lam("soapBox", () => ({ color: "#d99a5e" }));
  const bar = new THREE.Mesh(new RoundedBoxGeometry(0.216, 0.216, 0.084, 3, 0.014), barM);
  bar.position.set(-0.17, 0.108, 0);
  // box with the front face of the photo (aspect 0.94 like the real pack); the front is unlit so the art stays readable
  const BW = 0.25, BH = 0.266, BD = 0.1;
  const box = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, BD, 2, 0.004), boxM);
  box.position.set(0.19, BH / 2, 0);
  const objs: THREE.Mesh[] = [bar, box];
  if (packFront) {
    const front = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.004, BH - 0.004), new THREE.MeshBasicMaterial({ map: packFront, color: new THREE.Color(0.92, 0.92, 0.92) }));
    front.position.set(0.19, BH / 2, BD / 2 + 0.0015);
    objs.push(front);
  }
  for (const o of objs) { o.castShadow = true; o.receiveShadow = true; g.add(o); }
  return g;
};
