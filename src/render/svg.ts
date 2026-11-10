// Arms -> SVG, drawn with our own art (no game assets). Geometry comes from
// layout.ts, so the picture matches the CK3 export position for position.

import { ART } from "../art/index.ts";
import type { ArtColors } from "../art/types.ts";
import { INK } from "../art/style.ts";
import { CHARGES, TEX } from "../charges.ts";
import { roleTinctures } from "../ck3/export.ts";
import type { Arms } from "../heraldry/ast.ts";
import { TINCTURE, type Tincture } from "../heraldry/tincture.ts";
import { CHIEF_INDENTED, layout, ORDINARY_POLYS, ordinaryPolys, type Box, type LNode } from "../layout.ts";

const S = 100; // viewBox units per CK3 unit
const n = (v: number) => +(v * S).toFixed(2);
const OUTLINE = `stroke="${INK}" stroke-width="1.1" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;

export const SHIELD_PATH = "M2,0 H98 Q100,0 100,2 V56 C100,79 79,94 50,100 C21,94 0,79 0,56 V2 Q0,0 2,0 Z";

interface Ctx {
  id: string;
  next: number;
  defs: string[];
}

function fillOf(t: Tincture, ctx: Ctx): string {
  return t === "ermine" ? `url(#${ctx.id}-ermine)` : TINCTURE[t].svg;
}

/** polygon given in box-relative coordinates */
function poly(b: Box, pts: [number, number][], fill: string, outline = true): string {
  const p = pts.map(([x, y]) => `${n(b.x + x * b.w)},${n(b.y + y * b.h)}`).join(" ");
  return `<polygon points="${p}" fill="${fill}"${outline ? " " + OUTLINE : ""}/>`;
}

type Pt = [number, number];
const onBorder = ([x0, y0]: Pt, [x1, y1]: Pt) =>
  (x0 <= 0 && x1 <= 0) || (x0 >= 1 && x1 >= 1) || (y0 <= 0 && y1 <= 0) || (y0 >= 1 && y1 >= 1);

/**
 * A clockwise, box-relative polygon whose edges (except those along the box
 * border) follow a line of partition: engrailed = shallow arcs biting in,
 * embattled = battlements standing out.
 */
function linedPath(b: Box, pts: Pt[], line: "engrailed" | "embattled", only?: number): string {
  const P = ([x, y]: Pt) => `${n(b.x + x * b.w)},${n(b.y + y * b.h)}`;
  let d = `M${P(pts[0])}`;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    if (onBorder(p, q) || (only !== undefined && i !== only)) return void (d += ` L${P(q)}`);
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const k = Math.max(2, Math.round(len / (line === "engrailed" ? 0.1 : 0.07)));
    const at = (j: number): Pt => [p[0] + ((q[0] - p[0]) * j) / k, p[1] + ((q[1] - p[1]) * j) / k];
    if (line === "engrailed") {
      const seg = (len / k) * b.w * S, ang = (Math.atan2((q[1] - p[1]) * b.h, (q[0] - p[0]) * b.w) * 180) / Math.PI;
      for (let j = 1; j <= k; j++) d += ` A${+(seg / 2).toFixed(2)},${+(seg * 0.28).toFixed(2)} ${+ang.toFixed(1)} 0 0 ${P(at(j))}`;
    } else {
      // outward normal of a clockwise polygon
      const nx = (q[1] - p[1]) / len, ny = -(q[0] - p[0]) / len, h = 0.035;
      for (let j = 0; j < k; j++) {
        const a = at(j), c = at(j + 1);
        if (j % 2) d += ` L${P([a[0] + nx * h, a[1] + ny * h])} L${P([c[0] + nx * h, c[1] + ny * h])} L${P(c)}`;
        else d += ` L${P(c)}`;
      }
    }
  });
  return d + " Z";
}

/** a zigzag through the given points: x from 0 to 1 in `teeth * 2` steps, alternating between y0 and y1 */
const zigzag = (teeth: number, y0: number, y1: number): Pt[] =>
  Array.from({ length: teeth * 2 + 1 }, (_, k) => [Math.min(1.01, Math.max(-0.01, k / (teeth * 2))), k % 2 ? y1 : y0] as Pt);

