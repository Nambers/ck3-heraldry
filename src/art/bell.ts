// Church bell: a loop on the crown, rounded shoulder, flaring waist and lip, the
// clapper showing beneath.
import type { Art } from "./types.ts";
import { path, line, OUT } from "./style.ts";

const W = 81;
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

const BODY = sym(
  [40.5, 11],
  [
    [31, 11, 24.5, 13.5, 23.5, 22],
    [22.5, 32, 22, 48, 18.5, 60],
    [15, 70, 7, 77, 1.5, 80.5],
    [0, 81.5, 0, 86, 2, 87.5],
    [14, 91, 28, 92, 40.5, 92],
  ],
);
const LOOP = "M33.5,14 V7 A7,7 0 0 1 47.5,7 V14 Z M37,14 V7.5 A3.5,3.5 0 0 1 44,7.5 V14 Z";

const art: Art = {
  w: W,
  h: 100,
  draw: (c) =>
    path("M38.5,86 H42.5 V91 H38.5 Z", c.body) +
    path("M40.5,88 A6,6 0 1 1 40.49,88 Z", c.body) +
    `<path d="${LOOP}" fill="${c.body}" fill-rule="evenodd" ${OUT}/>` +
    path(BODY, c.body) +
    line("M24,20 Q40.5,23 57,20 M23.5,24 Q40.5,27 57.5,24") +
    line("M12,72.5 Q40.5,78.5 69,72.5 M6,77.5 Q40.5,84 75,77.5"),
};
export default art;
