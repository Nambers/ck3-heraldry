// Horseshoe, opening downward: broad branches, thickened heels (calkins), pierced nail holes.
import type { Art } from "./types.ts";
import { path, line, mirror, OUT } from "./style.ts";

const W = 88;

const art: Art = {
  w: W,
  h: 100,
  draw: (c) => {
    const shoe =
      "M2.5,99.5 C1.5,84 0.5,68 0.5,52 C0.5,22 20,0.5 44,0.5 C68,0.5 87.5,22 87.5,52 " +
      "C87.5,68 86.5,84 85.5,99.5 L64.5,99.5 C66.5,84 68.5,68 68.5,52 C68.5,30 57,19 44,19 " +
      "C31,19 19.5,30 19.5,52 C19.5,68 21.5,84 23.5,99.5 Z";
    // nail holes on the dexter branch (mirrored for sinister): [x, y, angle]
    const holes: [number, number, number][] = [
      [26, 14.5, -58],
      [15.5, 26, -38],
      [10.5, 41, -14],
      [10.5, 57, 2],
    ];
    const half =
      holes
        .map(([x, y, a]) => `<rect x="${x - 2}" y="${y - 3.2}" width="4" height="6.4" rx="1.6" transform="rotate(${a} ${x} ${y})" fill="${c.under}" ${OUT}/>`)
        .join("") +
      // fuller groove and the calkin at the heel
      line("M10.5,64 C11,74 12,82 12.5,88") +
      line("M2,91 L23,91");
    return path(shoe, c.body) + half + mirror(W, half);
  },
};
export default art;