function linedShape(node: Extract<LNode, { type: "shape" }>, c: string): string {
  const b = node.box;
  if (node.kind === "fess" && node.line === "dancetty") {
    const top = zigzag(5, 0.453, 0.367);
    return poly(b, [...top, ...top.map(([x, y]) => [x, y + 0.195] as Pt).reverse()], c);
  }
  const line = node.line === "embattled" ? "embattled" : "engrailed";
  return ordinaryPolys(node.kind, node.line)
    .map((p) => `<path d="${linedPath(b, p, line, line === "embattled" ? 1 : undefined)}" fill="${c}" ${OUTLINE}/>`)
    .join("");
}

function linedDivision(node: Extract<LNode, { type: "division" }>, a: string, c: string): string {
  const b = node.box, base = rect(b, a, false);
  if (node.kind === "per_fess") return base + poly(b, [[-0.01, 1.01], ...zigzag(7, 0.367, 0.633), [1.01, 1.01]], c);
  // per bend nebuly: a wavy line down the dexter diagonal
  const P = ([x, y]: Pt) => `${n(b.x + x * b.w)},${n(b.y + y * b.h)}`;
  let d = `M${P([-0.01, -0.01])}`;
  const k = 9;
  for (let j = 0; j < k; j++) {
    const t0 = j / k, t1 = (j + 1) / k, m = (t0 + t1) / 2, o = j % 2 ? 0.07 : -0.07;
    d += ` Q${P([m + o, m - o])} ${P([t1, t1])}`;
  }
  return base + `<path d="${d} L${P([1.01, 1.01])} L${P([-0.01, 1.01])} Z" fill="${c}" ${OUTLINE}/>`;
}

function escutcheonPath(b: Box): string {
  const p = (rx: number, ry: number) => `${n(b.x + rx * b.w)},${n(b.y + ry * b.h)}`;
  return `M${p(0, 0)} L${p(1, 0)} L${p(1, 0.45)} C${p(1, 0.75)} ${p(0.75, 0.92)} ${p(0.5, 1)} C${p(0.25, 0.92)} ${p(0, 0.75)} ${p(0, 0.45)} Z`;
}

const sub = (b: Box, x: number, y: number, w: number, h: number): Box => ({ x: b.x + x * b.w, y: b.y + y * b.h, w: w * b.w, h: h * b.h });
// Fills without an outline abut other fills (quarters, chequers): anti-aliasing
// both edges would let the colour underneath show through as a hairline, so
// these are drawn with crisp (pixel-snapped) edges instead.
const rect = (b: Box, fill: string, outline = true) =>
  `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" fill="${fill}"${outline ? " " + OUTLINE : ' shape-rendering="crispEdges"'}/>`;

