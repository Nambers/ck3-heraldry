// Shared drawing kit for the lions, griffin and dragon: tapered tubes for
// tails and limbs, paws with claws, merged outlines, and the rampant lion
// itself (built once, then crowned / fork-tailed / given an axe or a sword).

import type { ArtColors } from "./types.ts";
import { INK, LINE, OUT } from "./style.ts";

export type Pt = [number, number];
const f = (n: number) => (Math.round(n * 100) / 100).toString();
const pt = (p: Pt) => `${f(p[0])},${f(p[1])}`;

/** outline that, drawn under an unstroked copy, leaves a 1.2 px edge only on the outside of the union */
const STROKE2 = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"`;

/** several filled shapes merged into one silhouette with a single outer outline */
export const unite = (fill: string, ds: string[], extra = "") =>
  `<g fill="${fill}"${extra ? " " + extra : ""}>${ds.map((d) => `<path d="${d}" ${STROKE2}/>`).join("")}${ds
    .map((d) => `<path d="${d}"/>`)
    .join("")}</g>`;

/** a filled, outlined shape */
export const shape = (d: string, fill: string) => `<path d="${d}" fill="${fill}" ${OUT}/>`;
/** an outline-weight stroke without fill (for overlaps that should read as an edge) */
export const edge = (d: string) => `<path d="${d}" fill="none" ${OUT}/>`;
/** an inner detail line */
export const ln = (d: string) => `<path d="${d}" ${LINE}/>`;
/** a solid ink dot (eye) */
export const dot = (x: number, y: number, r: number) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${INK}"/>`;

// ---------------------------------------------------------------- transforms

export interface Place {
  x?: number;
  y?: number;
  /** degrees, clockwise on screen */
  rot?: number;
  s?: number;
  /** mirror horizontally (before rotation) */
  flip?: boolean;
}

export const placePt = (p: Pt, o: Place): Pt => {
  const s = o.s ?? 1;
  const a = ((o.rot ?? 0) * Math.PI) / 180;
  const x = (o.flip ? -p[0] : p[0]) * s;
  const y = p[1] * s;
  return [(o.x ?? 0) + x * Math.cos(a) - y * Math.sin(a), (o.y ?? 0) + x * Math.sin(a) + y * Math.cos(a)];
};

/** transform a path made only of absolute M/L/C/Q/Z commands */
export const xf = (d: string, o: Place): string => {
  const toks = d.match(/[MLCQZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let out = "";
  let nums: number[] = [];
  const flush = () => {
    for (let i = 0; i + 1 < nums.length; i += 2) out += pt(placePt([nums[i], nums[i + 1]], o)) + " ";
    nums = [];
  };
  for (const t of toks) {
    if (/[MLCQZ]/.test(t)) {
      flush();
      out += t + " ";
    } else nums.push(Number(t));
  }
  flush();
  return out.trim();
};

// ---------------------------------------------------------------- tubes

const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): [Pt, Pt] => {
  const u = 1 - t;
  const p: Pt = [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
  const d: Pt = [
    3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
    3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]),
  ];
  return [p, d];
};

/**
 * A tapered band along a chain of cubic Béziers [p0, c, c, p1, c, c, p2, …],
 * with a width at every knot. `tip` ends it in a point; otherwise the end is round.
 */
export const tube = (chain: Pt[], widths: number[], opts: { n?: number; tip?: boolean; cap0?: boolean } = {}): string => {
  const n = opts.n ?? 14;
  const L: Pt[] = [];
  const R: Pt[] = [];
  const segs = (chain.length - 1) / 3;
  let endDir: Pt = [1, 0];
  for (let s = 0; s < segs; s++) {
    const [p0, p1, p2, p3] = chain.slice(s * 3, s * 3 + 4) as [Pt, Pt, Pt, Pt];
    for (let i = s === 0 ? 0 : 1; i <= n; i++) {
      const t = i / n;
      const [p, d] = bez(p0, p1, p2, p3, t);
      const len = Math.hypot(d[0], d[1]) || 1;
      const nx = -d[1] / len, ny = d[0] / len;
      let w = (widths[s] + (widths[s + 1] - widths[s]) * t) / 2;
      if (opts.tip && s === segs - 1) w *= Math.min(1, (1 - t) * 1.6 + 0.02);
      L.push([p[0] + nx * w, p[1] + ny * w]);
      R.push([p[0] - nx * w, p[1] - ny * w]);
      endDir = [d[0] / len, d[1] / len];
    }
  }
  const last = chain[chain.length - 1];
  const wEnd = widths[widths.length - 1] / 2;
  let d = `M ${pt(L[0])} ` + L.slice(1).map((p) => `L ${pt(p)}`).join(" ");
  if (!opts.tip && wEnd > 0.2) {
    const c1: Pt = [L[L.length - 1][0] + endDir[0] * wEnd * 1.33, L[L.length - 1][1] + endDir[1] * wEnd * 1.33];
    const c2: Pt = [R[R.length - 1][0] + endDir[0] * wEnd * 1.33, R[R.length - 1][1] + endDir[1] * wEnd * 1.33];
    d += ` C ${pt(c1)} ${pt(c2)} ${pt(R[R.length - 1])}`;
  } else d += ` L ${pt(last)}`;
  d += " " + R.slice(0, -1).reverse().map((p) => `L ${pt(p)}`).join(" ");
  if (opts.cap0) {
    const [, d0] = bez(chain[0], chain[1], chain[2], chain[3], 0);
    const l0 = Math.hypot(d0[0], d0[1]) || 1;
    const k = (widths[0] / 2) * 1.33;
    const b: Pt = [(-d0[0] / l0) * k, (-d0[1] / l0) * k];
    d += ` C ${pt([R[0][0] + b[0], R[0][1] + b[1]])} ${pt([L[0][0] + b[0], L[0][1] + b[1]])} ${pt(L[0])}`;
  }
  return d + " Z";
};

