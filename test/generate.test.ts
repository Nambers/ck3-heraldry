import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHARGES, TEX } from "../src/charges.ts";
import { parseCoa, serializeCoa } from "../src/ck3/coa.ts";
import { exportCk3 } from "../src/ck3/export.ts";
import { describe as describeArms, fmt, fmtList } from "../src/describe.ts";
import { blazon } from "../src/heraldry/blazon.ts";
import { checkArms } from "../src/heraldry/rules.ts";
import { lintArms } from "../src/lint.ts";
import { LOCALES, setLocale } from "../src/i18n/index.ts";
import { DEFAULT_ANSWERS, PALETTES, decodeAnswers, encodeAnswers, geomString, partsString, type Answers } from "../src/west/answers.ts";
import { TINCTURES } from "../src/heraldry/tincture.ts";
import { generate, hash, type Result } from "../src/west/generate.ts";
import { CADENCY, DEEDS, EMBLEM_FAMILIES, FAITH_CHARGES, GEOM, GEOM_KEYS, ORIGIN_GROUPS, PARTS, STYLES } from "../src/west/questions.ts";
import { RANKS, REALM_IDS, canHold, type Rank } from "../src/realms.ts";
import { renderSvg } from "../src/render/svg.ts";
import { escutcheonSafe } from "../src/layout.ts";
import type { Arms } from "../src/heraldry/ast.ts";
import { gamePath, inGame } from "./ck3-game.ts";

// a deterministic sample of the whole answer space
function* sample(n: number): Generator<Answers> {
  const emblems = ["none", "liege", ...EMBLEM_FAMILIES.flatMap((f) => f.charges)];
  const origins = ["none", ...ORIGIN_GROUPS.flatMap((g) => g.charges)];
  const faiths = ["none", ...FAITH_CHARGES];
  const realms = ["none", ...REALM_IDS];
  const years = [900, 1100, 1178, 1210, 1250, 1270, 1300, 1340, 1380, 1440];
  const palettes = ["liege", ...PALETTES.map(([f, c]) => `${f}/${c}`)];
  const pickFrom = <T,>(xs: readonly T[], i: number, salt: number) => xs[hash(`${i}:${salt}`) % xs.length];
  for (let i = 0; i < n; i++) {
    // about half hold titles (0..3 that their rank allows), a quarter of those as emperor with the HRE first
    const rank: Rank = i % 8 === 0 ? "emperor" : i % 2 ? pickFrom(RANKS, i, 11) : pickFrom(RANKS.slice(1), i, 11);
    const holdable = REALM_IDS.filter((id) => canHold(rank, id));
    const nt = i % 2 || !holdable.length ? 0 : hash(`${i}:12`) % 4;
    const titles = [...new Set(Array.from({ length: nt }, (_, j) => (j === 0 && i % 8 === 0 ? "hre" : pickFrom(holdable, i, 20 + j))))];
    yield {
      ...DEFAULT_ANSWERS,
      name: i % 3 ? `House ${i}` : "",
      year: pickFrom(years, i, 1),
      liege: pickFrom(realms, i, 2),
      emblem: pickFrom(emblems, i, 3),
      origin: pickFrom(origins, i, 4),
      faith: i % 2 ? "none" : pickFrom(faiths, i, 5),
      deed: pickFrom(DEEDS, i, 6),
      claim: pickFrom(realms, i, 7),
      cadency: pickFrom(CADENCY, i, 8),
      style: pickFrom(STYLES, i, 9),
      palette: pickFrom(palettes, i, 10),
      rank,
      titles,
      // one in five picks its own detail colours
      parts: i % 5 ? "" : partsString(Object.fromEntries(PARTS.map((p, j) => [p, pickFrom(TINCTURES, i, 30 + j)]))),
      // one in four chooses its own geometry, each part of it half the time
      geom: i % 4 ? "" : geomString(Object.fromEntries(GEOM_KEYS.flatMap((k, j) => (hash(`${i}:${40 + j}`) % 2 ? [[k, pickFrom(GEOM[k], i, 50 + j)]] : [])))),
    };
  }
}

