// The examples page must keep showing what its notes describe: the chosen
// layout is still offered, nothing the example asks for is dropped, and real
// arms still come out with the same blazon.
import { describe, expect, it } from "vitest";
import { blazon } from "../src/heraldry/blazon.ts";
import { DEFAULT_ANSWERS, decodeAnswers, encodeAnswers } from "../src/west/answers.ts";
import { generate } from "../src/west/generate.ts";
import { EXAMPLES, SECTIONS } from "../src/pages/example-list.ts";

describe("examples page", () => {
  it("has unique anchors that do not clash with the page's own ids", () => {
    const ids = [...SECTIONS.map((s) => s.id), ...EXAMPLES.map((e) => e.id)];
    expect(ids.filter((id, i) => ids.indexOf(id) !== i), "duplicate ids").toEqual([]);
    expect(ids.filter((id) => ["page", "title", "lang"].includes(id))).toEqual([]);
  });

  it.each(EXAMPLES.map((e) => [e.id, e] as const))("%s still comes out as described", (_, ex) => {
    const answers = { ...DEFAULT_ANSWERS, ...ex.answers };
    // the answers must survive the share link the page builds
    expect(decodeAnswers(encodeAnswers(answers)), "answers the URL cannot carry").toEqual(answers);
    const r = generate(answers);
    expect(r.chosen.id, `layout ${ex.answers.layout} is no longer offered; pick another from: ${r.candidates.map((c) => c.id).join(", ")}`).toBe(ex.answers.layout);
    expect(r.chosen.dropped ?? []).toEqual([]);
    if (ex.blazon) expect(blazon(r.chosen.arms)).toBe(ex.blazon);
  });
});