/** a tapered capsule from a to b (round ends), bowed sideways by `bow` (+ = clockwise side) */
export const bone = (a: Pt, b: Pt, wa: number, wb: number, bow = 0): string => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * bow, ny = (dx / len) * bow;
  return tube(
    [a, [a[0] + dx / 3 + nx, a[1] + dy / 3 + ny], [a[0] + (2 * dx) / 3 + nx, a[1] + (2 * dy) / 3 + ny], b],
    [wa, wb],
    { cap0: true, n: 12 },
  );
};

/** bones through successive joints; widths[i] is the width at joint i, bows[i] bends bone i */
export const limb = (joints: Pt[], widths: number[], bows: number[] = []): string[] =>
  joints.slice(1).map((j, i) => bone(joints[i], j, widths[i], widths[i + 1], bows[i] ?? 0));

// ---------------------------------------------------------------- paws

export interface PawOpts {
  /** degrees relative to the paw direction, one per toe */
  toes?: number[];
  /** +1 claws hook clockwise of the toe, -1 anticlockwise */
  curl?: number;
  /** claw length factor */
  claw?: number;
  /** toe length factor */
  reach?: number;
}

/**
 * A paw whose wrist (half-width 3·s) is centred at (x, y), pointing `dir` degrees
 * (0 = right, 90 = down). Returns the pad outline and the claws (draw claws first).
 */
export const paw = (x: number, y: number, dir: number, s = 1, o: PawOpts = {}): { pad: string; claws: string } => {
  const toes = o.toes ?? [-38, 0, 38];
  const curl = o.curl ?? 1;
  const reach = o.reach ?? 1;
  const P: Place = { x, y, rot: dir, s };
  const at = (p: Pt) => pt(placePt(p, P));
  const C: Pt = [2.2, 0];
  const hw = 1.45;
  const r0 = 2.6, r1 = 5.2 * reach, rv = 3.3;
  const pol = (r: number, a: number, off = 0): Pt => {
    const ar = (a * Math.PI) / 180;
    return [C[0] + r * Math.cos(ar) - off * Math.sin(ar), C[1] + r * Math.sin(ar) + off * Math.cos(ar)];
  };
  let d = `M ${at([0, -3])} Q ${at([1.4, -3.4])} ${at(pol(r0 - 0.4, toes[0], -hw * 0.9))}`;
  const claws: string[] = [];
  toes.forEach((a, i) => {
    if (i > 0) d += ` Q ${at(pol(rv - 0.6, (toes[i - 1] + a) / 2))} ${at(pol(r0 - 0.4, a, -hw * 0.9))}`;
    d += ` C ${at(pol(r0 + 0.8, a, -hw * 1.25))} ${at(pol(r1 - 1, a, -hw * 1.2))} ${at(pol(r1, a, -hw))}`;
    d += ` A ${f(hw * s)} ${f(hw * s)} 0 0 1 ${at(pol(r1, a, hw))}`;
    d += ` C ${at(pol(r1 - 1, a, hw * 1.2))} ${at(pol(r0 + 0.8, a, hw * 1.25))} ${at(pol(r0 - 0.4, a, hw * 0.9))}`;
    const k = o.claw ?? 1;
    const T = pol(r1 + 0.2, a);
    const cl: Place = { x: T[0], y: T[1], rot: a };
    const cp = (p: Pt) => at(placePt([p[0] * k, p[1] * (0.6 + 0.4 * k) * curl], cl));
    claws.push(
      `M ${cp([-1, -1.3])} C ${cp([1.4, -1.5])} ${cp([3.4, -0.8])} ${cp([4.4, 2])} C ${cp([3, 0.9])} ${cp([1.6, 1.1])} ${cp([-1, 1.3])} Z`,
    );
  });
  d += ` Q ${at([1.4, 3.4])} ${at([0, 3])} Z`;
  return { pad: d, claws: claws.join(" ") };
};

// ---------------------------------------------------------------- fitting

