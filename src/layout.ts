// Arms -> positioned drawing nodes, in painter's order (back to front).
// Both the SVG renderer and the CK3 exporter consume the same nodes, so the
// web preview and the in-game result agree on where everything is.
//
// Coordinates: CK3 coat-of-arms space, 0..1, origin top-left, y down.
// Ordinary geometry follows the vanilla ordinary textures (see TEX in charges.ts).

import { CHARGES, TEX } from "./charges.ts";
import type { Arms, Brisure, Charge, Division, Escutcheon, Field, Line, OrdinaryKind, Placed, Spot } from "./heraldry/ast.ts";
import { firstTincture, isEscutcheon, quarterCols, quarterRows } from "./heraldry/ast.ts";
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
  if (a.quarterly) return a.quarterly.q.length === 4 && !a.overall && !a.brisure && a.quarterly.q.every(escutcheonSafe);
  const f = a.field;
  if (f.kind === "semy" || (f.kind === "plain" && f.t === "ermine")) return false;
  if (f.kind !== "plain" && (f.line || !["per_pale", "per_fess", "quarterly", "barry", "barry8", "barry10", "paly", "chequy"].includes(f.kind))) return false;
  if (a.ordinary?.line || a.chief?.line) return false;
  // block-built ordinaries are clipped; orle and tressure textures sit well inside the edge
  if (a.ordinary && !["fess", "pale", "cross", "pallets", "orle", "tressure"].includes(a.ordinary.kind) && !BAND_ORDINARIES[a.ordinary.kind]) return false;
  if (a.overall || a.brisure) return false;
  return true;
}

type Pt = [number, number];
const H = 0.143; // half the horizontal width of a bend at 45° (perpendicular width ≈ 0.2)

/**
 * Diminutives that are plain bands across or down the field: drawn as blocks (like the fess
 * and pallets), so they can go on an escutcheon. Bands are [from, to] in 0..1 of the box;
 * three bars and three pallets follow ce_bars_03 and ce_pales_03, bars gemel the pairs of
 * ce_bars_gemel_03 (bars .06 high, .055 apart), barrulets as thin.
 */
export const BAND_ORDINARIES: Partial<Record<OrdinaryKind, { across: boolean; bands: [number, number][] }>> = {
  bars3: { across: true, bands: [[0.156, 0.289], [0.43, 0.57], [0.711, 0.852]] },
  gemel: { across: true, bands: [0.345, 0.655].flatMap((c): [number, number][] => [[c - 0.0875, c - 0.0275], [c + 0.0275, c + 0.0875]]) },
  barrulets: { across: true, bands: Array.from({ length: 6 }, (_, i): [number, number] => [0.137 + 0.1333 * i, 0.197 + 0.1333 * i]) },
  pales3: { across: false, bands: [[0.227, 0.336], [0.445, 0.555], [0.664, 0.773]] },
};

/** the band between the lines x − y = lo and x − y = hi (bends run from dexter chief), cut to the box */
const diagonal = (lo: number, hi: number): Pt[] => clipToBox([[lo - 1, -1], [hi - 1, -1], [hi + 2, 2], [lo + 2, 2]]);
/** a chevron whose upper edge has its apex at y = a, `thick` high, sloping `slope` each way */
const chevronAt = (a: number, thick: number, slope: number): Pt[] =>
  clipToBox([[-0.01, a + 0.51 * slope], [0.5, a], [1.01, a + 0.51 * slope], [1.01, a + thick + 0.51 * slope], [0.5, a + thick], [-0.01, a + thick + 0.51 * slope]]);
