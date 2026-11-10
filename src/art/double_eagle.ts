// Double-headed eagle displayed, as CK3 draws it (ce_eagle_double): wings spread
// wide with seven fingered pinions each, two necks rising from a broad breast to
// heads turned outward, legs splayed with open talons, a fanned tail. Texture space.
import type { Art } from "./types.ts";
import { path, line, mirror, inBox } from "./style.ts";
import { wing, leg, symmetric, eagleHead, feather, type P } from "./_eagle-parts.ts";

const BBOX = [0.068, 0.107, 0.93, 0.879] as const;

const art: Art = {
  w: 111.7,
  h: 100,
  draw: (c) => {
    // the dexter half (wing, leg, neck and head), mirrored for the sinister half
    let half = "";
    half += wing(
      {
        arm: [[41, 36], [36, 33], [30, 30], [24.4, 25]],
        armW: [6, 4],
        pinions: [
          [1.0, [19.6, 15]],
          [0.88, [12, 20.4]],
          [0.76, [8.4, 28.4]],
          [0.62, [9.4, 39.6]],
          [0.48, [10.4, 51.6]],
          [0.34, [16, 60]],
          [0.2, [19.6, 67.6]],
        ],
        wd: 5.6,
        cov: 0.3,
        bend: 1.6,
      },
      c.body,
    );
    half += leg({ hip: [43.6, 58], knee: [35, 62], ankle: [29, 65], thigh: [5, 4.2], shank: 3.2, toe: [6.4, 2.1, 3], toes: [196, 150, 110, 320] }, c.body, c.armed);
    const neck =
      path("M41,37 C40.8,30.6 39.2,24.2 37.8,18.6 L44.6,18.6 C45.2,23.6 46.4,30 48,37 Z", c.body) +
      line("M45.2,23 Q43.8,24.6 42.2,23.6") +
      line("M46.2,28.6 Q44.8,30.2 43.2,29.2");
    const head = `<g transform="translate(42.6 14.8) scale(0.74)">${eagleHead(c.body, c.armed)}</g>`;
    let s = "";
    // the tail: a fan of five feathers, the middle one longest
    const tail = (tip: P, w: number, bend: number) => {
      const b: P = [50, 66];
      return feather(b, (Math.atan2(tip[1] - b[1], tip[0] - b[0]) * 180) / Math.PI, Math.hypot(tip[0] - b[0], tip[1] - b[1]), w, c.body, { bend });
    };
    s += tail([38.4, 73.6], 6.6, 1.6) + tail([61.6, 73.6], 6.6, -1.6) + tail([44, 81], 7, 1) + tail([56, 81], 7, -1) + tail([50, 87.6], 7.6, 0);
    s += half + mirror(100, half);
    // the necks go under the breast, which covers their roots
    s += neck + mirror(100, neck);
    // the breast, broad where the two necks join, narrow below
    s += path(
      symmetric(50, [50, 28], [
        [[44, 28], [38.4, 31], [38.6, 39]],
        [[38.8, 46], [43.4, 52], [45, 58]],
        [[46, 64], [48.4, 70], [50, 70]],
      ]),
      c.body,
    );
    s += line("M44.6,40 q2.7,3 5.4,0 q2.7,3 5.4,0") + line("M44,48 q3,3 6,0 q3,3 6,0") + line("M45.4,56 q2.3,2.6 4.6,0 q2.3,2.6 4.6,0");
    s += head + mirror(100, head);
    return inBox(s, BBOX, 111.7);
  },
};
export default art;
