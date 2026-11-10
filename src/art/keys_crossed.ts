// Two keys in saltire, bows in base, wards in chief turned outward (as in the papal arms).
// The key in bend is c.body; the key in bend sinister (c.second) lies over it.
import type { Art } from "./types.ts";
import { path, line, mirror } from "./style.ts";

const W = 104;
const R = 13.2, r = 7; // bow
const S = 3.6; // half-width of the shaft
const L = 115.5; // bow centre to the tip of the shaft
const BX = 13.7, BY = 86.1; // bow centre on the field
const ANG = 43; // a little steeper than 45° so the wards reach the top edge

const ring = `M${-R},0 A${R},${R} 0 1 1 ${R},0 A${R},${R} 0 1 1 ${-R},0 Z M${-r},0 A${r},${r} 0 1 0 ${r},0 A${r},${r} 0 1 0 ${-r},0 Z`;

// one key in local coordinates: bow centre at the origin, shaft up the -y axis, bit to +x
const key = (fill: string) => {
  const t = -L; // tip
  const b0 = t + 3, b1 = t + 26; // bit along the shaft
  const bx = 15; // reach of the bit
  const shaft =
    `M${-S},${-R + 2} L${-S},${t + 3} Q${-S},${t} 0,${t} Q${S},${t} ${S},${t + 3} L${S},${b0} ` +
    `L${bx},${b0} L${bx},${b0 + 6} L${S + 6},${b0 + 6} L${S + 6},${b0 + 10} L${bx},${b0 + 10} ` +
    `L${bx},${b1 - 7} L${S + 6},${b1 - 7} L${S + 6},${b1 - 3} L${bx},${b1 - 3} L${bx},${b1} ` +
    `L${S},${b1} L${S},${-R + 2} Z`;
  const cy = -R - 1;
  const collar = `M${-7},${cy} L7,${cy} L7,${cy - 5} L-7,${cy - 5} Z`;
  return (
    `<g transform="translate(${BX} ${BY}) rotate(${ANG})">` +
    path(shaft, fill) +
    line(`M0,${cy - 8} L0,${t + 30}`) +
    path(ring, fill, 'fill-rule="evenodd"') +
    path(collar, fill) +
    `</g>`
  );
};

const art: Art = {
  w: W,
  h: 100,
  draw: (c) => key(c.body) + mirror(W, key(c.second)),
};
export default art;