const bandPolys = (k: OrdinaryKind): Pt[][] => {
  const b = BAND_ORDINARIES[k]!;
  return b.bands.map(([u, v]): Pt[] => (b.across ? [[-0.01, u], [1.01, u], [1.01, v], [-0.01, v]] : [[u, -0.01], [v, -0.01], [v, 1.01], [u, 1.01]]));
};
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
  bars3: bandPolys("bars3"),
  gemel: bandPolys("gemel"),
  barrulets: bandPolys("barrulets"),
  pales3: bandPolys("pales3"),
  // ce_bends_02..05, measured along the anti-diagonal: bands of x − y
  bends2: [diagonal(-0.39, -0.078), diagonal(0.218, 0.532)],
  bends3: [diagonal(-0.484, -0.25), diagonal(-0.032, 0.188), diagonal(0.422, 0.64)],
  bends4: [diagonal(-0.484, -0.328), diagonal(-0.156, 0.016), diagonal(0.172, 0.344), diagonal(0.5, 0.672)],
  bends5: [diagonal(-0.516, -0.376), diagonal(-0.25, -0.11), diagonal(0.032, 0.156), diagonal(0.296, 0.422), diagonal(0.562, 0.688)],
  // ce_ordinary_chevron_2: apexes at y .129 and .453, .16 thick, slope 1
  chevrons2: [chevronAt(0.129, 0.16, 1), chevronAt(0.453, 0.164, 1)],
  // ce_fess_betw_two_chevrons: a fess y .383–.578; the upper chevron (apex .023, .195 thick,
  // slope .89) stops at the fess; the lower one (apex .585, .2 thick, slope .875) runs to the edge
  fess_chevrons: [
    [[-0.01, 0.383], [1.01, 0.383], [1.01, 0.578], [-0.01, 0.578]],
    [[0.096, 0.383], [0.5, 0.023], [0.904, 0.383], [0.685, 0.383], [0.5, 0.218], [0.315, 0.383]],
    chevronAt(0.585, 0.2, 0.875),
  ],
  pall: [
    [[-0.01, -0.148], [0.5, 0.357], [0.5, 0.64], [-0.01, 0.135]],
    [[1.01, -0.148], [1.01, 0.135], [0.5, 0.64], [0.5, 0.357]],
    [[0.4, 0.5], [0.6, 0.5], [0.6, 1.01], [0.4, 1.01]],
  ],
  baton: [[[0.915, 0.165], [0.835, 0.085], [0.085, 0.835], [0.165, 0.915]]],
};
export const CANTON = { w: 0.4, h: 0.38 };

/** a heater-shaped ring: the outline at (x, y, w, h) and one `t` inside it (a heater is narrower below) */
const ring = (x: number, y: number, w: number, h: number, t: number): [Box, Box] => [{ x, y, w, h }, { x: x + t, y: y + t, w: w - 2 * t, h: h - 2 * t * 1.15 }];
/** the orle and the double tressure as heater-shaped rings, [outer, inner] in 0..1 of their box */
export const RINGS: Record<"orle" | "tressure", [Box, Box][]> = {
  orle: [[{ x: 0.188, y: 0.109, w: 0.624, h: 0.774 }, { x: 0.273, y: 0.19, w: 0.454, h: 0.6 }]],
  tressure: [ring(0.12, 0.04, 0.76, 0.88, 0.025), ring(0.17, 0.09, 0.66, 0.77, 0.025)],
};

/** a polygon cut to the box (Sutherland–Hodgman against x, y in [lo, hi]) */
export function clipToBox(pts: Pt[], lo = -0.01, hi = 1.01): Pt[] {
  const edges: [(p: Pt) => boolean, (a: Pt, b: Pt) => Pt][] = [0, 1].flatMap((axis) =>
    [lo, hi].map((v): [(p: Pt) => boolean, (a: Pt, b: Pt) => Pt] => [
      (p) => (v === lo ? p[axis] >= v : p[axis] <= v),
      (a, b) => {
        const k = (v - a[axis]) / (b[axis] - a[axis]);
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      },
    ]),
  );
  let out = pts;
  for (const [inside, cut] of edges) {
    const src = out;
    out = [];
    src.forEach((p, i) => {
      const q = src[(i + 1) % src.length];
      if (inside(p)) out.push(p);
      if (inside(p) !== inside(q)) out.push(cut(p, q));
    });
    if (!out.length) break;
  }
  return out;
}

