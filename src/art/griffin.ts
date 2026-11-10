import type { Art } from "./types.ts";
import { bone, featherWing, fit, limb, ln, paw, shape, talons, tube, tuft, unite, dot, ELBOW, xf, type Pt } from "./_lion-parts.ts";

// Griffin segreant: eagle's head (eared, beak open), raised wings and eagle's
// forelegs with talons; lion's hindquarters and tufted tail; facing dexter.
const draw = (c: Parameters<Art["draw"]>[0]) => {
  const parts: string[] = [];
  const K = 1.05;
  const leg = (claws: string, ds: string[], extra = "") => parts.push(shape(claws, c.armed), unite(c.body, ds), extra);

  // far wing
  parts.push(featherWing(c.body, { x: 46, y: 36, s: 0.6, rot: -30 }));
  // far hind leg (lion), raised
  {
    const p = paw(23, 80, 196, 1.05, { toes: [-36, 0, 36], claw: K });
    leg(p.claws, [...limb([[55, 66], [40, 68.5], [31.5, 77], [23.5, 80]], [15, 9, 6.4, 5.8], [-1.5, 0.6, 0]), p.pad]);
  }
  // far foreleg (eagle), raised high
  {
    const t = talons(16.5, 25.5, 222, 1.05);
    leg(t.claws, [...limb([[35, 31], [27, 38], [17, 26.5]], [10, 7, 4.4], [0, 1.4]), ...t.toes], t.lines);
  }
  // tail and body
  {
    const tail = tube(
      [[62, 72], [72, 77], [84, 73], [84, 64], [84, 57], [77, 56], [79, 50]],
      [5.6, 4.6, 4.2],
    );
    const t = tuft(79, 50.6, 4, 1.05);
    const torso = [
      bone([35, 17], [34, 33], 17, 21.5, -3.5),
      bone([34, 33], [49, 57], 21.5, 12, -2),
      bone([49, 57], [59, 69], 12, 18, 0.5),
    ];
    parts.push(unite(c.body, [tail, t.d, ...torso]), t.lines);
  }
  // near hind leg (lion), standing
  {
    const p = paw(55, 95.8, 182, 1.05, { toes: [-32, 0, 32], claw: K });
    leg(p.claws, [...limb([[60, 69], [51.5, 81], [60.5, 90], [55.5, 95.8]], [18, 9.5, 6.4, 5.8], [1.8, -0.8, 0]), p.pad]);
  }
  // near wing
  parts.push(featherWing(c.body, { x: 52, y: 40, s: 0.66, rot: -12 }));
  // near foreleg (eagle)
  {
    const t = talons(19.5, 51.6, 186, 1.1);
    const fringe = xf(ELBOW, { x: 37, y: 56, rot: 140, s: 1.1 });
    leg(t.claws, [...limb([[42, 41], [36.5, 52.5], [20.5, 51.6]], [11.5, 8.4, 4.6], [0, -1.2]), fringe, ...t.toes], t.lines);
  }
  parts.push(ln("M 52.4,76 C 52.6,71 55.6,66.6 61,65.4"), ln("M 41.6,63.4 C 43,65.4 43.4,68 42.6,70.6"), ln("M 28.6,82.2 C 27.4,80.4 27.2,78.4 28,76.4"));

  // feathered neck: pointed hackles over the shoulders
  {
    const E: Pt[] = [[44, 6], [48.5, 13], [51.5, 21], [53, 29], [52, 37], [47.5, 43], [41, 46.5], [34.5, 47], [29, 44], [25.5, 38.5], [25, 32], [27.5, 26]];
    const fringe = (pts: Pt[], out: number, lean: number) => {
      let d = "";
      const tips: Pt[] = [];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy);
        const nx = dy / len, ny = -dx / len;
        const tip: Pt = [(a[0] + b[0]) / 2 + nx * out + dx * lean, (a[1] + b[1]) / 2 + ny * out + dy * lean];
        tips.push(tip);
        d += ` Q ${a[0] + nx * out * 0.8},${a[1] + ny * out * 0.8} ${tip[0]},${tip[1]}`;
        d += ` Q ${(a[0] + b[0]) / 2 + dx * 0.25 + nx * out * 0.15},${(a[1] + b[1]) / 2 + dy * 0.25 + ny * out * 0.15} ${b[0]},${b[1]}`;
      }
      return { d, tips };
    };
    const f = fringe(E, 3.6, 0.32);
    parts.push(unite(c.body, [`M 30,8 L 44,6${f.d} L 30,22 Z`]));
    const H: Pt = [36, 20];
    for (let i = 1; i < E.length; i++) {
      const b = E[i];
      const q: Pt = [b[0] + (H[0] - b[0]) * 0.3, b[1] + (H[1] - b[1]) * 0.3];
      parts.push(ln(`M ${b[0]},${b[1]} Q ${(b[0] + q[0]) / 2 + 0.8},${(b[1] + q[1]) / 2} ${q[0]},${q[1]}`));
    }
  }
  // ear, beak, tongue, head
  const ear = "M 38.4,5.6 C 39,-0.6 42.8,-5.2 48.6,-7.2 C 48.2,-2 46,2.8 42.6,6.4 Z";
  const upper =
    "M 25,6.2 C 21.4,6 17.6,6.8 15.2,8.8 C 13.4,10.4 12.8,12.4 13.4,14.8 C 14,13.8 15,13.2 16.4,13 C 19.4,12.8 22.6,13 25.8,13.8 Z";
  const lower = "M 26.2,17 C 23.2,17.6 20.4,18.4 18,19.2 C 17,19.6 17.2,20.6 18.2,20.8 C 21,21.2 23.8,20.8 26.6,20 Z";
  const tongue = "M 26,15.2 C 22.8,15.2 19.8,15.6 17,16.4 C 16,16.7 15.2,16.5 14.6,16 C 15,17.3 16.2,18 17.6,17.8 C 20.4,17.4 23.2,17.2 26,17.2 Z";
  const head =
    "M 46.4,9.6 C 44.6,4.4 38.6,1.6 32,1.8 C 28.6,1.9 25.8,3.2 24,5.4 C 23.2,6.6 23.2,8 23.6,9.4 C 24.2,11.6 25.4,13.6 26.8,15 " +
    "C 27.4,15.8 27.2,16.8 26.6,17.6 C 26,19.6 26.8,21.6 28.4,22.8 C 31.6,25 36,25.2 40,24 C 44.6,22.2 47.4,15.4 46.4,9.6 Z";
  parts.push(
    unite(c.body, [ear]),
    ln("M 41.2,4.6 C 42.4,1.4 44.4,-1.4 46.8,-3.6"),
    shape(lower, c.armed),
    shape(tongue, c.armed),
    shape(upper, c.armed),
    unite(c.body, [head]),
    ln("M 23.8,6.4 C 25,7.4 25.4,9.2 25,11"),
    ln("M 18.2,8.6 C 19.4,8 20.6,7.9 21.6,8.2"),
    dot(31.2, 9.2, 1.1),
    ln("M 25.6,6.4 C 28.4,6.6 31.6,6.4 35.6,7.8"),
    ln("M 28.8,10.6 C 30.4,11.6 32.4,11.4 33.8,10.2"),
    ln("M 30,15.8 C 32.6,15.2 35,16.2 36.6,18.2"),
    ln("M 34,21.4 C 37.2,21 39.8,19.2 41.4,16.6"),
  );
  return parts.join("");
};

const art: Art = { w: 81, h: 100, draw: (c) => fit(draw(c), [2.6, -7.2, 87.8, 100.6], 81, 100) };
export default art;
