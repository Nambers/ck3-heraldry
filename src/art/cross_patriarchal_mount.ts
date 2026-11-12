// A patriarchal cross issuing from a trimount: Hungary's double cross on its three hills.
// The cross is c.body and stands with its foot in the middle hill; the trimount is c.second.
// Laid out on the composite in src/charges.ts: the hills fill the lower third, the cross the rest.
import type { Art } from "./types.ts";
import { path } from "./style.ts";

const W = 57.3;
const X = W / 2;
const S = 3.2; // half the width of the shaft
const F = 2.2; // how far each end flares

// one outline for the whole cross, so its arms show no seams: the shaft from the top down
// into the hill, the shorter bar above the longer, every end flaring a little
const bar = (y: number, half: number, t: number, side: 1 | -1) => {
  const e = X + side * half, i = X + side * (half - 4), s = X + side * S;
  return side > 0
    ? `L${s},${y - t} L${i},${y - t} L${e},${y - t - F} L${e},${y + t + F} L${i},${y + t} L${s},${y + t} `
    : `L${s},${y + t} L${i},${y + t} L${e},${y + t + F} L${e},${y - t - F} L${i},${y - t} L${s},${y - t} `;
};
const UPPER = 22, LOWER = 42;
const cross =
  `M${X - S - F},0 L${X + S + F},0 L${X + S},4 ` +
  bar(UPPER, 14, 3.2, 1) +
  bar(LOWER, 24, 3.4, 1) +
  `L${X + S},73 L${X - S},73 ` +
  bar(LOWER, 24, 3.4, -1) +
  bar(UPPER, 14, 3.2, -1) +
  `L${X - S},4 Z`;

// three rounded hills on a flat base, the middle one the highest
const mount =
  "M2,100 L3.6,80 Q3.6,71.2 10.4,71 Q16.6,71.2 19.2,75.6 Q21.2,67.8 28.65,67.7 Q36.1,67.8 38.1,75.6 " +
  "Q40.7,71.2 46.9,71 Q53.7,71.2 53.7,80 L55.3,100 Z";

const art: Art = {
  w: W,
  h: 100,
  draw: (c) => path(mount, c.second) + path(cross, c.body),
};
export default art;
