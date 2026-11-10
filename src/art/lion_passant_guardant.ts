import type { Art } from "./types.ts";
import { bone, fit, limb, lionFace, ln, paw, shape, tube, tuft, unite, ELBOW, xf } from "./_lion-parts.ts";

// Lion passant guardant (the "leopard" of England): walking to dexter, dexter
// forepaw raised, face turned to the viewer, tail raised and curled over the back.
const draw = (c: Parameters<Art["draw"]>[0]) => {
  const parts: string[] = [];
  const K = 1.05;
  const leg = (claws: string, ds: string[]) => parts.push(shape(claws, c.armed), unite(c.body, ds));

  // far hind leg, stepping forward
  {
    const p = paw(74.5, 95.4, 182, 1.15, { toes: [-32, 0, 32], claw: K });
    leg(p.claws, [...limb([[80, 54], [72, 72], [80, 85], [75, 95.4]], [18, 10, 7, 6.6], [-1, 0.6, 0]), p.pad]);
  }
  // far foreleg, raised
  {
    const p = paw(14.5, 60, 192, 1.15, { toes: [-38, 0, 38], claw: K });
    leg(p.claws, [...limb([[42, 58], [31, 71], [15, 60.5]], [15, 10, 6.4], [0, -1.2]), p.pad]);
  }
  // tail and body
  {
    const tail = tube(
      [[88, 46], [97, 42], [106, 36], [105.5, 25], [105, 13], [96, 6], [87, 7.5], [79, 9], [76, 14], [77.5, 20]],
      [6, 5, 4.6, 4.2],
    );
    const t = tuft(77.4, 19.4, 196, 1.12);
    const torso = [
      bone([29, 32], [42, 48], 24, 32, 0),
      bone([40, 52], [58, 54], 34, 26, 0),
      bone([58, 54], [73, 53], 26, 20, 0),
      bone([73, 53], [88, 49], 20, 27, 0),
    ];
    parts.push(unite(c.body, [tail, t.d, ...torso]), t.lines);
  }
  // near hind leg, stretched back
  {
    const p = paw(94, 95.4, 182, 1.15, { toes: [-32, 0, 32], claw: K });
    leg(p.claws, [...limb([[87, 50], [89.5, 71], [99.5, 85], [95, 95.4]], [24, 11, 7.4, 6.6], [-1.8, 0.6, 0]), p.pad]);
  }
  // near foreleg, standing
  {
    const p = paw(40.5, 95.4, 180, 1.15, { toes: [-32, 0, 32], claw: K });
    const elbow = xf(ELBOW, { x: 49, y: 77, rot: 160, s: 1.1 });
    leg(p.claws, [...limb([[48, 58], [45.5, 76], [42, 91]], [17, 10, 7], [0, 0.6]), elbow, p.pad]);
  }
  parts.push(
    ln("M 79,63 C 81,57 85,53 91,52.4"),
    ln("M 59,45 C 61.4,48.6 62.4,52 62.4,56.6"),
    ln("M 63.6,45.6 C 65.6,48.6 66.6,52 66.6,56"),
    ln("M 35,69 C 33,67 32.6,64.4 33.4,62"),
  );
  parts.push(lionFace(c, 24, 25, 1.2, { rOut: 19, skew: 5, n: 16 }));
  return parts.join("");
};

const art: Art = { w: 110, h: 100, draw: (c) => fit(draw(c), [0.5, 2.4, 108.2, 101], 110, 100) };
export default art;
