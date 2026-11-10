// Minimal DDS decoder for CK3 coat-of-arms textures: DXT1, DXT3, DXT5 and
// uncompressed 32-bit, first mip level only. Returns RGBA bytes.

export interface Decoded {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

function rgb565(c: number): [number, number, number] {
  const r = (c >> 11) & 31, g = (c >> 5) & 63, b = c & 31;
  return [(r << 3) | (r >> 2), (g << 2) | (g >> 4), (b << 3) | (b >> 2)];
}

function colorBlock(view: DataView, off: number, out: Uint8ClampedArray, w: number, bx: number, by: number, dxt1: boolean) {
  const c0 = view.getUint16(off, true), c1 = view.getUint16(off + 2, true);
  const p0 = rgb565(c0), p1 = rgb565(c1);
  const pal: number[][] = [[...p0, 255], [...p1, 255]];
  if (!dxt1 || c0 > c1) {
    pal.push([0, 1, 2].map((i) => (2 * p0[i] + p1[i]) / 3).concat(255));
    pal.push([0, 1, 2].map((i) => (p0[i] + 2 * p1[i]) / 3).concat(255));
  } else {
    pal.push([0, 1, 2].map((i) => (p0[i] + p1[i]) / 2).concat(255));
    pal.push([0, 0, 0, 0]);
  }
  const bits = view.getUint32(off + 4, true);
  for (let i = 0; i < 16; i++) {
    const p = pal[(bits >> (2 * i)) & 3];
    const x = bx + (i & 3), y = by + (i >> 2);
    const o = (y * w + x) * 4;
    out[o] = p[0]; out[o + 1] = p[1]; out[o + 2] = p[2];
    if (dxt1) out[o + 3] = p[3];
  }
}

function alphaBlock5(bytes: Uint8Array, off: number, out: Uint8ClampedArray, w: number, bx: number, by: number) {
  const a0 = bytes[off], a1 = bytes[off + 1];
  const pal = [a0, a1];
  if (a0 > a1) for (let i = 1; i < 7; i++) pal.push(((7 - i) * a0 + i * a1) / 7);
  else {
    for (let i = 1; i < 5; i++) pal.push(((5 - i) * a0 + i * a1) / 5);
    pal.push(0, 255);
  }
  // 48 bits of 3-bit indices
  let bits = 0n;
  for (let i = 0; i < 6; i++) bits |= BigInt(bytes[off + 2 + i]) << BigInt(8 * i);
  for (let i = 0; i < 16; i++) {
    const idx = Number((bits >> BigInt(3 * i)) & 7n);
    const x = bx + (i & 3), y = by + (i >> 2);
    out[(y * w + x) * 4 + 3] = pal[idx];
  }
}

function alphaBlock3(bytes: Uint8Array, off: number, out: Uint8ClampedArray, w: number, bx: number, by: number) {
  for (let i = 0; i < 16; i++) {
    const v = (bytes[off + (i >> 1)] >> ((i & 1) * 4)) & 15;
    const x = bx + (i & 3), y = by + (i >> 2);
    out[(y * w + x) * 4 + 3] = v * 17;
  }
}

export function decodeDds(buf: ArrayBuffer): Decoded {
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  if (view.getUint32(0, true) !== 0x20534444) throw new Error("not a DDS file");
  const height = view.getUint32(12, true), width = view.getUint32(16, true);
  const pfFlags = view.getUint32(80, true);
  const fourCC = String.fromCharCode(bytes[84], bytes[85], bytes[86], bytes[87]);
  let off = 128;
  const out = new Uint8ClampedArray(width * height * 4);
  if (pfFlags & 0x4) {
    if (fourCC === "DX10") throw new Error("DX10 DDS not supported");
    const kind = fourCC;
    for (let by = 0; by < height; by += 4)
      for (let bx = 0; bx < width; bx += 4) {
        if (kind === "DXT1") {
          colorBlock(view, off, out, width, bx, by, true);
          off += 8;
        } else if (kind === "DXT3") {
          alphaBlock3(bytes, off, out, width, bx, by);
          colorBlock(view, off + 8, out, width, bx, by, false);
          off += 16;
        } else if (kind === "DXT5") {
          alphaBlock5(bytes, off, out, width, bx, by);
          colorBlock(view, off + 8, out, width, bx, by, false);
          off += 16;
        } else throw new Error(`unsupported DDS format ${kind}`);
      }
    return { width, height, data: out };
  }
  // uncompressed, 32 bits per pixel with channel masks
  const masks = [92, 96, 100, 104].map((o) => view.getUint32(o, true));
  const shift = (m: number) => (m ? 31 - Math.clz32(m & -m) : 0);
  for (let i = 0; i < width * height; i++) {
    const px = view.getUint32(off + i * 4, true);
    for (let c = 0; c < 4; c++) out[i * 4 + c] = masks[c] ? (px & masks[c]) >>> shift(masks[c]) : 255;
  }
  return { width, height, data: out };
}