/**
 * Fusils conjoined, where ce_fess_lozenges / ce_bend_lozenges draw them: seven upright
 * fusils touching side to side across the fess (centres 19.17 px apart on 128, 28 px
 * tall each way); the bend turns the row 45° along the diagonal (centres every 15 px).
 */
function fusils(kind: "fess" | "bend"): Pt[][] {
  if (kind === "fess") {
    const hw = 19.17 / 2 / 128, hh = 28 / 128;
    return Array.from({ length: 7 }, (_, i): Pt[] => {
      const x = (6 + 19.17 * i) / 128;
      return clipToBox([[x, 0.5 - hh], [x + hw, 0.5], [x, 0.5 + hh], [x - hw, 0.5]]);
    });
  }
  const a = 7.5 / 128, p = 19.5 / 128;
  return Array.from({ length: 9 }, (_, j): Pt[] => {
    const c = (7.5 + 15 * j) / 128;
    return clipToBox([[c - a, c - a], [c + p, c - p], [c + a, c + a], [c - p, c + p]]);
  });
}

/**
 * ce_vairy: rows of vair-bells 24 px high and wide (of 128), the first row's top at
 * y = 3 px; color2 bells hang point down (centred at x = 15.5 px + 24 px · j, shifted
 * half a bell on alternate rows), color1 shows between them pointing up. Box-relative
 * polygons of the color2 bells, cut to the box.
 */
export function vairBells(): Pt[][] {
  const u = (v: number) => v / 128;
  const bell: Pt[] = [[-12, 0], [12, 0], [6, 6], [6, 18], [0, 24], [-6, 18], [-6, 6]];
  const out: Pt[][] = [];
  for (let k = -1; k <= 5; k++)
    for (let j = -1; j <= 6; j++) {
      const cx = 15.5 + 24 * j + (k % 2 ? 12 : 0), y0 = 3 + 24 * k;
      const p = clipToBox(bell.map(([x, y]): Pt => [u(cx + x), u(y0 + y)]));
      if (p.length > 2) out.push(p);
    }
  return out;
}

/**
 * ce_fretty: bands at 45° both ways, 52 px wide measured across x (of 512), their
 * centre lines at x ± y = 60.5 px + 195 px · k. Box-relative polygons, cut to the box;
 * the dexter bands first.
 */
export function fretBands(): Pt[][] {
  const c0 = 60.5 / 512, q = 195 / 512, h = 26 / 512;
  const out: Pt[][] = [];
  for (const dexter of [true, false])
    for (let k = -4; k <= 6; k++) {
      const c = c0 + k * q;
      // points of the band at y = -1 and y = 2: x = c + y (dexter) or c - y (sinister)
      const at = (d: number, y: number): Pt => [dexter ? d + y : d - y, y];
      const p = clipToBox([at(c - h, -1), at(c + h, -1), at(c + h, 2), at(c - h, 2)]);
      if (p.length > 2) out.push(p);
    }
  return out;
}

/** an ordinary's footprint, allowing for its line (a dancetty fess and an engrailed bend are wider) */
export function ordinaryPolys(kind: ShapeKind, line?: Line): Pt[][] {
  if (line === "fusilly" && (kind === "fess" || kind === "bend")) return fusils(kind);
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
  return { type: "escutcheon", box, arms: e.arms, outline: true, children: layoutInside(e.arms, box, { escutcheon: true, frame: { box, heater: true } }), on };
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

/**
 * The half of a divided field a spot belongs to, as far as its charges may use it. The area of
 * a quarter is not centred on the quarter, but the partition line is; so each half keeps inside
 * the shield (or escutcheon) on its own, and below the area's top (the brisure band). The two
 * halves are then made alike, so their charges match: per pale at the same height and size, as
 * far from the line on either side; per fess over the same width, as tall.
 */
function halfOf(at: Spot, f: Field, box: Box, area: Box, frame: Frame, esc?: Box): Box | null {
  const pale = f.kind === "per_pale" && (at === "dexter" || at === "sinister");
  const fess = f.kind === "per_fess" && (at === "chief_half" || at === "base_half");
  if (!pale && !fess) return null;
  const fit = (h: Box): Box | null => {
    const r = insideShield(h, frame);
    const y0 = Math.max(r.y, area.y), y1 = r.y + r.h;
    return y1 > y0 ? { ...r, y: y0, h: y1 - y0 } : null;
  };
  const a = fit(pale ? sub(box, 0, 0, 0.5, 1) : sub(box, 0, 0, 1, 0.5));
  const b = fit(pale ? sub(box, 0.5, 0, 0.5, 1) : sub(box, 0, 0.5, 1, 0.5));
  if (!a || !b) return (at === "dexter" || at === "chief_half" ? a : b) ?? null;
  if (pale) {
    const mid = box.x + box.w / 2, d = Math.min(mid - a.x, b.x + b.w - mid);
    const y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h);
    if (y1 <= y0 || d <= 0) return null;
    // an escutcheon over all sits on the line, so the halves stay mirror images beside it
    const r = { x: at === "dexter" ? mid - d : mid, y: y0, w: d, h: y1 - y0 };
    return esc ? clearOf(r, esc) : r;
  }
  const x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w), h = Math.min(a.h, b.h);
  if (x1 <= x0) return null;
  return { x: x0, y: (at === "chief_half" ? a : b).y, w: x1 - x0, h };
}

