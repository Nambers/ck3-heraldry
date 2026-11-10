// Lymphad as CK3 draws it (ce_ship_lymphad): a crescent hull with three round ports,
// a castle at stem and stern, a mast topped by a ball, the yard slung bendwise with
// its sail furled beneath, shrouds fanning to the deck, and three pennons. No oars.
// One tincture (the recipe paints every part with it); ports and windows are openings.
import type { Art } from "./types.ts";
import { path, line, inBox, OUT } from "./style.ts";

const BBOX = [0.092, 0.121, 0.85, 0.865] as const;

/** a pennon flying to dexter from the top of a staff at (x, y) */
const pennon = (x: number, y: number, len: number, fill: string) =>
  path(`M${x},${y} C${x - len * 0.3},${y - 2.6} ${x - len * 0.55},${y + 1.6} ${x - len},${y - 0.6} C${x - len * 0.8},${y + 2.4} ${x - len * 0.82},${y + 4.4} ${x - len * 0.62},${y + 6.4} C${x - len * 0.4},${y + 3.6} ${x - len * 0.2},${y + 6.2} ${x},${y + 4.4} Z`, fill);
/** a small round-headed window */
const window = (cx: number, top: number, bottom: number, fill: string) =>
  path(`M${cx - 1.3},${bottom} V${top + 1.3} A1.3,1.3 0 0 1 ${cx + 1.3},${top + 1.3} V${bottom} Z`, fill);

const art: Art = {
  w: 101.9,
  h: 100,
  draw: (c) => {
    let s = "";
    // shrouds from the yard and masthead down to the deck
    const shrouds: [number, number, number][] = [[47.6, 29.6, 36], [48.4, 27, 40], [49.2, 24.6, 44], [50.8, 22, 56.6], [51.4, 23, 60.4], [52, 24.4, 64.2]];
    for (const [x, y, xd] of shrouds) s += path(`M${x - 0.5},${y} L${xd - 0.7},61 L${xd + 0.7},61 L${x + 0.5},${y} Z`, c.body);
    // mast with a ball at the top, and its pennon
    s += path("M49.2,15 H50.8 V71 H49.2 Z", c.body) + `<circle cx="50" cy="13.6" r="2" fill="${c.body}" ${OUT}/>`;
    s += pennon(48.6, 15.6, 18, c.body);
    // the furled sail hanging in folds under the yard, and the yard itself
    s += path("M29,32.6 C29.4,40.6 38.4,42 40.6,33.6 C43,40 50.6,37.4 50.4,29.2 C53.6,33.6 60.6,31 60,23.6 C63.6,27.4 71.4,24.4 72,15.6 L71.6,14.8 L28,32.8 Z", c.body);
    s += line("M40.6,33.6 L40.2,30.6 M50.4,29.2 L50,26.6 M60,23.6 L59.6,21");
    s += path("M25.6,33 L73.4,13.6 L74.2,15.6 L26.4,35 Z", c.body);
    // hull: a crescent rising to the castles, with a strake and three ports
    s += path("M18.6,60 H82.6 C84.4,62.4 85,66 84.4,69.4 L81.4,70 C77,80.6 64.6,86.5 50,86.5 C35.4,86.5 22.6,80 18.6,68.6 Z", c.body);
    s += line("M20.6,67.6 C27,78 38,83.4 50,83.4 C62,83.4 73,78 79.4,67.6");
    for (const [x, y] of [[40.4, 76.4], [50.4, 78.6], [60.6, 76.4]]) s += `<circle cx="${x}" cy="${y}" r="2.2" fill="${c.under}" ${OUT}/>`;
    // the castles: a rail on posts over three arched windows, a staff with a ball and a pennon
    for (const x0 of [17, 67.6]) {
      s += path(`M${x0},49 H${x0 + 15.6} V51.4 H${x0 + 14.4} V60.2 H${x0 + 1.2} V51.4 H${x0} Z`, c.body);
      for (const dx of [4.4, 7.8, 11.2]) s += window(x0 + dx, 52.6, 58.6, c.under);
    }
    for (const x of [21.2, 80.4]) {
      s += path(`M${x - 0.7},41 H${x + 0.7} V49 H${x - 0.7} Z`, c.body) + `<circle cx="${x}" cy="40.2" r="1.4" fill="${c.body}" ${OUT}/>`;
      s += pennon(x - 0.8, 41.6, x < 50 ? 11.2 : 12.6, c.body);
    }
    return inBox(s, BBOX, 101.9);
  },
};
export default art;
