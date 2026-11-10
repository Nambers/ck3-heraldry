// Portugal's five escutcheons in cross, each with five roundels in saltire; before
// 1485 the side ones point to the centre. Laid out as in the CK3 recipe (charges.ts).
import type { Art } from "./types.ts";
import { OUT, path } from "./style.ts";

const W = 19.5, H = 24.8; // one escutcheon, in the recipe's 0..100 space

/** a round-based escutcheon centred at (x, y), with its roundels */
const escutcheon = (x: number, y: number, body: string, plate: string) => {
  const x0 = x - W / 2, x1 = x + W / 2, y0 = y - H / 2, y1 = y + H / 2, ys = y0 + 0.5 * H;
  const d = `M${x0},${y0} L${x1},${y0} L${x1},${ys} C${x1},${ys + 0.3 * H} ${x + 0.3 * W},${y1} ${x},${y1} C${x - 0.3 * W},${y1} ${x0},${ys + 0.3 * H} ${x0},${ys} Z`;
  const r = 0.085 * W;
  const plates = [[-0.25, -0.24], [0.25, -0.24], [0, -0.06], [-0.25, 0.12], [0.25, 0.12]]
    .map(([dx, dy]) => `<circle cx="${x + dx * W}" cy="${y + dy * H}" r="${r}" fill="${plate}" ${OUT}/>`)
    .join("");
  return path(d, body) + plates;
};

const art: Art = {
  w: 100,
  h: 100,
  draw: (c) => {
    const s = 100 / 79.6; // the visible box 10.7..89.3 (and a little room for the outline) fills the drawing
    const turned = (x: number, rot: number) => `<g transform="rotate(${rot} ${x} 50)">${escutcheon(x, 50, c.body, c.second)}</g>`;
    return (
      `<g transform="scale(${s}) translate(-10.2 -10.2)">` +
      escutcheon(50, 23, c.body, c.second) +
      escutcheon(50, 50, c.body, c.second) +
      escutcheon(50, 77, c.body, c.second) +
      turned(23, 270) +
      turned(77, 90) +
      `</g>`
    );
  },
};
export default art;
