// Localized text: plain-language descriptions of arms, and formatting of the
// generator's messages. All words come from the i18n catalogs; only the small
// grammar differences between languages live here.

import type { Arms, Charge } from "./heraldry/ast.ts";
import { isEscutcheon } from "./heraldry/ast.ts";
import { groupQuarters } from "./heraldry/rules.ts";
import type { Tincture } from "./heraldry/tincture.ts";
import { has, locale, t } from "./i18n/index.ts";
import { BETWEEN, ON } from "./layout.ts";
import type { Msg, Param } from "./designer/types.ts";

const tadj = (x: Tincture) => t(`tadj.${x}`);
export const chargeName = (id: string, n = 1) => (n === 1 || locale() === "zh-CN" ? t(`charge.${id}.n`) : t(`charge.${id}.p`));
export const realmName = (id: string) => t(`realm.${id}.name`);

/** "三头红色立狮" / "three red lions rampant" */
function chargePhrase(c: Charge, n: number = c.count ?? 1): string {
  const id = c.id;
  let s: string;
  if (locale() === "zh-CN") {
    s = t("desc.chargeN", { num: t(`num.${n}`), m: t(`charge.${id}.m`), t: tadj(c.t), name: chargeName(id) });
  } else {
    const name = chargeName(id, n);
    const body = `${tadj(c.t)} ${name}`;
    s = n === 1 ? `${/^[aeiou]/i.test(body) ? "an" : "a"} ${body}` : `${t(`num.${n}`)} ${body}`;
  }
  const attrs: string[] = [];
  if (id === "keys_crossed" && c.second) attrs.push(t("desc.attr.keys", { a: tadj(c.t), b: tadj(c.second) }));
  if (c.crined) attrs.push(t("desc.attr.crined", { t: tadj(c.crined) }));
  if (c.crowned) attrs.push(t("desc.attr.crowned", { t: tadj(c.crowned) }));
  if (c.armed) attrs.push(t("desc.attr.armed", { t: tadj(c.armed) }));
  if (c.nimbed) attrs.push(t("desc.attr.nimbed", { t: tadj(c.nimbed) }));
  if (c.detail) attrs.push(t("desc.attr.detail", { t: tadj(c.detail) }));
  if (c.second && id === "lion_axe") attrs.push(t("desc.attr.axe", { t: tadj(c.second) }));
  if (c.second && id === "lion_sword") attrs.push(t("desc.attr.sword", { t: tadj(c.second) }));
  if (c.second && id === "lion_sword_sabre") attrs.push(t("desc.attr.swordSabre", { t: tadj(c.second) }));
  if (c.second && id === "lion_st_mark") attrs.push(t("desc.attr.book", { t: tadj(c.second) }));
  if (c.second && id === "quinas") attrs.push(t("desc.attr.plates", { t: tadj(c.second) }));
  if (attrs.length) s += t("desc.sep") + attrs.join(t("desc.sep"));
  if (n === (c.count ?? 1) && (n === 2 || (n === 3 && c.arr))) s += t(`desc.arr.${c.arr ?? "pale"}`);
  if (c.breast) {
    s += isEscutcheon(c.breast)
      ? t("desc.breastEsc", { of: c.breast.own ? t("desc.ofFamily") : c.breast.of ? t("desc.of", { r: realmName(c.breast.of.id) }) : "", arms: describeInner(c.breast.arms) })
      : t("desc.breast", { c: chargePhrase(c.breast) });
  }
  return s;
}

/** "弧齿边十字" / "cross engrailed" */
export const lined = (name: string, line?: string) => (line ? t("desc.lined", { o: name, line: t(`line.${line}`) }) : name);

function ordinaryPhrase(arms: Arms): string {
  const o = arms.ordinary!;
  if (o.kind === "pallets" || o.kind === "bars" || o.kind === "chevronels") return t(`desc.${o.kind}`, { t: tadj(o.t) });
  return t("desc.ordinary", { t: tadj(o.t), o: lined(t(`ord.${o.kind}`), o.line) });
}

function fieldPhrase(arms: Arms): string {
  const f = arms.field;
  if (f.kind === "plain") return f.t === "ermine" ? t("desc.field.ermine") : t("desc.field.plain", { t: t(`tinct.${f.t}`) });
  if (f.kind === "semy") {
    const c = locale() === "zh-CN" ? tadj(f.charge.t) + chargeName(f.charge.id) : `${tadj(f.charge.t)} ${chargeName(f.charge.id, 2)}`;
    return t("desc.field.semy", { t: t(`tinct.${f.t}`), c });
  }
  if (f.kind === "vairy" && f.t[0] === "argent" && f.t[1] === "azure") return t("desc.field.vair");
  if (f.kind === "fretty") return t("desc.field.fretty", { a: t(`tinct.${f.t[0]}`), b: t(`tinct.${f.t[1]}`) });
  return t("desc.field.div", { d: lined(t(`div.${f.kind}`), f.line), a: t(`tinct.${f.t[0]}`), b: t(`tinct.${f.t[1]}`) });
}

