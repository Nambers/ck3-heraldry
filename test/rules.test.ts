import { describe, expect, it } from "vitest";
import type { Arms } from "../src/heraldry/ast.ts";
import { blazon } from "../src/heraldry/blazon.ts";
import { checkArms } from "../src/heraldry/rules.ts";

const errors = (a: Arms) => checkArms(a).filter((i) => i.level === "error");

describe("rule of tincture", () => {
  it("rejects metal on metal and colour on colour", () => {
    expect(errors({ field: { kind: "plain", t: "argent" }, charges: [{ at: "center", charge: { id: "eagle", t: "or" } }] })).toHaveLength(1);
    expect(errors({ field: { kind: "plain", t: "gules" }, charges: [{ at: "center", charge: { id: "castle", t: "azure" } }] })).toHaveLength(1);
  });

  it("checks charges on charges (the original example's gold chi-rho on a silver eagle)", () => {
    const arms: Arms = { field: { kind: "plain", t: "gules" }, charges: [{ at: "center", charge: { id: "maiden_eagle", t: "argent", breast: { id: "chi_rho", t: "or" } } }] };
    expect(errors(arms)).toHaveLength(1);
  });

  it("checks charges on ordinaries, chiefs and cantons", () => {
    expect(errors({ field: { kind: "plain", t: "azure" }, ordinary: { kind: "fess", t: "or", on: { id: "mullet", t: "argent" } }, charges: [] })).toHaveLength(1);
    expect(errors({ field: { kind: "plain", t: "gules" }, canton: { t: "or", charge: { id: "fleur", t: "argent" } }, charges: [] })).toHaveLength(1);
  });

  it("takes historic realm arms as they are but still checks what the bearer adds", () => {
    const anjou: Arms = { field: { kind: "semy", t: "azure", charge: { id: "fleur", t: "or" } }, charges: [], brisure: { kind: "label", t: "gules" } };
    const bad: Arms = { field: { kind: "plain", t: "argent" }, charges: [{ at: "center", charge: { id: "eagle", t: "or" } }] };
    const good: Arms = { field: { kind: "plain", t: "argent" }, charges: [{ at: "center", charge: { id: "eagle", t: "sable" } }] };
    const q = (fam: Arms): Arms => ({ field: fam.field, charges: [], quarterly: { q: [fam, anjou, anjou, fam], of: [null, { id: "sicily" }, { id: "sicily" }, null] } });
    expect(errors(anjou)).toHaveLength(1); // on its own, the label breaks the rule
    expect(errors(q(good))).toHaveLength(0);
    expect(errors(q(bad)).length).toBeGreaterThan(0);
    expect(errors({ ...anjou, of: { id: "sicily" }, overall: { kind: "escutcheon", arms: bad, own: true } })).toHaveLength(1);
  });

  it("exempts charges lying across a partition line", () => {
    expect(errors({ field: { kind: "per_pale", t: ["gules", "or"] }, charges: [{ at: "center", charge: { id: "roundel", t: "argent" } }] })).toHaveLength(0);
  });

  it("treats ermine like a metal", () => {
    expect(errors({ field: { kind: "plain", t: "ermine" }, charges: [{ at: "center", charge: { id: "lion_rampant", t: "or" } }] })).toHaveLength(1);
    expect(errors({ field: { kind: "plain", t: "ermine" }, charges: [{ at: "center", charge: { id: "lion_rampant", t: "gules" } }] })).toHaveLength(0);
  });

  it("lets historical exceptions through (Jerusalem)", () => {
    expect(errors({ field: { kind: "plain", t: "argent" }, charges: [{ at: "center", charge: { id: "jerusalem", t: "or" } }], exempt: true })).toHaveLength(0);
  });
});

describe("blazon", () => {
  const b = (a: Arms) => blazon(a);
  it("uses the special names of roundels", () => {
    expect(b({ field: { kind: "plain", t: "azure" }, charges: [{ at: "center", charge: { id: "roundel", t: "or", count: 3 } }] })).toBe("Azure, three bezants");
  });
  it("blazons Aragon, England and Castile", () => {
    expect(b({ field: { kind: "plain", t: "or" }, ordinary: { kind: "pallets", t: "gules" }, charges: [] })).toBe("Or, four pallets gules");
    expect(b({ field: { kind: "plain", t: "gules" }, charges: [{ at: "center", charge: { id: "lion_passant_guardant", t: "or", count: 3 } }] })).toBe(
      "Gules, three lions passant guardant Or",
    );
    expect(b({ field: { kind: "plain", t: "gules" }, charges: [{ at: "center", charge: { id: "castle", t: "or", detail: "azure" } }] })).toBe(
      "Gules, a castle Or, ported and windowed azure",
    );
  });
  it("blazons ordinaries with charges on and around them", () => {
    expect(
      b({ field: { kind: "plain", t: "gules" }, ordinary: { kind: "chevron", t: "argent", on: { id: "mullet", t: "azure" } }, charges: [{ at: "between", charge: { id: "escallop", t: "argent" } }] }),
    ).toBe("Gules, on a chevron argent three mullets azure between three escallops argent");
  });
  it("blazons the furs and fusils conjoined", () => {
    expect(b({ field: { kind: "vairy", t: ["argent", "azure"] }, ordinary: { kind: "fess", t: "gules" }, charges: [] })).toBe("Vair, a fess gules");
    expect(b({ field: { kind: "vairy", t: ["or", "gules"] }, charges: [] })).toBe("Vairy Or and gules");
    expect(b({ field: { kind: "fretty", t: ["gules", "or"] }, charges: [] })).toBe("Gules fretty Or");
    expect(b({ field: { kind: "plain", t: "argent" }, ordinary: { kind: "bend", t: "gules", line: "fusilly" }, charges: [] })).toBe("Argent, a bend fusilly gules");
  });
  it("blazons semé fields in the rolls' words", () => {
    const semy = (id: string, t: "or" | "argent" | "gules", rest: Partial<Arms> = {}): Arms => ({ field: { kind: "semy", t: "sable", charge: { id, t } }, charges: [], ...rest });
    expect(b(semy("cross_crosslet", "or", { charges: [{ at: "center", charge: { id: "lion_rampant", t: "or" } }] }))).toBe("Sable crusilly Or, a lion rampant Or");
    expect(b(semy("billet", "argent", { ordinary: { kind: "bend", t: "argent" } }))).toBe("Sable billetty argent, a bend argent");
    expect(b(semy("roundel", "or"))).toBe("Sable bezanty");
    expect(b(semy("roundel", "argent"))).toBe("Sable platy");
    expect(b(semy("roundel", "gules"))).toBe("Sable, semé of torteaux");
  });
  it("blazons the French semé and cadency marks", () => {
    expect(b({ field: { kind: "semy", t: "azure", charge: { id: "fleur", t: "or" } }, charges: [], brisure: { kind: "label", t: "gules" } })).toBe(
      "Azure, semé-de-lis Or; a label of three points gules",
    );
  });
});
