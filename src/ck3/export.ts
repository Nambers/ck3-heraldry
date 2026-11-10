// Arms -> CK3 coat-of-arms code, using only vanilla textures (no mod needed).

import { CHARGES, TEX, type RecipePart, type Role } from "../charges.ts";
import type { Arms, Charge } from "../heraldry/ast.ts";
import { TINCTURE, type Tincture } from "../heraldry/tincture.ts";
import { escutcheonEdge, layout, sub, type Box, type LNode } from "../layout.ts";
import type { Ck3Color, Coa, ColoredEmblem, Instance } from "./coa.ts";

/** a tincture, or a blend of two (a share `k` of the second) written as rgb */
type Colour = Tincture | { mix: [Tincture, Tincture, number] };

interface Piece {
  texture: string;
  colors: Colour[];
  pos: [number, number];
  scale: [number, number];
  rot?: number;
}

const hex = (t: Tincture) => [1, 3, 5].map((i) => parseInt(TINCTURE[t].svg.slice(i, i + 2), 16));
/** CK3's colour for a piece: the named colour, or an rgb blend of two (from the same values as the sketch) */
const ck = (c: Colour): Ck3Color => {
  if (typeof c === "string") return TINCTURE[c].ck3;
  const [a, b, k] = c.mix;
  const A = hex(a), B = hex(b);
  return { space: "rgb", v: A.map((v, i) => Math.round(v * (1 - k) + B[i] * k)) };
};
const centre = (b: Box): [number, number] => [b.x + b.w / 2, b.y + b.h / 2];
const over = (texture: string, box: Box, colors: Colour[], rot?: number): Piece => ({ texture, colors, pos: centre(box), scale: [box.w, box.h], rot });

/** first tincture of `order` that differs from everything it touches, so details stay visible */
const visible = (order: Tincture[], body: Tincture, under: Tincture): Tincture =>
  order.find((t) => t !== body && t !== under && !(under === "ermine" && t === "argent")) ?? order[0];

// Claws and tongues are usually red, or blue when red would vanish — which is
// how England's and Scotland's lions are blazoned ("armed and langued azure").
export const defaultArmed = (body: Tincture, under: Tincture): Tincture => visible(["gules", "azure", "or", "argent"], body, under);
export const defaultCrown = (body: Tincture, under: Tincture): Tincture => visible(["or", "gules", "azure", "argent"], body, under);
export const defaultSecond = (body: Tincture, under: Tincture): Tincture => visible(["argent", "or", "gules", "azure"], body, under);

export function roleTinctures(c: Charge, under: Tincture): Record<Role, Tincture> {
  const crown = c.crowned ?? defaultCrown(c.t, under);
  return {
    body: c.t,
    armed: c.armed ?? defaultArmed(c.t, under),
    crown,
    hair: c.crined ?? crown,
    second: c.second ?? defaultSecond(c.t, under),
    detail: c.detail ?? under,
    under,
    nimbus: c.nimbed ?? "or",
    ink: "sable",
    features: c.t === "sable" ? "argent" : "sable",
  };
}

/**
 * A raster charge's recipe for its size on the shield: the coarsest grid whose cells
 * stay within 1/300 of the shield's width (under a pixel on the game's large view).
 */
function rasterRecipe(levels: { n: number; ck3: RecipePart[] }[], s: number): RecipePart[] {
  const fit = levels.filter((l) => s / l.n <= 1 / 300);
  return (fit.length ? fit[fit.length - 1] : levels[0]).ck3;
}

function chargePieces(node: Extract<LNode, { type: "charge" }>): Piece[] {
  const { charge, box, under } = node;
  const def = CHARGES[charge.id];
  const [x0, y0, x1] = def.bbox;
  const s = box.w / (x1 - x0); // texture units -> shield units
  const recipe = def.raster ? rasterRecipe(def.raster, s) : def.ck3;
  const roles = roleTinctures(charge, under);
  // haloes go behind the charge: a dark disc with a slightly smaller gold one on it
  const halos: Piece[] = charge.nimbed && def.halo
    ? def.halo.flatMap(([hx, hy, hr]): Piece[] => {
        const pos: [number, number] = [box.x + hx * box.w, box.y + hy * box.h];
        const d = 2 * hr * box.w;
        return [
          { texture: TEX.halo, colors: [roles.ink], pos, scale: [d, d] },
          { texture: TEX.halo, colors: [roles.nimbus], pos, scale: [d * 0.94, d * 0.94] },
        ];
      })
    : [];
  return [...halos, ...recipe.map((p): Piece => ({
    texture: p.texture,
    colors: p.colors.map((r): Colour =>
      r === "edge" ? { mix: [roles.body, roles.under === "ermine" ? "argent" : roles.under, 0.5] } : r === "line" ? { mix: [roles.body, roles.body === "sable" ? "argent" : "sable", 0.8] } : roles[r],
    ),
    pos: [box.x + ((p.x ?? 0.5) - x0) * s, box.y + ((p.y ?? 0.5) - y0) * s],
    scale: [(p.w ?? 1) * s, (p.h ?? 1) * s],
    rot: p.rot,
  }))];
}

