// Compact overview of many charges: one tile per charge on alternating tinctures.
//   node --experimental-strip-types --no-warnings scripts/art-grid.ts <ids...> -o out/art/grid.svg

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Art } from "../src/art/types.ts";
import { TINCTURE, type Tincture } from "../src/heraldry/tincture.ts";

const args = process.argv.slice(2);
const oi = args.indexOf("-o");
const out = oi >= 0 ? args[oi + 1] : "out/art/grid.svg";
const ids = args.filter((a, i) => a !== "-o" && (oi < 0 || i !== oi + 1));
const PAIRS: [Tincture, Tincture, Tincture][] = [["gules", "or", "azure"], ["azure", "argent", "gules"], ["argent", "sable", "or"], ["vert", "or", "gules"]];
const T = 150, COLS = 8;
let body = "";
for (const [i, id] of ids.entries()) {
  const art: Art = (await import(`../src/art/${id}.ts`)).default;
  const [f, b, a] = PAIRS[i % PAIRS.length];
  const x = (i % COLS) * T, y = Math.floor(i / COLS) * T;
  const s = T - 34;
  const [w, h] = art.w >= art.h ? [s, (s * art.h) / art.w] : [(s * art.w) / art.h, s];
  const C = (t: Tincture) => TINCTURE[t].svg;
  const colors = { body: C(b), armed: C(a), crown: C(b === "or" ? "gules" : "or"), hair: C(b === "or" ? "gules" : "or"), second: C(b === "argent" ? "or" : "argent"), detail: C(f), under: C(f), features: C(b === "sable" ? "argent" : "sable") };
  body += `<rect x="${x + 2}" y="${y + 2}" width="${T - 4}" height="${T - 4}" fill="${C(f)}"/>`;
  body += `<svg x="${x + (T - w) / 2}" y="${y + 8 + (s - h) / 2}" width="${w}" height="${h}" viewBox="0 0 ${art.w} ${art.h}" preserveAspectRatio="none" overflow="visible">${art.draw(colors)}</svg>`;
  body += `<text x="${x + T / 2}" y="${y + T - 8}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#fff" stroke="#000" stroke-width="2.5" paint-order="stroke">${id}</text>`;
}
const W = Math.min(ids.length, COLS) * T, H = Math.ceil(ids.length / COLS) * T;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#d8d2c4"/>${body}</svg>`);
console.log(`wrote ${out}`);