/** move a charge (centre and larger side) into a region, smaller if it does not fit */
function fitInto(cx: number, cy: number, size: number, r: Box): [number, number, number] {
  const m = 0.06 * Math.min(r.w, r.h);
  const s = Math.min(size, r.w - 2 * m, r.h - 2 * m);
  if (s <= 0) return [cx, cy, size];
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
  return [clamp(cx, r.x + m + s / 2, r.x + r.w - m - s / 2), clamp(cy, r.y + m + s / 2, r.y + r.h - m - s / 2), s];
}

/** how much a box must shrink about (cx, cy), a point inside it, to lie within r: 1 if it already does */
function shrinkInto(b: Box, cx: number, cy: number, r: Box): number {
  const k = Math.min(
    1,
    (cx - r.x) / (cx - b.x),
    (r.x + r.w - cx) / (b.x + b.w - cx),
    (cy - r.y) / (cy - b.y),
    (r.y + r.h - cy) / (b.y + b.h - cy),
  );
  return Math.max(k, 0);
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
/**
 * Where the charges of a semé go: rows offset by half, the outer ones half off the field. Off
 * the shield's own edge they are cut by its outline; across a partition line inside the shield
 * nothing would cut them (CK3 cannot clip), so there those are left out.
 */
function semyPositions(box: Box, frame: Frame): [number, number, number][] {
  const out: [number, number, number][] = [];
  const rows = 5, cols = 4, size = 0.17 * minDim(box), half = size / 2, e = 1e-6;
  const f = frame.box;
  const inner = { l: box.x > f.x + e, r: box.x + box.w < f.x + f.w - e, t: box.y > f.y + e, b: box.y + box.h < f.y + f.h - e };
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? 0.5 : 0;
    for (let c = -1; c <= cols; c++) {
      const x = (c + off + 0.5) / cols;
      const y = (r + 0.5) / rows;
      if (x < -0.05 || x > 1.05) continue;
      const cx = box.x + x * box.w, cy = box.y + y * box.h;
      if ((inner.l && cx - half < box.x) || (inner.r && cx + half > box.x + box.w) || (inner.t && cy - half < box.y) || (inner.b && cy + half > box.y + box.h)) continue;
      out.push([cx, cy, size]);
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
  /**
   * half of an impaled coat: a quarterly coat inside it fills the whole half, each sub-quarter
   * keeping its charges inside the shield, instead of shrinking into the visible part over a
   * background (as in a quarter of four, six or eight, which are too narrow to split again)
   */
  tile?: boolean;
  /**
   * half of a coat impaled across the whole shield: a whole coat squeezed sideways, so its
   * ordinaries, chief and canton fill the half from top to base as on a whole shield, and only
   * the charges keep to the content area (below a cadency mark)
   */
  whole?: boolean;
  /** the outline this coat lies in: the whole shield unless on an escutcheon */
  frame?: Frame;
}

const below = (content: Box, y: number): Box =>
  y <= content.y ? content : { ...content, y, h: content.y + content.h - y };

/**
 * The outline a coat is drawn in: the whole shield (SHIELD_PATH in src/render/svg.ts) or an
 * escutcheon (the heater shape lint.ts checks it against), as a box.
 */
interface Frame {
  box: Box;
  heater: boolean;
}
const SHIELD_FRAME: Frame = { box: { x: 0, y: 0, w: 1, h: 1 }, heater: false };

/** an outline's left edge at height y, both in 0..1 of its box (the outline is symmetric) */
function edgeLeft(heater: boolean, y: number): number {
  // the lower left curve, from the point of the base (t = 0) up to where the side is straight (t = 1)
  const [side, c1y, c2y, c1x] = heater ? [0.45, 0.92, 0.75, 0.25] : [0.56, 0.94, 0.79, 0.21];
  if (y <= side) return 0;
  const at = (t: number, a: number, b: number, c: number, d: number) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid, 1, c1y, c2y, side) > y) lo = mid;
    else hi = mid;
  }
  return at(lo, 0.5, c1x, 0, 0);
}

