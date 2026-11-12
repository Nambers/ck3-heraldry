// Answers -> a handful of legal arms to choose from, plus notes.
//
// Correct by construction: tinctures are assigned by role (field / on the field
// / on a charge or ordinary), so the rule of tincture cannot be broken. When
// wishes compete for one place (an eagle's breast, the top of the shield) we do
// not error; each legal resolution becomes its own candidate, and candidates
// that keep every wish come first.

import { CHARGES, isEagleLike } from "../charges.ts";
import type { Arms, Charge, ChargeId, Division, Escutcheon, Field, OrdinaryKind, Placed } from "../heraldry/ast.ts";
import { LINES, firstTincture, isImpaled, plain, quarterCols, type Line } from "../heraldry/ast.ts";
import { checkArms, signature, unmarked } from "../heraldry/rules.ts";
import { contrasts, isMetal, type Tincture } from "../heraldry/tincture.ts";
import { opens } from "../heraldry/era.ts";
import { ON, escutcheonSafe } from "../layout.ts";
import { REALMS, REALM_IDS, canHold, holdable, realmAt, realmMainCharge, realmPalette, type Period } from "../realms.ts";
import type { Candidate as BaseCandidate, Msg, Note, Param, Result as BaseResult } from "../designer/types.ts";
import { defaultCrown } from "../ck3/export.ts";
import { maxQuarters, maxTitles, paletteOf, parseGeom, parseParts, thirdOf, type Answers, type Geom, type Style } from "./answers.ts";
import { DIMINISHES, GEOM, ORD_BY_NAME, PARTS, PART_ROLE, type Part } from "./questions.ts";
import { legend } from "./legend.ts";

export type { Msg, Note, Param } from "../designer/types.ts";
export { hash } from "../designer/util.ts";
import { hash } from "../designer/util.ts";

const m = (key: string, p?: Record<string, Param>): Msg => ({ key, p });

export interface Candidate extends BaseCandidate {
  style: Exclude<Style, "auto">;
}

export type Result = BaseResult<Candidate>;

// ---------------------------------------------------------------- helpers

const clone = <T>(x: T): T => structuredClone(x);
const small = (id: ChargeId) => CHARGES[id].small;

/**
 * What mk() needs from the answers being generated: the two tinctures of the
 * palette (details that spill over the charge's edge must not vanish into them)
 * and the player's own detail colours. Set by generate() for one run.
 */
let ctx: { avoid: Tincture[]; parts: Partial<Record<Part, Tincture>> } = { avoid: [], parts: {} };

/** every realm's arms in every period, with their signatures (the realms never change: worked out once) */
let borne: { id: string; p: Period; sig: string }[] | null = null;
const borneArms = () =>
  (borne ??= REALM_IDS.flatMap((id) => REALMS[id].periods.flatMap((p) => (p.arms ? [{ id, p, sig: signature(p.arms) }] : []))));

/** a charge with the usual extras filled in */
function mk(id: ChargeId, t: Tincture, count: 1 | 3 | 6 = 1): Charge {
  const c: Charge = { id, t };
  if (count !== 1) c.count = count;
  if (id === "maiden_eagle") {
    // her hair and crown stand out over the field, so they differ from the eagle and from both tinctures in play
    const order: Tincture[] = ["or", "gules", "argent", "azure", "sable", "vert", "purpure"];
    c.crowned = c.crined = order.find((x) => x !== t && !ctx.avoid.includes(x)) ?? (t === "or" ? "gules" : "or");
  } else if (CHARGES[id].attrs?.includes("crowned")) {
    // a crowned charge says what its crown is: the colour the export would pick anyway
    // (gold, else red, blue, silver), clear of the charge and of what it lies on (the other tincture in play)
    const under = ctx.avoid.find((x) => x !== t) ?? ctx.avoid[0];
    c.crowned = defaultCrown(t, under ?? t);
  }
  if (id === "keys_crossed") c.second = t === "argent" ? "or" : "argent";
  // the hills take the cross's class (metal or colour) but not its tincture: the cross contrasts
  // whatever it lies on, so they do too, wherever the charge goes
  if (id === "cross_patriarchal_mount") c.second = isMetal(t) ? (t === "or" ? "argent" : "or") : (["vert", "azure", "gules", "sable", "purpure"] as Tincture[]).find((x) => x !== t)!;
  // the player's detail colours, for the parts this charge has
  const roles = new Set(CHARGES[id].ck3.flatMap((p) => p.colors));
  for (const part of PARTS) {
    const v = ctx.parts[part];
    if (v && roles.has(PART_ROLE[part])) c[part] = v;
  }
  return c;
}

/** a tincture of the same class as `like`, different from all of `avoid` */
function sameClass(like: Tincture, avoid: Tincture[]): Tincture {
  const order: Tincture[] = isMetal(like) ? ["argent", "or"] : ["azure", "gules", "sable", "vert", "purpure"];
  return order.find((t) => !avoid.includes(t)) ?? order[0];
}

/** a tincture contrasting `under`: `prefer` if it does, else preferably one not in `avoid` */
function contrasting(under: Tincture | null, avoid: Tincture[], prefer?: Tincture): Tincture {
  if (prefer && (under === null || contrasts(prefer, under))) return prefer;
  const order: Tincture[] = ["argent", "or", "gules", "azure", "sable", "vert", "purpure"];
  return (
    order.find((t) => (under === null || contrasts(t, under)) && !avoid.includes(t) && t !== under) ??
    order.find((t) => under === null || contrasts(t, under))!
  );
}

// what the family name picks from, in a fixed order (questions.ts GEOM); the player may pick instead
/** without charges there is room for the diminutives too */
const PLAIN_ORDINARY_ROTATION: OrdinaryKind[] = [...ORD_BY_NAME];
/** what the player may choose: the rest follow in this order */
const ALL_ORDINARIES: OrdinaryKind[] = [...GEOM.ord];
const ORDINARY_ROTATION: OrdinaryKind[] = PLAIN_ORDINARY_ROTATION.filter((k) => !DIMINISHES[k]);
const DIVISION_ROTATION: Division[] = [...GEOM.div];
const VARIED_ROTATION: Division[] = [...GEOM.var];
/** furs have candidates of their own, built the way the rolls use them */
const FUR_ROTATION = GEOM.fur;
/**
 * Semé fields for families, as often as the 13th-century rolls have them (docs/roll-gaps.md:
 * crusilly 49, billetty 22, bezanty 15). Semé-de-lis only when chosen: on a family it is rare,
 * and gold on blue is the arms of France.
 */
const SEMY_BY_NAME = ["cross_crosslet", "billet", "cross_crosslet", "roundel", "cross_crosslet", "billet"];

