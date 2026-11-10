// Sun in splendour: a disc with a face, eight straight and eight wavy rays alternating.
import type { Art, ArtColors } from "./types.ts";
import { path, line, INK, OUT } from "./style.ts";

const W = 88;
const CX = 44, CY = 50;
const RX = 43.5, RY = 49.5; // ray tips lie on this ellipse (the box is a little taller than wide)
const DISC = 21;
const BASE = 18.5; // rays start under the disc

const f = (n: number) => n.toFixed(2);
// a = angle clockwise from straight up
const polar = (r: number, a: number): [number, number] => [CX + r * Math.sin(a), CY - r * Math.cos(a)];
const tipR = (a: number) => 1 / Math.hypot(Math.sin(a) / RX, Math.cos(a) / RY);

// smooth path through points (Catmull-Rom as cubic Béziers)
const smooth = (p: [number, number][]) => {
  let d = "";
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
};

const straightRay = (a: number) => {
  const d = 0.2;
  const [x0, y0] = polar(BASE, a - d), [x1, y1] = polar(tipR(a), a), [x2, y2] = polar(BASE, a + d);
  return `M${f(x0)},${f(y0)} L${f(x1)},${f(y1)} L${f(x2)},${f(y2)} Z`;
};

const wavyRay = (a: number) => {
  const L = tipR(a) - 0.5;
  const ux = Math.sin(a), uy = -Math.cos(a); // along the ray
  const vx = -uy, vy = ux; // across it
  const n = 9, hw = 4, amp = 3.2;
  const side = (sgn: number) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const s = i / n;
      const r = BASE + s * (L - BASE);
      const off = amp * Math.sin(2 * Math.PI * s) * Math.min(1, s * 3);
      const w = sgn * hw * (1 - s) ** 0.9;
      return [CX + ux * r + vx * (off + w), CY + uy * r + vy * (off + w)] as [number, number];
    });
  const left = side(1), right = side(-1).reverse();
  return `M${f(left[0][0])},${f(left[0][1])}${smooth(left)} L${f(right[0][0])},${f(right[0][1])}${smooth(right)} Z`;
};

const face = () =>
  // brows, eyes, nose, mouth
  line("M31.5,42.5 Q36,38.5 41,41.5 M47,41.5 Q52,38.5 56.5,42.5") +
  line("M32.5,46.5 Q36.5,43.5 40.5,46.5 Q36.5,49 32.5,46.5 M47.5,46.5 Q51.5,43.5 55.5,46.5 Q51.5,49 47.5,46.5") +
  `<circle cx="36.5" cy="46.3" r="1.25" fill="${INK}"/><circle cx="51.5" cy="46.3" r="1.25" fill="${INK}"/>` +
  line("M44,43.5 L42.5,54 Q44,56.5 46.5,55") +
  line("M38,61 Q44,64.5 50,61");

const art: Art = {
  w: W,
  h: 100,
  draw: (c: ArtColors) => {
    let rays = "";
    for (let k = 0; k < 8; k++) {
      rays += path(wavyRay(((k + 0.5) * Math.PI) / 4), c.body);
    }
    for (let k = 0; k < 8; k++) {
      rays += path(straightRay((k * Math.PI) / 4), c.body);
    }
    return rays + `<circle cx="${CX}" cy="${CY}" r="${DISC}" fill="${c.body}" ${OUT}/>` + face();
  },
};
export default art;
