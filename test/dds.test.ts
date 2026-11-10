import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHARGES } from "../src/charges.ts";
import { decodeDds } from "../src/ck3/dds.ts";
import { gamePath, inGame } from "./ck3-game.ts";

const dir = gamePath("gfx/coat_of_arms")!;

describe.skipIf(!inGame("gfx/coat_of_arms"))("DDS decoder on real game textures (needs CK3_GAME)", () => {
  const load = (p: string) => {
    const b = readFileSync(`${dir}/${p}`);
    return decodeDds(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  };

  it.each(["eagle", "castle", "fleur", "lion_rampant", "escallop"])("finds the measured visible area of %s", (id) => {
    const def = CHARGES[id];
    const img = load(`colored_emblems/${def.ck3[0].texture}`);
    let x0 = img.width, y0 = img.height, x1 = 0, y1 = 0;
    for (let y = 0; y < img.height; y++)
      for (let x = 0; x < img.width; x++)
        if (img.data[(y * img.width + x) * 4 + 3] > 127) {
          x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1);
        }
    const got = [x0 / img.width, y0 / img.height, x1 / img.width, y1 / img.height];
    got.forEach((v, i) => expect(v).toBeCloseTo(def.bbox[i], 2));
  });

  it("decodes patterns: color2 mask on the right half of a per-pale pattern", () => {
    const img = load("patterns/pattern_vertical_split_01.dds");
    const at = (x: number, y: number) => img.data[(Math.floor(y * img.height) * img.width + Math.floor(x * img.width)) * 4 + 1];
    expect(at(0.25, 0.5)).toBeLessThan(30);
    expect(at(0.75, 0.5)).toBeGreaterThan(225);
  });
});
