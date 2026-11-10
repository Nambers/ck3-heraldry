import type { Art } from "./types.ts";
import { bone, edge, fit, limb, ln, shape, talons, tube, unite, dot, xf, type Place, type Pt } from "./_lion-parts.ts";

// Heraldic dragon segreant: four eagle-footed legs, bat's wings raised, barbed
// tongue, scaled belly and a long tail ending in a barb; facing dexter.

/** a bat's wing: root at the shoulder (0,0), rising and spreading to +x */
const batWing = (fill: string, P: Place) => {
  const X = (d: string) => xf(d, P);
  const W: Pt = [16, -34]; // wrist
  const tips: Pt[] = [[30, -38], [39, -26], [40, -10], [32, 2]];
  const ribs = tips.map((t) => `M ${W[0]},${W[1]} Q ${(W[0] + t[0]) / 2 + 1.5},${(W[1] + t[1]) / 2 - 1.5} ${t[0]},${t[1]}`);
  let mem = `M 0,4 L 7,-16 L ${W[0]},${W[1]} L ${tips[0][0]},${tips[0][1]}`;
  for (let i = 1; i < tips.length; i++) {
    const a = tips[i - 1], b = tips[i];
    // edge scalloped inward toward the wrist
    const m: Pt = [(a[0] + b[0]) / 2 + (W[0] - (a[0] + b[0]) / 2) * 0.42, (a[1] + b[1]) / 2 + (W[1] - (a[1] + b[1]) / 2) * 0.42];
    mem += ` Q ${m[0]},${m[1]} ${b[0]},${b[1]}`;
  }
  const last = tips[tips.length - 1];
  mem += ` Q ${(last[0] + 12) / 2 + 2},${(last[1] + 10) / 2 - 6} 12,10 Z`;
  const arm = [bone([0, 2], [7, -16], 4.6, 3.4, 0), bone([7, -16], [W[0], W[1]], 3.4, 2.8, -1)];
  const thumb = `M ${W[0] - 1.4},${W[1] - 0.8} C ${W[0] - 2.4},${W[1] - 3.6} ${W[0] - 1.6},${W[1] - 6} ${W[0] + 0.6},${W[1] - 7.4} C ${W[0] + 0.4},${W[1] - 5.2} ${W[0] + 1},${W[1] - 3.2} ${W[0] + 1.8},${W[1] - 1.2} Z`;
  return [
    unite(fill, [X(mem)]),
    ...ribs.map((r) => edge(X(r))),
    unite(fill, [X(thumb), ...arm.map(X)]),
  ].join("");
};