function division(node: Extract<LNode, { type: "division" }>, ctx: Ctx): string {
  const { box: b } = node;
  const [a, c] = node.t.map((t) => fillOf(t, ctx));
  if (node.line) return linedDivision(node, a, c);
  const base = rect(b, a, false);
  switch (node.kind) {
    case "per_pale":
      return base + poly(b, [[0.5, -0.01], [1.01, -0.01], [1.01, 1.01], [0.5, 1.01]], c);
    case "per_fess":
      return base + poly(b, [[-0.01, 0.5], [1.01, 0.5], [1.01, 1.01], [-0.01, 1.01]], c);
    case "quarterly":
      return base + poly(b, [[0.5, -0.01], [1.01, -0.01], [1.01, 0.5], [0.5, 0.5]], c) + poly(b, [[-0.01, 0.5], [0.5, 0.5], [0.5, 1.01], [-0.01, 1.01]], c);
    case "per_bend":
      return base + poly(b, [[-0.01, -0.01], [-0.01, 1.01], [1.01, 1.01]], c);
    case "per_bend_sinister":
      return base + poly(b, [[1.01, -0.01], [1.01, 1.01], [-0.01, 1.01]], c);
    case "per_saltire":
      return base + poly(b, [[-0.01, -0.01], [0.5, 0.5], [-0.01, 1.01]], c) + poly(b, [[1.01, -0.01], [0.5, 0.5], [1.01, 1.01]], c);
    case "gyronny": {
      let s = base;
      const pts: [number, number][] = [[0.5, 0], [1, 0], [1, 0.5], [1, 1], [0.5, 1], [0, 1], [0, 0.5], [0, 0]];
      for (let i = 0; i < 8; i += 2) s += poly(b, [[0.5, 0.5], pts[i], pts[(i + 1) % 8]], c);
      return s;
    }
    case "barry_indented": {
      // bars with zigzag edges that interlock
      let s = base;
      const h = 1 / 6, amp = h * 0.45;
      for (const r of [1, 3, 5]) {
        const edge = (y: number) => Array.from({ length: 17 }, (_, j) => [Math.min(1.01, Math.max(-0.01, j / 16)), y + (j % 2 ? -amp : amp)] as Pt);
        s += poly(b, [...edge(r * h), ...edge((r + 1) * h).reverse()], c, false);
      }
      return s;
    }
    case "barry":
    case "barry8":
    case "barry10":
    case "paly": {
      const k = node.kind === "barry8" ? 8 : node.kind === "barry10" ? 10 : 6;
      let s = base;
      for (let i = 1; i < k; i += 2) s += node.kind === "paly" ? rect(sub(b, i / k, -0.01, 1 / k, 1.02), c) : rect(sub(b, -0.01, i / k, 1.02, 1 / k), c);
      return s;
    }
    case "chequy": {
      let s = base;
      for (let r = 0; r < 6; r++) for (let q = 0; q < 6; q++) if ((r + q) % 2) s += rect(sub(b, q / 6, r / 6, 1 / 6, 1 / 6), c, false);
      return s;
    }
    case "bendy": {
      // six bends of equal width along the dexter diagonal
      let s = base;
      for (let i = 1; i < 6; i += 2) {
        const d0 = -1 + (2 * i) / 6, d1 = -1 + (2 * (i + 1)) / 6;
        s += poly(b, [[d0, 0], [d1, 0], [d1 + 1, 1], [d0 + 1, 1]], c);
      }
      return s;
    }
    case "lozengy":
    case "lozengy_bend": {
      let s = base;
      const cols = node.kind === "lozengy" ? 5 : 6, rows = node.kind === "lozengy" ? 4 : 6;
      for (let r = -1; r <= rows; r++)
        for (let q = -1; q <= cols; q++) {
          const cx = (q + 0.5 + (r % 2 ? 0.5 : 0)) / cols, cy = (r + 0.5) / rows;
          const hw = 0.5 / cols, hh = 0.5 / rows;
          let pts: [number, number][] = [[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy]];
          if (node.kind === "lozengy_bend") pts = pts.map(([x, y]) => [x + (y - 0.5) * 0.5, y]);
          s += poly(b, pts, c, false);
        }
      return s;
    }
  }
}