function escutcheonPieces(box: Box, t: Tincture, outline: boolean): Piece[] {
  const [x0, y0, x1, y1] = TEX.escutcheon.bbox;
  const sx = box.w / (x1 - x0);
  const sy = box.h / (y1 - y0);
  const pos = centre(box);
  const out: Piece[] = [];
  if (outline) out.push({ texture: TEX.escutcheon.texture, colors: ["sable"], pos, scale: [sx * 1.07, sy * 1.06] });
  out.push({ texture: TEX.escutcheon.texture, colors: [t], pos, scale: [sx, sy] });
  return out;
}

const fill = (box: Box, t: Tincture): Piece => (t === "ermine" ? over(TEX.ermine, box, ["argent", "sable"]) : over(TEX.block, box, [t]));

/** stripes of the second tincture over a base of the first */
function stripes(box: Box, t: [Tincture, Tincture], n: number, vertical: boolean): Piece[] {
  const out = [fill(box, t[0])];
  for (let i = 1; i < n; i += 2) out.push(fill(vertical ? sub(box, i / n, 0, 1 / n, 1) : sub(box, 0, i / n, 1, 1 / n), t[1]));
  return out;
}

function divisionPieces(n: Extract<LNode, { type: "division" }>): Piece[] {
  const { box, t } = n;
  // a line of partition has its own two-colour texture (color1 above / upper right)
  const lined = n.line && TEX.line[`${n.kind}_${n.line}`];
  if (lined) return [over(lined, box, [t[0], t[1]])];
  switch (n.kind) {
    case "per_pale":
      return [fill(sub(box, 0, 0, 0.5, 1), t[0]), fill(sub(box, 0.5, 0, 0.5, 1), t[1])];
    case "per_fess":
      return [fill(sub(box, 0, 0, 1, 0.5), t[0]), fill(sub(box, 0, 0.5, 1, 0.5), t[1])];
    case "quarterly":
      return [fill(box, t[0]), fill(sub(box, 0.5, 0, 0.5, 0.5), t[1]), fill(sub(box, 0, 0.5, 0.5, 0.5), t[1])];
    case "per_bend":
      return [over(TEX.perBend, box, [t[0], t[1]])];
    case "per_bend_sinister":
      return [over(TEX.perBend, box, [t[1], t[0]], 90)];
    case "per_saltire":
      return [over(TEX.perSaltire, box, [t[0], t[1]])];
    case "gyronny":
      return [over(TEX.gyronny, box, [t[0], t[1]])];
    case "bendy":
      return [over(TEX.bendy, box, [t[0], t[1]])];
    case "lozengy":
      return [over(TEX.lozengy, box, [t[0], t[1]])];
    case "lozengy_bend":
      return [over(TEX.lozengyBend, box, [t[0], t[1]])];
    case "barry":
      return stripes(box, t, 6, false);
    case "barry8":
      return stripes(box, t, 8, false);
    case "barry10":
      return stripes(box, t, 10, false);
    case "barry_indented":
      return [over(TEX.barryIndented, box, [t[0], t[1]])];
    case "paly":
      return stripes(box, t, 6, true);
    case "chequy": {
      const out = [fill(box, t[0])];
      for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if ((r + c) % 2) out.push(fill(sub(box, c / 6, r / 6, 1 / 6, 1 / 6), t[1]));
      return out;
    }
  }
}

function shapePieces(n: Extract<LNode, { type: "shape" }>): Piece[] {
  const { box, t } = n;
  const lined = n.line && TEX.line[`${n.kind}_${n.line}`];
  if (lined) return [over(lined, box, [t])];
  switch (n.kind) {
    case "fess":
      return [over(TEX.fess, box, [t])];
    case "pale":
      return [over(TEX.pale, box, [t])];
    case "cross":
      return [over(TEX.fess, box, [t]), over(TEX.pale, box, [t])];
    case "bend":
      return [over(TEX.bend, box, [t])];
    case "bend_sinister":
      return [over(TEX.bendSinister, box, [t])];
    case "saltire":
      return [over(TEX.saltire, box, [t])];
    case "chevron":
      return [over(TEX.chevron, box, [t])];
    case "pile":
      // the vanilla pile reaches the centre; stretch it to reach the base
      return [{ texture: TEX.pile, colors: [t], pos: [box.x + box.w / 2, box.y + 0.8 * box.h], scale: [box.w, 1.6 * box.h] }];
    case "orle":
      return [over(TEX.orle, box, [t])];
    case "tressure":
      return [over(TEX.tressure, box, [t])];
    case "pallets":
      return [over(TEX.pallets4.texture, box, [t])];
    case "bars":
      return [over(TEX.bars, box, [t])];
    case "chevronels":
      return [over(TEX.chevronels, box, [t])];
    case "pall":
      return [over(TEX.pall, box, [t])];
    case "baton":
      // a bendlet turned to the sinister and couped (cut short at both ends)
      return [{ texture: TEX.bendlet, colors: [t], pos: centre(box), scale: [box.w * 0.75, box.h * 0.75], rot: 90 }];
  }
}

