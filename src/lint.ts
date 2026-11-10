// Layout lint: finds charges that overlap each other or something they do not
// lie on, or that are cut off by the edge of the shield. Measured on the same
// layout nodes both renderers use, by sampling points inside each charge's box.

import type { Arms } from "./heraldry/ast.ts";
import { CHIEF_INDENTED, layout, ordinaryPolys, type Box, type LNode } from "./layout.ts";

type Pt = [number, number];

export interface LintIssue {
  kind: "charge-overlap" | "covers-chief" | "covers-canton" | "on-ordinary" | "under-brisure" | "under-escutcheon" | "cut-off";
  a: string;
  b?: string;
  /** fraction of the smaller box affected */
  amount: number;
}

function inPoly([x, y]: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

/** the shield outline used by our renderers (SHIELD_PATH in 0..1) */
const SHIELD: Pt[] = [
  [0.02, 0], [0.98, 0], [1, 0.02], [1, 0.56],
  ...bezier([1, 0.56], [1, 0.79], [0.79, 0.94], [0.5, 1], 10),
  ...bezier([0.5, 1], [0.21, 0.94], [0, 0.79], [0, 0.56], 10),
  [0, 0.02],
];

/** a heater-shaped escutcheon inside a box */
function heater(b: Box): Pt[] {
  const p = (x: number, y: number): Pt => [b.x + x * b.w, b.y + y * b.h];
  return [p(0, 0), p(1, 0), p(1, 0.45), ...bezier(p(1, 0.45), p(1, 0.75), p(0.75, 0.92), p(0.5, 1), 8), ...bezier(p(0.5, 1), p(0.25, 0.92), p(0, 0.75), p(0, 0.45), 8)];
}

/** points sampled inside the middle of a charge's box (charges rarely fill their corners) */
function samples(b: Box, n = 9): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const u = (i + 0.5) / n, v = (j + 0.5) / n;
      // skip the corners: an inscribed ellipse approximates the silhouette better
      if ((u - 0.5) ** 2 + (v - 0.5) ** 2 > 0.25) continue;
      pts.push([b.x + u * b.w, b.y + v * b.h]);
    }
  return pts;
}

const frac = (pts: Pt[], test: (p: Pt) => boolean) => pts.filter(test).length / pts.length;
const inBox = (b: Box) => ([x, y]: Pt) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

const LIMIT = { overlap: 0.08, region: 0.08, cut: 0.12 };

function lintNodes(nodes: LNode[], outline: Pt[], issues: LintIssue[]) {
  const charges = nodes.filter((n): n is Extract<LNode, { type: "charge" }> => n.type === "charge");
  const field = charges.filter((c) => c.on === "field" || c.on === "brisure");
  const name = (c: Extract<LNode, { type: "charge" }>) => `${c.charge.id}@${c.on}`;

  // charges on the same surface must not overlap each other
  for (const group of ["field", "chief", "canton", "ordinary"] as const) {
    const g = charges.filter((c) => (group === "field" ? c.on === "field" || c.on === "brisure" : c.on === group));
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++) {
        const a = samples(g[i].box), b = samples(g[j].box);
        const amount = Math.max(frac(a, inBox(g[j].box)), frac(b, inBox(g[i].box)));
        if (amount > LIMIT.overlap) issues.push({ kind: "charge-overlap", a: name(g[i]), b: name(g[j]), amount });
      }
  }
  // field charges must stay off chiefs, cantons, ordinaries, the brisure band and escutcheons
  for (const c of field) {
    const pts = samples(c.box);
    for (const n of nodes) {
      if (n.type === "rect" && !n.bg) {
        // an indented chief's teeth reach below its box
        const region = n.line && n.area ? { ...n.box, h: CHIEF_INDENTED.tips * n.area.h } : n.box;
        const amount = frac(pts, inBox(region));
        const kind = n.box.w > 0.9 * Math.max(...nodes.filter((x) => x.type === "rect").map((x) => x.box.w)) ? "covers-chief" : "covers-canton";
        if (amount > LIMIT.region) issues.push({ kind, a: name(c), amount });
      }
      if (n.type === "shape" && n.kind !== "baton") {
        const polys = ordinaryPolys(n.kind, n.line).map((poly) => poly.map(([x, y]): Pt => [n.box.x + x * n.box.w, n.box.y + y * n.box.h]));
        const amount = frac(pts, (p) => polys.some((poly) => inPoly(p, poly)));
        if (amount > LIMIT.region) issues.push({ kind: "on-ordinary", a: name(c), b: n.kind, amount });
      }
      if (n.type === "label" && c.on !== "brisure") {
        const band: Box = { x: n.box.x, y: n.box.y + n.y0 * n.box.h, w: n.box.w, h: (n.y1 - n.y0) * n.box.h };
        const amount = frac(pts, inBox(band));
        if (amount > LIMIT.region) issues.push({ kind: "under-brisure", a: name(c), amount });
      }
      if (n.type === "escutcheon" && n.on === "field") {
        const amount = frac(pts, (p) => inPoly(p, heater(n.box)));
        if (amount > LIMIT.region) issues.push({ kind: "under-escutcheon", a: name(c), amount });
      }
    }
  }
  // nothing but a semé may be cut off by the edge
  for (const c of charges) {
    if (c.on === "semy") continue;
    const amount = frac(samples(c.box), (p) => !inPoly(p, outline));
    if (amount > LIMIT.cut) issues.push({ kind: "cut-off", a: name(c), amount });
  }
  for (const n of nodes) if (n.type === "escutcheon") lintNodes(n.children, heater(n.box), issues);
}

export function lintArms(arms: Arms): LintIssue[] {
  const issues: LintIssue[] = [];
  lintNodes(layout(arms), SHIELD, issues);
  return issues;
}
