// Render charge art to a contact sheet for checking.
//   node --experimental-strip-types --no-warnings scripts/art-sheet.ts eagle double_eagle -o out/art/sheet.svg
//   magick -density 96 out/art/sheet.svg out/art/sheet.png
// Each charge is shown large on three tincture pairs, plus small (as on a map).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Art, ArtColors } from "../src/art/types.ts";
import { TINCTURE, type Tincture } from "../src/heraldry/tincture.ts";

const args = process.argv.slice(2);
const oi = args.indexOf("-o");
const out = oi >= 0 ? args[oi + 1] : "out/art/sheet.svg";
const ids = args.filter((a, i) => a !== "-o" && (oi < 0 || i !== oi + 1));

const PAIRS: [Tincture, Tincture, Tincture][] = [
  ["gules", "or", "azure"], // field, body, armed
  ["azure", "argent", "gules"],
  ["argent", "sable", "or"],
];
const colors = (body: Tincture, armed: Tincture, under: Tincture): ArtColors => ({
  body: TINCTURE[body].svg,
  armed: TINCTURE[armed].svg,
  crown: TINCTURE[body === "or" ? "gules" : "or"].svg,
  hair: TINCTURE[body === "or" ? "gules" : "or"].svg,
  second: TINCTURE[body === "argent" ? "or" : "argent"].svg,
  detail: TINCTURE[under].svg,
  under: TINCTURE[under].svg,
  features: TINCTURE[body === "sable" ? "argent" : "sable"].svg,
});

const BIG = 220, SMALL = 48, GAP = 14, LABEL = 18;
let y = GAP;
let body = "";
for (const id of ids) {
  const art: Art = (await import(`../src/art/${id}.ts`)).default;
  const fit = (size: number) => (art.w >= art.h ? [size, (size * art.h) / art.w] : [(size * art.w) / art.h, size]);
  body += `<text x="${GAP}" y="${y + 13}" font-family="sans-serif" font-size="13">${id}  (${art.w}×${art.h})</text>`;
  y += LABEL;
  let x = GAP;
  for (const [f, b, a] of PAIRS) {
    const [w, h] = fit(BIG - 30);
    body += `<rect x="${x}" y="${y}" width="${BIG}" height="${BIG}" fill="${TINCTURE[f].svg}"/>`;
    body += `<svg x="${x + (BIG - w) / 2}" y="${y + (BIG - h) / 2}" width="${w}" height="${h}" viewBox="0 0 ${art.w} ${art.h}" preserveAspectRatio="none" overflow="visible">${art.draw(colors(b, a, f))}</svg>`;
    body += `<rect x="${x + (BIG - w) / 2}" y="${y + (BIG - h) / 2}" width="${w}" height="${h}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-dasharray="3 3"/>`;
    x += BIG + GAP;
  }
  for (const [f, b, a] of PAIRS) {
    const [w, h] = fit(SMALL - 6);
    body += `<rect x="${x}" y="${y}" width="${SMALL}" height="${SMALL}" fill="${TINCTURE[f].svg}"/>`;
    body += `<svg x="${x + (SMALL - w) / 2}" y="${y + (SMALL - h) / 2}" width="${w}" height="${h}" viewBox="0 0 ${art.w} ${art.h}" preserveAspectRatio="none" overflow="visible">${art.draw(colors(b, a, f))}</svg>`;
    x += SMALL + 6;
  }
  y += BIG + GAP;
}
const W = GAP + 3 * (BIG + GAP) + 3 * (SMALL + 6) + GAP;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}"><rect width="100%" height="100%" fill="#d8d2c4"/>${body}</svg>`);
console.log(`wrote ${out} (${ids.length} charges)`);
