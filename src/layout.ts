// Arms -> positioned drawing nodes, in painter's order (back to front).
// Both the SVG renderer and the CK3 exporter consume the same nodes, so the
// web preview and the in-game result agree on where everything is.
//
// Coordinates: CK3 coat-of-arms space, 0..1, origin top-left, y down.
// Ordinary geometry follows the vanilla ordinary textures (see TEX in charges.ts).

import { CHARGES, TEX } from "./charges.ts";
import type { Arms, Brisure, Charge, Division, Escutcheon, Line, OrdinaryKind, Placed, Spot } from "./heraldry/ast.ts";
import { firstTincture, isEscutcheon } from "./heraldry/ast.ts";
import type { Tincture } from "./heraldry/tincture.ts";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ShapeKind = OrdinaryKind | "baton";

export type LNode =
  /** `line` + `area`: an indented chief, drawn over the whole area it belongs to */
  | { type: "rect"; box: Box; t: Tincture; bg?: string; line?: "indented"; area?: Box }
  | { type: "division"; kind: Division; box: Box; t: [Tincture, Tincture]; bg?: string; line?: Line }
  | { type: "ermine"; box: Box; bg?: string }
  | { type: "shape"; kind: ShapeKind; box: Box; t: Tincture; line?: Line }
  | { type: "label"; box: Box; y0: number; y1: number; t: Tincture }
  | { type: "charge"; charge: Charge; box: Box; under: Tincture; on: On }
  | { type: "escutcheon"; box: Box; arms: Arms; outline: boolean; children: LNode[]; on: On };

/** what a charge lies on (used by the overlap checks in lint.ts) */
export type On = "field" | "chief" | "canton" | "ordinary" | "breast" | "semy" | "brisure";

const [EX0, EY0, EX1, EY1] = TEX.escutcheon.bbox;
const ESC_ASPECT = (EX1 - EX0) / (EY1 - EY0);

export const CHIEF_H = 0.3;

/** left edge of CK3's escutcheon at relative height y (0..1), measured from ce_escutcheon */
export function escutcheonEdge(y: number): number {
  const e = TEX.escutcheon.edge;
  const f = Math.min(Math.max(y, 0), 1) * (e.length - 1);
  const i = Math.min(Math.floor(f), e.length - 2);
  return e[i] + (e[i + 1] - e[i]) * (f - i);
}

/**
 * Can these arms be shown on a small escutcheon in CK3? CK3 cannot clip, so only
 * fields and ordinaries drawn with plain blocks (which we clip to the shape
 * ourselves) are allowed — no diagonal textures, semé or ermine.
 */
export function escutcheonSafe(a: Arms): boolean {
  if (a.quarterly) return !a.overall && !a.brisure && a.quarterly.q.every(escutcheonSafe);
  const f = a.field;
  if (f.kind === "semy" || (f.kind === "plain" && f.t === "ermine")) return false;
  if (f.kind !== "plain" && (f.line || !["per_pale", "per_fess", "quarterly", "barry", "barry8", "barry10", "paly", "chequy"].includes(f.kind))) return false;
  if (a.ordinary?.line || a.chief?.line) return false;
  // block-built ordinaries are clipped; orle and tressure textures sit well inside the edge
  if (a.ordinary && !["fess", "pale", "cross", "pallets", "orle", "tressure"].includes(a.ordinary.kind)) return false;
  if (a.overall || a.brisure) return false;
  return true;
}

