// Sexfoil as CK3 draws it (ce_rosetta_06): six long, pointed petals radiating from a
// small round seed, one straight up and one straight down. Drawn in texture space.
import type { Art } from "./types.ts";
import { path, line, inBox, OUT } from "./style.ts";

const BBOX = [0.195, 0.152, 0.805, 0.848] as const;
// one petal pointing up from the centre, widest a little below its middle
const PETAL = "M0,-2.4 C6.4,-10.5 6.4,-23.5 0,-34.8 C-6.4,-23.5 -6.4,-10.5 0,-2.4 Z";

const art: Art = {
  w: 87.6,
  h: 100,
  draw: (c) => {
    let s = "";
    for (const a of [0, 60, 120, 180, 240, 300]) s += `<g transform="rotate(${a})">${path(PETAL, c.body)}${line("M0,-6 L0,-30")}</g>`;
    s += `<circle r="4.4" fill="${c.armed}" ${OUT}/>`;
    return inBox(`<g transform="translate(50 50)">${s}</g>`, BBOX, 87.6);
  },
};
export default art;