interface Base {
  id: string;
  style: Exclude<Style, "auto">;
  label: Msg[];
  arms: Arms;
  /** which wishes this layout shows: A = main charge, B = second charge */
  uses: Set<"A" | "B">;
}

const at = (spot: Placed["at"], charge: Charge): Placed => ({ at: spot, charge });

// ---------------------------------------------------------------- templates

function templates(Fp: Tincture, C: Tincture, third: Tincture | undefined, A: Charge | undefined, B: Charge | undefined, seed: number, capo: { realm: string; arms: Arms } | null, geom: Geom): Base[] {
  const out: Base[] = [];
  // ermine can only be a plain field in CK3; charges and stripes use argent instead
  const F: Tincture = Fp === "ermine" ? "argent" : Fp;
  const field = plain(Fp);
  // a third tincture (the player's, or another of the field's class), and what lies on it:
  // whichever of the pair contrasts it, so the rule of tincture still holds
  const T3 = third ?? sameClass(F, [F, C]);
  const on3 = contrasts(C, T3) || !contrasts(F, T3) ? C : F;
  // the player's own geometry (Answers.geom) wins over the family name's; the i-th pick
  // after it follows the same rotation, so a second ordinary still differs from the first
  const rot = <T extends string>(list: readonly T[], chosen: string | undefined, i: number, byName: number): T => {
    const at = chosen ? list.indexOf(chosen as T) : -1;
    return list[((at >= 0 ? at : byName % list.length) + i) % list.length];
  };
  // diminutives leave no room for charges: with charges, the ordinary they diminish
  const chargedOrd = (geom.ord && DIMINISHES[geom.ord as OrdinaryKind]) || geom.ord;
  const ord = (i: number) => rot(ORDINARY_ROTATION, chargedOrd, i, seed);
  const div = rot(DIVISION_ROTATION, geom.div, 0, seed);
  const varied = rot(VARIED_ROTATION, geom.var, 0, seed >>> 3);
  // Furs as the 13th-century rolls use them (docs/roll-gaps.md): vair alone or under a plain
  // ordinary or chief of another colour (Vair, a fess gules — Marmion), fretty mostly alone
  // (Gules fretty Or — Audley) or under a chief of the fret's tincture (St Amand).
  const fur = rot(FUR_ROTATION, geom.fur, 0, seed >>> 13);
  const metal = isMetal(F) ? F : C, colour = isMetal(F) ? C : F;
  // vair names its metal first (and CK3's vair paints it as color1); fretty its field
  const furField: Field = fur === "vairy" ? { kind: "vairy", t: [metal, colour] } : { kind: "fretty", t: [F, C] };
  // on vair: another colour, metal charges on it; on fretty: the fret's tincture, charges in the field's
  const vairT3 = third ?? sameClass(colour, [F, C]);
  const furChief: [Tincture, Tincture] = fur === "vairy" ? [vairT3, contrasts(metal, vairT3) || !contrasts(colour, vairT3) ? metal : colour] : [C, F];
  // Semé, as the rolls use it for families: powdered in the tincture of what lies on it
  // (Gules crusilly, a lion rampant Or; Azure billetty Or, a bend Or; Sable bezanty)
  const semyId = geom.semy ?? SEMY_BY_NAME[(seed >>> 17) % SEMY_BY_NAME.length];
  const semyField = (id: ChargeId): Field => ({ kind: "semy", t: F, charge: mk(id, C) });
  const ch = (c: Charge, t: Tincture, count: 1 | 3 | 6 = 1) => mk(c.id, t, count);
  const single = A ?? B;
  const which = new Set<"A" | "B">(A ? ["A"] : ["B"]);
  // the family name also picks a line of partition for the first ordinary, the chief and the
  // division; a chosen line goes wherever CK3 can draw it, the rest stay straight
  const lineFor = (k: string, salt: number): Line | undefined => {
    const ls = LINES[k];
    if (geom.line) return geom.line !== "plain" && ls?.includes(geom.line as Line) ? (geom.line as Line) : undefined;
    if (!ls) return undefined;
    const pool = [undefined, ...ls];
    return pool[(seed >>> salt) % pool.length];
  };
  const withLine = <T extends object>(x: T, line: Line | undefined) => (line ? { ...x, line } : x);
  const L0 = lineFor(ord(0), 5);
  const chiefLine = lineFor("chief", 11) as "indented" | undefined;
  /** charges fit on an ordinary only if it has room for them, and not on a zigzag or battlements */
  const canBear = (k: OrdinaryKind, line?: Line) => !!ON[k] && (!line || line === "engrailed");
  const aspect = (id: ChargeId) => {
    const [x0, y0, x1, y1] = CHARGES[id].bbox;
    return (x1 - x0) / (y1 - y0);
  };

  if (single && !(A && B)) {
    out.push({
      id: "single", style: "simple", uses: which,
      label: [m("layout.single", { a: { charge: single.id } })],
      arms: { field, charges: [at("center", ch(single, C, small(single.id) ? 3 : 1))] },
    });
    // a small charge borne alone and large; crosses mostly are (a cross moline; Hungary's
    // patriarchal cross), so for them it comes before the three
    if (small(single.id)) {
      const one: Base = { id: "one", style: "simple", uses: which, label: [m("layout.one", { a: { charge: single.id } })], arms: { field, charges: [at("center", ch(single, C))] } };
      if (CHARGES[single.id].cat === "cross") out.splice(out.length - 1, 0, one);
      else out.push(one);
    }
    // in a line, or six: English-style counts
    if (aspect(single.id) >= 1.25) {
      out.push({
        id: "three-pale", style: "simple", uses: which,
        label: [m("layout.threePale", { a: { charge: single.id } })],
        arms: { field, charges: [at("center", { ...ch(single, C, 3), arr: "pale" })] },
      });
    } else if (aspect(single.id) <= 0.85) {
      out.push({
        id: "three-fess", style: "simple", uses: which,
        label: [m("layout.threeFess", { a: { charge: single.id } })],
        arms: { field, charges: [at("center", { ...ch(single, C, 3), arr: "fess" })] },
      });
    }
    if (small(single.id)) {
      out.push({
        id: "six", style: "simple", uses: which,
        label: [m("layout.six", { a: { charge: single.id } })],
        arms: { field, charges: [at("center", ch(single, C, 6))] },
      });
      out.push({
        id: "three-bend", style: "simple", uses: which,
        label: [m("layout.threeBend", { a: { charge: single.id } })],
        arms: { field, charges: [at("center", { ...ch(single, C, 3), arr: "bend" })] },
      });
    }
    for (const [i, k] of [ord(0), ord(1)].entries()) {
      const line = i === 0 ? L0 : undefined;
      out.push({
        id: `between-${k}`, style: "ordinary", uses: which,
        label: [m("layout.between", { o: { ord: k, line }, a: { charge: single.id } })],
        arms: { field, ordinary: withLine({ kind: k, t: C }, line), charges: [at("between", ch(single, C))] },
      });
      if (i === 0 && small(single.id) && k !== "pale" && canBear(k, line)) {
        out.push({
          id: `on-${k}`, style: "ordinary", uses: which,
          label: [m("layout.on", { o: { ord: k, line }, a: { charge: single.id } })],
          arms: { field, ordinary: withLine({ kind: k, t: C, on: ch(single, F) }, line), charges: [] },
        });
      }
    }
    out.push({
      id: "orle", style: "ordinary", uses: which,
      label: [m("layout.orle", { a: { charge: single.id } })],
      arms: { field, ordinary: { kind: "orle", t: C }, charges: [at("center", ch(single, C))] },
    });
    out.push({
      id: "varied-chief", style: "patterned", uses: which,
      label: [m("layout.variedChief", { d: { div: varied }, a: { charge: single.id } })],
      arms: { field: { kind: varied, t: [F, C] }, chief: withLine({ t: T3, charges: small(single.id) ? [0, 1, 2].map(() => ch(single, on3)) : [ch(single, on3)] }, chiefLine), charges: [] },
    });
    out.push({
      id: "varied-escutcheon", style: "patterned", uses: which,
      label: [m("layout.variedEscutcheon", { d: { div: varied }, a: { charge: single.id } })],
      arms: { field: { kind: varied, t: [F, C] }, charges: [], overall: { kind: "escutcheon", arms: { field: plain(T3), charges: [at("center", ch(single, on3))] } } },
    });
    out.push({
      id: `fur-chief-${fur}`, style: "patterned", uses: which,
      label: [m("layout.variedChief", { d: { div: fur }, a: { charge: single.id } })],
      arms: { field: furField, chief: { t: furChief[0], charges: small(single.id) ? [0, 1, 2].map(() => ch(single, furChief[1])) : [ch(single, furChief[1])] }, charges: [] },
    });
    if (single.id !== semyId) {
      out.push({
        id: `semy-${semyId}`, style: "patterned", uses: which,
        label: [m("layout.fieldCharge", { d: { div: `semy_${semyId}` }, a: { charge: single.id } })],
        arms: { field: semyField(semyId), charges: [at("center", ch(single, C, small(single.id) ? 3 : 1))] },
      });
    }
  }

  if (A && B) {
    const big = small(A.id) && !small(B.id) ? B : A;
    const many = big === A ? B : A;
    out.push({
      id: "high-base", style: "simple", uses: new Set(["A", "B"]),
      label: [m("layout.highBase", { a: { charge: A.id }, b: { charge: B.id } })],
      arms: { field, charges: [at("high", ch(A, C)), at("base", ch(B, C))] },
    });
    out.push({
      id: "chief", style: "simple", uses: new Set(["A", "B"]),
      label: [m("layout.chief", { a: { charge: big.id }, b: { charge: many.id } })],
      arms: { field, charges: [at("center", ch(big, C))], chief: withLine({ t: C, charges: [0, 1, 2].map(() => ch(many, F)) }, chiefLine) },
    });
    out.push({
      id: "canton", style: "simple", uses: new Set(["A", "B"]),
      label: [m("layout.canton", { a: { charge: big.id }, b: { charge: many.id } })],
      arms: { field, charges: [at("center", ch(big, C))], canton: { t: C, charge: ch(many, F) } },
    });
    // the second wish powdered over the field, when it is one of the semé charges
    if ((GEOM.semy as readonly string[]).includes(many.id) && many.id !== big.id) {
      out.push({
        id: `semy-${many.id}`, style: "patterned", uses: new Set(["A", "B"]),
        label: [m("layout.fieldCharge", { d: { div: `semy_${many.id}` }, a: { charge: big.id } })],
        arms: { field: semyField(many.id), charges: [at("center", ch(big, C, small(big.id) ? 3 : 1))] },
      });
    }
    const onKind: OrdinaryKind = ord(0) === "pale" || !ON[ord(0)] ? "fess" : ord(0);
    const onLine = onKind === ord(0) && L0 === "engrailed" ? L0 : undefined;
    if (small(many.id)) {
      out.push({
        id: `on-between-${onKind}`, style: "ordinary", uses: new Set(["A", "B"]),
        label: [m("layout.onBetween", { o: { ord: onKind, line: onLine }, a: { charge: big.id }, b: { charge: many.id } })],
        arms: { field, ordinary: withLine({ kind: onKind, t: C, on: ch(many, F) }, onLine), charges: [at("between", ch(big, C))] },
      });
    }
    out.push({
      id: "pale", style: "divided", uses: new Set(["A", "B"]),
      label: [m("layout.pale", { a: { charge: A.id }, b: { charge: B.id } })],
      arms: { field: { kind: "per_pale", t: [F, C] }, charges: [at("dexter", ch(A, C)), at("sinister", ch(B, F))] },
    });
    out.push({
      id: "fess-div", style: "divided", uses: new Set(["A", "B"]),
      label: [m("layout.fessDiv", { a: { charge: A.id }, b: { charge: B.id } })],
      arms: { field: { kind: "per_fess", t: [F, C] }, charges: [at("chief_half", ch(A, C)), at("base_half", ch(B, F))] },
    });
    out.push({
      id: "varied-canton", style: "patterned", uses: new Set(["A", "B"]),
      label: [m("layout.variedCanton", { d: { div: varied }, a: { charge: A.id }, b: { charge: B.id } })],
      arms: {
        field: { kind: varied, t: [F, C] },
        canton: { t: T3, charge: ch(B, on3) },
        charges: [],
        overall: { kind: "escutcheon", arms: { field: plain(T3), charges: [at("center", ch(A, on3))] } },
      },
    });
  }

  if (!single) {
    // a chosen ordinary may be one the name never picks: then the next one follows it in the full list
    const pord = (i: number) => rot(geom.ord ? ALL_ORDINARIES : PLAIN_ORDINARY_ROTATION, geom.ord, i, seed);
    for (const [i, k] of [pord(0), pord(1)].entries()) {
      const line = i === 0 ? lineFor(k, 5) : undefined;
      out.push({ id: `ordinary-${k}`, style: "ordinary", uses: new Set(), label: [m("layout.ordinary", { o: { ord: k, line } })], arms: { field, ordinary: withLine({ kind: k, t: C }, line), charges: [] } });
    }
    const divLine = lineFor(div, 9);
    out.push({ id: `division-${div}`, style: "divided", uses: new Set(), label: [m("layout.division", { d: { div, line: divLine } })], arms: { field: withLine({ kind: div, t: [F, C] as [Tincture, Tincture] }, divLine), charges: [] } });
    out.push({ id: `varied-${varied}`, style: "patterned", uses: new Set(), label: [m("layout.division", { d: { div: varied } })], arms: { field: { kind: varied, t: [F, C] }, charges: [] } });
    out.push({ id: `fur-${fur}`, style: "patterned", uses: new Set(), label: [m("layout.division", { d: { div: fur } })], arms: { field: furField, charges: [] } });
    if (fur === "vairy") {
      const k = pord(0);
      out.push({ id: `fur-${k}-vairy`, style: "patterned", uses: new Set(), label: [m("layout.fieldOrdinary", { d: { div: fur }, o: { ord: k } })], arms: { field: furField, ordinary: { kind: k, t: furChief[0] }, charges: [] } });
    }
    out.push({ id: `semy-${semyId}`, style: "patterned", uses: new Set(), label: [m("layout.division", { d: { div: `semy_${semyId}` } })], arms: { field: semyField(semyId), charges: [] } });
    const so = pord(0);
    out.push({ id: `semy-${so}-${semyId}`, style: "patterned", uses: new Set(), label: [m("layout.fieldOrdinary", { d: { div: `semy_${semyId}` }, o: { ord: so } })], arms: { field: semyField(semyId), ordinary: { kind: so, t: C }, charges: [] } });
  }

  // a chief of the liege (Italian "capo"): the liege's field and charge in chief
  if (capo) {
    const lc = realmMainCharge(capo.arms);
    const [LF] = realmPalette(capo.arms);
    if (lc) {
      const F2 = contrasts(LF, Fp) ? Fp : C;
      const X = F2 === Fp ? C : F;
      const main = single ? ch(single, X) : undefined;
      out.push({
        id: "capo", style: "simple", uses: new Set(main ? [A ? "A" : "B"] : []),
        label: [m("layout.capo", { r: { realm: capo.realm } }), ...(main ? [m("layout.capoMain", { a: { charge: main.id } })] : [])],
        arms: {
          field: plain(F2),
          chief: { t: LF, charges: [{ ...lc, count: 1 }], of: { id: capo.realm } },
          charges: main ? [at("center", main)] : [],
          ordinary: main ? undefined : { kind: "pale", t: X },
        },
      });
    }
  }
  return out;
}