/** place a drawing whose painted extent is [x0,y0,x1,y1] so that it fills 0..w × 0..h exactly */
export const fit = (inner: string, box: [number, number, number, number], w: number, h: number) => {
  const [x0, y0, x1, y1] = box;
  const sx = w / (x1 - x0), sy = h / (y1 - y0);
  return `<g transform="translate(${f(-x0 * sx)} ${f(-y0 * sy)}) scale(${f(sx)} ${f(sy)})">${inner}</g>`;
};

// ---------------------------------------------------------------- crown

/** an open heraldic crown: circlet with three fleurons; base centred at (x, y), `rot` tilt */
export const crown = (c: ArtColors, x: number, y: number, s = 1, rot = 0) => {
  const P: Place = { x, y, s, rot };
  const d =
    "M -7,0 L -7.5,-4.5 C -8.6,-5.6 -8.6,-7.4 -7.3,-8 C -6.4,-8.4 -5.4,-7.6 -5.5,-6.4 L -3.2,-4.6 " +
    "L -1.4,-7.4 C -2.4,-8.6 -1.6,-10.6 0,-10.8 C 1.6,-10.6 2.4,-8.6 1.4,-7.4 L 3.2,-4.6 " +
    "L 5.5,-6.4 C 5.4,-7.6 6.4,-8.4 7.3,-8 C 8.6,-7.4 8.6,-5.6 7.5,-4.5 L 7,0 C 2.5,1 -2.5,1 -7,0 Z";
  const band = "M -7.2,-2.6 C -2.6,-1.7 2.6,-1.7 7.2,-2.6";
  return shape(xf(d, P), c.crown) + `<path d="${xf(band, P)}" ${LINE}/>`;
};

// ---------------------------------------------------------------- the rampant lion
// Native frame 85 × 100, facing dexter (left).

export interface RampantOpts {
  crowned?: boolean;
  forked?: boolean;
  /** hold a long-hafted axe upright in the forepaws (blade and haft c.second, as in the game texture) */
  grip?: boolean;
  /** push the single tail outward (to widen the drawing) */
  tailOut?: number;
  /** a sword in the raised forepaw: "held" erect and leaning outward, or "brandished" back over the head */
  sword?: { pose: "held" | "brandished"; fill: string };
  /** trample a sabre lying under the hind paws, in this tincture */
  sabre?: string;
}

/** a circle as a path xf can move (four cubic quarters) */
const circleD = (cx: number, cy: number, r: number) => {
  const k = 0.5523 * r;
  return `M ${cx},${cy - r} C ${cx + k},${cy - r} ${cx + r},${cy - k} ${cx + r},${cy} C ${cx + r},${cy + k} ${cx + k},${cy + r} ${cx},${cy + r} ` +
    `C ${cx - k},${cy + r} ${cx - r},${cy + k} ${cx - r},${cy} C ${cx - r},${cy - k} ${cx - k},${cy - r} ${cx},${cy - r} Z`;
};

/** an arming sword, point up in its own frame with the middle of the grip at (0, 0); `len` from guard to point */
export const sword = (fill: string, P: Place, len: number): string => {
  const X = (d: string) => xf(d, P);
  const top = -5.8 - len;
  return [
    shape(X(`M -1.9,-5.8 L 1.9,-5.8 L 1.6,${top + 4} L 0,${top} L -1.6,${top + 4} Z`), fill),
    ln(X(`M 0,-8 L 0,${top + 5}`)),
    shape(X("M -1.3,-3.6 L 1.3,-3.6 L 1.5,4 L -1.5,4 Z"), fill),
    shape(X("M -6.5,-5.8 L 6.5,-5.8 Q 7.7,-4.6 6.5,-3.4 L -6.5,-3.4 Q -7.7,-4.6 -6.5,-5.8 Z"), fill),
    shape(X(circleD(0, 6.2, 2.3)), fill),
  ].join("");
};

/** a curved sabre lying edge down under the hind paws, hilt to dexter */
const sabre = (fill: string): string =>
  [
    shape("M 18.5,90.4 C 33,97.6 55,98.2 75,88.6 C 58,101.6 33,101.8 18,94 Z", fill),
    shape("M 9.5,90.8 L 17.4,90.6 L 17.4,93.8 L 9.5,93.6 Z", fill),
    shape("M 16.6,86.6 L 19.6,86.8 L 19.2,97.6 L 16.2,97.4 Z", fill),
    shape(circleD(8, 92.2, 2), fill),
  ].join("");

/** the tail's tuft, drawn pointing up from (0,0) where a tail of width ~4 ends */
const TUFT =
  "M -2.2,1 C -3.6,-1 -5.6,-2 -6.6,-4.6 C -7.6,-7.2 -7,-9.6 -5,-11.2 C -5.6,-9.2 -4.6,-7.4 -3,-7 " +
  "C -3,-9.6 -1.4,-11.6 0.6,-12.6 C 0,-10.6 0.8,-8.6 2.4,-7.8 C 3.4,-9.4 5,-10.4 7,-10.4 " +
  "C 5.4,-8.6 5.4,-6 4.6,-4 C 3.8,-2 2.6,-0.5 2,1 Z";
