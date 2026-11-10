// Anchor erect: ring, stock, shank, and arms curving up into barbed flukes.
import type { Art } from "./types.ts";
import { path, line, mirror, OUT } from "./style.ts";

const W = 84;
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

const RING = "M42,0 A8,8 0 1 1 41.99,0 Z M42,3.5 A4.5,4.5 0 1 0 42.01,3.5 Z";
const SHANK = "M38.5,13 H45.5 V94 H38.5 Z";
const STOCK = sym([42, 17.5], [[15, 18.5], [15, 24.5], [42, 25.5]]);
const ARMS = sym([42, 100], [[26, 100, 11, 92, 6.5, 74], [13, 72.5], [17, 85, 28, 92, 42, 92]]);
const FLUKE = "M5,53 C3,60 0.5,67 0,74 L7,70.5 L15.5,73.5 C12,66 8,59 5,53 Z";

const art: Art = {
  w: W,
  h: 100,
  draw: (c) => {
    const knob = path("M11,17.3 A4.2,4.2 0 1 1 10.99,17.3 Z", c.body);
    return (
      path(SHANK, c.body) +
      path(ARMS, c.body) +
      path(FLUKE, c.body) +
      mirror(W, path(FLUKE, c.body)) +
      line("M5,58 C4,63 3.5,67 4,71 M79,58 C80,63 80.5,67 80,71") +
      `<path d="${RING}" fill="${c.body}" fill-rule="evenodd" ${OUT}/>` +
      path(STOCK, c.body) +
      knob +
      mirror(W, knob)
    );
  },
};
export default art;
