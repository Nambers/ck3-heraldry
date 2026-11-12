// What each element of the chosen arms stands for, and which kind of answer it
// came from — the table under the result. Built by reading the arms back, so
// it only lists what is actually on the shield.

import type { Arms, Charge, ChargeId, OrdinaryKind } from "../heraldry/ast.ts";
import { firstTincture, isEscutcheon } from "../heraldry/ast.ts";
import type { Tincture } from "../heraldry/tincture.ts";
import { parseGeom, type Answers } from "./answers.ts";
import { DIMINISHES } from "./questions.ts";
import type { Cat, LegendRow, Msg, Param } from "../designer/types.ts";

// life: liege, titles, claims, deeds, place in the family; choice: symbols the
// player picks; taste: looks only; auto: decided by the generator (e.g. the
// ordinary, from the family name). See Cat in src/designer/types.ts.
export type { Cat, LegendRow } from "../designer/types.ts";

/** where the family's charges came from (set by generate()) */
export interface Sources {
  main?: ChargeId;
  mainFromLiege: boolean;
  second?: ChargeId;
  /** the second charge is the deed's charge (no origin was given) */
  secondIsDeed: boolean;
  tertiary?: ChargeId;
  faith?: ChargeId;
  F: Tincture;
  C: Tincture;
  /** the player's third tincture, when it applies (see thirdOf) */
  third?: Tincture;
}

const m = (key: string, p?: Record<string, Param>): Msg => ({ key, p });

