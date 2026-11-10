// Triple-towered castle (as in the arms of Castile): a crenellated curtain wall
// with an arched gate, three crenellated towers rising behind it, the middle one
// taller.
import type { Art } from "./types.ts";
import { path, line } from "./style.ts";

const W = 84;

/** outline of a block from yb up to yt with n merlons of height mh along its top */
const crenellated = (x0: number, x1: number, yb: number, yt: number, n: number, mh: number) => {
  const m = (x1 - x0) / (n + (n - 1) * 0.65);
  const g = m * 0.65;
  let d = `M${x0},${yb} V${yt}`;
  let x = x0;
  for (let i = 0; i < n; i++) {
    x += m;
    d += ` H${+x.toFixed(2)}`;
    if (i < n - 1) {
      x += g;
      d += ` V${yt + mh} H${+x.toFixed(2)} V${yt}`;
    }
  }
  return `${d} V${yb} Z`;
};

/** arched opening: sides from yb up to the springing line, round head of width w */
const arch = (cx: number, w: number, yb: number, yTop: number) => {
  const r = w / 2;
  return `M${cx - r},${yb} V${yTop + r} A${r},${r} 0 0 1 ${cx + r},${yTop + r} V${yb} Z`;
};

/** masonry: `rows` courses between y0 and y1 with staggered vertical joints */
const masonry = (x0: number, x1: number, y0: number, y1: number, rows: number, step: number) => {
  const h = (y1 - y0) / rows;
  let d = "";
  for (let i = 0; i < rows; i++) {
    const ya = +(y0 + i * h).toFixed(2);
    if (i > 0) d += ` M${x0},${ya} H${x1}`;
    for (let x = x0 + (i % 2 ? step : step / 2); x < x1 - 1; x += step) d += ` M${+x.toFixed(2)},${ya} V${+(ya + h).toFixed(2)}`;
  }
  return d;
};

const art: Art = {
  w: W,
  h: 100,
  draw: (c) =>
    // towers (behind the wall)
    path(crenellated(5, 23, 60, 14, 3, 8), c.body) +
    path(crenellated(61, 79, 60, 14, 3, 8), c.body) +
    path(crenellated(31, 53, 60, 0, 3, 9), c.body) +
    line(masonry(5, 23, 22, 52, 3, 9)) +
    line(masonry(61, 79, 22, 52, 3, 9)) +
    line(masonry(31, 53, 9, 52, 4, 11)) +
    path(arch(14, 5, 38, 24), c.detail) +
    path(arch(70, 5, 38, 24), c.detail) +
    path(arch(42, 6, 34, 16), c.detail) +
    // curtain wall
    path(crenellated(0, W, 100, 44, 7, 8), c.body) +
    line(masonry(0, W, 52, 100, 5, 12)) +
    path(arch(42, 18, 100, 68), c.detail),
};
export default art;
