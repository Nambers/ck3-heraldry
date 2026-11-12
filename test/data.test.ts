// Consistency of the hand-written data: charges, art, realms, question lists
// and translations. These are the steps that are easy to forget when adding a
// charge, a realm or a language (see CONTRIBUTING.md), so each failure says
// what is missing and where.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ART } from "../src/art/index.ts";
import { CHARGES, CHARGE_IDS } from "../src/charges.ts";
import { LOCALES } from "../src/i18n/index.ts";
import { EMBLEM_FAMILIES, FAITH_CHARGES, ORIGIN_GROUPS } from "../src/west/questions.ts";
import { DESTINATIONS, REGIONS, ROLES } from "../src/pages/destinations.ts";
import { CREDITS } from "../src/theme/art/credits.ts";
import { LATE_SOURCES, REALM_SOURCES } from "../src/pages/sources.ts";
import { LATE, type Late } from "../src/heraldry/era.ts";
import { REALMS, REALM_IDS, TIER } from "../src/realms.ts";
import { ROUTES } from "../src/routes.ts";

const I18N = "src/i18n";
const catalogs = Object.fromEntries(
  readdirSync(I18N)
    .filter((f) => f.endsWith(".json"))
    .map((f) => [f.slice(0, -5), JSON.parse(readFileSync(`${I18N}/${f}`, "utf8"))]),
) as Record<string, any>;
const keys = (o: unknown, p = ""): string[] =>
  typeof o === "object" && o !== null ? Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k)) : [p];
const lookup = (cat: unknown, key: string) => key.split(".").reduce<any>((v, k) => (v && typeof v === "object" ? v[k] : undefined), cat);

describe("translations", () => {
  it("registers every catalog in src/i18n/index.ts", () => {
    expect(new Set(LOCALES), "add the new .json to CATALOGS in src/i18n/index.ts").toEqual(new Set(Object.keys(catalogs)));
  });

  // a charge's count word differs by language: zh-CN has a measure word (m), the others a plural (p)
  const norm = (k: string) => k.replace(/^charge\.(\w+)\.(m|p)$/, "charge.$1.x");
  const base = new Set(keys(catalogs["zh-CN"]).map(norm));
  it.each(LOCALES.filter((l) => l !== "zh-CN"))("%s has the same keys as zh-CN", (l) => {
    const have = new Set(keys(catalogs[l]).map(norm));
    expect([...base].filter((k) => !have.has(k)), `missing in ${l}.json`).toEqual([]);
    expect([...have].filter((k) => !base.has(k)), `only in ${l}.json`).toEqual([]);
  });

  it.each(LOCALES)("%s names its own language for the switch button (app.langName)", (l) => {
    expect(lookup(catalogs[l], "app.langName")).toBeTruthy();
  });

  it.each(LOCALES)("%s names every charge, family and realm, and notes every realm period", (l) => {
    const cat = catalogs[l];
    for (const id of CHARGE_IDS) expect(lookup(cat, `charge.${id}.n`), `charge.${id}.n`).toBeTruthy();
    for (const f of [...EMBLEM_FAMILIES, ...ORIGIN_GROUPS]) expect(lookup(cat, `fam.${f.id}`), `fam.${f.id}`).toBeTruthy();
    for (const id of REALM_IDS) {
      expect(lookup(cat, `realm.${id}.name`), `realm.${id}.name`).toBeTruthy();
      // periods without arms may share the generic realm._early note
      for (const p of REALMS[id].periods) if (p.arms) expect(lookup(cat, `realm.${id}.${p.key}`), `realm.${id}.${p.key}`).toBeTruthy();
    }
  });
});

describe("charges", () => {
  const artFiles = readdirSync("src/art")
    .filter((f) => f.endsWith(".ts") && !f.startsWith("_") && !["index.ts", "types.ts", "style.ts"].includes(f))
    .map((f) => f.slice(0, -3));

  it("has an up-to-date src/art/index.ts", () => {
    expect(Object.keys(ART).sort(), "run `pnpm art:index`").toEqual([...artFiles].sort());
  });

  it("draws every charge, and every drawing belongs to a charge", () => {
    expect(CHARGE_IDS.filter((id) => !ART[id]), "add src/art/<id>.ts").toEqual([]);
    expect(Object.keys(ART).filter((id) => !CHARGES[id]), "add the charge to src/charges.ts, or prefix a helper file with _").toEqual([]);
  });

  it("has a sane visible box for every charge", () => {
    for (const c of Object.values(CHARGES)) {
      const [x0, y0, x1, y1] = c.bbox;
      expect(0 <= x0 && x0 < x1 && x1 <= 1 && 0 <= y0 && y0 < y1 && y1 <= 1, `${c.id} bbox ${c.bbox}`).toBe(true);
    }
  });

  it("draws every charge in the shape of its game texture (art w/h ≈ bbox w/h)", () => {
    for (const c of Object.values(CHARGES)) {
      const [x0, y0, x1, y1] = c.bbox;
      const art = ART[c.id];
      if (!art) continue;
      const ratio = art.w / art.h / ((x1 - x0) / (y1 - y0));
      expect(Math.abs(ratio - 1), `${c.id}: art ${art.w}×${art.h} vs bbox ${(x1 - x0).toFixed(3)}×${(y1 - y0).toFixed(3)}`).toBeLessThan(0.05);
    }
  });

  it("offers only charges that exist", () => {
    const offered = [...EMBLEM_FAMILIES.flatMap((f) => f.charges), ...ORIGIN_GROUPS.flatMap((g) => g.charges), ...FAITH_CHARGES];
    expect(offered.filter((id) => !CHARGES[id]), "unknown charge id in src/west/questions.ts").toEqual([]);
  });
});

