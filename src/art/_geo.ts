// Geometric charges and crosses, constructed procedurally.
// Each export follows the Art contract (see types.ts); src/art/<id>.ts re-exports.

import type { Art } from "./types.ts";
import { INK, line, path } from "./style.ts";

const f = (n: number) => +n.toFixed(2);

export const mullet: Art = {
  w: 105,
  h: 100,
  draw: (c) => {
    // five points: top at y 0, lower points at y 100
    const R = 52.5 / Math.sin((72 * Math.PI) / 180); // so the side points reach x 0 and 105
    const cy = R;
    const scaleY = 100 / (R + R * Math.cos(Math.PI / 5));
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? R : R * 0.4;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push(`${f(52.5 + r * Math.cos(a))},${f((cy + r * Math.sin(a)) * scaleY)}`);
    }
    const centre = `${52.5},${f(cy * scaleY)}`;
    const ridges = [0, 2, 4, 6, 8].map((i) => line(`M${centre} L${pts[i]}`)).join("");
    return path("M" + pts.join(" L") + " Z", c.body) + ridges;
  },
};

export const mullet6: Art = {
  w: 87,
  h: 100,
  draw: (c) => {
    const pts: string[] = [];
    for (let i = 0; i < 12; i++) {
      const r = i % 2 === 0 ? 1 : 0.5;
      const a = -Math.PI / 2 + (i * Math.PI) / 6;
      pts.push(`${f(43.5 + 43.5 * r * Math.cos(a) / Math.cos(Math.PI / 6))},${f(50 + 50 * r * Math.sin(a))}`);
    }
    const ridges = [0, 2, 4, 6, 8, 10].map((i) => line(`M43.5,50 L${pts[i]}`)).join("");
    return path("M" + pts.join(" L") + " Z", c.body) + ridges;
  },
};

export const crescent: Art = {
  w: 135,
  h: 100,
  draw: (c) => path("M0,2 C0,58 30,100 67.5,100 C105,100 135,58 135,2 C122,44 98,66 67.5,66 C37,66 13,44 0,2 Z", c.body),
};

export const roundel: Art = {
  w: 100,
  h: 100,
  draw: (c) => `<circle cx="50" cy="50" r="49.4" fill="${c.body}" stroke="${INK}" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`,
};

export const annulet: Art = {
  w: 100,
  h: 100,
  draw: (c) => path("M50,0.6 A49.4,49.4 0 1 1 49.99,0.6 Z M50,22 A28,28 0 1 0 50.01,22 Z", c.body, 'fill-rule="evenodd"'),
};

export const lozenge: Art = {
  w: 50,
  h: 100,
  draw: (c) => path("M25,0 L50,50 L25,100 L0,50 Z", c.body) + line("M25,0 L25,100 M0,50 L50,50"),
};

export const mascle: Art = {
  w: 63,
  h: 100,
  draw: (c) => path("M31.5,0 L63,50 L31.5,100 L0,50 Z M31.5,26 L16.5,50 L31.5,74 L46.5,50 Z", c.body, 'fill-rule="evenodd"'),
};

export const billet: Art = {
  w: 51,
  h: 100,
  draw: (c) => path("M0.6,0.6 H50.4 V99.4 H0.6 Z", c.body),
};

/** a cross built from arm shapes: `arm(len)` returns the path of the top arm in a 100x100 box centred at 50,50 */
function cross(arm: string, half: number): (c: { body: string }) => string {
  const out = `stroke="${INK}" stroke-width="1.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
  return (c) => {
    const rot = [0, 90, 180, 270].map((r) => `<path d="${arm}" transform="rotate(${r} 50 50)" fill="${c.body}" ${out}/>`).join("");
    const hub = half ? `<rect x="${50 - half - 0.6}" y="${50 - half - 0.6}" width="${2 * half + 1.2}" height="${2 * half + 1.2}" fill="${c.body}"/>` : "";
    return rot + hub;
  };
}

export const cross_plain: Art = {
  w: 100,
  h: 100,
  draw: (c) => path("M38,0 H62 V38 H100 V62 H62 V100 H38 V62 H0 V38 H38 Z", c.body),
};

export const cross_patty: Art = {
  w: 100,
  h: 100,
  draw: (c) =>
    path(
      "M30,0 H70 Q56,22 57,43 Q78,44 100,30 V70 Q78,56 57,57 Q56,78 70,100 H30 Q44,78 43,57 Q22,56 0,70 V30 Q22,44 43,43 Q44,22 30,0 Z",
      c.body,
    ),
};

export const cross_potent: Art = {
  w: 100,
  h: 100,
  draw: (c) =>
    path(
      "M24,0 H76 V18 H60 V40 H82 V24 H100 V76 H82 V60 H60 V82 H76 V100 H24 V82 H40 V60 H18 V76 H0 V24 H18 V40 H40 V18 H24 Z",
      c.body,
    ),
};

export const cross_crosslet: Art = {
  w: 100,
  h: 100,
  draw: (c) =>
    path(
      "M42,0 H58 V12 H70 V26 H58 V42 H74 V30 H88 V42 H100 V58 H88 V70 H74 V58 H58 V74 H70 V88 H58 V100 H42 V88 H30 V74 H42 V58 H26 V70 H12 V58 H0 V42 H12 V30 H26 V42 H42 V26 H30 V12 H42 Z",
      c.body,
    ),
};

export const cross_moline: Art = {
  w: 100,
  h: 100,
  draw: cross("M42,50 L42,20 C42,12 36,8 28,6 C34,2 42,0 50,8 C58,0 66,2 72,6 C64,8 58,12 58,20 L58,50 Z", 8),
};

export const cross_fleury: Art = {
  w: 100,
  h: 100,
  draw: cross(
    "M43,50 L43,22 C34,24 28,18 32,10 C36,14 40,14 43,12 C42,6 46,2 50,0 C54,2 58,6 57,12 C60,14 64,14 68,10 C72,18 66,24 57,22 L57,50 Z",
    7,
  ),
};

export const cross_maltese: Art = {
  w: 100,
  h: 100,
  draw: cross("M50,50 L30,0 L50,12 L70,0 Z", 0),
};

export const cross_patriarchal: Art = {
  w: 74,
  h: 100,
  draw: (c) =>
    path("M30,0 H44 V14 H62 V28 H44 V42 H74 V56 H44 V100 H30 V56 H0 V42 H30 V28 H12 V14 H30 Z", c.body),
};

export const jerusalem: Art = {
  w: 100,
  h: 100,
  draw: (c) => {
    const small = (x: number, y: number) =>
      path(`M${x - 3},${y - 10} H${x + 3} V${y - 3} H${x + 10} V${y + 3} H${x + 3} V${y + 10} H${x - 3} V${y + 3} H${x - 10} V${y - 3} H${x - 3} Z`, c.body);
    return (
      path(
        "M30,8 H70 V18 H56 V44 H82 V30 H92 V70 H82 V56 H56 V82 H70 V92 H30 V82 H44 V56 H18 V70 H8 V30 H18 V44 H44 V18 H30 Z",
        c.body,
      ) +
      small(14, 14) + small(86, 14) + small(14, 86) + small(86, 86)
    );
  },
};

export const chi_rho: Art = {
  w: 83,
  h: 100,
  draw: (c) => {
    const stroke = (d: string) =>
      `<path d="${d}" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${c.body}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
    return stroke("M41.5,6 V94") + stroke("M41.5,7 H52 A12,12 0 0 1 52,31 H41.5") + stroke("M7,36 L76,86 M76,36 L7,86");
  },
};

