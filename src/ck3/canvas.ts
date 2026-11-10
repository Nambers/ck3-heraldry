// Render CK3 coat-of-arms code in the browser with the player's own game
// textures (read locally, never uploaded). Same rules as tools/ck3_preview.py:
//   emblem channels: B = color1 + shading (overlay), G = color2, R = color3, A = shape
//   pattern channels: R = color1, G = color2 mask, B = color3 mask
//   instance: rotate the texture, then scale along the shield axes; larger depth = further back

import { SHIELD_PATH } from "../render/svg.ts";
import type { Ck3Color, Coa } from "./coa.ts";
import { decodeDds, type Decoded } from "./dds.ts";

/** CK3 1.20 named colours (common/named_colors/default_colors.txt) */
const NAMED_HSV: Record<string, [number, number, number]> = {
  red: [0.02, 0.8, 0.45], blue: [0.58, 0.8, 0.4], yellow: [0.1, 0.75, 0.75], green: [0.35, 0.6, 0.3], black: [0.1, 0.25, 0.1],
  white: [0.08, 0.02, 0.8], purple: [0.9, 0.7, 0.35], orange: [0.064, 1, 0.6], grey: [0, 0, 0.5], brown: [21 / 360, 0.74, 0.45],
  blue_light: [0.58, 0.7, 0.55], green_light: [0.35, 0.5, 0.4], yellow_light: [0.1, 0.8, 1], red_dark: [0, 0.9, 0.3], blue_dark: [0.58, 0.9, 0.3],
};

function hsv(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  return ([[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]] as [number, number, number][])[((i % 6) + 6) % 6];
}

export function rgbOf(c: Ck3Color | undefined): [number, number, number] {
  if (c === undefined) return [0, 0, 0];
  if (typeof c === "string") return hsv(...(NAMED_HSV[c] ?? [0.8, 1, 1]));
  if (c.space === "rgb") return [c.v[0] / 255, c.v[1] / 255, c.v[2] / 255];
  if (c.space === "hsv360") return hsv(c.v[0] / 360, c.v[1] / 100, c.v[2] / 100);
  return hsv(c.v[0], c.v[1], c.v[2]);
}

/** where textures come from: a folder the player picked (gfx/coat_of_arms) */
export class TextureStore {
  private files = new Map<string, File | { getFile(): Promise<File> }>();
  private decoded = new Map<string, Promise<Decoded | null>>();

  /** files from <input webkitdirectory>; keeps colored_emblems/*.dds and patterns/*.dds */
  static fromFiles(list: FileList | File[]): TextureStore {
    const s = new TextureStore();
    for (const f of Array.from(list)) {
      const path = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
      const m = /(colored_emblems|patterns)\/([^/]+\.dds)$/i.exec(path);
      if (m) s.files.set(`${m[1].toLowerCase()}/${m[2].toLowerCase()}`, f);
      // loose files (no folder path): tell them apart by name
      else if (/^(ce|pattern)_.*\.dds$/i.test(f.name)) s.files.set(`${/^pattern/i.test(f.name) ? "patterns" : "colored_emblems"}/${f.name.toLowerCase()}`, f);
    }
    return s;
  }

  /** textures from a directory handle (opened lazily, one file at a time) */
  static fromHandles(map: Map<string, { getFile(): Promise<File> }>): TextureStore {
    const s = new TextureStore();
    for (const [k, h] of map) s.files.set(k, h);
    return s;
  }

  get size() {
    return this.files.size;
  }

  has(sub: string, name: string) {
    return this.files.has(`${sub}/${name.toLowerCase()}`);
  }

  get(sub: "colored_emblems" | "patterns", name: string): Promise<Decoded | null> {
    const key = `${sub}/${name.toLowerCase()}`;
    let p = this.decoded.get(key);
    if (!p) {
      const f = this.files.get(key);
      p = f
        ? (f instanceof File ? Promise.resolve(f) : f.getFile())
            .then((x) => x.arrayBuffer())
            .then(decodeDds)
            .catch(() => null)
        : Promise.resolve(null);
      this.decoded.set(key, p);
    }
    return p;
  }
}

