// Swan as CK3 draws it (ce_swan): rising, the neck rearing up and arching over so
// the head hangs to dexter, the wings raised in a fan to sinister, walking on two
// webbed feet. Beak, eye, legs and feet armed. Drawn in texture space.
import type { Art } from "./types.ts";
import { path, line, inBox, OUT } from "./style.ts";
import { feather, tube, type P } from "./_eagle-parts.ts";

const BBOX = [0.16, 0.078, 0.898, 0.93] as const;

/** a feather from base b to tip t, width wd */
const quill = (b: P, t: P, wd: number, fill: string, bend = 0) => {
  const a = (Math.atan2(t[1] - b[1], t[0] - b[0]) * 180) / Math.PI;
  return feather(b, a, Math.hypot(t[0] - b[0], t[1] - b[1]), wd, fill, { bend });
};

const art: Art = {
  w: 86.6,
  h: 100,
  draw: (c) => {
    let s = "";
    // the far wing: two long pinions rising behind
    s += quill([52, 34], [71, 8.4], 7.6, c.body, 1) + quill([56, 36], [88.6, 11.8], 7.6, c.body, 1.2);
    // the near wing: a fan whose tips run down the sinister side
    const fan: [P, P, number][] = [
      [[52, 40], [86, 20], 8.4], [[52, 43], [82.6, 31], 8.4], [[52, 46], [76, 41.6], 8.2], [[54, 49], [80.6, 56.4], 8],
      [[54, 52], [78.6, 61.6], 7.8], [[54, 55], [76.4, 66.6], 7.6],
    ];
    for (const [b, t, w] of fan) s += quill(b, t, w, c.body, 0.8);
    // coverts over the roots of the feathers
    s += path("M45.6,52 C44.6,40 45.4,27 50,19.6 C55,13.6 62,12.6 68,14.6 C66,24 62.6,34 61,44 C59.4,52 54,57 48,57 Z", c.body);
    s += line("M48,26 q2.6,3 5.2,0 q2.6,3 5.2,0") + line("M47,35 q2.6,3 5.2,0 q2.6,3 5.2,0") + line("M47,44 q2.6,3 5.2,0 q2.6,3 5.2,0");
    // the hind leg and foot (armed), behind the body
    s += path(tube([56.4, 72], [[[55, 76.6], [53.6, 80.4], [51.6, 84]]], [3.6, 3]), c.armed);
    s += path("M52.4,83 L39.6,86.4 L42.6,88.6 L38.4,92.8 L46.2,90.8 L44.6,93 L56,86 Z", c.armed);
    // body: a full breast to dexter, the tail to sinister
    s += path("M31,47 C25,50 24.4,58.6 27.6,64.4 C31.4,70.6 41,73.4 52,73.2 L59,73 L68.4,71.6 L61,66.4 C59,58.6 53.6,51 45.4,48 C40,46 35,45.4 31,47 Z", c.body);
    s += line("M29,62 C34,67.6 42,70 51,70") + line("M55,71.4 L63,70.4");
    // the near leg and foot
    s += path(tube([38.2, 65.8], [[[36, 68], [33.6, 70], [31.4, 71.4]]], [3.8, 3.2]), c.armed);
    s += path("M32.4,69.6 L17.6,67.8 L20.8,71.8 L17.6,75.2 L24.6,74.8 L22.2,80.4 L34,73.2 Z", c.armed);
    // the neck rears up on the sinister side of the head, then arches over
    s += path(tube([31.6, 51], [[[33.6, 45], [38.6, 40.6], [38.2, 33.6]], [[37.8, 26.4], [34.6, 21], [29.6, 20.8]]], [10, 7.4]), c.body);
    // the head hanging to dexter, the beak pointing down
    s += path("M21.4,25.6 C21,21.6 24.2,19.6 28,19.8 C31.6,20 33.6,22.6 32.8,25.6 C32,28.6 28.6,30 25.4,29.6 C23.2,29.2 21.6,27.8 21.4,25.6 Z", c.body);
    s += path("M23.6,26.4 C21.4,28.4 18.6,31.4 16.2,35.4 C19.6,34.8 23.2,32.8 26.2,29.6 Z", c.armed);
    s += `<circle cx="26" cy="24.4" r="1.2" fill="${c.armed}" ${OUT}/>`;
    return inBox(s, BBOX, 86.6);
  },
};
export default art;