/** the heraldic name of a layout, from its template and how a claim was added */
function layoutName(base: Base, arms: Arms): Msg[] {
  const [kind, ...rest] = base.id.split("-");
  const arg = rest.join("_");
  const own = base.arms;
  let main: Msg;
  if (kind === "single") main = m((own.charges[0]?.charge.count ?? 1) === 3 ? "lname.three" : "lname.single");
  else if (base.id.startsWith("on-between-")) main = m("lname.onBetween", { o: { ord: base.id.slice("on-between-".length), line: own.ordinary?.line } });
  else if (kind === "between" || kind === "on" || kind === "ordinary") main = m(`lname.${kind}`, { o: { ord: arg, line: own.ordinary?.line } });
  else if (base.id.startsWith("varied-")) {
    const f = own.field;
    const d = f.kind === "plain" || f.kind === "semy" ? "barry" : f.kind;
    main = ["chief", "escutcheon", "canton"].includes(arg) ? m(`lname.varied_${arg}`, { d: { div: d } }) : m("lname.division", { d: { div: d } });
  } else if (kind === "fur") {
    const d = own.field.kind as Division;
    main = own.chief ? m("lname.varied_chief", { d: { div: d } }) : own.ordinary ? m("lname.fieldOrdinary", { d: { div: d }, o: { ord: own.ordinary.kind } }) : m("lname.division", { d: { div: d } });
  } else if (kind === "semy" && own.field.kind === "semy") {
    const d = `semy_${own.field.charge.id}`;
    main = own.ordinary ? m("lname.fieldOrdinary", { d: { div: d }, o: { ord: own.ordinary.kind } }) : own.charges.length ? m("lname.fieldCharge", { d: { div: d } }) : m("lname.division", { d: { div: d } });
  } else if (kind === "division") main = m("lname.division", { d: { div: arg, line: own.field.kind !== "plain" && own.field.kind !== "semy" ? own.field.line : undefined } });
  else main = m(`lname.${base.id.replace("-", "_")}`);
  const q = arms.quarterly ? arms.quarterly.q[0] : arms;
  if (arms.granted) return [m("lname.grant", { r: { realm: arms.granted.id } }), main];
  if (arms.overall?.own) return [m("lname.surtout"), main];
  if (arms.charges.some((p) => p.charge.breast && "own" in p.charge.breast && p.charge.breast.own)) return [m("lname.imperial"), main];
  if (arms.quarterly) return [m(isImpaled(arms.quarterly) ? "lname.impaled" : arms.quarterly.q.length === 4 ? "lname.quarterly" : `lname.quarterly${arms.quarterly.q.length}`), main];
  if (arms.overall && !own.overall) return [main, m("lname.plusOverall")];
  const breast = q.charges.some((p) => p.charge.breast && "kind" in p.charge.breast);
  return breast ? [main, m("lname.plusBreast")] : [main];
}