const TUFT_LINES = ["M -0.6,-1.6 C -1.6,-3.6 -2.4,-5.4 -3,-7", "M 0.6,-1.6 C 1.2,-3.6 1.8,-5.8 2.4,-7.8"];

export const tuft = (x: number, y: number, rot: number, s = 1) => {
  const P: Place = { x, y, rot, s };
  return { d: xf(TUFT, P), lines: TUFT_LINES.map((l) => ln(xf(l, P))).join("") };
};

/** a small two-lock tuft of hair (elbows, hocks), pointing up from (0,0) */
export const ELBOW = "M -3,0.5 C -3.4,-2.4 -2.6,-4.6 -0.6,-6.4 C -0.8,-4.8 -0.4,-3.6 0.4,-2.8 C 0.8,-4.4 2,-5.4 3.6,-5.8 C 2.6,-4.2 2.6,-2 2.8,0.5 Z";

/** the rampant lion's head in profile (facing dexter) with its mane, in the 85×100 frame, placed by P */
export const lionHead = (c: ArtColors, P: Place = {}, crowned = false): string => {
  const parts: string[] = [];
  const X = (d: string) => xf(d, P);
  // mane: flame-like locks [start, c, c, tip, c, c, end], each end the next start
  const locks: number[][] = [
    [37, 1.4, 40, -0.6, 44.6, -0.8, 47.4, 0.8, 44.8, 1.8, 43.4, 3.4, 43.6, 5.6],
    [47.6, 3.4, 52.2, 4.4, 54.2, 7.6, 50.6, 7.6, 48.4, 9.6, 47.8, 12.6],
    [52, 11.2, 56, 13.4, 57, 17.6, 53.4, 16.6, 50.6, 18.4, 49.6, 21.6],
    [54, 21.2, 57, 24.6, 57.2, 28.4, 54, 26.8, 51.2, 28, 50, 30.6],
    [54.2, 31.6, 56, 35.2, 55.4, 39, 52.8, 36.6, 50.2, 37, 48.4, 39],
    [51.4, 41, 52, 44.8, 50.6, 48, 48.6, 45.2, 46.4, 44.4, 44.2, 44.8],
    [45, 47.6, 44.2, 50.6, 42, 52.4, 41.2, 49.4, 39.6, 47.4, 37.6, 46.6],
    [37.4, 49.2, 35.6, 51.4, 33, 52.2, 33.2, 49.4, 32.6, 47.4, 31, 45.8],
    [28.4, 46.8, 25.6, 46.2, 24, 44.4, 26.4, 43.4, 27.8, 41.6, 28.4, 39.2],
    [26, 39.2, 23.6, 37.8, 22.6, 35.2, 25, 34.6, 26.8, 33.2, 28, 31],
    [26.2, 30.4, 24.6, 28.6, 24.2, 26, 26.6, 26.4, 28.6, 25.6, 30, 24],
  ];
  let maneD = `M 31,6 L ${locks[0][0]},${locks[0][1]}`;
  const maneLines: string[] = [];
  let prev: Pt = [locks[0][0], locks[0][1]];
  for (const L of locks) {
    const q = L.length === 14 ? L.slice(2) : L;
    maneD += ` C ${q[0]},${q[1]} ${q[2]},${q[3]} ${q[4]},${q[5]} C ${q[6]},${q[7]} ${q[8]},${q[9]} ${q[10]},${q[11]}`;
    const T: Pt = [q[4], q[5]], B: Pt = [q[10], q[11]];
    const H: Pt = [36, 24];
    const M: Pt = [(prev[0] + B[0]) / 2, (prev[1] + B[1]) / 2];
    const Q: Pt = [M[0] + (H[0] - M[0]) * 0.18, M[1] + (H[1] - M[1]) * 0.18];
    const E: Pt = [T[0] + (Q[0] - T[0]) * 0.32, T[1] + (Q[1] - T[1]) * 0.32];
    const mid: Pt = [(Q[0] + E[0]) / 2 + (prev[0] - B[0]) * 0.12, (Q[1] + E[1]) / 2 + (prev[1] - B[1]) * 0.12];
    maneLines.push(ln(X(`M ${pt(Q)} Q ${pt(mid)} ${pt(E)}`)));
    prev = B;
  }
  maneD += " L 31,20 Z";
  parts.push(unite(c.body, [X(maneD)]), ...maneLines);

  // ear, tongue, head
  const ear = "M 34,3.4 C 34.4,0 37.6,-0.6 40.4,0.4 C 40,2.6 39,4.2 37.4,5.2 Z";
  const tongue =
    "M 28,17.4 C 24,17 20,17 16.5,17.6 C 14.6,17.9 13,17.4 11.4,16.2 C 12.4,18.4 14,19.8 16.5,19.8 C 20,19.8 24,19 28,18.4 Z";
  const head =
    "M 38,2 C 34,0.6 30,1 27.5,3.2 C 26.6,4 25.6,4.6 24.4,4.8 C 21.5,5.4 18.5,6.2 15.6,7 C 13.8,7.6 13.2,9.4 13.6,11 " +
    "C 14,12.2 15.2,12.8 16.6,12.6 C 17.4,13.6 17.2,14.6 16.6,15.2 C 18.6,15.4 20,14.8 21,14.6 C 23.6,15.2 26,16.2 28.4,17.6 " +
    "C 25.6,18.6 22.6,19.8 20,20.6 C 18.8,21 18.4,22.6 19.6,23.4 C 23,25 28.5,25.2 33,24.2 C 37.6,23 40.6,19 41,14 C 41.4,9 41,4.4 38,2 Z";
  const fangs = ["M 21.2,14.7 L 22.3,17.4 L 23.5,15.1 Z", "M 20.4,20.5 L 21.3,18.5 L 22.5,20 Z"];
  parts.push(unite(c.body, [X(ear)]), shape(X(tongue), c.armed), unite(c.body, [X(head)]), ...fangs.map((d) => shape(X(d), c.body)));
  parts.push(
    dot(...placePt([28.8, 7.7], P), 0.9 * (P.s ?? 1)),
    ln(X("M 25.4,5.8 C 27.8,4.4 30.8,4.6 33,6.2")),
    ln(X("M 15.2,9.2 C 16.2,8.8 17.4,9 18,9.8")),
    ln(X("M 28.4,17.6 C 30.8,17.2 32.8,18.4 34,20.6")),
    ln(X("M 35.6,3 C 36.8,2.2 38.2,1.8 39.4,2")),
  );

  if (crowned) {
    const b = placePt([31, 4], P);
    parts.push(crown(c, b[0], b[1], 1.2 * (P.s ?? 1), -12 + (P.rot ?? 0)));
  }
  return parts.join("");
};

