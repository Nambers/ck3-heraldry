// Chalice: a wide bowl, a stem with a knop, a broad foot.
import type { Art } from "./types.ts";
import { path, line, OUT } from "./style.ts";

const W = 76;
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

const BOWL = sym([38, 3], [[3, 3], [3, 20, 10, 33, 22, 39], [28, 42, 33, 43, 38, 43]]);
const STEM = sym([38, 40], [[34.5, 40], [35, 50, 35, 62, 34, 74], [33, 84, 24, 90, 8, 93], [7, 96], [38, 96]]);
const KNOP = sym([38, 52], [[31, 52, 26.5, 54.5, 26.5, 59.5], [26.5, 64.5, 31, 67, 38, 67]]);

const art: Art = {
  w: W,
  h: 100,
  draw: (c) =>
    path(STEM, c.body) +
    `<rect x="4" y="93.5" width="68" height="6.5" rx="1.5" fill="${c.body}" ${OUT}/>` +
    path(BOWL, c.body) +
    line("M4.5,12 H71.5") +
    `<rect x="30" y="41" width="16" height="5" rx="1.5" fill="${c.body}" ${OUT}/>` +
    path(KNOP, c.body) +
    line("M33,53 C31,57 31,62 33,66 M43,53 C45,57 45,62 43,66") +
    `<rect x="0" y="0" width="76" height="6" rx="2" fill="${c.body}" ${OUT}/>`,
};
export default art;