type Pt = [number, number];
const H = 0.143; // half the horizontal width of a bend at 45° (perpendicular width ≈ 0.2)
/** ordinary shapes as polygons in box-relative coordinates, matching the vanilla textures */
export const ORDINARY_POLYS: Partial<Record<ShapeKind, Pt[][]>> = {
  fess: [[[-0.01, 0.402], [1.01, 0.402], [1.01, 0.602], [-0.01, 0.602]]],
  pale: [[[0.402, -0.01], [0.602, -0.01], [0.602, 1.01], [0.402, 1.01]]],
  cross: [[[0.402, -0.01], [0.602, -0.01], [0.602, 0.402], [1.01, 0.402], [1.01, 0.602], [0.602, 0.602], [0.602, 1.01], [0.402, 1.01], [0.402, 0.602], [-0.01, 0.602], [-0.01, 0.402], [0.402, 0.402]]],
  bend: [[[-0.01, -0.01], [H, -0.01], [1.01, 1 - H], [1.01, 1.01], [1 - H, 1.01], [-0.01, H]]],
  bend_sinister: [[[1.01, -0.01], [1 - H, -0.01], [-0.01, 1 - H], [-0.01, 1.01], [H, 1.01], [1.01, H]]],
  saltire: [[[-0.01, -0.01], [H, -0.01], [0.5, 0.5 - H], [1 - H, -0.01], [1.01, -0.01], [1.01, H], [0.5 + H, 0.5], [1.01, 1 - H], [1.01, 1.01], [1 - H, 1.01], [0.5, 0.5 + H], [H, 1.01], [-0.01, 1.01], [-0.01, 1 - H], [0.5 - H, 0.5], [-0.01, H]]],
  chevron: [[[-0.01, 0.725], [0.5, 0.215], [1.01, 0.725], [1.01, 1.01], [0.5, 0.5], [-0.01, 1.01]]],
  pile: [[[-0.01, -0.01], [1.01, -0.01], [0.5, 0.8]]],
  bars: [[[-0.01, 0.199], [1.01, 0.199], [1.01, 0.398], [-0.01, 0.398]], [[-0.01, 0.598], [1.01, 0.598], [1.01, 0.797], [-0.01, 0.797]]],
  chevronels: [0.051, 0.375, 0.699].map((a): Pt[] => [[-0.01, a + 0.505], [0.5, a], [1.01, a + 0.505], [1.01, a + 0.665], [0.5, a + 0.16], [-0.01, a + 0.665]]),
  pall: [
    [[-0.01, -0.148], [0.5, 0.357], [0.5, 0.64], [-0.01, 0.135]],
    [[1.01, -0.148], [1.01, 0.135], [0.5, 0.64], [0.5, 0.357]],
    [[0.4, 0.5], [0.6, 0.5], [0.6, 1.01], [0.4, 1.01]],
  ],
  baton: [[[0.915, 0.165], [0.835, 0.085], [0.085, 0.835], [0.165, 0.915]]],
};
export const CANTON = { w: 0.4, h: 0.38 };

/** an ordinary's footprint, allowing for its line (a dancetty fess and an engrailed bend are wider) */
export function ordinaryPolys(kind: ShapeKind, line?: Line): Pt[][] {
  if (kind === "fess" && line === "dancetty") return [[[-0.01, 0.36], [1.01, 0.36], [1.01, 0.65], [-0.01, 0.65]]];
  if (kind === "bend" && line === "engrailed") {
    const h = 0.19;
    return [[[-0.01, -0.01], [h, -0.01], [1.01, 1 - h], [1.01, 1.01], [1 - h, 1.01], [-0.01, h]]];
  }
  return ORDINARY_POLYS[kind] ?? [];
}
/** the indented chief reaches lower than a straight one */
export const CHIEF_INDENTED = { solid: 0.277, tips: 0.387 };

/** visible box of a charge whose larger side is `size`, centred on (cx, cy) */
export function chargeBox(charge: Charge, cx: number, cy: number, size: number): Box {
  const [x0, y0, x1, y1] = CHARGES[charge.id].bbox;
  const w = x1 - x0;
  const h = y1 - y0;
  const s = size / Math.max(w, h);
  return { x: cx - (w * s) / 2, y: cy - (h * s) / 2, w: w * s, h: h * s };
}