// ---------------------------------------------------------------- decorations

/** how much is on a coat: a plain or divided field is simplest */
function busy(a: Arms): number {
  const charges = a.charges.reduce((n, p) => n + (p.charge.count ?? 1), 0);
  return charges + (a.ordinary ? 1 : 0) + (a.chief ? 1 + a.chief.charges.length : 0) + (a.canton ? 1 : 0) + (a.field.kind === "semy" ? 2 : 0);
}

/** can an escutcheon sit in the centre without covering a charge? */
function centreFree(arms: Arms): boolean {
  if (arms.overall) return false;
  if (arms.quarterly) return true; // the quarters' charges move outward (layout.ts)
  return (
    !arms.ordinary?.on &&
    arms.field.kind !== "semy" &&
    arms.charges.every((p) => p.at === "dexter" || p.at === "sinister" || p.at === "between") &&
    !(arms.charges.some((p) => p.at === "between") && ["fess", "chevron"].includes(arms.ordinary?.kind ?? ""))
  );
}

type Coat = { arms: Arms; of: string | null };

/**
 * Marshal 2..cap coats quarterly: two as 1&4 / 2&3, three as 1&4 / 2 / 3, four in four;
 * five or six in six, seven or eight in eight (maxQuarters), an odd one out repeating the
 * first in the last quarter as three do in four. The rest do not fit.
 */
function quarterOf(coats: Coat[], cap: 4 | 6 | 8): { arms: Arms; over: Coat[] } {
  const L = coats.slice(0, cap);
  const n = L.length;
  const idx = n === 2 ? [0, 1, 1, 0] : n === 3 ? [0, 1, 2, 0] : [...L.keys(), ...(n % 2 ? [0] : [])];
  return {
    arms: {
      field: clone(L[0].arms.field),
      charges: [],
      quarterly: { q: idx.map((i) => clone(L[i].arms)), of: idx.map((i) => (L[i].of ? { id: L[i].of! } : null)) },
    },
    over: coats.slice(cap),
  };
}