// CK3 cannot clip, so a block inside an escutcheon is cut into horizontal strips
// that follow the measured outline (finer where the curve is steeper).
const CLIP_Y = [0, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.78, 0.81, 0.84, 0.87, 0.9, 0.92, 0.94, 0.96, 0.98, 1];

function clipBlock(p: Piece, esc: Box): Piece[] {
  const r = [
    (p.pos[0] - p.scale[0] / 2 - esc.x) / esc.w,
    (p.pos[1] - p.scale[1] / 2 - esc.y) / esc.h,
    (p.pos[0] + p.scale[0] / 2 - esc.x) / esc.w,
    (p.pos[1] + p.scale[1] / 2 - esc.y) / esc.h,
  ];
  const strips: [number, number, number, number][] = [];
  for (let i = 0; i + 1 < CLIP_Y.length; i++) {
    const ya = Math.max(CLIP_Y[i], r[1]), yb = Math.min(CLIP_Y[i + 1], r[3]);
    if (yb - ya < 1e-6) continue;
    const e = escutcheonEdge((ya + yb) / 2);
    const x0 = Math.max(r[0], e), x1 = Math.min(r[2], 1 - e);
    if (x1 - x0 < 1e-4) continue;
    const last = strips[strips.length - 1];
    if (last && Math.abs(last[0] - x0) < 1e-6 && Math.abs(last[2] - x1) < 1e-6 && Math.abs(last[3] - ya) < 1e-6) last[3] = yb;
    else strips.push([x0, ya, x1, yb]);
  }
  return strips.map(([x0, y0, x1, y1]) => over(TEX.block, sub(esc, x0, y0, x1 - x0, y1 - y0), p.colors));
}

/** ordinaries that are plain rectangles, drawn as blocks so they can be clipped */
function blockOrdinary(n: Extract<LNode, { type: "shape" }>): Piece[] | null {
  const b = n.box, f = (x0: number, y0: number, x1: number, y1: number) => fill(sub(b, x0, y0, x1 - x0, y1 - y0), n.t);
  if (n.kind === "fess") return [f(0, 0.402, 1, 0.602)];
  if (n.kind === "pale") return [f(0.402, 0, 0.602, 1)];
  if (n.kind === "cross") return [f(0, 0.402, 1, 0.602), f(0.402, 0, 0.602, 1)];
  if (n.kind === "pallets") {
    const e = TEX.pallets4.edges;
    return [0, 2, 4, 6].map((i) => f(e[i], 0, e[i + 1], 1));
  }
  return null;
}

const extent = (p: Piece): [number, number, number, number] => {
  // rotated pieces: take the bounding circle's square to be safe
  const hw = p.rot ? Math.hypot(p.scale[0], p.scale[1]) / 2 : Math.abs(p.scale[0]) / 2;
  const hh = p.rot ? hw : Math.abs(p.scale[1]) / 2;
  return [p.pos[0] - hw, p.pos[1] - hh, p.pos[0] + hw, p.pos[1] + hh];
};
const overlaps = (a: number[], b: number[]) => Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 1e-6 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 1e-6;