export const lionRampant = (c: ArtColors, o: RampantOpts = {}): string => {
  const parts: string[] = [];
  if (o.sabre) parts.push(sabre(o.sabre));
  if (o.grip) {
    // a long-hafted bearded axe held upright, edge to dexter, behind the forepaws
    const blade =
      "M 8.6,0.6 C 4.6,-0.6 0.6,-2.8 -1.8,-6 C -4.6,-1.6 -5.6,4.6 -4.4,10.4 C -3.4,15.4 -0.8,19.6 2.4,23 " +
      "C 3.2,19.6 5,16.8 8.6,14.6 Z";
    parts.push(
      shape(blade, c.second),
      ln("M -1.4,-1.8 C -3,2.6 -3.2,8 -2,12.6 C -1.2,15.6 0.2,18 1.8,19.8"),
      shape(bone([9.2, 98.6], [8.2, -1.6], 3, 2.8), c.second),
    );
  }
  const K = 1.05; // claw size
  const leg = (claws: string, ds: string[]) => parts.push(shape(claws, c.armed), unite(c.body, ds));

  // far (dexter) hind leg, raised forward
  {
    const p = paw(23, 80, 196, 1.05, { toes: [-36, 0, 36], claw: K });
    leg(p.claws, [...limb([[55, 66], [40, 68.5], [31.5, 77], [23.5, 80]], [15, 9, 6.4, 5.8], [-1.5, 0.6, 0]), p.pad]);
  }
  // far (dexter) foreleg, raised high (higher still with a sword, held behind the paw)
  if (o.sword?.pose === "held") {
    parts.push(sword(o.sword.fill, { x: 7.4, y: 9.6, rot: -12 }, 44));
    const p = paw(8.4, 13.6, 236, 1.05, { toes: [-40, 0, 40], claw: K });
    leg(p.claws, [...limb([[35, 31], [22, 32], [9, 14.4]], [10, 8.2, 5.4], [0, 1.6]), p.pad]);
  } else if (o.sword?.pose === "brandished") {
    parts.push(sword(o.sword.fill, { x: 5.6, y: 7.6, rot: 66 }, 46));
    const p = paw(6.8, 11, 228, 1.05, { toes: [-40, 0, 40], claw: K });
    leg(p.claws, [...limb([[35, 31], [21, 31], [7.6, 11.8]], [10, 8.2, 5.4], [0, 1.6]), p.pad]);
  } else {
    const p = paw(13.2, 24.6, 212, 1.05, { toes: [-40, 0, 40], claw: K });
    leg(p.claws, [...limb([[35, 31], [27, 37.5], [14, 25]], [10, 8.2, 5.4], [0, 1.6]), p.pad]);
  }
  // tail (with its tuft) and body
  {
    const torso = [
      bone([36, 17], [35, 33], 16, 19.5, -2),
      bone([35, 33], [49, 57], 20, 12, -2.4),
      bone([49, 57], [59, 69], 12, 18, 0.5),
    ];
    if (o.forked) {
      // queue fourchée: two tails from one root, crossed once, each tufted
      const root = tube([[60, 71], [66, 75], [72, 75], [76, 71]], [5.8, 5.4]);
      const back = tube(
        [[75, 72], [83, 69], [89.5, 60], [85.5, 50], [82, 42], [71, 39], [71, 28], [71, 20], [73.5, 15], [70.5, 9.5]],
        [4.8, 4.2, 3.8, 3.6],
      );
      const front = tube(
        [[74, 72], [69, 66], [66, 58], [73, 50], [80, 43], [88.5, 37], [86, 26], [84.5, 18], [81.5, 15], [85, 9.5]],
        [4.8, 4.2, 3.8, 3.6],
      );
      const t1 = tuft(70.6, 10, -26, 1);
      const t2 = tuft(85.1, 10, 4, 1);
      parts.push(unite(c.body, [back, t1.d, ...torso]), t1.lines, unite(c.body, [root, front, t2.d]), t2.lines);
    } else {
      const e = o.tailOut ?? 0;
      const tail = tube(
        [[62, 72], [70, 76.5], [82.5 + e, 72], [82.5 + e, 61], [82.5 + e, 51], [69 + e / 3, 49], [69.5 + e / 3, 38], [70 + e / 3, 28], [79 + e, 25], [77.5 + e, 14]],
        [5.6, 4.8, 4.3, 4],
      );
      const t = tuft(77.4 + e, 14.4, -20, 1.08);
      parts.push(unite(c.body, [tail, t.d, ...torso]), t.lines);
    }
  }
  // near (sinister) hind leg, standing
  {
    const p = paw(55, 95.8, 182, 1.05, { toes: [-32, 0, 32], claw: K });
    leg(p.claws, [...limb([[60, 69], [51.5, 81], [60.5, 90], [55.5, 95.8]], [18, 9.5, 6.4, 5.8], [1.8, -0.8, 0]), p.pad]);
  }
  // near (sinister) foreleg
  {
    const p = paw(18.2, 51.6, 186, 1.05, { toes: [-38, 0, 38], claw: K });
    const elbow = xf(ELBOW, { x: 37.5, y: 55.5, rot: 125, s: 1 });
    leg(p.claws, [...limb([[42, 41], [36.5, 52.5], [18.6, 51.6]], [11.5, 8.8, 5.4], [0, -1.6]), elbow, p.pad]);
    parts.push(ln("M 32,56.2 C 31,54.6 31,52.4 32,50.6"), ln("M 24.5,48.6 C 23.6,50.2 23.6,52.4 24.6,54.2"));
  }
  // muscles and ribs
  parts.push(
    ln("M 52.4,76 C 52.6,71 55.6,66.6 61,65.4"),
    ln("M 46.4,51.6 C 48.4,52.8 49.8,54.6 50.4,57"),
    ln("M 49.6,49.6 C 51.6,50.8 53,52.6 53.6,55"),
    ln("M 41.6,63.4 C 43,65.4 43.4,68 42.6,70.6"),
    ln("M 28.6,82.2 C 27.4,80.4 27.2,78.4 28,76.4"),
    ln("M 22.6,30.2 C 21,30.6 19.8,29.8 19,28.4"),
  );

  parts.push(lionHead(c, {}, o.crowned));
  return parts.join("");
};

