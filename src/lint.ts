// Layout lint: finds charges that overlap each other or something they do not
// lie on, or that are cut off by the edge of the shield. Measured on the same
// layout nodes both renderers use, by sampling points inside each charge's box.

import { TEX } from "./charges.ts";
import type { Arms, Line } from "./heraldry/ast.ts";
import { CHIEF_INDENTED, clipToBox, layout, ordinaryPolys, RINGS, type Box, type LNode, type ShapeKind } from "./layout.ts";

type Pt = [number, number];

export interface LintIssue {
  kind: "charge-overlap" | "covers-chief" | "covers-canton" | "on-ordinary" | "under-brisure" | "under-escutcheon" | "cut-off" | "wrong-half";
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

/**
 * What an ordinary covers, in 0..1 of its box: its polygons cut to the box (a texture draws
 * nothing outside it, so the third of three chevronels stops at the foot of its quarter), the
 * orle and the tressure as rings of quads between their outlines, the four pallets as bands.
 */
function footprint(kind: ShapeKind, line?: Line): Pt[][] {
  if (kind === "orle" || kind === "tressure") {
    return RINGS[kind].flatMap(([o, i]) => {
      const a = heater(o), b = heater(i);
      return a.map((p, k): Pt[] => [p, a[(k + 1) % a.length], b[(k + 1) % b.length], b[k]]);
    });
  }
  if (kind === "pallets") {
    const e = TEX.pallets4.edges;
    return [0, 2, 4, 6].map((k): Pt[] => [[e[k], -0.01], [e[k + 1], -0.01], [e[k + 1], 1.01], [e[k], 1.01]]);
  }
  return ordinaryPolys(kind, line).map((p) => clipToBox(p)).filter((p) => p.length > 2);
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

type ChargeNode = Extract<LNode, { type: "charge" }>;

/** with `only`, just the issues of the charges it picks out (the others meet them only as obstacles) */
function lintNodes(nodes: LNode[], outline: Pt[], issues: LintIssue[], only?: (c: ChargeNode) => boolean) {
  const charges = nodes.filter((n): n is ChargeNode => n.type === "charge");
  const mine = only ? charges.filter(only) : charges;
  const field = mine.filter((c) => c.on === "field" || c.on === "brisure");
  const name = (c: ChargeNode) => `${c.charge.id}@${c.on}`;

  // charges on the same surface must not overlap each other
  for (const group of ["field", "chief", "canton", "ordinary"] as const) {
    const g = charges.filter((c) => (group === "field" ? c.on === "field" || c.on === "brisure" : c.on === group));
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++) {
        if (only && !only(g[i]) && !only(g[j])) continue;
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
        const polys = footprint(n.kind, n.line).map((poly) => poly.map(([x, y]): Pt => [n.box.x + x * n.box.w, n.box.y + y * n.box.h]));
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
  // on a field divided per pale or per fess, a charge given one half's tincture to lie on stays on that half
  for (const d of nodes) {
    if (d.type !== "division" || (d.kind !== "per_pale" && d.kind !== "per_fess") || d.t[0] === d.t[1]) continue;
    const across = d.kind === "per_pale";
    const mid = across ? d.box.x + d.box.w / 2 : d.box.y + d.box.h / 2;
    for (const c of field) {
      const [cx, cy] = [c.box.x + c.box.w / 2, c.box.y + c.box.h / 2];
      if (!inBox(d.box)([cx, cy]) || c.on !== "field") continue;
      const side = c.under === d.t[0] ? 0 : c.under === d.t[1] ? 1 : -1;
      if (side < 0) continue;
      const amount = frac(samples(c.box), ([x, y]) => ((across ? x : y) > mid ? 1 : 0) !== side);
      if (amount > LIMIT.region) issues.push({ kind: "wrong-half", a: name(c), b: d.kind, amount });
    }
  }
  // nothing but a semé may be cut off by the edge
  for (const c of mine) {
    if (c.on === "semy") continue;
    const amount = frac(samples(c.box), (p) => !inPoly(p, outline));
    if (amount > LIMIT.cut) issues.push({ kind: "cut-off", a: name(c), amount });
  }
  for (const n of nodes) if (n.type === "escutcheon") lintNodes(n.children, heater(n.box), issues, only);
}

export function lintArms(arms: Arms): LintIssue[] {
  const issues: LintIssue[] = [];
  lintNodes(layout(arms), SHIELD, issues);
  return issues;
}

/**
 * Does a small cadency mark (crescent, mullet, …) on these arms lie on anything but the field?
 * Where it sits depends on the marshalling (on the partition line of two columns, inside the
 * middle quarter of three), so the generator tries it on the laid-out arms instead of guessing.
 */
export function markCovers(arms: Arms): boolean {
  const issues: LintIssue[] = [];
  lintNodes(layout(arms), SHIELD, issues, (c) => c.on === "brisure");
  return issues.length > 0;
}