function shape(node: Extract<LNode, { type: "shape" }>, ctx: Ctx): string {
  const { box: b } = node;
  const c = fillOf(node.t, ctx);
  if (node.line) return linedShape(node, c);
  const polys = ORDINARY_POLYS[node.kind];
  if (polys) return polys.map((p) => poly(b, p, c)).join("");
  switch (node.kind) {
    case "fess":
      return rect(sub(b, -0.01, 0.402, 1.02, 0.2), c);
    case "pale":
      return rect(sub(b, 0.402, -0.01, 0.2, 1.02), c);
    case "cross":
      return poly(b, [[0.402, -0.01], [0.602, -0.01], [0.602, 0.402], [1.01, 0.402], [1.01, 0.602], [0.602, 0.602], [0.602, 1.01], [0.402, 1.01], [0.402, 0.602], [-0.01, 0.602], [-0.01, 0.402], [0.402, 0.402]], c);
    case "bend":
      return poly(b, [[-0.01, -0.01], [0.143, -0.01], [1.01, 0.857], [1.01, 1.01], [0.857, 1.01], [-0.01, 0.143]], c);
    case "bend_sinister":
      return poly(b, [[1.01, -0.01], [0.857, -0.01], [-0.01, 0.857], [-0.01, 1.01], [0.143, 1.01], [1.01, 0.143]], c);
    case "saltire": {
      const h = 0.143;
      return poly(b, [[-0.01, -0.01], [h, -0.01], [0.5, 0.5 - h], [1 - h, -0.01], [1.01, -0.01], [1.01, h], [0.5 + h, 0.5], [1.01, 1 - h], [1.01, 1.01], [1 - h, 1.01], [0.5, 0.5 + h], [h, 1.01], [-0.01, 1.01], [-0.01, 1 - h], [0.5 - h, 0.5], [-0.01, h]], c);
    }
    case "chevron":
      return poly(b, [[-0.01, 0.725], [0.5, 0.215], [1.01, 0.725], [1.01, 1.01], [0.5, 0.5], [-0.01, 1.01]], c);
    case "pile":
      return poly(b, [[-0.01, -0.01], [1.01, -0.01], [0.5, 0.8]], c);
    case "pallets": {
      const e = TEX.pallets4.edges;
      let s = "";
      for (let i = 0; i < e.length; i += 2) s += rect(sub(b, e[i], -0.01, e[i + 1] - e[i], 1.02), c);
      return s;
    }
    case "orle": {
      const outer = escutcheonPath(sub(b, 0.188, 0.109, 0.624, 0.774));
      const inner = escutcheonPath(sub(b, 0.273, 0.19, 0.454, 0.6));
      return `<path d="${outer} ${inner}" fill="${c}" fill-rule="evenodd" ${OUTLINE}/>`;
    }
    case "tressure": {
      const ring = (x: number, y: number, w: number, h: number, t: number) =>
        `<path d="${escutcheonPath(sub(b, x, y, w, h))} ${escutcheonPath(sub(b, x + t, y + t, w - 2 * t, h - 2 * t * 1.15))}" fill="${c}" fill-rule="evenodd" ${OUTLINE}/>`;
      return ring(0.12, 0.04, 0.76, 0.88, 0.025) + ring(0.17, 0.09, 0.66, 0.77, 0.025);
    }
    case "baton": {
      const w = 0.04;
      return poly(b, [[0.875 + w, 0.125 + w], [0.875 - w, 0.125 - w], [0.125 - w, 0.875 - w], [0.125 + w, 0.875 + w]].map(([x, y]) => [x, y] as [number, number]), c);
    }
    default:
      return ""; // the rest are drawn from ORDINARY_POLYS above
  }
}

function ermineDefs(ctx: Ctx): string {
  const spot = `<g fill="${INK}"><circle cx="5" cy="1.6" r="1.1"/><circle cx="3" cy="3" r="1.1"/><circle cx="7" cy="3" r="1.1"/><path d="M5,3 C4,6 2.8,8 2.6,9.5 L4,8.6 L5,10 L6,8.6 L7.4,9.5 C7.2,8 6,6 5,3 Z"/></g>`;
  return `<pattern id="${ctx.id}-ermine" width="10" height="12" patternUnits="userSpaceOnUse"><rect width="10" height="12" fill="${TINCTURE.argent.svg}"/>${spot}<g transform="translate(5 6)">${spot}</g><g transform="translate(-5 6)">${spot}</g></pattern>`;
}