// ---------------------------------------------------------------- guardant face

/** a lion's face seen from the front, with a ring of mane locks; centre (x, y), face half-width ≈ 12.5·s */
export const lionFace = (c: ArtColors, x: number, y: number, s = 1, mane: { rIn?: number; rOut?: number; skew?: number; n?: number } = {}) => {
  const P: Place = { x, y, s };
  const X = (d: string) => xf(d, P);
  const n = mane.n ?? 15;
  const rIn = mane.rIn ?? 11.5, rOut = mane.rOut ?? 19.5, skew = mane.skew ?? 3;
  const pol = (r: number, deg: number): Pt => {
    const a = (deg * Math.PI) / 180;
    return [r * Math.sin(a), -r * Math.cos(a)];
  };
  const step = 360 / n;
  const ro = (deg: number) => rOut + skew * Math.sin((deg * Math.PI) / 180);
  let d = `M ${pt(pol(rIn, -step / 2))}`;
  const lines: string[] = [];
  for (let i = 0; i < n; i++) {
    const th = i * step;
    const r = ro(th);
    const tip = pol(r, th + step * 0.45);
    d += ` C ${pt(pol(rIn + (r - rIn) * 0.6, th - step * 0.55))} ${pt(pol(r * 0.98, th - step * 0.05))} ${pt(tip)}`;
    d += ` C ${pt(pol(rIn + (r - rIn) * 0.72, th + step * 0.3))} ${pt(pol(rIn + (r - rIn) * 0.38, th + step * 0.42))} ${pt(pol(rIn + 1.5, th + step / 2))}`;
    lines.push(`M ${pt(pol(rIn + 1.5, th + step / 2))} Q ${pt(pol(rIn + (r - rIn) * 0.45, th + step * 0.35))} ${pt(pol(rIn + (r - rIn) * 0.7, th + step * 0.42))}`);
  }
  d += " Z";
  const ears = [
    "M 5.6,-11.6 C 6.6,-16 9.6,-17.6 12.8,-17.2 C 13,-14.2 12,-11.6 10,-9.8 Z",
    "M -5.6,-11.6 C -6.6,-16 -9.6,-17.6 -12.8,-17.2 C -13,-14.2 -12,-11.6 -10,-9.8 Z",
  ];
  const face =
    "M -9,-11 C -4,-13.6 4,-13.6 9,-11 C 12.6,-8.4 13.6,-3 12.6,1.6 C 11.6,6 8.6,10 5,12.6 C 2.6,14.2 -2.6,14.2 -5,12.6 " +
    "C -8.6,10 -11.6,6 -12.6,1.6 C -13.6,-3 -12.6,-8.4 -9,-11 Z";
  const mouth = "M -5.6,8 C -3,9.2 3,9.2 5.6,8 C 4.2,11.2 2.2,12.6 0,12.6 C -2.2,12.6 -4.2,11.2 -5.6,8 Z";
  const tongue = "M -2.3,9.4 C -2.7,12.4 -2,15.6 0.1,18.4 C 1.8,15.6 2.6,12.4 2.2,9.4 C 0.7,10 -0.8,10 -2.3,9.4 Z";
  const nose = "M -3.8,2 C -2,1.2 2,1.2 3.8,2 C 3.2,3.8 1.6,5 0,5.4 C -1.6,5 -3.2,3.8 -3.8,2 Z";
  const eyes = ["M -7.6,-3.4 C -6.2,-5.2 -3.6,-5.2 -2.2,-3.6 C -3.6,-2.4 -6.2,-2.2 -7.6,-3.4 Z", "M 7.6,-3.4 C 6.2,-5.2 3.6,-5.2 2.2,-3.6 C 3.6,-2.4 6.2,-2.2 7.6,-3.4 Z"];
  const fangs = ["M -4.4,8.5 L -3.5,10.9 L -2.6,8.8 Z", "M 4.4,8.5 L 3.5,10.9 L 2.6,8.8 Z"];
  return [
    unite(c.body, [X(d)]),
    ...lines.map((l) => ln(X(l))),
    unite(c.body, ears.map(X)),
    ln(X("M 7.4,-12.4 C 8.6,-14.6 10.2,-15.4 11.8,-15.6")),
    ln(X("M -7.4,-12.4 C -8.6,-14.6 -10.2,-15.4 -11.8,-15.6")),
    unite(c.body, [X(face)]),
    shape(X(mouth), c.under),
    shape(X(tongue), c.armed),
    ...fangs.map((f2) => shape(X(f2), c.body)),
    shape(X(nose), c.body),
    ...eyes.map((e) => shape(X(e), c.body)),
    dot(...placePt([-4.9, -3.7], P), 0.85 * s),
    dot(...placePt([4.9, -3.7], P), 0.85 * s),
    ln(X("M -8.6,-6 C -6.6,-7.8 -3.8,-7.6 -1.8,-5.6")),
    ln(X("M 8.6,-6 C 6.6,-7.8 3.8,-7.6 1.8,-5.6")),
    ln(X("M -1.8,-4.6 C -2.2,-1.6 -2.4,0 -3,1.6")),
    ln(X("M 1.8,-4.6 C 2.2,-1.6 2.4,0 3,1.6")),
    ln(X("M -6.4,7 C -4.2,8.4 -1.6,8 0,5.6 C 1.6,8 4.2,8.4 6.4,7")),
    ln(X("M -10.4,3 C -9,6.4 -7.6,8.4 -5.6,9.6")),
    ln(X("M 10.4,3 C 9,6.4 7.6,8.4 5.6,9.6")),
  ].join("");
};

