// Eagle displayed as CK3 draws it (ce_eagle): the German manner, wings spread to the
// sides with long fingered pinions, the uppermost turned up; legs splayed with open
// talons; a fanned tail; the head turned to dexter. Drawn in texture space (0..100).
// eagleTex() is shared with eagle_crowned and maiden_eagle.
import type { Art, ArtColors } from "./types.ts";
import { path, line, mirror, inBox } from "./style.ts";
import { wing, leg, eagleHead, feather, symmetric, type P } from "./_eagle-parts.ts";

export const EAGLE_BBOX = [0.184, 0.102, 0.816, 0.855] as const;

/**
 * Wings, legs, tail and body of a single-headed eagle in texture space, without the
 * head; `neck` is drawn over the wings and under the head (pass "" to leave it out).
 */
export function eagleTex(c: ArtColors, neck: string): string {
  let half = "";
  half += wing(
    {
      arm: [[45, 33], [40, 30], [35, 27], [30.5, 21.6]],
      armW: [5.6, 3.6],
      pinions: [
        [1.0, [20.4, 13.6]],
        [0.86, [17.6, 23.6]],
        [0.7, [18.4, 35.6]],
        [0.54, [20.6, 47.4]],
        [0.38, [24, 55.6]],
        [0.22, [27.6, 60.4]],
      ],
      wd: 5.4,
      cov: 0.3,
      bend: 1.6,
    },
    c.body,
  );
  half += leg({ hip: [44.6, 56], knee: [38.4, 58.6], ankle: [33.6, 60.2], thigh: [4.6, 3.8], shank: 3, toe: [5.4, 1.9, 2.6], toes: [196, 160, 124, 320] }, c.body, c.armed);
  let s = "";
  // the tail: a fan of five feathers, the middle one longest
  const tail = (tip: P, w: number, bend: number) => {
    const b: P = [50, 64];
    return feather(b, (Math.atan2(tip[1] - b[1], tip[0] - b[0]) * 180) / Math.PI, Math.hypot(tip[0] - b[0], tip[1] - b[1]), w, c.body, { bend });
  };
  s += tail([36, 71.4], 6.4, 1.6) + tail([64, 71.4], 6.4, -1.6) + tail([42.6, 79.4], 6.8, 1) + tail([57.4, 79.4], 6.8, -1) + tail([50, 85.4], 7.4, 0);
  s += half + mirror(100, half);
  s += neck;
  // the body, narrow below the wings
  s += path(
    symmetric(50, [50, 24], [
      [[45.6, 25], [42.4, 30], [42.4, 37]],
      [[42.4, 44], [44.6, 52], [45.6, 58]],
      [[46.4, 64], [48.4, 69], [50, 69]],
    ]),
    c.body,
  );
  s += line("M45.6,38 q2.2,2.6 4.4,0 q2.2,2.6 4.4,0") + line("M44.6,46 q2.6,2.8 5.4,0 q2.6,2.8 5.4,0") + line("M45.4,54 q2.3,2.6 4.6,0 q2.3,2.6 4.6,0");
  return s;
}

/** the neck rising to a head turned to dexter, ruffled at the back (texture space) */
export const eagleNeckTex = (c: ArtColors) =>
  path("M44.6,32 C45.4,27 47,22.6 48.4,19 L56.2,19 C57.2,21.6 58,24.6 57.8,27 L59,28.6 L57.2,29.6 L57.8,31.6 L55.6,32.4 Z", c.body) +
  line("M55.6,22.4 Q54,24 52.4,22.8") +
  line("M56,27.4 Q54.4,29 52.8,27.8");

/** the head, turned to dexter: skull at about (51.4, 16), beak tip near x 40 */
export const eagleHeadTex = (c: ArtColors) => `<g transform="translate(51.4 16) scale(0.78)">${eagleHead(c.body, c.armed)}</g>`;

const art: Art = {
  w: 83.9,
  h: 100,
  draw: (c) => inBox(eagleTex(c, eagleNeckTex(c)) + eagleHeadTex(c), EAGLE_BBOX, 83.9),
};
export default art;
