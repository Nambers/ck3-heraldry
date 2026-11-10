// Key erect: ring bow at the top, long shaft, bit with wards at the foot turned to dexter.
import type { Art } from "./types.ts";
import { path, line } from "./style.ts";

const W = 38;
const CX = 19;

// ring bow (even-odd: the eye stays open)
const ring = (cx: number, cy: number, R: number, r: number) =>
  `M${cx - R},${cy} A${R},${R} 0 1 1 ${cx + R},${cy} A${R},${R} 0 1 1 ${cx - R},${cy} Z ` +
  `M${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} Z`;

const art: Art = {
  w: W,
  h: 100,
  draw: (c) => {
    // shaft with the bit (wards cut in from the dexter edge) and a small tip below
    const shaft =
      `M15.5,30 L22.5,30 L22.5,96 Q22.5,99.5 19,99.5 Q15.5,99.5 15.5,96 L15.5,93 ` +
      `L1.5,93 L1.5,85.5 L8,85.5 L8,80.5 L1.5,80.5 L1.5,73.5 L8,73.5 L8,68.5 L1.5,68.5 L1.5,63 L15.5,63 Z`;
    // collar below the bow
    const collar = `M12.5,35 L25.5,35 Q27,35 27,36.5 L27,39.5 Q27,41 25.5,41 L12.5,41 Q11,41 11,39.5 L11,36.5 Q11,35 12.5,35 Z`;
    return (
      path(shaft, c.body) +
      path(ring(CX, 18.6, 18.3, 9.8), c.body, 'fill-rule="evenodd"') +
      path(collar, c.body) +
      // pipe of the shaft
      line("M19,44 L19,60")
    );
  },
};
export default art;