// every texture name in TEX: the patterns, and the emblems besides the charges' own
const texNames = (o: unknown): string[] =>
  typeof o === "string" ? [o] : o && typeof o === "object" ? Object.values(o).flatMap(texNames) : [];
const ALLOWED_PATTERNS = new Set<string>([TEX.patternSolid, ...Object.values(TEX.patterns)]);
const ALLOWED_TEXTURES = new Set<string>([
  ...texNames(TEX).filter((t) => !ALLOWED_PATTERNS.has(t)),
  ...Object.values(CHARGES).flatMap((c) => c.ck3.map((p) => p.texture)),
]);
// raster charges are hundreds of blocks each: not held to the layer budget (the page warns instead)
const RASTER = Object.keys(CHARGES).filter((id) => CHARGES[id].raster);
const isRaster = (arms: Arms) => {
  const s = JSON.stringify(arms);
  return RASTER.some((id) => s.includes(`"id":"${id}"`));
};
const KEY_LEAK = /\b(app|q|fam|region|num|tinct|tadj|charge|div|ord|layout|place|drop|rule|desc|note|realm)\.[a-z_]+(\.[a-z_]+)*\b/;

/** freeze a result all the way down, so a test that changed it would throw instead of feeding the others */
const deepFreeze = <T,>(o: T): T => {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
};

