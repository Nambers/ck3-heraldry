// Maiden-eagle (Jungfrauenadler): the eagle of eagle.ts whose head is a crowned
// woman's head seen from the front, her hair falling in two locks to the shoulders.
// The head is the CK3 recipe in charges.ts drawn part for part at the same places
// (texture space): hair, two locks, face, eyes, brows, nose, mouth, crown.
import type { Art, ArtColors } from "./types.ts";
import { OUT, inBox } from "./style.ts";
import { crown } from "./_eagle-parts.ts";
import { eagleTex } from "./eagle.ts";

const BBOX = [0.184, 0.05, 0.816, 0.855] as const;

/** an outlined ellipse with the recipe's centre and size (texture units / 100) */
const oval = (u: number, v: number, w: number, h: number, fill: string) =>
  `<ellipse cx="${u * 100}" cy="${v * 100}" rx="${w * 50}" ry="${h * 50}" fill="${fill}" ${OUT}/>`;
/** a facial feature: a flat shape without outline, like the small vanilla pieces in game */
const dot = (u: number, v: number, w: number, h: number, fill: string) =>
  `<ellipse cx="${u * 100}" cy="${v * 100}" rx="${w * 50}" ry="${h * 50}" fill="${fill}"/>`;
const bar = (u: number, v: number, w: number, h: number, fill: string) =>
  `<rect x="${(u - w / 2) * 100}" y="${(v - h / 2) * 100}" width="${w * 100}" height="${h * 100}" fill="${fill}"/>`;

function maidenHead(c: ArtColors): string {
  return [
    oval(0.432, 0.25, 0.055, 0.11, c.hair),
    oval(0.568, 0.25, 0.055, 0.11, c.hair),
    oval(0.5, 0.165, 0.225, 0.18, c.hair),
    oval(0.5, 0.195, 0.1, 0.125, c.body),
    dot(0.481, 0.188, 0.016, 0.01, c.features),
    dot(0.519, 0.188, 0.016, 0.01, c.features),
    bar(0.481, 0.1775, 0.018, 0.003, c.features),
    bar(0.519, 0.1775, 0.018, 0.003, c.features),
    bar(0.5, 0.204, 0.004, 0.02, c.features),
    dot(0.5, 0.231, 0.022, 0.006, c.features),
    // a small, low crown like ce_crown_small (about 11 wide and 6 high), its base on the hair
    `<g transform="translate(50 10.6) scale(0.63 0.47)">${crown(c.crown)}</g>`,
  ].join("");
}

const art: Art = {
  w: 78.5,
  h: 100,
  draw: (c) => inBox(eagleTex(c, "") + maidenHead(c), BBOX, 78.5),
};
export default art;