const mainEagle = (arms: Arms): Placed | undefined =>
  arms.charges.find((p) => ["center", "high", "dexter", "chief_half"].includes(p.at) && isEagleLike(p.charge.id) && (p.charge.count ?? 1) === 1);

type Where = "breast" | "chief" | "canton" | "ordinary";

/** put a single charge somewhere legal; returns where, or null if there is no room */
function placeSingle(arms: Arms, id: ChargeId, F: Tincture, C: Tincture, opts: { breast?: boolean } = {}): Where | null {
  const eagle = mainEagle(arms);
  if (opts.breast !== false && eagle && !eagle.charge.breast) {
    eagle.charge.breast = mk(id, contrasts(F, eagle.charge.t) ? F : C);
    return "breast";
  }
  if (arms.chief && arms.chief.charges.length === 3 && !arms.chief.of) {
    arms.chief.charges[1] = mk(id, arms.chief.charges[0].t);
    return "chief";
  }
  const center = arms.charges.find((p) => p.at === "center");
  const plainField = arms.field.kind === "plain";
  if (center && plainField && !arms.chief && !arms.canton && arms.charges.length === 1 && !arms.ordinary) {
    arms.canton = { t: C, charge: mk(id, F) };
    center.charge.count = 1;
    return "canton";
  }
  if (plainField && arms.ordinary && !arms.ordinary.on && ["fess", "cross", "saltire", "chevron", "bend"].includes(arms.ordinary.kind) && (!arms.ordinary.line || arms.ordinary.line === "engrailed") && small(id)) {
    arms.ordinary.on = mk(id, F);
    return "ordinary";
  }
  return null;
}

/** ordinaries that reach the middle of the top edge, where a cadency mark sits */
const TOP_CENTRE = new Set<OrdinaryKind>(["pale", "cross", "pile", "orle", "tressure", "pallets", "pales3", "bends2", "bends3", "bends4", "bends5", "chevrons2", "fess_chevrons"]);

/** does anything sit in the top band a label or a cadency mark needs? */
function crowdedTop(arms: Arms): boolean {
  if (arms.quarterly) {
    const cols = quarterCols(arms.quarterly);
    const row = arms.quarterly.q.slice(0, cols);
    // with three across, the mark sits inside the middle quarter, not on a partition line
    const mid = cols % 2 ? row[(cols - 1) / 2] : undefined;
    return row.some(crowdedTop) || !!(mid?.ordinary && TOP_CENTRE.has(mid.ordinary.kind));
  }
  const a = arms;
  return (
    !!a.chief ||
    !!a.canton ||
    a.charges.some((p) => p.at === "dexter_chief" || p.at === "between") ||
    !!(a.ordinary && ["pale", "cross", "saltire", "bend", "bend_sinister", "pile", "chevron"].includes(a.ordinary.kind) && a.ordinary.on) ||
    a.field.kind === "semy"
  );
}

// ---------------------------------------------------------------- main

