// The crowned lion of "le Rey de Bugrie" in the Lord Marshal's Roll (c. 1295; the
// Hatton-Dugdale facsimile of c. 1640, Society of Antiquaries of London), taken one
// to one from the painting: its silver body, the ink of the face and the gold crown,
// turned once into blocks (raster/lion_manuscript.json). These are the blocks CK3 is
// given (charges.ts), drawn here as they will look in the game. No outline: the painting has none.
import type { Art, ArtColors } from "./types.ts";
import raster from "./raster/lion_manuscript.json" with { type: "json" };

const W = Math.round(raster.aspect * 1000) / 10;

/** halfway (or a share k) between two #rrggbb colours */
const blend = (a: string, b: string, k: number) => {
  const p = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return "#" + A.map((v, i) => Math.round(v * (1 - k) + B[i] * k).toString(16).padStart(2, "0")).join("");
};

function draw(c: ArtColors): string {
  const { n, layers } = raster.levels[0];
  const [x0, y0, x1, y1] = raster.box;
  const sx = W / ((x1 - x0) * n), sy = 100 / ((y1 - y0) * n);
  const ox = x0 * n, oy = y0 * n;
  const k = 0.2; // as in charges.ts: each block a little larger, so neighbours leave no seam
  // the same colours as the exporter: the soft edge between the charge and the field, the ink as the body darkened
  const paint: Record<string, string> = { edge: blend(c.body, c.under, 0.5), body: c.body, line: blend(c.body, c.features, 0.8), crown: c.crown };
  const f = (v: number) => Math.round(v * 100) / 100;
  return layers
    .map((l) => {
      const d = l.rects.map(([x, y, w, h]) => `M${f((x - k - ox) * sx)},${f((y - k - oy) * sy)}h${f((w + 2 * k) * sx)}v${f((h + 2 * k) * sy)}h${f(-(w + 2 * k) * sx)}z`).join("");
      return `<path d="${d}" fill="${paint[l.role]}"/>`;
    })
    .join("");
}

const art: Art = { w: W, h: 100, draw };
export default art;
