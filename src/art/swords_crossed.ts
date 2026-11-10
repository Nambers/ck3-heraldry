// Two swords in saltire, points upward. As in the game texture, the grips are c.armed;
// blades, cross-guards and pommels are c.body.
import type { Art } from "./types.ts";
import { path, line, mirror, OUT } from "./style.ts";

const W = 102;
const K = 1.38; // scale of one sword (drawn 100 long) so it spans the diagonal
const PX = 0.5 + 5.5 * K, PY = 99.5 - 5.5 * K; // pommel centre on the field
const ANG = 44.8;

// one sword in local coordinates: pommel centre at the origin, point up the -y axis
const sword = (blade: string, hilt: string) => {
  const P = -93.5; // point
  const G = -25.5; // top of the cross-guard
  const bw = 4.3; // half-width of the blade at the guard
  const bladeD = `M0,${P} L${bw - 0.5},${P + 9} L${bw},${G + 1} L${-bw},${G + 1} L${-bw + 0.5},${P + 9} Z`;
  const guard =
    `M-11,${G} L11,${G} Q13.5,${G} 13.5,${G + 3} Q13.5,${G + 6} 11,${G + 6} L-11,${G + 6} ` +
    `Q-13.5,${G + 6} -13.5,${G + 3} Q-13.5,${G} -11,${G} Z`;
  const grip = `M-3,${G + 6} L3,${G + 6} L3.4,-4.5 L-3.4,-4.5 Z`;
  return (
    `<g transform="translate(${PX} ${PY}) rotate(${ANG}) scale(${K})">` +
    path(bladeD, blade) +
    line(`M0,${P + 10} L0,${G - 3}`) +
    path(grip, hilt) +
    line(`M-3,${G + 11} L3,${G + 9} M-3,${G + 15} L3,${G + 13}`) +
    path(guard, blade) +
    `<circle cx="0" cy="0" r="5.5" fill="${blade}" ${OUT}/>` +
    `<circle cx="0" cy="0" r="2.2" fill="none" ${OUT}/>` +
    `</g>`
  );
};

const art: Art = {
  w: W,
  h: 100,
  draw: (c) => mirror(W, sword(c.body, c.armed)) + sword(c.body, c.armed),
};
export default art;