describe("generator", () => {
  const all = [...sample(4000)];
  // each sampled answer set is generated once, on first use, and shared by the tests below
  // (generate() returns messages, not text, so the locale does not change the result)
  const cache: Result[] = [];
  const sampled = (keep: (a: Answers, i: number) => boolean = () => true) =>
    all.flatMap((a, i) => (keep(a, i) ? [{ a, r: (cache[i] ??= deepFreeze(generate(a))) }] : []));
  const every = (n: number) => sampled((_, i) => i % n === 0);

  it(`always yields legal arms (${all.length} sampled answer sets)`, { timeout: 60_000 }, () => {
    let n = 0;
    for (const { a, r } of sampled()) {
      expect(r.candidates.length, JSON.stringify(a)).toBeGreaterThan(0);
      for (const c of r.candidates) {
        expect(checkArms(c.arms).filter((i) => i.level === "error"), `${c.id} ${JSON.stringify(a)}`).toEqual([]);
        n++;
      }
    }
    expect(n).toBeGreaterThan(all.length * 3);
  });

  it("exports parseable CK3 code with vanilla textures and a sane layer count", { timeout: 60_000 }, () => {
    let max = 0;
    for (const { r } of every(4)) {
      for (const c of r.candidates) {
        const { coa, instances } = exportCk3(c.arms);
        const back = parseCoa(serializeCoa(coa));
        expect(back.emblems.reduce((s, e) => s + e.instances.length, 0)).toBe(instances);
        expect(ALLOWED_PATTERNS.has(back.pattern), back.pattern).toBe(true);
        for (const e of back.emblems) {
          expect(ALLOWED_TEXTURES.has(e.texture), e.texture).toBe(true);
          for (const i of e.instances) for (const v of [...(i.position ?? []), ...(i.scale ?? [])]) expect(Number.isFinite(v)).toBe(true);
        }
        if (!isRaster(c.arms)) max = Math.max(max, instances);
      }
    }
    expect(max).toBeLessThan(150);
  });

  it.each(LOCALES)("writes complete text in %s (no holes, no raw keys)", (loc) => {
    setLocale(loc);
    try {
      for (const { r } of every(9)) {
        const texts = [...r.notes.map((n) => fmt(n.msg)), ...r.legend.flatMap((row) => [fmt(row.what), fmt(row.means)])];
        for (const c of r.candidates) {
          texts.push(c.name.map(fmt).join(" "), fmtList(c.label), fmtList(c.dropped), fmtList(c.warnings ?? []), describeArms(c.arms), blazon(c.arms));
        }
        for (const s of texts) {
          expect(s).not.toMatch(/undefined|NaN|\{\w+\}/);
          expect(s, s).not.toMatch(KEY_LEAK);
        }
      }
    } finally {
      setLocale("zh-CN");
    }
  });

  it("lays out every candidate without overlaps or cut-off charges", { timeout: 60_000 }, () => {
    for (const { a, r } of every(3)) {
      for (const c of r.candidates) expect(lintArms(c.arms), `${c.id} ${JSON.stringify(a)}`).toEqual([]);
    }
  });

  it("renders SVG without holes", () => {
    for (const { r } of every(25)) for (const c of r.candidates) expect(renderSvg(c.arms)).not.toMatch(/undefined|NaN/);
  });

  it("is deterministic and survives the URL", () => {
    const a: Answers = { ...DEFAULT_ANSWERS, name: "Hauteville", year: 1250, emblem: "maiden_eagle", claim: "sicily", faith: "chi_rho", deed: "pilgrimage_santiago", cadency: "label", layout: "chief#0", rank: "duke", titles: ["brittany", "flanders"] };
    expect(decodeAnswers(encodeAnswers(a))).toEqual(a);
    expect(JSON.stringify(generate(a))).toBe(JSON.stringify(generate(decodeAnswers(encodeAnswers(a)))));
  });

  it("marshals held titles by rank", () => {
    const fam = (x: Arms) => x.quarterly?.of?.[0] === null;
    const lord = generate({ ...DEFAULT_ANSWERS, year: 1250, rank: "count", titles: ["flanders", "holland"] });
    for (const c of lord.candidates) {
      // a lord keeps the family arms first and the titles in the other quarters
      expect(fam(c.arms)).toBe(true);
      expect(c.arms.quarterly!.of!.map((r) => r?.id ?? null)).toEqual([null, "flanders", "holland", null]);
    }
    const king = generate({ ...DEFAULT_ANSWERS, year: 1300, rank: "king", titles: ["aragon", "sicily"], emblem: "eagle", origin: "none" });
    // a king puts the realms first, the family en surtout or after them
    expect(king.candidates.every((c) => (c.arms.quarterly?.of?.[0]?.id ?? c.arms.of?.id) === "aragon")).toBe(true);
    expect(king.candidates.some((c) => c.arms.overall?.own)).toBe(true);
    expect(king.candidates.some((c) => c.arms.quarterly?.of?.includes(null))).toBe(true);
    const emperor = generate({ ...DEFAULT_ANSWERS, year: 1440, rank: "emperor", titles: ["hre"], emblem: "lion_rampant", origin: "none" });
    expect(emperor.candidates.some((c) => c.arms.of?.id === "hre" && c.arms.charges.some((p) => p.charge.breast && "own" in p.charge.breast))).toBe(true);
  });

  it("only lets a rank hold titles of its own tier or below", () => {
    // a count cannot hold a kingdom; no rank holds nothing
    expect(decodeAnswers("r=count&t=flanders,france").titles).toEqual(["flanders"]);
    expect(decodeAnswers("t=flanders").titles).toEqual([]);
    expect(decodeAnswers("r=king&t=brittany,france,flanders").titles).toEqual(["brittany", "france", "flanders"]);
    // and the generator ignores titles above the rank even if handed them
    const r = generate({ ...DEFAULT_ANSWERS, rank: "duke", titles: ["france"] });
    expect(r.candidates.some((c) => c.arms.quarterly?.of?.some((x) => x?.id === "france"))).toBe(false);
  });

  it("lifts period, rank and tincture limits when history is switched off", () => {
    // colour on colour, a realm before its arms, a kingdom held without a rank
    const a: Answers = { ...DEFAULT_ANSWERS, free: true, year: 900, palette: "gules/azure", liege: "hre", titles: ["france"], emblem: "lion_rampant", origin: "none" };
    expect(decodeAnswers(encodeAnswers(a))).toEqual(a);
    const r = generate(a);
    expect(r.candidates.length).toBeGreaterThan(0);
    expect(r.candidates.some((c) => checkArms(c.arms).some((i) => i.level === "error"))).toBe(true);
    expect(r.candidates.some((c) => c.arms.quarterly?.of?.some((x) => x?.id === "france"))).toBe(true);
    expect(r.notes.map((n) => n.msg.key)).not.toContain("note.anachronism");
    expect(r.notes.map((n) => n.msg.key)).toContain("note.free");
    // with the rules on, the same link loses what they forbid
    const strict = decodeAnswers(encodeAnswers({ ...a, free: false }));
    expect(strict.palette).toBe(DEFAULT_ANSWERS.palette);
    expect(strict.titles).toEqual([]);
  });

  it("only puts CK3-safe arms on escutcheons", { timeout: 60_000 }, () => {
    const check = (a: Arms) => {
      if (a.overall && !escutcheonSafe(a.overall.arms)) return false;
      for (const p of a.charges) if (p.charge.breast && "kind" in p.charge.breast && !escutcheonSafe(p.charge.breast.arms)) return false;
      return (a.quarterly?.q ?? []).every(check);
    };
    for (const { a, r } of every(3)) for (const c of r.candidates) expect(check(c.arms), JSON.stringify(a)).toBe(true);
  });

  it("keeps the chosen layout when other answers change", () => {
    const a: Answers = { ...DEFAULT_ANSWERS, emblem: "lion_rampant", origin: "castle" };
    const pick = generate(a).candidates.find((c) => c.id.startsWith("pale"))!;
    const b = { ...a, layout: pick.id };
    expect(generate(b).chosen.id).toBe(pick.id);
    // change other answers: the same layout stays chosen
    for (const change of [{ palette: "azure/argent" }, { origin: "tower" }, { year: 1300 }, { deed: "crusade" as const }, { faith: "cross_patty" }]) {
      expect(generate({ ...b, ...change }).chosen.id.split("#")[0]).toBe("pale");
    }
    // a layout that no longer exists falls back to the first
    const r = generate({ ...b, origin: "none" });
    expect(r.chosen.id).toBe(r.candidates[0].id);
  });

  it("reproduces the Gonzaga grant of 1433 to Gianfrancesco I", () => {
    const a: Answers = { ...DEFAULT_ANSWERS, name: "Gianfrancesco I Gonzaga", year: 1430, liege: "hre", deed: "service", emblem: "none", origin: "none", palette: "or/sable", geom: "var:barry" };
    const c = generate(a).candidates.find((c) => c.arms.granted?.id === "hre" && c.arms.overall?.arms.field.kind === "barry");
    expect(c && blazon(c.arms)).toBe("Argent, a cross gules between four eagles displayed sable, armed gules; over all an escutcheon of the family arms (Barry of six sable and Or)");
    // and the table says what each part stands for
    const rows = generate({ ...a, layout: c!.id }).legend.map((r) => `${r.cat}:${r.means.key}`);
    expect(rows).toEqual(expect.arrayContaining(["life:legend.means.grant", "life:legend.means.ownEscGrant", "taste:legend.means.geometryChosen"]));
  });

  it("says where every element came from", () => {
    const r = generate({ ...DEFAULT_ANSWERS, year: 1300, liege: "hre", emblem: "lion_rampant", origin: "castle", faith: "cross", cadency: "label", palette: "azure/or", layout: "single#0" });
    const cats = Object.fromEntries(r.legend.map((row) => [row.means.key, row.cat]));
    expect(cats["legend.means.emblem"]).toBe("choice");
    expect(cats["legend.means.colours"]).toBe("taste");
    expect(cats["legend.means.cadency.label"]).toBe("life");
    const capo = generate({ ...DEFAULT_ANSWERS, year: 1300, liege: "hre", palette: "liege", layout: "capo#0" });
    expect(capo.chosen.arms.chief?.of?.id).toBe("hre");
    expect(Object.fromEntries(capo.legend.map((row) => [row.means.key, row.cat]))).toMatchObject({ "legend.means.capo": "life", "legend.means.coloursLiege": "life" });
  });

  it("gives the liege a real influence", () => {
    const r = generate({ ...DEFAULT_ANSWERS, year: 1300, liege: "hre", palette: "liege", emblem: "liege", deed: "service" });
    expect(r.candidates.some((c) => c.arms.canton?.of?.id === "hre")).toBe(true);
    expect(r.candidates.some((c) => c.arms.chief?.of?.id === "hre")).toBe(true);
    expect(r.candidates.every((c) => JSON.stringify(c.arms).includes('"eagle"'))).toBe(true);
  });

  it("keeps arms that copy a realm's, and says whose they are", () => {
    for (const [year, free] of [[1178, false], [1300, false], [1300, true]] as const) {
      const r = generate({ ...DEFAULT_ANSWERS, year, free, emblem: "lion_manuscript", origin: "none", palette: "sable/argent", layout: "single#0" });
      expect(r.chosen.arms.field, `${year}`).toEqual({ kind: "plain", t: "sable" });
      expect(r.chosen.warnings?.map((w) => w.key), `${year}`).toEqual(["warn.realmArms"]);
      expect(fmt(r.chosen.warnings![0])).toContain("1294");
    }
  });

  it("keeps the maiden's hair and crown clear of the field and the eagle", () => {
    for (const palette of PALETTES.map(([f, c]) => `${f}/${c}`)) {
      const [F, C] = palette.split("/");
      const r = generate({ ...DEFAULT_ANSWERS, emblem: "maiden_eagle", origin: "none", palette, layout: "single#0" });
      const c = r.chosen.arms.charges.find((p) => p.charge.id === "maiden_eagle")!.charge;
      expect([F === "ermine" ? "argent" : F, C, c.t], palette).not.toContain(c.crined);
      expect(c.crowned, palette).toBe(c.crined);
    }
  });

  it("paints the player's detail colours on the parts the charges have", () => {
    const r = generate({ ...DEFAULT_ANSWERS, emblem: "maiden_eagle", origin: "castle", palette: "or/gules", parts: "armed:azure,crined:vert,detail:sable,second:argent" });
    const all = JSON.stringify(r.chosen.arms);
    const eagle = r.chosen.arms.charges.find((p) => p.charge.id === "maiden_eagle")!.charge;
    expect([eagle.armed, eagle.crined, eagle.second]).toEqual(["azure", "vert", undefined]); // no second colour on a maiden-eagle
    expect(all).toContain('"detail":"sable"');
    expect(blazon(r.chosen.arms)).toContain("crined vert");
  });

  it("keeps detail colours in the link, and drops what it does not know", () => {
    const a = { ...DEFAULT_ANSWERS, parts: "armed:azure,crined:argent" };
    expect(decodeAnswers(encodeAnswers(a)).parts).toBe("armed:azure,crined:argent");
    expect(decodeAnswers("h=crined:argent,armed:azure,nose:gules,crowned:ermine").parts).toBe("armed:azure,crined:argent");
  });

  it("lets the player choose the geometry instead of the family name", () => {
    const plain = { ...DEFAULT_ANSWERS, name: "Percy", emblem: "none", origin: "none", palette: "azure/or" };
    const ids = (a: Answers) => generate(a).candidates.map((c) => c.id);
    const r = generate({ ...plain, geom: "ord:fess,div:quarterly,var:chequy,fur:fretty,line:fusilly" });
    expect(r.candidates.map((c) => c.id)).toEqual(expect.arrayContaining(["ordinary-fess#0", "division-quarterly#0", "varied-chequy#0", "fur-fretty#0"]));
    expect(blazon(r.candidates.find((c) => c.id === "ordinary-fess#0")!.arms)).toBe("Azure, a fess fusilly Or");
    // a line goes only where CK3 has a texture for it: there is no fusilly division
    expect(blazon(r.candidates.find((c) => c.id === "division-quarterly#0")!.arms)).toBe("Quarterly azure and Or");
    // "straight" overrides the name's line; with charges, two bars stand for a fess
    expect(JSON.stringify(generate({ ...plain, geom: "line:plain" }).candidates.map((c) => c.arms))).not.toContain('"line"');
    expect(ids({ ...plain, emblem: "lion_rampant", geom: "ord:bars" })).toContain("between-fess#0");
    // what the name picks is unchanged when nothing is chosen
    expect(ids({ ...plain, geom: "" })).toEqual(ids(plain));
  });

  it("powders a family's field as the rolls do, in the tincture of what lies on it", () => {
    const r = generate({ ...DEFAULT_ANSWERS, emblem: "lion_rampant", origin: "none", palette: "gules/or", geom: "semy:cross_crosslet" });
    const c = r.candidates.find((c) => c.id === "semy-cross_crosslet#0")!;
    expect(blazon(c.arms)).toBe("Gules crusilly Or, a lion rampant Or");
    // a second wish that is a semé charge is powdered over the field
    const two = generate({ ...DEFAULT_ANSWERS, emblem: "lion_rampant", origin: "billet", palette: "azure/or" });
    expect(blazon(two.candidates.find((c) => c.id === "semy-billet#0")!.arms)).toBe("Azure billetty Or, a lion rampant Or");
    // without a charge: alone, or under an ordinary
    const ids = generate({ ...DEFAULT_ANSWERS, emblem: "none", origin: "none", palette: "sable/or", geom: "semy:roundel,ord:fess" }).candidates.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["semy-roundel#0", "semy-fess-roundel#0"]));
  });

  it("powders a family's field with fleurs-de-lis only when chosen (gold on blue is France)", () => {
    for (let i = 0; i < 300; i++) {
      const r = generate({ ...DEFAULT_ANSWERS, name: `House ${i}`, emblem: "none", origin: "none", palette: "azure/or" });
      expect(r.candidates.some((c) => c.arms.field.kind === "semy" && c.arms.field.charge.id === "fleur")).toBe(false);
    }
    const r = generate({ ...DEFAULT_ANSWERS, emblem: "none", origin: "none", palette: "or/sable", geom: "semy:fleur" });
    expect(r.candidates.map((c) => blazon(c.arms))).toContain("Or, semé-de-lis sable");
  });

  it("keeps the chosen geometry in the link, and drops what it does not know", () => {
    const a = { ...DEFAULT_ANSWERS, geom: "ord:fess,fur:vairy,line:engrailed" };
    expect(decodeAnswers(encodeAnswers(a)).geom).toBe("ord:fess,fur:vairy,line:engrailed");
    expect(decodeAnswers("g=line:wavy,fur:ermine,ord:pall,colour:red,div:per_fess").geom).toBe("ord:pall,div:per_fess");
  });

  it("never lets a cadency mark overlap the top of the shield", { timeout: 60_000 }, () => {
    for (const { r } of sampled((a) => a.cadency !== "none" && a.cadency !== "baton")) {
      for (const c of r.candidates) {
        if (!c.arms.brisure) continue;
        const top = c.arms.quarterly ? c.arms.quarterly.q[0] : c.arms;
        expect(!!top.chief || !!top.canton || top.charges.some((p) => p.at === "between" || p.at === "dexter_chief")).toBe(false);
      }
    }
  });
});

// Only with a local CK3 install: every texture we use must exist in the game.
const LIST = "gfx/coat_of_arms/colored_emblems/50_coa_designer_emblems.txt";
describe.skipIf(!inGame(LIST))("against the local CK3 install (needs CK3_GAME)", () => {
  it("uses only textures and patterns that exist in the game", () => {
    const list = readFileSync(gamePath(LIST)!, "utf8");
    for (const t of ALLOWED_TEXTURES) expect(list.includes(`${t} =`), t).toBe(true);
    for (const p of ALLOWED_PATTERNS) expect(inGame(`gfx/coat_of_arms/patterns/${p}`), p).toBe(true);
  });
});
