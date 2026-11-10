// Fleur-de-lis, French royal form: tall central petal, two side petals curling
// out and down, a band, three short lobes beneath.
import type { Art } from "./types.ts";
import { path, line, mirror, OUT } from "./style.ts";

const W = 86;

// left side petal (rises from behind the band, curls over and hangs to a point)
const SIDE = "M40,62 C36,45 29,30 18,27 C8,24 1,32 1,44 C1,52 3,58 6,65 C8,56 12,49 18,49 C24,49 28,55 28,62 Z";
const SIDE_LINE = "M35,57 C32,44 26,36 18,34 C11,33 7,38 6,46";
// left lower lobe (curls out and down from under the band)
const FOOT = "M39,68 C37,77 32,82 26,86 C22,89 19,94 18,100 C13,94 12,85 18,79 C22,75 25,72 25,68 Z";
const CENTRE = "M43,0 C50,9 57,22 56,36 C55,46 50,53 49,62 L37,62 C36,53 31,46 30,36 C29,22 36,9 43,0 Z";
const STEM = "M37,68 L49,68 C49,80 46,90 43,100 C40,90 37,80 37,68 Z";

const art: Art = {
  w: W,
  h: 100,
  draw: (c) => {
    const side = path(SIDE, c.body) + line(SIDE_LINE) + path(FOOT, c.body);
    return (
      side +
      mirror(W, side) +
      path(STEM, c.body) +
      path(CENTRE, c.body) +
      line("M43,10 V55") +
      `<rect x="20" y="59" width="46" height="10" rx="1.5" fill="${c.body}" ${OUT}/>` +
      line("M22,64 H64")
    );
  },
};
export default art;
