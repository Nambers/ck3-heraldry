// Crown as CK3 draws it (ce_crown): a jewelled band between two rims; above, three
// fleurons (the middle one pierced) and two pearls on short stems, joined by hollow
// curves. Jewels armed; the piercing shows the tincture beneath. Texture space.
import type { Art } from "./types.ts";
import { path, line, inBox, OUT } from "./style.ts";
import { unite } from "./_lion-parts.ts";

const BBOX = [0.066, 0.205, 0.934, 0.787] as const;
const circle = (x: number, y: number, r: number) =>
  `M${x},${y - r} C${x + 0.55 * r},${y - r} ${x + r},${y - 0.55 * r} ${x + r},${y} C${x + r},${y + 0.55 * r} ${x + 0.55 * r},${y + r} ${x},${y + r} ` +
  `C${x - 0.55 * r},${y + r} ${x - r},${y + 0.55 * r} ${x - r},${y} C${x - r},${y - 0.55 * r} ${x - 0.55 * r},${y - r} ${x},${y - r} Z`;
const bar = (x0: number, x1: number, y0: number, y1: number) => {
  const r = (y1 - y0) / 2;
  return `M${x0 + r},${y0} H${x1 - r} C${x1 + 0.1 * r},${y0} ${x1 + 0.1 * r},${y1} ${x1 - r},${y1} H${x0 + r} C${x0 - 0.1 * r},${y1} ${x0 - 0.1 * r},${y0} ${x0 + r},${y0} Z`;
};

// the upper part: rising from the top rim, hollow curves between the fleurons and pearls
const UPPER =
  "M12,56 L9.6,37.6 C13.6,45.8 18.6,48.6 22,48.6 C25.8,48.6 28.6,45.4 30,40.6 C31.4,45.4 34.2,48.6 38,48.6 C41.6,48.6 44.4,45.8 45.6,38.6 " +
  "L54.4,38.6 C55.6,45.8 58.4,48.6 62,48.6 C65.8,48.6 68.6,45.4 70,40.6 C71.4,45.4 74.2,48.6 78,48.6 C81.4,48.6 86.4,45.8 90.4,37.6 L88,56 Z";
// the middle fleuron: three lobes over a stem, pierced in the middle
const MID = [circle(50, 24.6, 4.4), circle(44.4, 30.8, 4.6), circle(55.6, 30.8, 4.6), "M46,26 L54,26 L54,40 L46,40 Z"];
// a side fleuron leaning outward (mirrored for the right)
const SIDE = [circle(10.8, 24.2, 3.4), circle(9.6, 30.6, 2.9), circle(15.2, 31.4, 2.9), "M8.4,27 L13.6,26.4 L14,38.6 L9.4,38.6 Z"];

const art: Art = {
  w: 149.1,
  h: 100,
  draw: (c) => {
    const right = (d: string) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${Math.round((100 - Number(x)) * 100) / 100},${y}`);
    let s = "";
    s += unite(c.body, [UPPER, ...MID, ...SIDE, ...SIDE.map(right)]);
    s += `<circle cx="50" cy="30.4" r="2.4" fill="${c.under}" ${OUT}/>`;
    // pearls on short stems
    for (const x of [30, 70]) s += path(`M${x - 0.9},41 V36 H${x + 0.9} V41 Z`, c.body) + `<circle cx="${x}" cy="35.2" r="2.9" fill="${c.body}" ${OUT}/>`;
    s += path(bar(10.6, 89.4, 55.4, 60.4), c.body);
    s += path("M16,60.4 H84 L83.2,74.6 H16.8 Z", c.body);
    s += line("M17,62.6 H83");
    s += `<ellipse cx="28.4" cy="67.4" rx="4.6" ry="3.8" fill="${c.armed}" ${OUT}/>`;
    s += `<ellipse cx="50" cy="67.4" rx="6.2" ry="3.8" fill="${c.armed}" ${OUT}/>`;
    s += `<ellipse cx="71.6" cy="67.4" rx="4.6" ry="3.8" fill="${c.armed}" ${OUT}/>`;
    s += path(bar(12.6, 87.4, 74.6, 78.7), c.body);
    return inBox(s, BBOX, 149.1);
  },
};
export default art;