// ---------------------------------------------------------------- feathered wing

/**
 * A raised feathered wing: root at (0,0), rising upward with the pinions fanning
 * to +x. Placed by P (use flip to fan the other way).
 */
/** a single feather from base b to tip t: straight sides and an ogival point */
export const feather = (b: Pt, t: Pt, w: number): string => {
  const dx = t[0] - b[0], dy = t[1] - b[1];
  const len = Math.hypot(dx, dy);
  const u: Pt = [dx / len, dy / len], n: Pt = [-u[1], u[0]];
  const h = w / 2, k = Math.min(w * 1.1, len * 0.45);
  const P = (a: number, o: number): Pt => [b[0] + u[0] * a + n[0] * o, b[1] + u[1] * a + n[1] * o];
  return (
    `M ${pt(P(0, h * 0.85))} L ${pt(P(len - k, h))} C ${pt(P(len - k * 0.4, h))} ${pt(P(len - k * 0.15, h * 0.45))} ${pt(P(len, 0))} ` +
    `C ${pt(P(len - k * 0.15, -h * 0.45))} ${pt(P(len - k * 0.4, -h))} ${pt(P(len - k, -h))} L ${pt(P(0, -h * 0.85))} Z`
  );
};

/**
 * A raised feathered wing: root at (0,0), rising upward with the pinions fanning
 * to +x. Placed by P (use flip to fan the other way).
 */
