// Run the layout lint over many generated arms and summarise the problems.
//   node --experimental-strip-types --no-warnings scripts/lint-layouts.ts [count]
import { lintArms } from "../src/lint.ts";
import { DEFAULT_ANSWERS, PALETTES } from "../src/west/answers.ts";
import { generate, hash } from "../src/west/generate.ts";
import { CADENCY, DEEDS, EMBLEM_FAMILIES, FAITH_CHARGES, ORIGIN_GROUPS, STYLES } from "../src/west/questions.ts";
import { RANKS, REALM_IDS, canHold, type Rank } from "../src/realms.ts";

const N = Number(process.argv[2] ?? 1500);
const pick = <T,>(xs: readonly T[], i: number, s: number) => xs[hash(`${i}:${s}`) % xs.length];
const emblems = ["none", "liege", ...EMBLEM_FAMILIES.flatMap((f) => f.charges)];
const origins = ["none", ...ORIGIN_GROUPS.flatMap((g) => g.charges)];
const realms = ["none", ...REALM_IDS];
const counts = new Map<string, { n: number; example: string; amount: number }>();
let arms = 0, bad = 0;
for (let i = 0; i < N; i++) {
  const rank: Rank = i % 8 === 0 ? "emperor" : i % 2 ? pick(RANKS, i, 11) : pick(RANKS.slice(1), i, 11);
  const holdable = REALM_IDS.filter((id) => canHold(rank, id));
  const a = {
    ...DEFAULT_ANSWERS, name: `H${i}`, year: pick([900, 1178, 1250, 1300, 1440], i, 1), liege: pick(realms, i, 2), emblem: pick(emblems, i, 3),
    origin: pick(origins, i, 4), faith: i % 2 ? "none" : pick(["none", ...FAITH_CHARGES], i, 5), deed: pick(DEEDS, i, 6), claim: pick(realms, i, 7),
    cadency: pick(CADENCY, i, 8), style: pick(STYLES, i, 9), palette: pick(["liege", ...PALETTES.map(([f, c]) => `${f}/${c}`)], i, 10),
    rank,
    titles: i % 2 ? [] : [...new Set(Array.from({ length: hash(`${i}:12`) % 4 }, (_, j) => (j === 0 && i % 8 === 0 ? "hre" : pick(holdable, i, 20 + j))))],
  };
  for (const c of generate(a).candidates) {
    arms++;
    const issues = lintArms(c.arms);
    if (issues.length) bad++;
    for (const is of issues) {
      const key = `${is.kind}  [${c.id.split("#")[0]}${c.arms.quarterly ? " quarterly" : ""}${c.arms.overall?.own ? " surtout" : ""}]  ${is.a}${is.b ? " × " + is.b : ""}`.replace(/@field/g, "");
      const e = counts.get(key) ?? { n: 0, example: "", amount: 0 };
      e.n++;
      if (is.amount > e.amount) {
        e.amount = is.amount;
        e.example = new URLSearchParams(Object.entries(a).map(([k, v]) => [k, String(v)])).toString() + `&layout=${c.id}`;
      }
      counts.set(key, e);
    }
  }
}
const rows = [...counts.entries()].sort((x, y) => y[1].n - x[1].n);
console.log(`${bad}/${arms} layouts with issues, ${rows.length} kinds`);
for (const [k, v] of rows.slice(0, Number(process.argv[3] ?? 60))) console.log(`${String(v.n).padStart(5)}  max ${v.amount.toFixed(2)}  ${k}`);
