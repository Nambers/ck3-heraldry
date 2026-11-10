// Dexter hand appaumée, couped at the wrist: fingers up and together, thumb out to sinister
// (a right hand seen from the palm side has its thumb on the viewer's right).
import type { Art } from "./types.ts";
import { path, line } from "./style.ts";

const art: Art = {
  w: 54,
  h: 100,
  draw: (c) => {
    const hand =
      // wrist and the little-finger side of the palm
      "M8.5,99.5 C8,88 2,76 2,60 L2,29 " +
      // little, ring, middle and index fingers
      "A4.3,4.3 0 0 1 10.6,29 L10.6,13.5 A4.3,4.3 0 0 1 19.2,13.5 " +
      "L19.2,4.8 A4.3,4.3 0 0 1 27.8,4.8 L27.8,11.5 A4.3,4.3 0 0 1 36.4,11.5 L36.4,55 " +
      // thumb, ball of the thumb, wrist
      "C39,49 42.5,41 44.6,35.5 A4.6,4.6 0 0 1 53.5,38.5 C53.5,47 50.5,58 45.5,66 C41,73.5 36,82 34.5,99.5 Z";
    return (
      path(hand, c.body) +
      // fingers pressed together
      line("M10.6,29 L10.6,47 M19.2,13.5 L19.2,46 M27.8,11.5 L27.8,47") +
      // finger joints
      line("M3.5,40 Q6.3,41.5 9.1,40 M12.1,26 Q14.9,27.5 17.7,26 M20.7,18 Q23.5,19.5 26.3,18 M29.3,23.5 Q32.1,25 34.9,23.5") +
      // thumb joint, palm creases
      line("M42.5,44.5 Q47.5,45 52,48") +
      line("M36.4,60 C31.5,64.5 29,73 31,84") +
      line("M4,53 C10,55.5 17,55.5 23,52")
    );
  },
};
export default art;