const draw = (c: Parameters<Art["draw"]>[0]) => {
  const parts: string[] = [];
  const leg = (claws: string, ds: string[], extra = "") => parts.push(shape(claws, c.armed), unite(c.body, ds), extra);

  // far wing
  parts.push(batWing(c.body, { x: 50, y: 38, s: 0.85, rot: -10 }));
  // far hind leg, raised
  {
    const t = talons(22.5, 80.5, 196, 1.1);
    leg(t.claws, [...limb([[55, 66], [40, 68.5], [31.5, 77], [23.5, 80.5]], [15, 9, 6, 4.8], [-1.5, 0.6, 0]), ...t.toes], t.lines);
  }
  // far foreleg, raised high
  {
    const t = talons(16.5, 25.5, 222, 1.05);
    leg(t.claws, [...limb([[36, 31], [28, 38], [17.5, 26.5]], [9.5, 6.8, 4.2], [0, 1.4]), ...t.toes], t.lines);
  }
  // tail, ending in a barb
  const tailPts: Pt[] = [[62, 72], [77, 85], [96, 83], [96, 70], [96, 58], [82, 55], [81.5, 64.5]];
  const tail = tube(tailPts, [6.4, 4.6, 3]);
  const barb = xf("M -1.6,0 L -3.4,-4.6 L 6.6,0 L -3.4,4.6 Z", { x: 81.5, y: 64, rot: 93, s: 1.05 });
  // body
  const torso = [
    bone([40, 14], [38, 33], 13, 19, -3),
    bone([38, 33], [50, 57], 20, 13, -2),
    bone([50, 57], [59, 69], 13, 18, 0.5),
  ];
  parts.push(unite(c.body, [tail, barb, ...torso]));
  // dorsal spines along the neck
  {
    const spine: Pt[] = [[42, 6], [46.5, 12.5], [49, 20], [50.5, 28], [51, 36]];
    let d = "";
    for (let i = 1; i < spine.length; i++) {
      const a = spine[i - 1], b = spine[i];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      d += `M ${a[0] - (dy / len) * -0.5},${a[1]} L ${(a[0] + b[0]) / 2 + (dy / len) * 4.6 + dx * 0.2},${(a[1] + b[1]) / 2 - (dx / len) * 4.6 + dy * 0.2} L ${b[0]},${b[1]} Z `;
    }
    parts.push(shape(d, c.body));
  }
  // near hind leg, standing
  {
    const t = talons(56, 95.2, 182, 1.15);
    leg(t.claws, [...limb([[60, 69], [51.5, 81], [60.5, 90], [56.5, 95.2]], [18, 9.5, 6, 5], [1.8, -0.8, 0]), ...t.toes], t.lines);
  }
  // near wing
  parts.push(batWing(c.body, { x: 56, y: 40, s: 0.95, rot: 0 }));
  // near foreleg
  {
    const t = talons(19.5, 51.6, 186, 1.1);
    leg(t.claws, [...limb([[42, 41], [36.5, 52.5], [20.5, 51.6]], [10.5, 7.6, 4.4], [0, -1.2]), ...t.toes], t.lines);
  }
  // belly scutes and scales
  parts.push(
    ...[[28.6, 36, 33, 35.4], [29.6, 41, 34.4, 39.6], [32.4, 46.6, 37, 44.4], [36.4, 52, 40.6, 49.4], [40.4, 57, 44.4, 54], [44, 62.4, 48, 59.4]].map(
      ([x1, y1, x2, y2]) => ln(`M ${x1},${y1} Q ${(x1 + x2) / 2 + 0.6},${(y1 + y2) / 2 + 1.6} ${x2},${y2}`),
    ),
    ln("M 30,31 C 31,40 36,50 45,60"),
    ...[[46, 46], [50, 50], [47, 54], [52, 61], [56, 64]].map(([x, y]) => ln(`M ${x - 1.8},${y - 1} Q ${x},${y + 1.6} ${x + 1.8},${y - 1}`)),
    ln("M 52.4,76 C 52.6,71 55.6,66.6 61,65.4"),
    ln("M 41.6,63.4 C 43,65.4 43.4,68 42.6,70.6"),
  );
  // head: horn, lower jaw, tongue, upper head
  const horn = "M 36.6,4.6 C 40,0.6 45,-1 50.6,-0.6 C 46.6,1.4 43.6,4.4 41.6,8.4 Z";
  const lower = "M 31,15.6 C 25,16.8 18,18.8 12,20.8 C 10.4,21.4 10.4,23.4 12,23.8 C 18,24.6 25,24 32,21.6 Z";
  const tongueBody = tube([[28, 17.6], [21, 17.2], [14, 18.4], [5, 16.6]], [2, 1.6]);
  const tongueBarb = "M 7.2,13.2 L 0.4,16.6 L 7.2,20 L 5.4,16.6 Z";
  const head =
    "M 42,8 C 39,3 32,1.4 26,3 C 21,4.4 15,6.2 9.8,7 C 7.6,7.3 6,8.2 5.6,9.8 C 5.4,11.2 6.4,12.2 8,12.4 " +
    "C 14,12.6 22,13.2 30,14.6 C 32.6,15.2 32.6,16.6 31.6,17.6 C 31,19.6 32,22 34,23 C 38,24.6 42.6,22 44,17.6 C 45,14.2 44.4,10.6 42,8 Z";
  const teeth = [
    "M 12,12.4 L 13,14.8 L 14.2,12.5 Z", "M 17,12.7 L 18,15 L 19.2,12.9 Z", "M 22,13.1 L 23,15.2 L 24.2,13.4 Z",
    "M 14,20.2 L 15,18 L 16.2,19.8 Z", "M 19,18.8 L 20,16.8 L 21.2,18.4 Z",
  ];
  parts.push(
    unite(c.body, [horn]),
    ln("M 40,4.4 C 43,2.2 46,1.2 48.6,0.6"),
    shape(lower, c.body),
    unite(c.armed, [tongueBody, tongueBarb]),
    unite(c.body, [head]),
    ...teeth.map((t) => shape(t, c.body)),
    dot(29, 7.4, 1),
    ln("M 25.6,5.4 C 28,4.2 31,4.4 33.4,6"),
    ln("M 7.6,8.8 C 8.4,8.4 9.4,8.4 10.2,9"),
    ln("M 31.6,17.6 C 34,17 36.4,18 38,20"),
    ln("M 20,7.8 C 22,7.2 24,7 26,7.4"),
  );
  return parts.join("");
};

const art: Art = { w: 94, h: 100, draw: (c) => fit(draw(c), [0.2, -0.8, 98.5, 103.3], 94, 100) };
export default art;