export function generate(a: Answers): Result {
  const notes: Note[] = [];
  const note = (kind: Note["kind"], key: string, p?: Record<string, Param>) => notes.push({ kind, msg: m(key, p) });
  const seed = hash(a.name.trim());

  if (a.free) note("heraldry", "note.free");
  else if (a.year < 1150) note("history", "note.preHeraldic");

  const liege = a.liege !== "none" ? realmAt(a.liege, a.year, a.free) : null;
  const claim = a.claim !== "none" ? realmAt(a.claim, a.year, a.free) : null;
  if (liege && "unavailable" in liege) note("history", liege.unavailable, { r: { realm: a.liege } });
  if (claim && "unavailable" in claim) note("history", claim.unavailable, { r: { realm: a.claim } });
  for (const [id, r] of [[a.liege, liege], [a.claim, claim]] as const) {
    if (r && "since" in r && r.since !== undefined) note("history", "note.anachronism", { r: { realm: id }, y: r.since });
  }
  const liegeArms = liege && "arms" in liege ? liege.arms : null;
  const claimArms = claim && "arms" in claim ? claim.arms : null;

  // palette
  let [F, C] = paletteOf(a);
  if (a.palette === "liege" && liegeArms) note("heraldry", "note.liegeColours", { r: { realm: a.liege } });
  const third = thirdOf(a, [F, C]);

  // for every charge made from here on: the tinctures in play, and the player's detail colours
  ctx = { avoid: [F === "ermine" ? "argent" : F, C], parts: parseParts(a.parts) };

  // the wishes
  let mainId: ChargeId | undefined = a.emblem !== "none" && a.emblem !== "liege" ? a.emblem : undefined;
  if (a.emblem === "liege" && a.liege !== "none") {
    const lc = liegeArms && realmMainCharge(liegeArms);
    if (lc) {
      mainId = lc.id;
      note("heraldry", "note.liegeCharge", { r: { realm: a.liege }, a: { charge: lc.id } });
    } else note("heraldry", "note.liegeNoCharge", { r: { realm: a.liege } });
  }
  // the badges pilgrims brought home: Santiago's scallop, St Peter's keys from Rome, the Jerusalem cross
  const DEED_CHARGE: Partial<Record<Answers["deed"], ChargeId>> = {
    crusade: "cross_crosslet",
    pilgrimage_santiago: "escallop",
    pilgrimage_rome: "keys_crossed",
    pilgrimage_jerusalem: "jerusalem",
  };
  const deedCharge = DEED_CHARGE[a.deed];
  const originId = a.origin !== "none" ? a.origin : undefined;
  // a deed's charge stands in for the second charge when there is no origin
  const secondId = originId ?? deedCharge;
  const tertiary = originId ? deedCharge : undefined;
  const faith = a.faith !== "none" ? a.faith : undefined;
  // a faith symbol with no other charge is the family's charge itself (as the patriarchal cross
  // is Hungary's), not an addition that finds no place on a bare ordinary or division
  const faithAlone = !!faith && !mainId && !secondId;
  const addedFaith = faithAlone ? undefined : faith;
  const capo = liegeArms ? { realm: a.liege, arms: liegeArms } : null;

  // titles held now: arms of dominion (only titles the rank allows)
  const rank = a.rank;
  // titles above the rank are the player's own choice (folded away in the form): borne all the same
  const titles = a.titles.filter(holdable).slice(0, maxTitles(a));
  if (titles.some((id) => !canHold(rank, id))) note("history", "note.aboveRank", { r: { realm: titles.find((id) => !canHold(rank, id))! } });
  const cap = maxQuarters(a);
  const doms = titles.flatMap((id) => {
    const r = realmAt(id, a.year, a.free);
    if ("unavailable" in r) {
      note("history", r.unavailable, { r: { realm: id } });
      return [];
    }
    if (r.since !== undefined) note("history", "note.anachronism", { r: { realm: id }, y: r.since });
    return [{ id, arms: r.arms }];
  });
  const sovereign = rank === "king" || rank === "emperor";

  /** impaled: the two coats side by side, offered for the first layouts only (see build) */
  type Variant = { arms: Arms; label: Msg[]; dropped: Msg[]; impaled?: true };
  /** two coats side by side, dexter first (Gelre: Aragon impaling Urgell, Jerusalem impaling Anjou) */
  const impale = (dexter: Coat, sinister: Coat, label: Msg[], dropped: Msg[]): Variant => ({
    arms: { field: clone(dexter.arms.field), charges: [], quarterly: { q: [clone(dexter.arms), clone(sinister.arms)], of: [dexter, sinister].map((c) => (c.of ? { id: c.of } : null)) } },
    label,
    dropped,
    impaled: true,
  });
  /**
   * Lords keep the family arms first (1st and 4th quarters) and quarter their
   * titles in; sovereigns put the realms first and the family en surtout, or
   * after the realms; an emperor may bear the imperial eagle with the family
   * arms on its breast.
   */
  const marshal = (fam: Arms, label: Msg[], dropped: Msg[]): Variant[] => {
    const out: Variant[] = [];
    const claimed = claimArms && !titles.includes(a.claim) ? [{ arms: claimArms, of: a.claim }] : [];
    const realms: Coat[] = [...doms.map((d) => ({ arms: d.arms, of: d.id })), ...claimed];
    const own: Coat = { arms: fam, of: null };
    const tag = (c: Coat) => m(claimed.length && c.of === a.claim ? "place.claimQuarterly" : "place.dominion", { r: { realm: c.of! } });
    const push = (arms: Arms, placed: Coat[], extra: Msg[], over: Coat[]) =>
      out.push({
        arms,
        label: [...label, ...placed.filter((c) => c.of).map(tag), ...extra],
        dropped: [...dropped, ...over.map((c) => m("drop.title", { r: { realm: c.of! } }))],
      });
    if (!sovereign) {
      const { arms, over } = quarterOf([own, ...realms], cap);
      push(arms, realms.slice(0, cap - 1), [], over);
      // lords keep the family on the dexter here too (Gelre 646: Aragon impaling Urgell)
      if (realms.length === 1 && opens("impalement", a)) out.push(impale(own, realms[0], [...label, tag(realms[0]), m("place.impaled")], dropped));
      return out;
    }
    const famSafe = escutcheonSafe(fam);
    if (famSafe) {
      const surtout: Escutcheon = { kind: "escutcheon", arms: clone(fam), own: true };
      if (realms.length === 1) {
        if (centreFree(realms[0].arms)) push({ ...clone(realms[0].arms), of: { id: realms[0].of! }, overall: surtout }, realms, [m("place.surtout")], []);
      } else {
        const { arms, over } = quarterOf(realms, cap);
        arms.overall = surtout;
        push(arms, realms.slice(0, cap), [m("place.surtout")], over);
      }
    }
    // the family as a quarter after the realms (always room for it)
    const { arms } = quarterOf([...realms.slice(0, cap - 1), own], cap);
    push(arms, realms.slice(0, cap - 1), [m("place.ownQuarter")], realms.slice(cap - 1));
    const hre = doms.find((d) => d.id === "hre");
    if (rank === "emperor" && hre && famSafe) {
      const v: Arms = { ...clone(hre.arms), of: { id: "hre" } };
      const eagle = mainEagle(v);
      if (eagle && !eagle.charge.breast) {
        eagle.charge.breast = { kind: "escutcheon", arms: clone(fam), own: true };
        push(v, [{ arms: hre.arms, of: "hre" }], [m("place.imperial")], realms.filter((c) => c.of !== "hre"));
      }
    }
    // or, with one realm, the two side by side: the realm on the dexter (the place of honour)
    if (realms.length === 1 && opens("impalement", a)) out.push(impale(realms[0], own, [...label, tag(realms[0]), m("place.impaled")], dropped));
    return out;
  };

  // the grant coat (Gonzaga of Mantua, 1433: argent, a cross gules between four
  // imperial eagles sable): a field and a cross that contrast with the liege's
  // charge, which is borne four times between the arms of the cross
  const grant: Arms | null = (() => {
    if (a.deed !== "service" || !liegeArms || doms.length || claimArms) return null;
    const lc = realmMainCharge(liegeArms);
    if (!lc) return null;
    const metal = isMetal(lc.t);
    const field: Tincture = metal ? (lc.t === "or" ? "azure" : "gules") : "argent";
    const cross: Tincture = metal ? (lc.t === "or" ? "argent" : "or") : lc.t === "gules" ? "azure" : "gules";
    return { field: plain(field), ordinary: { kind: "cross", t: cross }, charges: [{ at: "between", charge: { ...clone(lc), count: 1, breast: undefined } }], granted: { id: a.liege } };
  })();

  const build = (F: Tincture, C: Tincture): Candidate[] => {
    const Fx: Tincture = F === "ermine" ? "argent" : F;
    const A = mainId ? mk(mainId, C) : faithAlone ? mk(faith!, C) : undefined;
    const B = secondId ? mk(secondId, C) : undefined;
    const out: Candidate[] = [];
    const grants: { base: Base; v: Variant; weight: number }[] = [];
    let impaledLeft = 2;
    for (const base of templates(F, C, third, A, B, seed, capo, parseGeom(a.geom))) {
      const variants: Variant[] = [];
      const dropped: Msg[] = [];
      if (A && !base.uses.has("A")) dropped.push(m("drop.charge", { a: { charge: A.id } }));
      if (B && !base.uses.has("B")) dropped.push(m("drop.charge", { a: { charge: B.id } }));
      const arms = clone(base.arms);
      const label = [...base.label];
      const before = { arms: clone(arms), label: [...label], dropped: [...dropped] };

      // deed: augmentation canton, or the deed's charge as a third charge
      if (a.deed === "service") {
        const lc = liegeArms && realmMainCharge(liegeArms);
        if (!lc || !liegeArms) dropped.push(m("drop.augmentationNoLiege"));
        else {
          const [LF] = realmPalette(liegeArms);
          if (arms.canton || arms.chief || arms.charges.some((p) => p.at === "dexter_chief" || p.at === "between") || !contrasts(LF, firstTincture(arms.field)) || arms.field.kind !== "plain") {
            dropped.push(m("drop.augmentation"));
          } else {
            arms.canton = { t: LF, charge: { ...lc, count: 1 }, of: { id: a.liege } };
            for (const p of arms.charges) if (p.at === "center") p.charge.count = 1;
            label.push(m("place.augmentation", { r: { realm: a.liege } }));
          }
        }
      }
      if (tertiary) {
        if (arms.ordinary && !arms.ordinary.on && ["fess", "chevron", "bend", "cross", "saltire"].includes(arms.ordinary.kind) && (!arms.ordinary.line || arms.ordinary.line === "engrailed") && arms.field.kind === "plain") {
          arms.ordinary.on = mk(tertiary, Fx);
          label.push(m("place.onOrdinary", { a: { charge: tertiary } }));
        } else if (!arms.chief && !arms.canton && arms.field.kind === "plain" && arms.charges.length > 0 && arms.charges.every((p) => p.at === "center")) {
          arms.chief = { t: C, charges: [0, 1, 2].map(() => mk(tertiary, Fx)) };
          label.push(m("place.chiefOf", { a: { charge: tertiary } }));
        } else if (!arms.chief && !arms.canton && arms.field.kind === "plain" && !arms.charges.some((p) => p.at === "between" || p.at === "dexter_chief")) {
          arms.canton = { t: C, charge: mk(tertiary, Fx) };
          label.push(m("place.canton", { a: { charge: tertiary } }));
        } else dropped.push(m("drop.charge", { a: { charge: tertiary } }));
      }

      // faith symbol
      if (addedFaith) {
        const where = placeSingle(arms, addedFaith, Fx, C);
        if (where) label.push(m(`place.${where}`, { a: { charge: addedFaith } }));
        else dropped.push(m("drop.charge", { a: { charge: addedFaith } }));
      }

      // held titles (and any claim with them) are marshalled; a claim alone goes
      // on the breast, over all, or quarterly
      if (doms.length) variants.push(...marshal(arms, label, dropped));
      else if (claimArms) {
        const escSafe = escutcheonSafe(claimArms);
        const esc: Escutcheon = { kind: "escutcheon", arms: clone(claimArms), of: { id: a.claim } };
        const eagle = mainEagle(arms);
        if (eagle && escSafe) {
          if (!eagle.charge.breast) {
            const v = clone(arms);
            mainEagle(v)!.charge.breast = clone(esc);
            variants.push({ arms: v, label: [...label, m("place.claimBreast", { r: { realm: a.claim } })], dropped });
          } else if (addedFaith) {
            // the breast holds the faith symbol: offer moving it elsewhere
            const v = clone(arms);
            mainEagle(v)!.charge.breast = clone(esc);
            const where = placeSingle(v, addedFaith, Fx, C, { breast: false });
            const l = label.filter((x) => x.key !== "place.breast");
            variants.push({
              arms: v,
              label: [...l, m("place.claimBreast", { r: { realm: a.claim } }), ...(where ? [m(`place.${where}`, { a: { charge: addedFaith } })] : [])],
              dropped: where ? dropped : [...dropped, m("drop.charge", { a: { charge: addedFaith } })],
            });
          }
        }
        if (centreFree(arms) && !arms.quarterly && escSafe) {
          variants.push({ arms: { ...clone(arms), overall: clone(esc) }, label: [...label, m("place.claimOverall", { r: { realm: a.claim } })], dropped });
        }
        variants.push({
          arms: { field: arms.field, charges: [], quarterly: { q: [clone(arms), clone(claimArms), clone(claimArms), clone(arms)], of: [null, { id: a.claim }, { id: a.claim }, null] } },
          label: [...label, m("place.claimQuarterly", { r: { realm: a.claim } })],
          dropped,
        });
        // the kingdom claimed on the dexter, as Louis II of Anjou and Hugues de Lusignan bore Jerusalem (Gelre 310, 1482)
        if (opens("impalement", a)) variants.push(impale({ arms: claimArms, of: a.claim }, { arms, of: null }, [...label, m("place.claimImpaled", { r: { realm: a.claim } })], dropped));
      } else variants.push({ arms, label, dropped });

      // cadency: never on top of something else
      for (const v of variants) {
        if (a.cadency === "none") continue;
        if (a.cadency !== "baton" && crowdedTop(v.arms)) {
          v.dropped = [...v.dropped, m("drop.cadency", { b: a.cadency })];
          continue;
        }
        const top = v.arms.quarterly ? null : v.arms.field.kind === "plain" ? v.arms.field.t : null;
        v.arms.brisure = { kind: a.cadency, t: contrasting(top, [F, C], third) };
      }
      // a grant: the liege gives a new coat made from his own charge, the family arms en surtout
      if (grant) {
        const fam = before.arms;
        const lbl = [...before.label, m("place.grant", { r: { realm: a.liege } })];
        const drp = [...before.dropped];
        if (addedFaith) {
          const where = placeSingle(fam, addedFaith, Fx, C);
          if (where) lbl.push(m(`place.${where}`, { a: { charge: addedFaith } }));
          else drp.push(m("drop.charge", { a: { charge: addedFaith } }));
        }
        // a chief of the same liege inside his own grant would say it twice
        if (escutcheonSafe(fam) && !fam.chief?.of && !fam.canton?.of) {
          const v: Variant = { arms: { ...clone(grant), overall: { kind: "escutcheon", arms: fam, own: true } }, label: lbl, dropped: drp };
          if (a.cadency !== "none" && a.cadency !== "baton") v.dropped = [...v.dropped, m("drop.cadency", { b: a.cadency })];
          else if (a.cadency === "baton") v.arms.brisure = { kind: "baton", t: contrasting(firstTincture(grant.field), [F, C], third) };
          grants.push({ base, v, weight: busy(fam) });
        }
      }
      // impaled coats only for the first two layouts that have one: on every layout they would
      // crowd the others out of the list
      const kept = variants.filter((v) => !v.impaled || impaledLeft-- > 0);
      kept.forEach((v, i) =>
        out.push({ id: `${base.id}#${i}`, name: layoutName(base, v.arms), label: v.label, arms: v.arms, dropped: v.dropped, style: base.style }),
      );
    }
    // two grants are enough (they differ only in the small shield): those with the simplest family arms
    grants
      .map((g, i) => ({ ...g, i }))
      .sort((x, y) => x.weight - y.weight || x.i - y.i)
      .slice(0, 2)
      .forEach(({ base, v }) => out.push({ id: `${base.id}#g`, name: layoutName(base, v.arms), label: v.label, arms: v.arms, dropped: v.dropped, style: base.style }));
    return out;
  };

  // an augmentation canton must stand out from the field: counter the liege's colours if needed
  if (a.deed === "service" && liegeArms && !contrasts(realmPalette(liegeArms)[0], F)) [F, C] = [C, F];
  let candidates = build(F, C);

  // arms that copy a realm's (in any period) are kept: the player may be that very house
  // or realm, or bear its arms before it took them up. But it is said, right by the arms.
  for (const c of candidates) {
    const t = borneArms().find((b) => b.sig === signature(c.arms));
    if (t) c.warnings = [m(t.p.to === undefined ? "warn.realmArms" : "warn.realmArmsUntil", { r: { realm: t.id }, y: t.p.from, z: t.p.to ?? 0 })];
  }

  // drop anything illegal (should never happen; tests enforce it), and duplicates; a pair against
  // the rule of tincture is the player's own choice (armes à enquérir), so its arms stay
  const legalPalette = contrasts(C, F);
  const seen = new Set<string>();
  candidates = candidates.filter((c) => {
    const sig = signature(c.arms);
    // with the rules switched off, arms that break the rule of tincture stay
    if (seen.has(sig) || (legalPalette && checkArms(c.arms).some((i) => i.level === "error"))) return false;
    seen.add(sig);
    return true;
  });

  // order: fewest dropped wishes, then the preferred style, then template order
  const styleRank = (c: Candidate) => (a.style === "auto" || c.style === a.style ? 0 : 1);
  candidates = candidates
    .map((c, i) => ({ c, i }))
    .sort((x, y) => x.c.dropped.length - y.c.dropped.length || styleRank(x.c) - styleRank(y.c) || x.i - y.i)
    .map((x) => x.c)
    .slice(0, 16);

  // keep the layout the player chose: the same candidate, else the same base layout
  // ("chief"), else the same kind ("between-*"), else the first
  const base = (id: string) => id.split("#")[0];
  const kind = (id: string) => id.split(/[-#]/)[0];
  const chosen =
    candidates.find((c) => c.id === a.layout) ??
    candidates.find((c) => a.layout && base(c.id) === base(a.layout)) ??
    candidates.find((c) => a.layout && kind(c.id) === kind(a.layout)) ??
    candidates[0];
  notesFor(a, notes, { liegeArms, claimArms, F, chosen });
  const rows = chosen
    ? legend(a, chosen.arms, { main: mainId, mainFromLiege: a.emblem === "liege", second: secondId, secondIsDeed: !originId && !!deedCharge, tertiary, faith, F, C, third })
    : [];
  if (doms.length) {
    for (const d of doms) {
      const r = realmAt(d.id, a.year, a.free);
      if ("key" in r && d.id !== a.claim && d.id !== a.liege) note("history", r.key, { r: { realm: d.id } });
    }
    note("heraldry", sovereign ? "note.dominionSovereign" : "note.dominionLord");
    if (chosen?.arms.charges.some((p) => p.charge.breast && "own" in p.charge.breast)) note("history", "note.imperialBreast");
  }
  if (rank !== "none") note("ck3", `note.rankFrame.${rank}`);
  return { candidates, notes, chosen, legend: rows };
}

function notesFor(a: Answers, notes: Note[], ctx: { liegeArms: Arms | null; claimArms: Arms | null; F: Tincture; chosen: Candidate | undefined }) {
  const note = (kind: Note["kind"], key: string, p?: Record<string, Param>) => notes.push({ kind, msg: m(key, p) });
  // charges with a story: where they come from (history), or how they are built or named (heraldry)
  const special: Record<string, Note["kind"]> = {
    double_eagle: "history", maiden_eagle: "history", chi_rho: "history", lion_st_mark: "history", jerusalem: "history", escallop: "history", fleur: "history",
    lion_axe: "history", lion_forked_crowned: "history", lion_sword_sabre: "history", lion_manuscript: "history", lion_passant_guardant: "history",
    eagle: "history", eagle_crowned: "history", griffin: "history", castle: "history", chalice: "history", crown: "history", keys_crossed: "history",
    dolphin: "history", bear: "history", cross_patriarchal_mount: "history",
    roundel: "heraldry", martlet: "heraldry", lion_sword: "heraldry",
  };
  for (const id of new Set([a.emblem, a.origin, a.faith])) if (special[id]) note(special[id], `note.charge.${id}`);
  if (a.deed === "crusade") note("history", "note.crusade");
  if (a.deed === "pilgrimage_santiago") note("history", "note.pilgrimageSantiago");
  if (a.deed === "pilgrimage_rome") note("history", "note.pilgrimageRome");
  if (a.deed === "pilgrimage_jerusalem") note("history", "note.pilgrimageJerusalem");
  if (a.deed.startsWith("pilgrimage")) note("heraldry", "note.pilgrimageFaith");
  if (ctx.claimArms) {
    const r = realmAt(a.claim, a.year, a.free);
    if ("key" in r) note("history", r.key, { r: { realm: a.claim } });
    note("heraldry", "note.pretension");
    if (ctx.claimArms.exempt) note("heraldry", "note.exempt", { r: { realm: a.claim } });
  }
  if (ctx.liegeArms) {
    const r = realmAt(a.liege, a.year, a.free);
    if ("key" in r && a.claim !== a.liege) note("history", r.key, { r: { realm: a.liege } });
  }
  const arms = ctx.chosen?.arms;
  const q1 = arms?.quarterly?.q[0] ?? arms;
  if (q1?.chief?.of) note("heraldry", "note.capo", { r: { realm: a.liege } });
  if (q1?.canton?.of) note("heraldry", "note.augmentation", { r: { realm: a.liege } });
  if (arms?.quarterly && arms.quarterly.q.length > 4) note("heraldry", `note.quarterly${arms.quarterly.q.length}`);
  if (arms?.quarterly && isImpaled(arms.quarterly)) note("heraldry", "note.impaled");
  // arms that break the rule of tincture: the player's own (with the rules off, or a detail
  // colour), else a realm's borne as it is; English and French heralds have names for them
  if (arms) {
    const own = checkArms(arms)[0];
    if (own) note("heraldry", "note.armesFausses", { top: own.p.top, under: own.p.under });
    else {
      // realm references are the only objects with nothing but an id (quarterly.of is a list of them)
      const realms = [...new Set([...JSON.stringify(arms).matchAll(/\{"id":"(\w+)"\}/g)].map((x) => x[1]))];
      for (const id of realms) {
        const r = realmAt(id, a.year, a.free);
        const breach = "arms" in r ? checkArms(unmarked(r.arms))[0] : undefined;
        if (breach) {
          note("heraldry", id === "jerusalem" ? "note.armesAEnquerirJerusalem" : "note.armesAEnquerir", { r: { realm: id }, top: breach.p.top, under: breach.p.under });
          break;
        }
      }
    }
  }
  if (arms?.granted) note("heraldry", "note.grant", { r: { realm: a.liege } });
  if (a.cadency !== "none") note("heraldry", a.cadency === "baton" ? "note.baton" : a.cadency === "label" ? "note.label" : "note.cadencyMarks");
  if (ctx.F === "ermine") note("heraldry", "note.ermine");
}
