import type { Art } from "./types.ts";
import { OUT } from "./style.ts";
import { bone, featherWing, fit, limb, lionHead, ln, paw, shape, tube, tuft, unite, ELBOW, xf } from "./_lion-parts.ts";

// Winged lion of St Mark: passant to dexter, haloed, wings raised, the dexter
// forepaw resting on an open book standing before it.
const draw = (c: Parameters<Art["draw"]>[0]) => {
  const parts: string[] = [];
  const K = 1.05;
  const leg = (claws: string, ds: string[]) => parts.push(shape(claws, c.armed), unite(c.body, ds));

  // halo behind the head: a ring
  parts.push(
    `<path d="M 39,0.4 A 17.6,17.6 0 1 1 38.99,0.4 Z M 39,4 A 14,14 0 1 0 39.01,4 Z" fill="${c.body}" fill-rule="evenodd" ${OUT}/>`,
  );
  // far wing
  parts.push(featherWing(c.body, { x: 67, y: 49, s: 0.78, rot: -10 }));
  // far hind leg
  {
    const p = paw(96, 95.4, 182, 1.15, { toes: [-32, 0, 32], claw: K });
    leg(p.claws, [...limb([[100, 58], [93, 76], [101, 87], [96.5, 95.4]], [17, 9.5, 7, 6.6], [-1, 0.6, 0]), p.pad]);
  }
  // far foreleg, resting on the book
  {
    const p = paw(23, 60, 172, 1.15, { toes: [-36, 0, 36], claw: K, curl: 1 });
    leg(p.claws, [...limb([[54, 62], [41, 73], [23.5, 60.5]], [15, 10, 6.6], [0, -1.4]), p.pad]);
  }
  // tail and body
  {
    const tail = tube(
      [[110, 52], [124, 50], [137, 45], [137, 35], [137, 25], [127, 22], [128, 14]],
      [5.8, 4.8, 4.2],
    );
    const t = tuft(128, 14.5, -12, 1.1);
    const torso = [
      bone([44, 38], [54, 54], 22, 30, 0),
      bone([52, 58], [72, 60], 32, 24, 0),
      bone([72, 60], [90, 58], 24, 18, 0),
      bone([90, 58], [108, 55], 18, 26, 0),
    ];
    parts.push(unite(c.body, [tail, t.d, ...torso]), t.lines);
  }
  // near hind leg
  {
    const p = paw(115.5, 95.4, 182, 1.15, { toes: [-32, 0, 32], claw: K });
    leg(p.claws, [...limb([[107, 56], [110, 76], [120.5, 87], [116, 95.4]], [24, 11, 7.4, 6.6], [-1.8, 0.6, 0]), p.pad]);
  }
  // near foreleg, standing
  {
    const p = paw(55.5, 95.4, 180, 1.15, { toes: [-32, 0, 32], claw: K });
    const elbow = xf(ELBOW, { x: 63, y: 79, rot: 160, s: 1.1 });
    leg(p.claws, [...limb([[62, 62], [60, 79], [57, 91]], [17, 10, 7], [0, 0.6]), elbow, p.pad]);
  }
  parts.push(ln("M 100,68 C 102,62 106,58 112,57"), ln("M 78,52 C 80,55 81,58 81,62"), ln("M 82.6,52.4 C 84.6,55 85.6,58 85.6,61.4"));
  // near wing
  parts.push(featherWing(c.body, { x: 79, y: 51, s: 0.8, rot: 8 }));
  // head and mane
  parts.push(lionHead(c, { x: 10, y: 6, s: 0.95 }));
  // the open book, standing
  {
    const book =
      "M 1,68 C 6,65 10.5,65 14,68 C 17.5,65 22,65 27,68 L 27,97 C 22,94.6 17.5,94.6 14,97 C 10.5,94.6 6,94.6 1,97 Z";
    const text = [72, 77, 82, 87].flatMap((y) => [`M 4,${y} C 7,${y - 1.4} 9.5,${y - 1.4} 11.6,${y}`, `M 16.4,${y} C 18.5,${y - 1.4} 21,${y - 1.4} 24,${y}`]);
    parts.push(shape(book, c.second), ln("M 14,68 L 14,97"), ...text.map(ln));
  }
  return parts.join("");
};

const art: Art = { w: 139, h: 100, draw: (c) => fit(draw(c), [0.9, 0.3, 139.6, 101], 139, 100) };
export default art;
