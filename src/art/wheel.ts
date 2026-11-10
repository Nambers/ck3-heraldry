// Cartwheel: iron-shod rim of felloes, nave (hub) and eight turned spokes.
import type { Art } from "./types.ts";
import { path, line, OUT } from "./style.ts";

const C = 50;
const f = (n: number) => n.toFixed(2);
const pt = (r: number, a: number) => `${f(C + r * Math.sin(a))},${f(C - r * Math.cos(a))}`;

const ring = (R: number, r: number) =>
  `M${C - R},${C} A${R},${R} 0 1 1 ${C + R},${C} A${R},${R} 0 1 1 ${C - R},${C} Z ` +
  `M${C - r},${C} A${r},${r} 0 1 0 ${C + r},${C} A${r},${r} 0 1 0 ${C - r},${C} Z`;

const art: Art = {
  w: 100,
  h: 100,
  draw: (c) => {
    let spokes = "";
    let joints = "";
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      // a spoke, a little swollen in the middle, tapering to the rim
      const w0 = 0.2, w1 = 0.1, w2 = 0.07; // half-angles at r = 9, 24, 41
      const d =
        `M${pt(9, a - w0)} Q${pt(24, a - w1 * 1.6)} ${pt(41, a - w2)} ` +
        `L${pt(41, a + w2)} Q${pt(24, a + w1 * 1.6)} ${pt(9, a + w0)} Z`;
      spokes += path(d, c.body);
      // joints between felloes, halfway between spokes
      const b = a + Math.PI / 8;
      joints += `M${pt(39.5, b)} L${pt(45.5, b)} `;
    }
    return (
      spokes +
      path(ring(49.5, 39.5), c.body, 'fill-rule="evenodd"') +
      line(`M4.5,${C} A45.5,45.5 0 1 1 95.5,${C} A45.5,45.5 0 1 1 4.5,${C}`) +
      line(joints) +
      `<circle cx="${C}" cy="${C}" r="11" fill="${c.body}" ${OUT}/>` +
      `<circle cx="${C}" cy="${C}" r="6" fill="none" ${OUT}/>` +
      `<circle cx="${C}" cy="${C}" r="2.4" fill="${c.under}" ${OUT}/>`
    );
  },
};
export default art;