describe("late practices", () => {
  it("gives every late practice with a year a source to check it against", () => {
    const dated = (Object.keys(LATE) as Late[]).filter((k) => LATE[k] !== null);
    expect(dated.filter((k) => !LATE_SOURCES[k]), "add it to LATE_SOURCES in src/pages/sources.ts").toEqual([]);
  });
});

describe("realms", () => {
  it("gives every realm a title tier and a source to check its arms against", () => {
    expect(REALM_IDS.filter((id) => !(id in TIER)), "add it to TIER in src/realms.ts").toEqual([]);
    expect(REALM_IDS.filter((id) => !REALM_SOURCES[id]), "add it to REALM_SOURCES in src/pages/sources.ts").toEqual([]);
  });

  it("has periods in order, without gaps, the last one open-ended", () => {
    for (const id of REALM_IDS) {
      const ps = REALMS[id].periods;
      ps.forEach((p, i) => {
        const next = ps[i + 1];
        if (next) expect(p.to, `${id}: period from ${p.from} should end where the next begins (${next.from})`).toBe(next.from);
        else expect(p.to, `${id}: the last period should have no \`to\``).toBeUndefined();
      });
    }
  });

  it("uses only charges that exist", () => {
    const used = (o: unknown): string[] =>
      Array.isArray(o) ? o.flatMap(used) : o && typeof o === "object" ? [...("id" in o && "t" in o ? [String(o.id)] : []), ...Object.values(o).flatMap(used)] : [];
    for (const id of REALM_IDS) expect(used(REALMS[id].periods).filter((c) => !CHARGES[c]), id).toEqual([]);
  });
});

describe("pages", () => {
  it("routes every page and names it in the navigation", () => {
    for (const r of ROUTES) expect(lookup(catalogs["zh-CN"], `app.nav.${r.id}`), `app.nav.${r.id}`).toBeTruthy();
    for (const d of DESTINATIONS.filter((d) => d.page)) expect(ROUTES.some((r) => r.id === d.page), `${d.id}: add "${d.page}" to src/routes.ts`).toBe(true);
  });

  it("pictures every tradition on the home page and gives it a material", () => {
    const css = readFileSync("src/theme/theme.css", "utf8");
    for (const d of DESTINATIONS) {
      expect(css.includes(`.scene[data-scene="${d.id}"]`), `.scene[data-scene="${d.id}"] in src/theme/theme.css`).toBe(true);
      // a picture in each margin: a missing one leaves that margin empty
      const scene = css.match(new RegExp(`\\.scene\\[data-scene="${d.id}"\\] \\{([^}]*)\\}`))?.[1] ?? "";
      for (const side of ["l", "r"]) expect(scene.includes(`--art-${side}: url(`), `--art-${side} for .scene[data-scene="${d.id}"]`).toBe(true);
      expect(css.includes(`[data-tradition="${d.id}"]`), `[data-tradition="${d.id}"] in src/theme/theme.css`).toBe(true);
    }
    for (const [, file] of css.matchAll(/url\("\.\/art\/([^"]+)"\)/g)) expect(existsSync(`src/theme/art/${file}`), file).toBe(true);
  });

  it("gives every picture its true proportions in the CSS", () => {
    const css = readFileSync("src/theme/theme.css", "utf8");
    // our pictures are WebP with alpha (VP8X): width-1 and height-1 as 24-bit little-endian at bytes 24 and 27
    const size = (file: string) => {
      const b = readFileSync(`src/theme/art/${file}`);
      expect(b.toString("ascii", 12, 16), `${file} should be a WebP with alpha (tools/ink_picture.py)`).toBe("VP8X");
      return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    };
    for (const [, side, file, w, h] of css.matchAll(/--art-([lr]): url\("\.\/art\/([^"]+)"\);\s*--ratio-\1: (\d+) \/ (\d+);/g)) {
      expect(`${w} / ${h}`, `--ratio-${side} for ${file}`).toBe(size(file).join(" / "));
    }
    const arts = [...css.matchAll(/--art-[lr]: url/g)].length;
    const ratios = [...css.matchAll(/--art-([lr]): url\("[^"]+"\);\s*--ratio-\1:/g)].length;
    expect(ratios, "every --art-l / --art-r is followed by its --ratio-l / --ratio-r").toBe(arts);
  });

  it("lists ink settings only for pictures that exist", () => {
    const ink = JSON.parse(readFileSync("src/theme/art/ink.json", "utf8"));
    for (const k of Object.keys(ink).filter((k) => k.endsWith(".webp"))) expect(existsSync(`src/theme/art/${k}`), k).toBe(true);
  });

  it("credits every picture, with its source", () => {
    const files = readdirSync("src/theme/art").filter((f) => f.endsWith(".webp"));
    expect(files.filter((f) => !CREDITS.some((c) => c.file === f)), "add it to src/theme/art/credits.ts").toEqual([]);
    expect(CREDITS.filter((c) => !files.includes(c.file)).map((c) => c.file), "credited but missing").toEqual([]);
    for (const c of CREDITS) {
      expect(c.page.startsWith("https://commons.wikimedia.org/wiki/File:"), c.file).toBe(true);
      expect(c.original.startsWith("https://upload.wikimedia.org/"), c.file).toBe(true);
      expect(c.title.zh && c.title.en && c.made.zh && c.made.en && c.license, c.file).toBeTruthy();
    }
  });

  it("gives every page roles and regions that exist", () => {
    const roles = new Set(ROLES.map((r) => r.id));
    const regions = new Set(REGIONS.map((r) => r.id));
    for (const d of DESTINATIONS) {
      expect(d.roles.every((r) => roles.has(r)) && d.regions.every((r) => regions.has(r)), d.id).toBe(true);
    }
  });
});