function escutcheonBox(cx: number, cy: number, w: number): Box {
  const h = w / ESC_ASPECT;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

const rel = (box: Box, rx: number, ry: number): [number, number] => [box.x + rx * box.w, box.y + ry * box.h];
export const sub = (box: Box, rx: number, ry: number, rw: number, rh: number): Box => ({
  x: box.x + rx * box.w,
  y: box.y + ry * box.h,
  w: rw * box.w,
  h: rh * box.h,
});
const minDim = (b: Box) => Math.min(b.w, b.h);

/** Lay out a charge (and whatever it bears on its breast). */
function placeCharge(out: LNode[], charge: Charge, cx: number, cy: number, size: number, under: Tincture, on: On = "field") {
  // three in a line, or six (three, two and one)
  const line3: Record<string, [number, number][]> = {
    pale: [[0, -0.33], [0, 0], [0, 0.33]],
    fess: [[-0.34, 0], [0, 0], [0.34, 0]],
    bend: [[-0.3, -0.3], [0, 0], [0.3, 0.3]],
  };
  if (charge.count === 3 && charge.arr) {
    const s = size * (charge.arr === "pale" ? 0.42 : 0.36);
    for (const [dx, dy] of line3[charge.arr]) placeCharge(out, { ...charge, count: 1, arr: undefined }, cx + dx * size, cy + dy * size, s, under, on);
    return;
  }
  if (charge.count === 6) {
    const pts: [number, number][] = [[-0.33, -0.3], [0, -0.3], [0.33, -0.3], [-0.17, 0.02], [0.17, 0.02], [0, 0.33]];
    for (const [dx, dy] of pts) placeCharge(out, { ...charge, count: 1 }, cx + dx * size, cy + dy * size, size * 0.29, under, on);
    return;
  }
  if (charge.count === 2) {
    // two in pale: one above the other, each a little over half the size
    const s = size * 0.52;
    for (const y of [cy - size * 0.25, cy + size * 0.25]) placeCharge(out, { ...charge, count: 1 }, cx, y, s, under, on);
    return;
  }
  if ((charge.count ?? 1) === 3) {
    const s = size * 0.44;
    const pts: [number, number][] = [
      [cx - size * 0.27, cy - size * 0.2],
      [cx + size * 0.27, cy - size * 0.2],
      [cx, cy + size * 0.27],
    ];
    for (const [x, y] of pts) placeCharge(out, { ...charge, count: 1 }, x, y, s, under, on);
    return;
  }
  const box = chargeBox(charge, cx, cy, size);
  out.push({ type: "charge", charge, box, under, on });
  const def = CHARGES[charge.id];
  if (charge.breast && def.breast) {
    const bx = box.x + def.breast.x * box.w;
    const by = box.y + def.breast.y * box.h;
    if (isEscutcheon(charge.breast)) out.push(escutcheonNode(charge.breast, escutcheonBox(bx, by, box.w * 0.34), "breast"));
    else placeCharge(out, charge.breast, bx, by, box.w * 0.24, charge.t, "breast");
  }
}

function escutcheonNode(e: Escutcheon, box: Box, on: On = "field"): LNode {
  return { type: "escutcheon", box, arms: e.arms, outline: true, children: layoutInside(e.arms, box, { escutcheon: true }), on };
}

/** positions [rx, ry, size] of charges around an ordinary, relative to the field box */
export const BETWEEN: Partial<Record<OrdinaryKind, [number, number, number][]>> = {
  fess: [[0.25, 0.2, 0.24], [0.75, 0.2, 0.24], [0.5, 0.79, 0.24]],
  chevron: [[0.2, 0.2, 0.22], [0.8, 0.2, 0.22], [0.5, 0.77, 0.24]],
  bend: [[0.73, 0.26, 0.27], [0.27, 0.72, 0.27]],
  bend_sinister: [[0.27, 0.26, 0.27], [0.73, 0.72, 0.27]],
  pale: [[0.2, 0.46, 0.25], [0.8, 0.46, 0.25]],
  pall: [[0.5, 0.13, 0.2], [0.2, 0.68, 0.22], [0.8, 0.68, 0.22]],
  saltire: [[0.5, 0.14, 0.19], [0.13, 0.5, 0.19], [0.87, 0.5, 0.19], [0.5, 0.86, 0.17]],
  cross: [[0.2, 0.2, 0.24], [0.8, 0.2, 0.24], [0.24, 0.76, 0.21], [0.76, 0.76, 0.21]],
  pile: [[0.14, 0.62, 0.2], [0.86, 0.62, 0.2]],
};

/** positions of charges lying on an ordinary */
export const ON: Partial<Record<OrdinaryKind, [number, number, number][]>> = {
  fess: [[0.22, 0.502, 0.15], [0.5, 0.502, 0.15], [0.78, 0.502, 0.15]],
  pale: [[0.502, 0.2, 0.15], [0.502, 0.48, 0.15], [0.502, 0.76, 0.15]],
  bend: [[0.24, 0.24, 0.14], [0.5, 0.5, 0.14], [0.76, 0.76, 0.14]],
  bend_sinister: [[0.76, 0.24, 0.14], [0.5, 0.5, 0.14], [0.24, 0.76, 0.14]],
  chevron: [[0.5, 0.36, 0.15], [0.25, 0.61, 0.15], [0.75, 0.61, 0.15]],
  cross: [[0.502, 0.502, 0.14], [0.502, 0.18, 0.14], [0.18, 0.502, 0.14], [0.82, 0.502, 0.14], [0.502, 0.8, 0.14]],
  saltire: [[0.5, 0.5, 0.13], [0.2, 0.2, 0.13], [0.8, 0.2, 0.13], [0.23, 0.77, 0.12], [0.77, 0.77, 0.12]],
};

/** where a charge goes inside the content area */
function spotGeometry(p: Placed, arms: Arms): [number, number, number][] {
  const corner = arms.charges.some((c) => c.at === "dexter_chief") || !!arms.canton;
  const ringed = arms.ordinary?.kind === "orle" || arms.ordinary?.kind === "tressure";
  switch (p.at) {
    case "center":
      if (corner) return [[0.56, 0.54, 0.58]];
      if (ringed) return [[0.5, 0.47, 0.5]];
      return [[0.5, 0.47, 0.72]];
    case "high":
      return [corner ? [0.6, 0.4, 0.46] : [0.5, 0.37, 0.54]];
    case "base":
      return [[0.5, 0.8, 0.27]];
    case "dexter":
      return [arms.overall ? [0.19, 0.36, 0.3] : [0.27, 0.48, 0.42]];
    case "sinister":
      return [arms.overall ? [0.81, 0.36, 0.3] : [0.73, 0.48, 0.42]];
    case "chief_half":
      return [[0.5, 0.25, 0.38]];
    case "base_half":
      return [[0.5, 0.72, 0.34]];
    case "dexter_chief":
      return [[0.19, 0.17, 0.21]];
    case "between":
      return BETWEEN[arms.ordinary?.kind ?? "fess"] ?? [];
  }
}

/** tincture directly beneath a spot */
function underAt(at: Spot, arms: Arms): Tincture {
  const f = arms.field;
  if (f.kind === "plain" || f.kind === "semy") return f.t;
  if (f.kind === "per_pale") return at === "sinister" ? f.t[1] : f.t[0];
  if (f.kind === "per_fess") return at === "base_half" || at === "base" ? f.t[1] : f.t[0];
  return f.t[0];
}

/** the band a brisure keeps free at the top of the field, as fractions of the box height */
export const brisureBand = (kind: Brisure | undefined, quarterly: boolean): [number, number] | null => {
  if (!kind || kind === "baton") return null;
  if (kind === "label") return quarterly ? [0.02, 0.15] : [0.03, 0.23];
  return quarterly ? [0.01, 0.14] : [0.02, 0.2];
};

/** semé: a staggered grid of small charges covering the box (cut by the edge) */
function semyPositions(box: Box): [number, number, number][] {
  const out: [number, number, number][] = [];
  const rows = 5, cols = 4;
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? 0.5 : 0;
    for (let c = -1; c <= cols; c++) {
      const x = (c + off + 0.5) / cols;
      const y = (r + 0.5) / rows;
      if (x < -0.05 || x > 1.05) continue;
      out.push([box.x + x * box.w, box.y + y * box.h, 0.17 * minDim(box)]);
    }
  }
  return out;
}