export function legend(a: Answers, arms: Arms, s: Sources): LegendRow[] {
  const rows: LegendRow[] = [];
  const seen = new Set<string>();
  const add = (cat: Cat, what: Msg, means: Msg) => {
    const k = JSON.stringify([what, means]);
    if (!seen.has(k)) {
      seen.add(k);
      rows.push({ cat, what, means });
    }
  };
  // geometry is the generator's, from the family name, unless the player chose it (Answers.geom)
  const geom = parseGeom(a.geom);
  const geometry = (chosen: boolean): [Cat, Msg] => (chosen ? ["taste", m("legend.means.geometryChosen")] : ["auto", m("legend.means.geometry")]);
  const realm = (id: string) => {
    const what = m("legend.what.realm", { r: { realm: id } });
    if (a.titles.includes(id)) add("life", what, m("legend.means.dominion", { r: { realm: id } }));
    else if (id === a.claim) add("life", what, m("legend.means.claim", { r: { realm: id } }));
  };

  // find the family's own arms, and the realms' arms around them
  const fams: Arms[] = [];
  if (arms.granted) {
    const c = arms.charges[0]?.charge;
    add("life", m("legend.what.grant", { o: { ord: arms.ordinary!.kind }, a: { charge: c.id } }), m("legend.means.grant", { r: { realm: arms.granted.id } }));
  } else if (arms.of) {
    if (arms.charges.some((p) => p.charge.breast && isEscutcheon(p.charge.breast) && p.charge.breast.own)) {
      add("life", m("legend.what.imperial"), m("legend.means.imperial", { r: { realm: arms.of.id } }));
    } else realm(arms.of.id);
  } else if (arms.quarterly) {
    arms.quarterly.q.forEach((q, i) => {
      const of = arms.quarterly!.of?.[i];
      if (of) realm(of.id);
      else fams.push(q);
    });
  } else fams.push(arms);
  for (const p of arms.charges) {
    if (p.charge.breast && isEscutcheon(p.charge.breast) && p.charge.breast.own) {
      fams.push(p.charge.breast.arms);
      add("life", m("legend.what.ownBreast"), m("legend.means.ownEsc"));
    }
  }
  if (arms.overall?.own) {
    fams.push(arms.overall.arms);
    add("life", m("legend.what.ownEsc"), m(arms.granted ? "legend.means.ownEscGrant" : "legend.means.ownEsc"));
  }


  const charge = (c: Charge) => {
    const what = m("legend.what.charge", { a: { charge: c.id }, t: { t: c.t } });
    if (c.id === s.main) add(s.mainFromLiege ? "life" : "choice", what, s.mainFromLiege ? m("legend.means.emblemLiege", { r: { realm: a.liege } }) : m("legend.means.emblem"));
    else if (c.id === s.second && !s.secondIsDeed) add("choice", what, m("legend.means.origin"));
    else if (c.id === s.second || c.id === s.tertiary) add("life", what, m(`legend.means.${a.deed}`));
    else if (c.id === s.faith) add("choice", what, m("legend.means.faith"));
    if (c.breast && !isEscutcheon(c.breast)) charge(c.breast);
    if (c.breast && isEscutcheon(c.breast) && c.breast.of && !c.breast.own) realm(c.breast.of.id);
  };

  // in order of weight: the charges, the ordinary, chief and canton, the field
  for (const f of fams) {
    for (const p of f.charges) charge(p.charge);
    const fl = f.field;
    if (fl.kind === "semy") {
      // powdered with a wished charge, or with one the family name (or the player's taste) picked
      const id = fl.charge.id;
      if ([s.main, s.second, s.tertiary, s.faith].includes(id)) charge(fl.charge);
      else {
        const [cat, means] = geometry(geom.semy === id);
        add(cat, m("legend.what.div", { d: { div: `semy_${id}` } }), means);
      }
    }
    if (f.ordinary) {
      const k = f.ordinary.kind;
      // a chosen diminutive becomes the ordinary it diminishes when there are charges
      const [cat, means] = geometry(geom.ord === k || DIMINISHES[geom.ord as OrdinaryKind] === k);
      add(cat, m("legend.what.ord", { o: { ord: k } }), means);
      if (f.ordinary.on) charge(f.ordinary.on);
    }
    if (f.chief?.of) add("life", m("legend.what.capo", { r: { realm: f.chief.of.id } }), m("legend.means.capo", { r: { realm: f.chief.of.id } }));
    else if (f.chief) {
      add("auto", m("legend.what.chief"), m("legend.means.geometry"));
      f.chief.charges.forEach(charge);
    }
    if (f.canton?.of) add("life", m("legend.what.augmentation", { r: { realm: f.canton.of.id } }), m("legend.means.augmentation", { r: { realm: f.canton.of.id } }));
    else if (f.canton) {
      add("auto", m("legend.what.canton"), m("legend.means.geometry"));
      if (f.canton.charge) charge(f.canton.charge);
    }
    if (fl.kind !== "plain" && fl.kind !== "semy") {
      const [cat, means] = geometry([geom.div, geom.var, geom.fur].includes(fl.kind));
      add(cat, m("legend.what.div", { d: { div: fl.kind } }), means);
    }
    if (f.overall?.of) realm(f.overall.of.id);
  }
  if (fams.length) {
    const liegeColours = a.palette === "liege" && a.liege !== "none";
    add(
      liegeColours ? "life" : "taste",
      m("legend.what.colours", { f: { t: s.F }, c: { t: s.C } }),
      liegeColours ? m("legend.means.coloursLiege", { r: { realm: a.liege } }) : m("legend.means.colours"),
    );
    // the player's third tincture, where it is a field of its own (the cadency mark says its colour itself)
    const x = s.third;
    const esc = (f: Arms) => (f.overall && !f.overall.own && !f.overall.of ? f.overall.arms.field : null);
    const bears = (f: Arms) =>
      (!f.chief?.of && f.chief?.t === x) || (!f.canton?.of && f.canton?.t === x) || f.ordinary?.t === x || (esc(f)?.kind === "plain" && firstTincture(esc(f)!) === x);
    if (x && fams.some(bears)) add("taste", m("legend.what.third", { t: { t: x } }), m("legend.means.colours"));
  }

  // the cadency mark, wherever it sits
  const b = arms.brisure ?? fams.find((f) => f.brisure)?.brisure;
  if (b) add("life", m(`legend.what.brisure.${b.kind}`, { t: { t: b.t } }), m(`legend.means.cadency.${b.kind}`));
  return rows;
}
