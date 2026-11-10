// Martlet: a swallow-like bird facing dexter, wings close, tail deeply forked,
// with tufts of feathers in place of feet. Body tincture only.
import type { Art } from "./types.ts";
import { path, line, INK } from "./style.ts";

const art: Art = {
  w: 141,
  h: 100,
  draw: (c) => {
    let s = "";
    // tufts of feathers instead of legs: a ragged, pointed tuft straight from the belly
    for (const x of [52, 70]) {
      s += path(
        `M${x - 5.4},70 L${x - 7.6},96.4 L${x - 3.6},88.6 L${x - 1.2},99.6 L${x + 1.6},88.6 L${x + 5.6},97 L${x + 5.4},70 Z`,
        c.body,
      );
      s += line(`M${x - 3},76 L${x - 5},90`) + line(`M${x + 0.2},76 L${x - 0.6},93`) + line(`M${x + 3},76 L${x + 4},90`);
    }
    // deeply forked tail
    s += path("M100,46 C113,48 127,50 140.8,50.4 C131,55.6 124,61 119.6,66.4 C125,72 131,80 136,92.4 C124,86 113,78 104,70 Z", c.body);
    s += line("M108,52 C118,53.4 128,54 135,53.6") + line("M110,68 C117,74 124,80 130,87.4");
    // head and body
    s += path(
      "M10,15 C11.6,6 18,1 26,1 C33,1 37.6,4.4 40,8.6 C43,12 47,14 52,16 C70,24 88,36 106,46 L109,66 C96,72 80,77.6 62,77.6 C44,77.6 28,68 18,54 C12,46 10,38 10.6,30 C10.6,26 10,22 9.6,19.6 Z",
      c.body,
    );
    // beak
    s += path("M10.6,13.8 L0.4,18.6 L9.8,22.4 Z", c.body);
    s += line("M10,18.4 L3.6,18.6");
    // eye, and the line of the throat
    s += `<circle cx="20.6" cy="11.4" r="2.3" fill="${INK}"/>`;
    s += line("M14,24.6 C17,28.6 22,30.6 28,30.4");
    // breast feathers
    s += line("M14,40 q2.4,3 4.8,0 q2.4,3 4.8,0") + line("M18,50 q2.4,3 4.8,0 q2.4,3 4.8,0 q2.4,3 4.8,0");
    s += line("M26,60 q2.4,3 4.8,0 q2.4,3 4.8,0 q2.4,3 4.8,0") + line("M40,68.6 q2.4,3 4.8,0 q2.4,3 4.8,0 q2.4,3 4.8,0 q2.4,3 4.8,0");
    // long folded wing reaching over the tail
    s += path("M29,20 C38,12 54,14 70,22 C90,32 110,46 132,60 C112,59 92,58 74,56 C54,54 38,48 31,38 C28,33 27.6,25 29,20 Z", c.body);
    s += line("M33.6,26 q3,3.6 6,0 q3,3.6 6,0 q3,3.6 6,0 q3,3.6 6,0");
    s += line("M33,36 q3.4,3.8 6.8,0 q3.4,3.8 6.8,0 q3.4,3.8 6.8,0 q3.4,3.8 6.8,0 q3.4,3.8 6.8,0");
    s += line("M68,30 C86,39 104,48 123,57.4") + line("M70,40 C86,46 102,52 117,57") + line("M70,48.6 C82,51.6 94,54 105,55.6");
    return s;
  },
};
export default art;