interface Opts {
  escutcheon?: boolean;
  bg?: string;
  /** area for charges (smaller than the box in lower quarters) */
  content?: Box;
  /** a lower quarter: ordinaries and the charges around them use the content area too */
  lower?: boolean;
}

const below = (content: Box, y: number): Box =>
  y <= content.y ? content : { ...content, y, h: content.y + content.h - y };

function layoutInside(arms: Arms, box: Box, opts: Opts = {}): LNode[] {
  const out: LNode[] = [];
  const bgTag = opts.bg ?? "root";
  const band = brisureBand(arms.brisure?.kind, !!arms.quarterly);

  if (arms.quarterly) {
    const qs = arms.quarterly.q;
    const q1 = qs[0];
    // quarterly arms inside a quarter (e.g. claiming Castile-León) fit their four
    // sub-quarters into the visible part of that quarter, over a background
    let qb = box;
    const nested = !!opts.content && (opts.content.w < box.w - 1e-9 || opts.content.h < box.h - 1e-9);
    if (nested) {
      out.push({ type: "rect", box, t: firstTincture(q1.field), bg: bgTag });
      qb = opts.content!;
    }
    const q = [sub(qb, 0, 0, 0.5, 0.5), sub(qb, 0.5, 0, 0.5, 0.5), sub(qb, 0, 0.5, 0.5, 0.5), sub(qb, 0.5, 0.5, 0.5, 0.5)];
    // upper quarters leave room for a brisure; lower quarters of the shield are cut by
    // its curved base, so their content uses the largest rectangle that stays inside
    const top = band ? (band[1] * box.h) / q[0].h : 0;
    const atBase = !opts.content || !!opts.lower;
    let content = [
      sub(q[0], 0, top, 1, 1 - top),
      sub(q[1], 0, top, 1, 1 - top),
      atBase ? sub(q[2], 0.28, 0, 0.72, 0.68) : q[2],
      atBase ? sub(q[3], 0, 0, 0.72, 0.68) : q[3],
    ];
    // an escutcheon over all covers the inner corners: keep the quarters' charges outward
    if (arms.overall) content = content.map((c, i) => sub(c, i % 2 ? 0.24 : 0, i < 2 ? 0 : 0.26, 0.76, 0.74));
    qs.forEach((a, i) => out.push(...layoutInside(a, q[i], { bg: nested ? `${bgTag}-q${i + 1}` : `q${i + 1}`, content: content[i], lower: atBase && i >= 2 })));
  } else {
    const f = arms.field;
    // on an escutcheon the shield shape itself is drawn in the first tincture; divisions go on top
    if (opts.escutcheon) {
      if (f.kind !== "plain" && f.kind !== "semy") out.push({ type: "division", kind: f.kind, box, t: f.t, bg: bgTag, ...(f.line ? { line: f.line } : {}) });
    } else {
      if (f.kind === "plain") out.push(f.t === "ermine" ? { type: "ermine", box, bg: bgTag } : { type: "rect", box, t: f.t, bg: bgTag });
      else if (f.kind === "semy") {
        out.push({ type: "rect", box, t: f.t, bg: bgTag });
        for (const [x, y, s] of semyPositions(box)) placeCharge(out, { ...f.charge, count: 1 }, x, y, s, f.t, "semy");
      } else out.push({ type: "division", kind: f.kind, box, t: f.t, bg: bgTag, ...(f.line ? { line: f.line } : {}) });
    }
    let content = opts.content ?? box;
    if (band) content = below(content, box.y + band[1] * box.h);

    const o = arms.ordinary;
    const geo = opts.lower && opts.content ? opts.content : box;
    if (o) {
      out.push({ type: "shape", kind: o.kind, box: geo, t: o.t, ...(o.line ? { line: o.line } : {}) });
      const on = ON[o.kind];
      if (o.on && on) for (const [rx, ry, s] of on) placeCharge(out, { ...o.on, count: 1 }, ...rel(geo, rx, ry), s * minDim(geo), o.t, "ordinary");
    }
    const fieldUnder = firstTincture(f);
    if (arms.chief) {
      const cb = sub(geo, 0, 0, 1, CHIEF_H);
      out.push({ type: "rect", box: cb, t: arms.chief.t, ...(arms.chief.line ? { line: arms.chief.line, area: geo } : {}) });
      const n = arms.chief.charges.length;
      arms.chief.charges.forEach((c, i) => {
        const rx = n === 1 ? 0.5 : 0.2 + 0.3 * i;
        const size = n === 1 ? cb.h * 0.86 : Math.min(cb.h * 0.78, geo.w * 0.24);
        placeCharge(out, { ...c, count: 1 }, ...rel(cb, rx, 0.5), size, arms.chief!.t, "chief");
      });
      content = below(content, geo.y + (arms.chief.line ? CHIEF_INDENTED.tips + 0.01 : CHIEF_H) * geo.h);
    }
    if (arms.canton) {
      const cb = sub(geo, 0, 0, CANTON.w, CANTON.h);
      out.push({ type: "rect", box: cb, t: arms.canton.t });
      if (arms.canton.charge) placeCharge(out, { ...arms.canton.charge, count: 1 }, ...rel(cb, 0.5, 0.5), cb.h * 0.72, arms.canton.t, "canton");
    }
    for (const p of arms.charges) {
      const area = p.at === "between" ? geo : content;
      for (const [rx, ry, s] of spotGeometry(p, arms)) {
        const c = p.at === "between" ? { ...p.charge, count: 1 as const } : p.charge;
        placeCharge(out, c, ...rel(area, rx, ry), s * minDim(area), p.at === "between" ? fieldUnder : underAt(p.at, arms));
      }
    }
  }

  const b = arms.brisure;
  if (b) {
    if (b.kind === "label") out.push({ type: "label", box, y0: band![0], y1: band![1], t: b.t });
    else if (b.kind === "baton") out.push({ type: "shape", kind: "baton", box, t: b.t });
    else {
      const [y0, y1] = band!;
      const top = arms.quarterly ? firstTincture(arms.quarterly.q[0].field) : arms.chief ? arms.chief.t : firstTincture(arms.field);
      placeCharge(out, { id: b.kind, t: b.t }, ...rel(box, 0.5, (y0 + y1) / 2), (y1 - y0) * 0.95 * box.h, top, "brisure");
    }
  }
  if (arms.overall) {
    const [cx, cy] = rel(box, 0.5, arms.quarterly ? 0.5 : 0.56);
    out.push(escutcheonNode(arms.overall, escutcheonBox(cx, cy, box.w * 0.34)));
  }
  return out;
}

export function layout(arms: Arms): LNode[] {
  return layoutInside(arms, { x: 0, y: 0, w: 1, h: 1 });
}