function pieces(nodes: LNode[], skipBg: Set<string>, clip?: { box: Box; base: Tincture; drawn: number[][] }): Piece[] {
  const out: Piece[] = [];
  const emit = (ps: Piece[]) => {
    for (const p of ps) {
      if (clip) {
        // the escutcheon already shows its first tincture: a block of it over nothing else is redundant
        if (p.texture === TEX.block && p.colors[0] === clip.base && !clip.drawn.some((d) => overlaps(d, extent(p)))) continue;
        clip.drawn.push(extent(p));
      }
      out.push(p);
    }
  };
  for (const n of nodes) {
    if ("bg" in n && n.bg && skipBg.has(n.bg)) continue;
    if (clip) {
      const blocks = n.type === "rect" && !n.line ? [fill(n.box, n.t)] : n.type === "division" ? divisionPieces(n) : n.type === "shape" ? blockOrdinary(n) : null;
      if (blocks && blocks.every((p) => p.texture === TEX.block)) {
        for (const p of blocks) {
          if (p.colors[0] === clip.base && !clip.drawn.some((d) => overlaps(d, extent(p)))) continue;
          emit(clipBlock(p, clip.box));
        }
        continue;
      }
    }
    switch (n.type) {
      case "rect":
        // an indented chief: the texture spans the whole area and shows only the chief
        emit([n.line && n.area ? over(TEX.line.chief_indented, n.area, [n.t]) : fill(n.box, n.t)]);
        break;
      case "ermine":
        emit([over(TEX.ermine, n.box, ["argent", "sable"])]);
        break;
      case "division":
        emit(divisionPieces(n));
        break;
      case "shape":
        emit(shapePieces(n));
        break;
      case "label": {
        const sy = ((n.y1 - n.y0) * n.box.h) / (TEX.label.y1 - TEX.label.y0);
        const py = n.box.y + n.y0 * n.box.h + (0.5 - TEX.label.y0) * sy;
        emit([{ texture: TEX.label.texture, colors: [n.t], pos: [n.box.x + n.box.w / 2, py], scale: [n.box.w, sy] }]);
        break;
      }
      case "charge":
        emit(chargePieces(n));
        break;
      case "escutcheon": {
        const f = n.arms.field;
        const base = f.kind === "plain" || f.kind === "semy" ? f.t : f.t[0];
        emit(escutcheonPieces(n.box, base, n.outline));
        emit(pieces(n.children, new Set(), { box: n.box, base, drawn: [] }));
        break;
      }
    }
  }
  return out;
}

const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

export interface Ck3Export {
  coa: Coa;
  instances: number;
}

/** The root field goes into the pattern when a vanilla pattern draws it exactly. */
function rootPattern(arms: Arms): { pattern: string; colors: Tincture[]; skip: string[] } {
  const f = arms.quarterly ? arms.quarterly.q[0].field : arms.field;
  const q4 = arms.quarterly?.q[3].field;
  const sameQ4 = !!q4 && q4.kind === "plain" && f.kind === "plain" && q4.t === f.t;
  const tag = arms.quarterly ? (sameQ4 ? ["q1", "q4"] : ["q1"]) : ["root"];
  if (f.kind === "plain" && f.t !== "ermine") return { pattern: TEX.patternSolid, colors: [f.t], skip: tag };
  if (f.kind === "semy") return { pattern: TEX.patternSolid, colors: [f.t], skip: tag };
  if (!arms.quarterly && f.kind !== "plain" && !f.line && TEX.patterns[f.kind]) return { pattern: TEX.patterns[f.kind], colors: [f.t[0], f.t[1]], skip: tag };
  const first = f.kind === "plain" ? "argent" : f.t[0];
  return { pattern: TEX.patternSolid, colors: [first], skip: [] };
}

export function exportCk3(arms: Arms, key = "coa_rd_dynasty_1"): Ck3Export {
  const { pattern, colors, skip } = rootPattern(arms);
  const ps = pieces(layout(arms), new Set(skip));
  // painter's order -> depth: last piece is frontmost (depth 0)
  const emblems: ColoredEmblem[] = [];
  const index = new Map<string, ColoredEmblem>();
  ps.forEach((p, i) => {
    const k = p.texture + "|" + JSON.stringify(p.colors);
    let e = index.get(k);
    if (!e) {
      e = { texture: p.texture, instances: [] };
      if (p.colors[0]) e.color1 = ck(p.colors[0]);
      if (p.colors[1]) e.color2 = ck(p.colors[1]);
      if (p.colors[2]) e.color3 = ck(p.colors[2]);
      index.set(k, e);
      emblems.push(e);
    }
    const inst: Instance = {};
    if (Math.abs(p.pos[0] - 0.5) > 1e-6 || Math.abs(p.pos[1] - 0.5) > 1e-6) inst.position = [r6(p.pos[0]), r6(p.pos[1])];
    if (Math.abs(p.scale[0] - 1) > 1e-6 || Math.abs(p.scale[1] - 1) > 1e-6) inst.scale = [r6(p.scale[0]), r6(p.scale[1])];
    const depth = ps.length - 1 - i;
    if (depth > 0) inst.depth = depth + 0.01;
    if (p.rot) inst.rotation = p.rot;
    e.instances.push(inst);
  });
  const coa: Coa = { key, pattern, emblems, color1: ck(colors[0]), color2: ck(colors[1] ?? colors[0]), color3: ck(colors[0]) };
  return { coa, instances: ps.length };
}
