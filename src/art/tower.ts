// Tower as CK3 draws it (ce_tower): four merlons over a slightly overhanging parapet,
// a plain shaft with two arched windows, a battered foot with an arched door, and a
// wider plinth. Door and windows are openings (the tincture beneath). Texture space.
import type { Art } from "./types.ts";
import { path, line, inBox } from "./style.ts";

const BBOX = [0.301, 0.094, 0.699, 0.824] as const;

/** a round-headed opening, sides from yb up to the springing, width w */
const arch = (cx: number, w: number, yTop: number, yb: number) => {
  const r = w / 2;
  return `M${cx - r},${yb} V${yTop + r} A${r},${r} 0 0 1 ${cx + r},${yTop + r} V${yb} Z`;
};

// parapet with four merlons, corbelled out over the shaft
const PARAPET = "M33.4,17.4 V9.4 H39.4 V12.4 H42.6 V9.4 H48.4 V12.4 H51.6 V9.4 H57.4 V12.4 H60.6 V9.4 H66.6 V17.4 L62.6,21.2 H37.4 Z";
// the shaft widens a little downwards, then batters out at the foot
const BODY = "M37.4,21 H62.6 L65,58.4 L67.6,62.4 V75.8 H32.4 V62.4 L35,58.4 Z";
const PLINTH = "M30.1,77.4 H69.9 V82.4 H30.1 Z";

const art: Art = {
  w: 54.5,
  h: 100,
  draw: (c) =>
    inBox(
      path(BODY, c.body) +
        line("M35,58.4 H65 M32.4,62.4 H67.6") +
        path(PARAPET, c.body) +
        path(PLINTH, c.body) +
        path(arch(43, 4.2, 26.4, 34.6), c.under) +
        path(arch(57, 4.2, 26.4, 34.6), c.under) +
        path(arch(50, 10, 63.6, 75.8), c.under),
      BBOX,
      54.5,
    ),
};
export default art;
