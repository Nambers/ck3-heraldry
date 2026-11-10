// Rule checks. The generator is built so that these never fail ("correct by
// construction"); the checker exists to prove that in tests and to review
// arms that come from elsewhere. Issues are i18n messages (rule.*).

import type { Arms, Charge, RealmRef } from "./ast.ts";
import { isEscutcheon } from "./ast.ts";
import { contrasts, type Tincture } from "./tincture.ts";

export interface Issue {
  level: "error" | "warn";
  key: string;
  p: Record<string, string | { t: Tincture } | { charge: string }>;
}

function checkOn(issues: Issue[], top: Tincture, under: Tincture | null, what: Issue["p"]["what"]) {
  if (under === null) return; // lies across a partition line: exempt
  if (!contrasts(top, under)) issues.push({ level: "error", key: "rule.tincture", p: { top: { t: top }, under: { t: under }, what } });
}

function checkCharge(issues: Issue[], c: Charge, under: Tincture | null) {
  checkOn(issues, c.t, under, { charge: c.id });
  if (!c.breast) return;
  if (isEscutcheon(c.breast)) {
    if (!c.breast.of) issues.push(...checkArms(c.breast.arms));
  }
  else checkCharge(issues, c.breast, c.t);
}

// Historic realm arms are taken as they are (Anjou-Sicily's red label on blue,
// Jerusalem's gold on silver): quarters, escutcheons and whole arms marked as a
// realm's are skipped; whatever the bearer adds to them is still checked.
export function checkArms(arms: Arms): Issue[] {
  if (arms.exempt) return [];
  const issues: Issue[] = [];
  if (arms.of) {
    // only what was added: an escutcheon over all, or one on an eagle's breast
  } else if (arms.quarterly) {
    arms.quarterly.q.forEach((q, i) => {
      if (!arms.quarterly!.of?.[i]) issues.push(...checkArms(q));
    });
  } else {
    const f = arms.field;
    const fieldUnder = f.kind === "plain" || f.kind === "semy" ? f.t : null;
    if (f.kind === "semy") checkCharge(issues, f.charge, f.t);
    const o = arms.ordinary;
    if (o) {
      checkOn(issues, o.t, fieldUnder, "ordinary");
      if (o.on) checkCharge(issues, o.on, o.t);
    }
    if (arms.chief) {
      checkOn(issues, arms.chief.t, fieldUnder, "chief");
      for (const c of arms.chief.charges) checkCharge(issues, c, arms.chief.t);
    }
    if (arms.canton) {
      checkOn(issues, arms.canton.t, fieldUnder, "canton");
      if (arms.canton.charge) checkCharge(issues, arms.canton.charge, arms.canton.t);
    }
    for (const p of arms.charges) {
      let under: Tincture | null = fieldUnder;
      if (f.kind === "per_pale" && (p.at === "dexter" || p.at === "sinister")) under = f.t[p.at === "dexter" ? 0 : 1];
      if (f.kind === "per_fess" && (p.at === "chief_half" || p.at === "base_half")) under = f.t[p.at === "chief_half" ? 0 : 1];
      checkCharge(issues, p.charge, under);
    }
    const b = arms.brisure;
    if (b && b.kind !== "baton") checkOn(issues, b.t, arms.chief ? arms.chief.t : fieldUnder, "brisure");
    if (b?.kind === "baton") checkOn(issues, b.t, fieldUnder, "brisure");
  }
  if (arms.of) for (const p of arms.charges) if (p.charge.breast && isEscutcheon(p.charge.breast) && !p.charge.breast.of) issues.push(...checkArms(p.charge.breast.arms));
  if (arms.overall && !arms.overall.of) issues.push(...checkArms(arms.overall.arms));
  return issues;
}

/** Quarters with identical arms grouped, in order of first appearance: [[1, 4], [2, 3]] etc. (1-based). */
export function groupQuarters(arms: Arms): { n: number[]; arms: Arms; of?: RealmRef }[] {
  const out: { n: number[]; arms: Arms; of?: RealmRef; sig: string }[] = [];
  arms.quarterly!.q.forEach((a, i) => {
    const sig = signature(a), of = arms.quarterly!.of?.[i] ?? undefined;
    const g = out.find((g) => g.sig === sig && g.of?.id === of?.id);
    if (g) g.n.push(i + 1);
    else out.push({ n: [i + 1], arms: a, of, sig });
  });
  return out.map(({ sig: _s, ...g }) => g);
}

/** Canonical form for comparing arms (ignores minor details such as claws). */
export function signature(arms: Arms): string {
  const IGNORE = new Set(["armed", "crowned", "crined", "second", "detail", "of", "of2"]);
  return JSON.stringify(arms, (k, v) => {
    if (IGNORE.has(k)) return undefined;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.fromEntries(Object.keys(v).sort().map((key) => [key, v[key]]));
    }
    return v;
  });
}
