// Shared drawing style for charge art: flat tinctures, a dark outline, and thin
// inner lines for feathers, muscles and folds — the look of a classic armorial.

export const INK = "#151311";

/** attributes for filled shapes: dark outline that keeps its width when scaled */
export const OUT = `stroke="${INK}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"`;

/** attributes for inner detail lines (no fill) */
export const LINE = `fill="none" stroke="${INK}" stroke-width="0.8" stroke-opacity="0.75" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;

/** a filled path with outline */
export const path = (d: string, fill: string, extra = "") => `<path d="${d}" fill="${fill}" ${OUT}${extra ? " " + extra : ""}/>`;

/** an inner detail line */
export const line = (d: string) => `<path d="${d}" ${LINE}/>`;

/**
 * Enlarge every subpath of an absolute M/C/L/Z path by `k` about the middle of its
 * base (the midpoint of its first and last points): small claws drawn as separate
 * subpaths grow from where they meet the paw.
 */
export const grow = (d: string, k: number) =>
  d.replace(/M[^M]*/g, (sub) => {
    const nums = (sub.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    const n = nums.length;
    const bx = (nums[0] + nums[n - 2]) / 2, by = (nums[1] + nums[n - 1]) / 2;
    let i = 0;
    return sub.replace(/-?\d*\.?\d+/g, (v) => {
      const out = i % 2 === 0 ? bx + (Number(v) - bx) * k : by + (Number(v) - by) * k;
      i++;
      return (Math.round(out * 100) / 100).toString();
    });
  });

/**
 * Fit a drawing made in the game texture's own coordinates (0..100 on both axes)
 * to the art box: `bbox` is the texture's visible area (as in charges.ts), mapped
 * onto 0..w × 0..100. Drawing in texture space keeps each part where the game has it.
 */
export const inBox = (inner: string, bbox: readonly [number, number, number, number], w: number) => {
  const [x0, y0, x1, y1] = bbox;
  const sx = w / ((x1 - x0) * 100), sy = 100 / ((y1 - y0) * 100);
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return `<g transform="translate(${r(-x0 * 100 * sx)} ${r(-y0 * 100 * sy)}) scale(${r(sx)} ${r(sy)})">${inner}</g>`;
};

/** mirror an SVG fragment horizontally inside a viewBox of width w */
export const mirror = (w: number, inner: string) => `<g transform="translate(${w} 0) scale(-1 1)">${inner}</g>`;