function draw(nodes: LNode[], ctx: Ctx): string {
  let s = "";
  for (const node of nodes) {
    switch (node.type) {
      case "rect":
        if (node.line && node.area) {
          // an indented chief: solid band, then seven teeth pointing down
          const { solid, tips } = CHIEF_INDENTED;
          const teeth: Pt[] = [];
          for (let k = 7; k >= 1; k--) teeth.push([(k - 0.5) / 7, tips], [(k - 1) / 7, solid]);
          s += poly(node.area, [[-0.01, -0.01], [1.01, -0.01], [1.01, solid], ...teeth, [-0.01, solid]], fillOf(node.t, ctx));
        } else s += rect(node.box, fillOf(node.t, ctx), !node.bg);
        break;
      case "ermine":
        s += rect(node.box, `url(#${ctx.id}-ermine)`, false);
        break;
      case "division":
        s += division(node, ctx);
        break;
      case "shape":
        s += shape(node, ctx);
        break;
      case "label": {
        const b = node.box;
        const c = fillOf(node.t, ctx);
        const bar = 0.2 * (node.y1 - node.y0);
        s += rect(sub(b, -0.01, node.y0, 1.02, bar), c);
        for (const cx of [0.25, 0.5, 0.75]) s += rect(sub(b, cx - 0.039, node.y0, 0.078, node.y1 - node.y0), c);
        s += rect(sub(b, -0.01, node.y0, 1.02, bar), c, false);
        break;
      }
      case "charge": {
        const { charge, box: b, under } = node;
        const art = ART[charge.id];
        const r = roleTinctures(charge, under);
        const colors: ArtColors = {
          body: TINCTURE[r.body].svg, armed: TINCTURE[r.armed].svg, crown: TINCTURE[r.crown].svg, hair: TINCTURE[r.hair].svg,
          second: TINCTURE[r.second].svg, detail: TINCTURE[r.detail].svg, under: TINCTURE[r.under].svg,
          features: TINCTURE[r.features].svg,
        };
        const def = CHARGES[charge.id];
        if (charge.nimbed && def?.halo) {
          for (const [hx, hy, hr] of def.halo) {
            s += `<circle cx="${n(b.x + hx * b.w)}" cy="${n(b.y + hy * b.h)}" r="${n(hr * b.w)}" fill="${TINCTURE[r.nimbus].svg}" ${OUTLINE}/>`;
          }
        }
        // inner detail lines are dark; on a sable charge draw them light so the detail stays visible
        let inner = art ? art.draw(colors) : "";
        if (r.body === "sable") inner = inner.replace(/stroke="#151311"( stroke-width="0\.8")/g, 'stroke="#9b9386"$1');
        s += art
          ? `<svg x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" viewBox="0 0 ${art.w} ${art.h}" preserveAspectRatio="none" overflow="visible">${inner}</svg>`
          : `<ellipse cx="${n(b.x + b.w / 2)}" cy="${n(b.y + b.h / 2)}" rx="${n(b.w / 2)}" ry="${n(b.h / 2)}" fill="${colors.body}" ${OUTLINE}/>`;
        break;
      }
      case "escutcheon": {
        const id = `${ctx.id}-e${ctx.next++}`;
        const d = escutcheonPath(node.box);
        const f = node.arms.field;
        const t = f.kind === "plain" || f.kind === "semy" ? f.t : f.t[0];
        ctx.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
        s += `<path d="${d}" fill="${fillOf(t, ctx)}"/>`;
        s += `<g clip-path="url(#${id})">${draw(node.children, ctx)}</g>`;
        s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`;
        break;
      }
    }
  }
  return s;
}

let uid = 0;

export function renderSvg(arms: Arms, opts: { size?: number; title?: string } = {}): string {
  const size = opts.size ?? 320;
  const ctx: Ctx = { id: `cs${uid++}`, next: 0, defs: [] };
  const body = draw(layout(arms), ctx);
  // a light sheen only: the middle of the shield keeps the game's own colours (TINCTURE.svg)
  const gloss =
    `<radialGradient id="${ctx.id}-g" cx="0.35" cy="0.25" r="0.9"><stop offset="0" stop-color="#fff" stop-opacity="0.1"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.15"/></radialGradient>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 104 104" width="${size}" height="${size}" role="img">` +
    (opts.title ? `<title>${opts.title.replace(/</g, "&lt;")}</title>` : "") +
    `<defs>${ermineDefs(ctx)}${gloss}<clipPath id="${ctx.id}-c"><path d="${SHIELD_PATH}"/></clipPath>${ctx.defs.join("")}</defs>` +
    `<g clip-path="url(#${ctx.id}-c)">${body}<path d="${SHIELD_PATH}" fill="url(#${ctx.id}-g)"/></g>` +
    `<path d="${SHIELD_PATH}" fill="none" stroke="${INK}" stroke-width="2.4" vector-effect="non-scaling-stroke"/>` +
    `</svg>`
  );
}
