// Oak tree eradicated: a crown of distinct round leaf clusters on a sturdy trunk,
// the roots spread out beneath.
import type { Art } from "./types.ts";
import { path, line } from "./style.ts";

const W = 79;
const f = (n: number) => +n.toFixed(2);

/** closed path symmetric about x = W/2 from its left half; segments are [x,y] (line) or cubic [c1, c2, end] */
const sym = (start: [number, number], segs: number[][]) => {
  const pts: number[][] = [start];
  let d = `M${start}`;
  for (const s of segs) {
    d += s.length === 2 ? ` L${s}` : ` C${s[0]},${s[1]} ${s[2]},${s[3]} ${s[4]},${s[5]}`;
    pts.push(s.slice(-2));
  }
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i], p = pts[i];
    d += s.length === 2 ? ` L${f(W - p[0])},${p[1]}` : ` C${f(W - s[2])},${s[3]} ${f(W - s[0])},${s[1]} ${f(W - p[0])},${p[1]}`;
  }
  return d + " Z";
};

/** a round leaf cluster with a scalloped edge: outer radius R, n lobes */
const cluster = (cx: number, cy: number, R: number, n: number, phase = 0) => {
  const bump = R * 0.12, r = R - bump;
  const rc = 2 * R - r * Math.cos(Math.PI / n);
  const at = (rad: number, a: number) => `${f(cx + rad * Math.cos(a))},${f(cy + rad * Math.sin(a))}`;
  let d = "";
  for (let k = 0; k < n; k++) {
    const a = phase + (2 * Math.PI * k) / n, b = a + (2 * Math.PI) / n;
    d += k === 0 ? `M${at(r, a)}` : "";
    d += ` Q${at(rc, (a + b) / 2)} ${at(r, b)}`;
  }
  return d + " Z";
};

/** leaf divisions: a short nick in from each valley of a cluster's edge */
const veins = (cx: number, cy: number, R: number, n: number, phase: number) => {
  const r = R * 0.88;
  let d = "";
  for (let k = 0; k < n; k++) {
    const a = phase + (2 * Math.PI * k) / n;
    const p = (rad: number) => `${f(cx + rad * Math.cos(a))},${f(cy + rad * Math.sin(a))}`;
    d += ` M${p(r)} L${p(r - R * 0.2)}`;
  }
  return d;
};

// [cx, cy, R, lobes], back to front
const CLUSTERS: [number, number, number, number][] = [
  [39.5, 15, 15, 9],
  [17, 26, 16, 9],
  [62, 26, 16, 9],
  [15.5, 45, 15.5, 9],
  [63.5, 45, 15.5, 9],
  [39.5, 37, 17, 10],
];

const TRUNK = sym(
  [39.5, 40],
  [
    [34, 40],
    [34, 51],
    [30, 49, 25, 48, 20, 49],
    [22, 55],
    [27, 56, 31.5, 58, 33, 64],
    [34, 70, 33, 76, 29, 82],
    [23, 88, 12, 90, 2, 96],
    [12, 96.5, 20, 93.5, 26, 90.5],
    [24, 93, 22, 96, 19, 100],
    [24, 97, 29, 94, 33, 91],
    [35, 94, 37, 97, 39.5, 100],
  ],
);

/** an acorn hanging from (x, y) */
const acorn = (x: number, y: number, body: string) =>
  `<g transform="translate(${x} ${y}) scale(1.35)">` +
  path("M-2.6,2.5 C-2.9,6 -1.5,8.5 0,9.6 C1.5,8.5 2.9,6 2.6,2.5 Z", body) +
  path("M-3.3,3 C-3.4,0.5 -2,-0.6 0,-0.6 C2,-0.6 3.4,0.5 3.3,3 C1.2,3.8 -1.2,3.8 -3.3,3 Z", body) +
  `</g>`;

const art: Art = {
  w: W,
  h: 100,
  draw: (c) =>
    path(TRUNK, c.body) +
    acorn(9, 58, c.body) +
    acorn(70, 58, c.body) +
    line("M36.5,60 C37,70 35.5,80 31,86 M43,58 C42.5,68 44,78 48,85 M39.5,72 V92") +
    CLUSTERS.map(([x, y, R, n], i) => path(cluster(x, y, R, n, i * 0.4), c.body) + line(veins(x, y, R, n, i * 0.4))).join(""),
};
export default art;