const overlay = (a: number, b: number) => (a < 0.5 ? 2 * a * b : 1 - 2 * (1 - a) * (1 - b));

function colorize(tex: Decoded, c1: number[], c2: number[], c3: number[], pattern: boolean): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = tex.width;
  cv.height = tex.height;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(tex.width, tex.height);
  const d = tex.data, o = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    for (let k = 0; k < 3; k++) {
      let v: number;
      if (pattern) {
        v = c1[k] * (1 - g) + c2[k] * g;
        v = v * (1 - b) + c3[k] * b;
      } else {
        v = c1[k] * (1 - g) + c2[k] * g;
        v = v * (1 - r) + c3[k] * r;
        v = overlay(v, b);
      }
      o[i + k] = Math.round(Math.min(1, Math.max(0, v)) * 255);
    }
    o[i + 3] = pattern ? 255 : d[i + 3];
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

export interface RenderResult {
  canvas: HTMLCanvasElement;
  missing: string[];
}

export async function renderCoa(coa: Coa, store: TextureStore, size: number): Promise<RenderResult> {
  const canvas = document.createElement("canvas");
  const scale = window.devicePixelRatio || 1;
  canvas.width = canvas.height = Math.round(size * scale);
  canvas.style.width = canvas.style.height = `${size}px`;
  const N = canvas.width;
  const ctx = canvas.getContext("2d")!;
  const missing: string[] = [];

  // draw into an offscreen square (0..1 -> 0..N), then clip-copy into the shield
  const off = document.createElement("canvas");
  off.width = off.height = N;
  const o = off.getContext("2d")!;
  o.imageSmoothingQuality = "high";
  const pc = [rgbOf(coa.color1), rgbOf(coa.color2 ?? coa.color1), rgbOf(coa.color3 ?? coa.color1)];
  const pat = await store.get("patterns", coa.pattern);
  if (pat) o.drawImage(colorize(pat, pc[0], pc[1], pc[2], true), 0, 0, N, N);
  else {
    missing.push(coa.pattern);
    o.fillStyle = `rgb(${pc[0].map((v) => v * 255).join(",")})`;
    o.fillRect(0, 0, N, N);
  }
  const layers: { depth: number; order: number; img: HTMLCanvasElement; pos: number[]; scale: number[]; rot: number }[] = [];
  let order = 0;
  for (const e of coa.emblems) {
    const tex = await store.get("colored_emblems", e.texture);
    if (!tex) {
      missing.push(e.texture);
      continue;
    }
    const img = colorize(tex, rgbOf(e.color1), rgbOf(e.color2 ?? e.color1), rgbOf(e.color3 ?? e.color1), false);
    for (const i of e.instances) {
      layers.push({ depth: i.depth ?? 0, order: order++, img, pos: i.position ?? [0.5, 0.5], scale: i.scale ?? [1, 1], rot: i.rotation ?? 0 });
    }
  }
  layers.sort((a, b) => b.depth - a.depth || a.order - b.order);
  for (const l of layers) {
    o.save();
    o.translate(l.pos[0] * N, l.pos[1] * N);
    o.scale(l.scale[0] * N, l.scale[1] * N);
    o.rotate((l.rot * Math.PI) / 180);
    o.drawImage(l.img, -0.5, -0.5, 1, 1);
    o.restore();
  }

  // the shield: map the 0..1 square onto the 0..100 part of the -2..102 viewBox
  const k = N / 104;
  ctx.save();
  ctx.setTransform(k, 0, 0, k, 2 * k, 2 * k);
  const shield = new Path2D(SHIELD_PATH);
  ctx.clip(shield);
  ctx.drawImage(off, 0, 0, 100, 100);
  const g = ctx.createRadialGradient(35, 25, 0, 35, 25, 95);
  g.addColorStop(0, "rgba(255,255,255,0.16)");
  g.addColorStop(0.55, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();
  ctx.save();
  ctx.setTransform(k, 0, 0, k, 2 * k, 2 * k);
  ctx.lineWidth = (1.6 * scale) / k;
  ctx.strokeStyle = "#151311";
  ctx.stroke(shield);
  ctx.restore();
  return { canvas, missing: [...new Set(missing)] };
}