/**
 * The biggest square-ish rectangle of a quarter that stays inside the shield (its sides and
 * curved base), keeping the quarter's top edge.
 */
function insideShield(cell: Box, frame: Frame): Box {
  const f = frame.box, margin = 0.02 * f.w;
  let best = cell, size = -1;
  for (let k = 20; k >= 6; k--) {
    const h = (cell.h * k) / 20;
    const left = edgeLeft(frame.heater, (cell.y + h - f.y) / f.h) * f.w + margin;
    const x0 = Math.max(cell.x, f.x + left), x1 = Math.min(cell.x + cell.w, f.x + f.w - left);
    if (x1 - x0 <= 0) continue;
    const s = Math.min(x1 - x0, h);
    if (s > size + 1e-9) {
      size = s;
      best = { x: x0, y: cell.y, w: x1 - x0, h };
    }
  }
  return best;
}

/**
 * The biggest square-ish part of a box clear of an escutcheon over all: beside it, above or
 * below it, or beside its narrowing base when the box gives up some height.
 */
function clearOf(c: Box, esc: Box): Box {
  let best = c, size = -1;
  for (let i = 0; i <= 10; i++)
    for (let j = 0; i + j <= 10; j++) {
      const y0 = c.y + (c.h * i) / 10, y1 = c.y + c.h - (c.h * j) / 10;
      // the escutcheon is widest at the top of the part of it beside this span
      const a = Math.max(y0, esc.y), b = Math.min(y1, esc.y + esc.h);
      let x0 = c.x, x1 = c.x + c.w;
      if (a < b) {
        const l = edgeLeft(true, (a - esc.y) / esc.h) * esc.w, L = esc.x + l, R = esc.x + esc.w - l;
        const left = Math.min(x1, L) - x0, right = x1 - Math.max(x0, R);
        if (left <= 0 && right <= 0) continue;
        if (left >= right) x1 = x0 + left;
        else x0 = x1 - right;
      }
      const s = Math.min(x1 - x0, y1 - y0);
      if (s > size + 1e-9) {
        size = s;
        best = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      }
    }
  return best;
}

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
    // an impaled coat inside a quarter fills it too: its halves are strips of the quarter
    const tile = nested && (!!opts.tile || quarterRows(arms.quarterly) === 1);
    if (nested && !tile) {
      out.push({ type: "rect", box, t: firstTincture(q1.field), bg: bgTag });
      qb = opts.content!;
    }
    const cols = quarterCols(arms.quarterly), rows = quarterRows(arms.quarterly);
    const q = qs.map((_, i) => sub(qb, (i % cols) / cols, Math.floor(i / cols) / rows, 1 / cols, 1 / rows));
    const atBase = !opts.content || !!opts.lower;
    // every quarter keeps its charges inside the shield's curved base (insideShield) and below
    // the brisure band, or below the top of the impaled half it is tiled into; an escutcheon
    // over all takes the middle, so the charges keep to the biggest part beside it
    const floor = tile ? opts.content!.y : box.y + (band ? band[1] * box.h : 0);
    // the halves of a coat impaled across the whole height are each a whole coat squeezed
    // sideways (impalement, not dimidiation): ordinaries run the whole half and charges stand
    // at the fess point, not in the square at its top
    const whole = rows === 1 && !nested;
    let content = q.map((c) => {
      const s = whole ? c : insideShield(c, opts.frame ?? SHIELD_FRAME);
      const cut = Math.max(0, floor - s.y);
      return { ...s, y: s.y + cut, h: s.h - cut };
    });
    if (arms.overall) {
      const [cx, cy] = rel(box, 0.5, 0.5);
      const esc = escutcheonBox(cx, cy, box.w * 0.34);
      content = content.map((c) => clearOf(c, esc));
    }
    // inside another quarter, the tags carry its own: the export skips the whole shield's q1 and q4
    const tag = (i: number) => (bgTag === "root" ? `q${i + 1}` : `${bgTag}-q${i + 1}`);
    qs.forEach((a, i) =>
      out.push(...layoutInside(a, q[i], { bg: tag(i), content: content[i], lower: atBase && (rows === 1 || i >= cols), tile: rows === 1, whole, frame: opts.frame })),
    );
  } else {
    const f = arms.field;
    // on an escutcheon the shield shape itself is drawn in the first tincture; divisions go on top
    if (opts.escutcheon) {
      if (f.kind !== "plain" && f.kind !== "semy") out.push({ type: "division", kind: f.kind, box, t: f.t, bg: bgTag, ...(f.line ? { line: f.line } : {}) });
    } else {
      if (f.kind === "plain") out.push(f.t === "ermine" ? { type: "ermine", box, bg: bgTag } : { type: "rect", box, t: f.t, bg: bgTag });
      else if (f.kind === "semy") {
        out.push({ type: "rect", box, t: f.t, bg: bgTag });
        for (const [x, y, s] of semyPositions(box, opts.frame ?? SHIELD_FRAME)) placeCharge(out, { ...f.charge, count: 1 }, x, y, s, f.t, "semy");
      } else out.push({ type: "division", kind: f.kind, box, t: f.t, bg: bgTag, ...(f.line ? { line: f.line } : {}) });
    }
    let content = opts.content ?? box;
    if (band) content = below(content, box.y + band[1] * box.h);

    const o = arms.ordinary;
    const geo = opts.lower && opts.content && !opts.whole ? opts.content : box;
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
    // inside an orle or tressure the charge keeps to the ring: placed in the ring's box as on a
    // whole shield, then shrunk about that point until it clears what took part of the field (a
    // chief, a cadency mark, an escutcheon over all). Shrunk about its centre it stays inside the
    // outline it has on a whole shield, so it never slides onto the ring.
    const ringed = !!o && (o.kind === "orle" || o.kind === "tressure");
    for (const p of arms.charges) {
      const inRing = ringed && p.at === "center";
      const area = p.at === "between" || inRing ? geo : content;
      const esc = arms.overall ? escutcheonBox(...rel(box, 0.5, 0.56), box.w * 0.34) : undefined;
      const half = halfOf(p.at, f, box, area, opts.frame ?? SHIELD_FRAME, esc);
      for (const [rx, ry, s] of spotGeometry(p, arms)) {
        const c = p.at === "between" ? { ...p.charge, count: 1 as const } : p.charge;
        let [cx0, cy0] = rel(area, rx, ry);
        // each in the middle of its half across: per pale as far from the line, per fess one above the other
        if (half) cx0 = half.x + half.w / 2;
        const [cx, cy, s0] = half ? fitInto(cx0, cy0, s * minDim(area), half) : [cx0, cy0, s * minDim(area)];
        const size = inRing ? s0 * shrinkInto(chargeBox(c, cx, cy, s0), cx, cy, content) : s0;
        placeCharge(out, c, cx, cy, size, p.at === "between" ? fieldUnder : underAt(p.at, arms));
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
