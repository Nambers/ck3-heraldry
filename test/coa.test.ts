import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { instanceCount, parseCoa, serializeCoa } from "../src/ck3/coa.ts";

// samples written for this project, plus some of its own generator's output
const DIR = join(__dirname, "../fixtures/samples");
const files = readdirSync(DIR).filter((f) => f.endsWith(".txt"));

describe("CK3 coat-of-arms code", () => {
  it.each(files)("round-trips %s", (f) => {
    const coa = parseCoa(readFileSync(join(DIR, f), "utf8"));
    expect(coa.emblems.length).toBeGreaterThan(0);
    const again = parseCoa(serializeCoa(coa));
    expect(again).toEqual(coa);
  });

  it("reads the details of a designer export", () => {
    const coa = parseCoa(readFileSync(join(DIR, "designer-export.txt"), "utf8"));
    expect(coa.key).toBe("coa_house_1234");
    expect(coa.pattern).toBe("pattern_solid.dds");
    expect(coa.color1).toBe("blue");
    const fleur = coa.emblems.find((e) => e.texture === "ce_fleur.dds")!;
    expect(fleur.color1).toBe("yellow");
    expect(fleur.instances[2]).toEqual({ position: [0.5, 0.68], scale: [0.25, 0.25], depth: 1.01 });
    expect(instanceCount(coa)).toBe(4);
  });

  it("reads every way of writing a colour", () => {
    const coa = parseCoa(readFileSync(join(DIR, "colours.txt"), "utf8"));
    expect(coa.color1).toEqual({ space: "rgb", v: [120, 30, 25] });
    expect(coa.color2).toEqual({ space: "hsv", v: [0.1, 0.75, 0.75] });
    const lion = coa.emblems[0];
    expect(lion.color1).toEqual({ space: "hsv360", v: [210, 80, 40] });
    expect(lion.color2).toBe("red");
  });

  it("reads rotation, mirroring and emblems without an instance", () => {
    const coa = parseCoa(readFileSync(join(DIR, "transforms.txt"), "utf8"));
    expect(coa.emblems[0].instances.length).toBeLessThanOrEqual(1);
    expect(coa.emblems[1].instances[0]).toEqual({ position: [0.5, 0.5], scale: [0.75, 0.75], rotation: 90 });
    expect(coa.emblems[2].instances[0].scale).toEqual([-0.3, 0.3]);
    expect(coa.emblems[2].instances[1].rotation).toBe(45);
  });
});

describe("tinctures", () => {
  it("draw the sketch in the game's own named colours", async () => {
    const { rgbOf } = await import("../src/ck3/canvas.ts");
    const { TINCTURE, TINCTURES } = await import("../src/heraldry/tincture.ts");
    const hex = (c: number[]) => "#" + c.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
    for (const t of TINCTURES) expect(TINCTURE[t].svg, t).toBe(hex(rgbOf(TINCTURE[t].ck3)));
  });
});