export const featherWing = (fill: string, P: Place = {}): string => {
  const X = (d: string) => xf(d, P);
  const B: Pt[] = [[8, -36], [11, -31], [13, -26], [14, -21], [14, -16], [13, -11], [10, -6]];
  const T: Pt[] = [[30, -58], [42, -52.5], [51, -44], [57, -34], [59.5, -23.5], [58, -13], [52, -3.5]];
  const out: string[] = [];
  for (let i = B.length - 1; i >= 0; i--) {
    const b = B[i], t = T[i];
    out.push(shape(X(feather(b, t, 8)), fill));
    const q0: Pt = [b[0] + (t[0] - b[0]) * 0.45, b[1] + (t[1] - b[1]) * 0.45];
    const q1: Pt = [b[0] + (t[0] - b[0]) * 0.86, b[1] + (t[1] - b[1]) * 0.86];
    out.push(ln(X(`M ${pt(q0)} L ${pt(q1)}`)));
  }
  // coverts: the arm of the wing with a scalloped lower edge
  const S: Pt[] = [[20, -50], [23, -43], [25.5, -36], [26.5, -28.5], [26.5, -21], [25, -13.5], [21.5, -6.5], [15, 0.5]];
  const scallops = (pts: Pt[], bulge: number) => {
    let d = "";
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      d += ` Q ${pt([(a[0] + b[0]) / 2 - (dy / len) * bulge, (a[1] + b[1]) / 2 + (dx / len) * bulge])} ${pt(b)}`;
    }
    return d;
  };
  const covert = `M -2.5,3 C -6.5,-12 -4.5,-30 5,-42 C 9,-47 14,-50.5 20,-50${scallops(S, 3)} Q 6,7 -2.5,3 Z`;
  out.push(unite(fill, [X(covert)]));
  const S2: Pt[] = [[9, -44], [13, -37], [15.5, -29.5], [16.5, -22], [16, -14.5], [13.5, -7.5], [8, -1.5]];
  out.push(ln(X(`M ${pt(S2[0])}${scallops(S2, 2.4)}`)));
  const S3: Pt[] = [[2, -38], [5, -31], [6.5, -24], [6.5, -17], [5, -10], [1.5, -3.5]];
  out.push(ln(X(`M ${pt(S3[0])}${scallops(S3, 2)}`)));
  return out.join("");
};

// ---------------------------------------------------------------- eagle's foot

/**
 * An eagle's foot (griffin forelegs): ankle at (x, y), toes pointing `dir` degrees.
 * Returns the toes (to unite with the leg) and the talons (draw first).
 */
export const talons = (x: number, y: number, dir: number, s = 1): { toes: string[]; claws: string; lines: string } => {
  const P: Place = { x, y, rot: dir, s };
  const toes: [Pt[], number][] = [
    [[[0, -0.8], [2.6, -2.8], [5.2, -4.4], [7.6, -5.6]], 1],
    [[[0, 0], [3, 0], [6, 0.2], [8.8, 0.8]], 1],
    [[[0, 0.8], [2.4, 2.6], [4.6, 4.4], [6.6, 6.2]], 1],
    [[[0, 0.6], [-1.4, 2.2], [-2.6, 3.6], [-3.4, 5.6]], -1],
  ];
  const out: string[] = [];
  const claws: string[] = [];
  const lines: string[] = [];
  for (const [ch, curl] of toes) {
    out.push(xf(tube(ch, [2.9, 2.3], { n: 10 }), P));
    const e = ch[3], q = ch[2];
    const a = (Math.atan2(e[1] - q[1], e[0] - q[0]) * 180) / Math.PI;
    const cl: Place = { x: e[0], y: e[1], rot: a };
    const cp = (p: Pt) => pt(placePt(placePt([p[0], p[1] * curl], cl), P));
    claws.push(`M ${cp([-0.9, -1.2])} C ${cp([1.6, -1.5])} ${cp([3.8, -0.6])} ${cp([4.6, 2.6])} C ${cp([3, 1.1])} ${cp([1.6, 1.1])} ${cp([-0.9, 1.2])} Z`);
    const m = ch[1];
    const nrm = [-(ch[2][1] - ch[0][1]), ch[2][0] - ch[0][0]];
    const L = Math.hypot(nrm[0], nrm[1]) || 1;
    lines.push(ln(xf(`M ${pt([m[0] + (nrm[0] / L) * 1.1, m[1] + (nrm[1] / L) * 1.1])} L ${pt([m[0] - (nrm[0] / L) * 1.1, m[1] - (nrm[1] / L) * 1.1])}`, P)));
  }
  out.push(xf("M -2.2,0 C -2.2,-1.6 -1,-2.4 0.4,-2.4 C 1.8,-2.4 2.6,-1.4 2.6,0 C 2.6,1.6 1.6,2.6 0.2,2.6 C -1.2,2.6 -2.2,1.6 -2.2,0 Z", P));
  return { toes: out, claws: claws.join(" "), lines: lines.join("") };
};
