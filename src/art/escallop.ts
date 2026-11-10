// Escallop seen from outside: ears at the hinge, ribs fanning down to a scalloped edge.
import type { Art } from "./types.ts";
import { path, line } from "./style.ts";

const W = 99;
const CX = 49.5;
const APEX: [number, number] = [CX, 1];
// rim of the fan (notches between lobes) on an ellipse
const RCY = 48, RX = 45.5, RY = 47.5;
const N = 11; // lobes
const TMAX = (116 * Math.PI) / 180;
const LOBE = 3.8; // how far each lobe swells beyond the rim

const f = (n: number) => n.toFixed(2);
const rim = (t: number): [number, number] => [CX + RX * Math.sin(t), RCY + RY * Math.cos(t)];
// outward normal of the ellipse
const normal = (t: number): [number, number] => {
  const nx = Math.sin(t) / RX, ny = Math.cos(t) / RY;
  const l = Math.hypot(nx, ny);
  return [nx / l, ny / l];
};

const art: Art = {
  w: W,
  h: 100,
  draw: (c) => {
    const ts = Array.from({ length: N + 1 }, (_, i) => -TMAX + (2 * TMAX * i) / N);
    const pts = ts.map(rim);
    let d = `M${f(APEX[0])},${f(APEX[1])} L${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 0; i < N; i++) {
      const tm = (ts[i] + ts[i + 1]) / 2;
      const [mx, my] = rim(tm);
      const [nx, ny] = normal(tm);
      const tx = mx + nx * LOBE, ty = my + ny * LOBE;
      const chx = (pts[i][0] + pts[i + 1][0]) / 2, chy = (pts[i][1] + pts[i + 1][1]) / 2;
      // quadratic control so the curve's midpoint lands on the lobe crest
      const qx = 2 * tx - chx, qy = 2 * ty - chy;
      d += ` Q${f(qx)},${f(qy)} ${f(pts[i + 1][0])},${f(pts[i + 1][1])}`;
    }
    d += " Z";

    // ribs run from near the beak to every inner notch
    let ribs = "";
    for (let i = 1; i < N; i++) {
      const [x, y] = pts[i];
      const dx = x - APEX[0], dy = y - APEX[1];
      const l = Math.hypot(dx, dy);
      const s = 9 / l;
      ribs += `M${f(APEX[0] + dx * s)},${f(APEX[1] + dy * s)} L${f(x - dx * 0.02)},${f(y - dy * 0.02)} `;
    }

    // ears: wings on the hinge line, partly behind the fan
    const ears = `M${CX},3 L25.5,2 Q24,9.5 27.5,17 L71.5,17 Q75,9.5 73.5,2 Z`;
    return (
      path(ears, c.body) +
      line(`M${CX - 7},5 L27.5,5.5 M${CX - 7},7 L28,11 M${CX + 7},5 L71.5,5.5 M${CX + 7},7 L71,11`) +
      path(d, c.body) +
      line(ribs)
    );
  },
};
export default art;
