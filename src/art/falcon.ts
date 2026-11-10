// Falcon close (wings folded), standing, facing dexter; beak and legs armed.
import type { Art } from "./types.ts";
import { path, line, INK } from "./style.ts";
import { feather, toe } from "./_eagle-parts.ts";

const art: Art = {
  w: 76,
  h: 100,
  draw: (c) => {
    let s = "";
    // tail, behind everything
    s += feather([60, 69], 63, 29, 9, c.body, { bend: -1, round: true });
    s += feather([57, 69], 72, 28.6, 9, c.body, { bend: 0.5, round: true });
    // far leg
    s += toe([40, 93.6], 172, 6, 2.6, 3.6, -1, c.armed);
    s += toe([40, 93.6], 145, 5.4, 2.6, 3.4, -1, c.armed);
    s += toe([40, 93.6], 12, 4, 2.6, 3.2, 1, c.armed);
    s += path("M38,82 L42,82 L41.6,93.6 L38.4,93.6 Z", c.armed);
    s += line("M38.4,89 Q40,90 41.6,89");
    // near leg
    s += toe([25, 93.6], 186, 7.5, 3, 4, -1, c.armed);
    s += toe([25, 93.6], 160, 7, 3, 4, -1, c.armed);
    s += toe([25, 93.6], 8, 4.8, 3, 3.6, 1, c.armed);
    s += path("M23,80 L27.4,80 L27,93.8 L23.2,93.8 Z", c.armed);
    s += line("M23.2,88 Q25.2,89.2 27.2,88") + line("M23.2,91.6 Q25.2,92.8 27.2,91.6");
    // body with head
    s += path(
      "M13,7 C15,2.4 21,0.4 26,1 C30.6,1.6 33,4.6 33.2,8.6 C33.4,12 35,15 38.6,18.6 C48,27 60,40 64,54 C66.4,62 66,70 62,77 C56,83 46,85 38,83 C22,79 5,68 1.4,52 C-0.6,43 1.4,34 6,27 C8.4,22.4 10.6,19.4 12,17 Z",
      c.body,
    );
    // feathered thighs
    s += path("M18,72 C23,77 29,79.4 33,79 L32.4,86.4 L30,84.8 L28.4,88.2 L26.2,85 L24.2,88.4 L23,84 L20.2,85.6 C18.4,82 17.6,77 18,72 Z", c.body);
    s += path("M33.6,79 C38,80.4 43,80.4 46,78.6 L45,85.4 L43,84 L41.6,87 L39.8,84.4 L37.8,86.8 L36.6,83.4 Z", c.body);
    // breast feathers
    s += line("M7,36 q2,2.6 4,0 q2,2.6 4,0") + line("M4.6,44 q2,2.6 4,0 q2,2.6 4,0 q2,2.6 4,0");
    s += line("M4.6,52 q2,2.6 4,0 q2,2.6 4,0 q2,2.6 4,0") + line("M8,60 q2,2.6 4,0 q2,2.6 4,0 q2,2.6 4,0");
    // folded wing: long primaries towards the tip, coverts over their roots
    s += feather([56, 54], 72, 39, 9.5, c.body, { bend: -1.2 });
    s += feather([50, 53], 75, 38, 9.5, c.body, { bend: -1.2 });
    s += feather([44, 52], 78, 34, 9.5, c.body, { bend: -1.2 });
    s += path(
      "M34,18.6 C46,21 58,33 63.4,45 C66,51 67,57 67,63 L63.6,60 L61,64.6 L57.4,60.4 L54.4,64.8 L50.6,59.8 L47.4,63.4 L44,57.8 L40.4,60.2 L38.2,54.4 C30,49 24.4,42 24.4,34 C24.4,25 28,19.4 34,18.6 Z",
      c.body,
    );
    s += line("M28.6,30 q2.8,3.2 5.6,0 q2.8,3.2 5.6,0 q2.8,3.2 5.6,0");
    s += line("M27,40 q3,3.2 6,0 q3,3.2 6,0 q3,3.2 6,0 q3,3.2 6,0 q3,3.2 6,0");
    s += line("M40.4,52.4 L41,60") + line("M46,53.6 L47.2,63.2") + line("M52,54 L53.6,64.6") + line("M58,53 L59.6,64") + line("M63.4,50 L63.4,60");
    // beak, hooked, with the falcon's notch
    s += path("M13.2,6.6 C10,6.4 6.8,8.4 5.8,11.4 C5.2,13 5.6,15 6.6,16.2 C7,15 7.8,14.2 8.8,14 L9.6,13 L13,13.4 Z", c.armed);
    s += path("M12.6,14.2 L9.4,14.6 C9.8,15.8 11,16.6 12.8,16.2 Z", c.armed);
    s += line("M13,7.2 C12.2,9.2 12.2,11.4 12.8,13.2");
    // eye with brow and the dark moustache stripe
    s += `<circle cx="18" cy="8.6" r="2.3" fill="${c.body}" stroke="${INK}" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`;
    s += `<circle cx="17.8" cy="8.6" r="1.3" fill="${INK}"/>`;
    s += line("M14.6,6 Q18,4 22,6.2");
    s += line("M16.6,11.6 C15.8,14 15.8,16.8 17,19.2");
    s += line("M23,8 C26,10 29,10 32,8.6");
    return s;
  },
};
export default art;