function chiefPhrase(arms: Arms): string {
  const k = arms.chief!;
  if (k.of) return t("desc.chiefOf", { r: realmName(k.of.id), arms: describeInner({ field: { kind: "plain", t: k.t }, charges: k.charges.map((c) => ({ at: "center", charge: c })) }) });
  const base = k.line ? t("desc.chiefLined", { t: tadj(k.t), line: t(`line.${k.line}`) }) : t("desc.chief", { t: tadj(k.t) });
  const cs = k.charges;
  if (!cs.length) return base;
  let c: string;
  if (cs.length === 3 && cs[0].id === cs[2].id && cs[0].id !== cs[1].id) c = t("desc.chiefBetween", { mid: chargePhrase(cs[1]), side: chargePhrase(cs[0]) });
  else if (cs.length === 3) c = chargePhrase(cs[0], 3);
  else c = cs.map((x) => chargePhrase(x)).join(t("desc.sep"));
  return t("desc.chiefWith", { chief: base, c });
}

function cantonPhrase(arms: Arms): string {
  const k = arms.canton!;
  if (k.of) return t("desc.cantonOf", { r: realmName(k.of.id), arms: describeInner({ field: { kind: "plain", t: k.t }, charges: k.charge ? [{ at: "center", charge: k.charge }] : [] }) });
  const base = t("desc.canton", { t: tadj(k.t) });
  return k.charge ? t("desc.cantonWith", { canton: base, c: chargePhrase(k.charge) }) : base;
}

function describeInner(arms: Arms): string {
  const parts: string[] = [];
  if (arms.quarterly) {
    const qs = groupQuarters(arms).map((g) =>
      t("desc.quarter", { n: g.n.map((n) => t(`desc.qnum.${n}`)).join(t("desc.qand")), arms: describeInner(g.arms), of: g.of ? t("desc.of", { r: realmName(g.of.id) }) : "" }),
    );
    parts.push(t("desc.quarterly", { parts: qs.join(t("desc.sep2")) }));
  } else {
    const main: string[] = [];
    const o = arms.ordinary;
    const ringed = o && (o.kind === "orle" || o.kind === "tressure");
    const between = arms.charges.find((p) => p.at === "between")?.charge;
    if (o && !ringed) {
      let ord = ordinaryPhrase(arms);
      if (o.on) ord = t("desc.on", { ord, c: chargePhrase(o.on, ON[o.kind]?.length ?? 3) });
      main.push(between ? t("desc.between", { ord, c: chargePhrase(between, BETWEEN[o.kind]?.length ?? 3) }) : ord);
    }
    for (const p of arms.charges) {
      if (p.at === "between") continue;
      const c = t(`desc.spot.${p.at}`, { c: chargePhrase(p.charge) });
      main.push(ringed && p.at === "center" ? t("desc.within", { c, ord: ordinaryPhrase(arms) }) : c);
    }
    if (ringed && !arms.charges.some((p) => p.at === "center")) main.push(ordinaryPhrase(arms));
    parts.push([fieldPhrase(arms), ...main].join(t("desc.sep")));
    if (arms.canton) parts.push(cantonPhrase(arms));
    if (arms.chief) parts.push(chiefPhrase(arms));
  }
  const b = arms.brisure;
  if (b) {
    if (b.kind === "label" || b.kind === "baton") parts.push(t(`desc.brisure.${b.kind}`, { t: tadj(b.t) }));
    else parts.push(t("desc.brisure.mark", { c: chargePhrase({ id: b.kind, t: b.t }) }));
  }
  if (arms.overall) parts.push(t("desc.overall", { of: arms.overall.own ? t("desc.ofFamily") : arms.overall.of ? t("desc.of", { r: realmName(arms.overall.of.id) }) : "", arms: describeInner(arms.overall.arms) }));
  return parts.join(t("desc.sep2"));
}

/** a plain-language description of the arms in the current language */
export function describe(arms: Arms): string {
  const s = describeInner(arms);
  return s.charAt(0).toUpperCase() + s.slice(1) + t("desc.end");
}

// ---------------------------------------------------------------- messages

function param(p: Param): string {
  if (typeof p === "string" || typeof p === "number") return String(p);
  if ("charge" in p) return chargeName(p.charge);
  if ("realm" in p) return realmName(p.realm);
  if ("t" in p) return t(`tinct.${p.t}`);
  if ("ord" in p) return lined(t(`ord.${p.ord}`), p.line);
  if ("div" in p) return lined(t(`div.${p.div}`), p.line);
  return "";
}

export function fmt(msg: Msg): string {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(msg.p ?? {})) params[k] = param(v);
  // unavailable periods without their own text use a generic sentence
  if (!has(msg.key) && /^realm\.\w+\.\w+$/.test(msg.key)) return t("realm._early", params);
  return t(msg.key, params);
}

/** human-readable list of placements, e.g. for a layout's label */
export const fmtList = (msgs: Msg[]) => msgs.map(fmt).join(t("desc.sep"));
