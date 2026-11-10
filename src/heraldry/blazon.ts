// Arms -> blazon: the formal English heraldic description. This is a technical
// output (like the CK3 code), not UI text, so it is not translated; the plain
// description in the user's language is in describe.ts.

import { CHARGES } from "../charges.ts";
import type { Arms, Charge, Division, OrdinaryKind, Placed } from "./ast.ts";
import { isEscutcheon } from "./ast.ts";
import { groupQuarters } from "./rules.ts";
import { TINCTURE, type Tincture } from "./tincture.ts";
import { BETWEEN, ON } from "../layout.ts";

const ROUNDEL: Partial<Record<Tincture, [string, string]>> = {
  or: ["bezant", "bezants"],
  argent: ["plate", "plates"],
  gules: ["torteau", "torteaux"],
  azure: ["hurt", "hurts"],
  sable: ["pellet", "pellets"],
  vert: ["pomme", "pommes"],
  purpure: ["golpe", "golpes"],
};
const NUM = ["", "a", "two", "three", "four", "five", "six"];
const article = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");
const tw = (t: Tincture) => TINCTURE[t].en;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** English realm names as used in blazon ("a chief of the Empire") */
const REALM_EN: Record<string, string> = {
  france: "France", england: "England", scotland: "Scotland", brittany: "Brittany", flanders: "Flanders", holland: "Holland",
  castile: "Castile", leon: "León", aragon: "Aragon", sicily: "Sicily", papacy: "the Church", venice: "Venice", genoa: "Genoa",
  jerusalem: "Jerusalem", byzantium: "the Palaiologoi", hre: "the Empire", austria: "Austria", bavaria: "Bavaria", bohemia: "Bohemia",
  hungary: "Hungary", poland: "Poland", denmark: "Denmark", norway: "Norway", sweden: "Sweden", serbia: "Serbia",
  normandy: "Normandy", aquitaine: "Aquitaine", brabant: "Brabant", luxembourg: "Luxembourg", galicia: "Galicia", savoy: "Savoy",
  montferrat: "Montferrat", cyprus: "Cyprus", palatinate: "the Palatinate", tyrol: "Tyrol", brandenburg: "Brandenburg", silesia: "Silesia",
  pomerania: "Pomerania", portugal: "Portugal", bulgaria: "Bulgaria",
};
export const realmEn = (id: string) => REALM_EN[id] ?? id;

const ARMED_WORD: Record<string, string> = { stag: "attired", bull: "horned", sword: "hilted", swords_crossed: "hilted", axe: "hafted", crown: "jewelled", sexfoil: "seeded" };

/** "a lion rampant Or" / "three bezants"; `withT` = false leaves the tincture to be said later */
function chargeEn(c: Charge, n: number = c.count ?? 1, withT = true): string {
  const def = CHARGES[c.id];
  let s: string;
  if (c.id === "roundel" && ROUNDEL[c.t]) {
    const [one, many] = ROUNDEL[c.t]!;
    s = n === 1 ? `${article(one)} ${one}` : `${NUM[n]} ${many}`;
    if (n === 3 && c.count === 3 && c.arr) s += ` in ${c.arr}`;
  } else {
    const word = n === 1 ? def.en[0] : def.en[1];
    s = n === 1 ? (/^(two|three|four|five|six) /.test(word) ? word : `${article(word)} ${word}`) : `${NUM[n]} ${word}`;
    if (n === 2 && c.count === 2) s += " in pale";
    if (n === 3 && c.count === 3 && c.arr) s += ` in ${c.arr}`;
    if (withT) s += ` ${tw(c.t)}`;
    if (c.id === "keys_crossed" && c.second && withT) s += ` and ${tw(c.second)}`;
  }
  const attrs: string[] = [];
  if (c.crined && c.crined === c.crowned) attrs.push(`crined and crowned ${tw(c.crowned)}`);
  else {
    if (c.crined) attrs.push(`crined ${tw(c.crined)}`);
    if (c.crowned) attrs.push(`crowned ${tw(c.crowned)}`);
  }
  if (c.armed) attrs.push(`${ARMED_WORD[c.id] ?? "armed"} ${tw(c.armed)}`);
  if (c.nimbed) attrs.push(`nimbed ${tw(c.nimbed)}`);
  if (c.second && c.id === "lion_axe") attrs.push(`the axe ${tw(c.second)}`);
  if (c.second && c.id === "lion_sword") attrs.push(`the sword ${tw(c.second)}`);
  if (c.second && c.id === "lion_sword_sabre") attrs.push(`the sword and sabre ${tw(c.second)}`);
  if (c.second && c.id === "lion_st_mark") attrs.push(`holding a book ${tw(c.second)}`);
  if (c.second && c.id === "quinas") attrs.push(`each charged with five ${ROUNDEL[c.second]?.[1] ?? `roundels ${tw(c.second)}`} in saltire`);
  if (c.detail) attrs.push(`ported and windowed ${tw(c.detail)}`);
  if (attrs.length) s += ", " + attrs.join(" and ");
  if (c.breast) {
    s += isEscutcheon(c.breast)
      ? `, bearing on its breast an escutcheon${c.breast.of ? ` of ${realmEn(c.breast.of.id)}` : c.breast.own ? " of the family arms" : ""} (${blazon(c.breast.arms)})`
      : `, on its breast ${chargeEn(c.breast)}`;
  }
  return s;
}

const DIVISION: Record<Division, string> = {
  per_pale: "Per pale", per_fess: "Per fess", per_bend: "Per bend", per_bend_sinister: "Per bend sinister", per_saltire: "Per saltire",
  quarterly: "Quarterly", gyronny: "Gyronny of eight", barry: "Barry of six", barry8: "Barry of eight", paly: "Paly of six",
  bendy: "Bendy of six", chequy: "Chequy", lozengy: "Lozengy", lozengy_bend: "Lozengy in bend",
  barry10: "Barry of ten", barry_indented: "Barry indented", vairy: "Vairy", fretty: "Fretty",
};
const ORDINARY: Record<OrdinaryKind, string> = {
  fess: "a fess", pale: "a pale", bend: "a bend", bend_sinister: "a bend sinister", chevron: "a chevron", saltire: "a saltire",
  cross: "a cross", pile: "a pile", orle: "an orle", tressure: "a double tressure flory counter-flory", pallets: "four pallets",
  bars: "two bars", chevronels: "three chevronels", pall: "a pall",
};
/** "a cross engrailed": the line follows the ordinary's name */
const ordEn = (o: { kind: OrdinaryKind; line?: string }) => ORDINARY[o.kind] + (o.line ? ` ${o.line}` : "");

function fieldEn(arms: Arms): string {
  const f = arms.field;
  if (f.kind === "plain") return cap(tw(f.t));
  if (f.kind === "semy") {
    // the rolls' own words: crusilly, billetty, bezanty and platy
    const c = f.charge, field = cap(tw(f.t));
    if (c.id === "fleur") return `${field}, semé-de-lis ${tw(c.t)}`;
    if (c.id === "cross_crosslet") return `${field} crusilly ${tw(c.t)}`;
    if (c.id === "billet") return `${field} billetty ${tw(c.t)}`;
    if (c.id === "roundel" && c.t === "or") return `${field} bezanty`;
    if (c.id === "roundel" && c.t === "argent") return `${field} platy`;
    if (c.id === "roundel" && ROUNDEL[c.t]) return `${field}, semé of ${ROUNDEL[c.t]![1]}`;
    return `${field}, semé of ${CHARGES[c.id].en[1]} ${tw(c.t)}`;
  }
  // the furs: "Vair" is argent and azure; a fretty field names its own tincture first
  if (f.kind === "vairy" && f.t[0] === "argent" && f.t[1] === "azure") return "Vair";
  if (f.kind === "fretty") return `${cap(tw(f.t[0]))} fretty ${tw(f.t[1])}`;
  return `${DIVISION[f.kind]}${f.line ? " " + f.line : ""} ${tw(f.t[0])} and ${tw(f.t[1])}`;
}

function chiefList(cs: Charge[]): string {
  if (cs.length === 3) {
    const [a, b, c] = cs;
    if (a.id === b.id && b.id === c.id && a.t === b.t && b.t === c.t) return chargeEn(a, 3);
    if (a.id === c.id && a.t === c.t) {
      const same = a.t === b.t && a.id !== "roundel";
      return `${same ? chargeEn(b, 1, false) : chargeEn(b)} between ${chargeEn(a, 2, !same)}${same ? " " + tw(a.t) : ""}`;
    }
  }
  return cs.map((c) => chargeEn(c)).join(" and ");
}

const spot = (arms: Arms, s: Placed["at"]) => arms.charges.find((p) => p.at === s)?.charge;

export function blazon(arms: Arms): string {
  const tail: string[] = [];
  const b = arms.brisure;
  if (b) {
    if (b.kind === "label") tail.push(`a label of three points ${tw(b.t)}`);
    else if (b.kind === "baton") tail.push(`over all a baton sinister ${tw(b.t)}`);
    else tail.push(`in chief ${chargeEn({ id: b.kind, t: b.t })} for difference`);
  }
  if (arms.overall) tail.push(`over all an escutcheon${arms.overall.of ? ` of ${realmEn(arms.overall.of.id)}` : arms.overall.own ? " of the family arms" : ""} (${blazon(arms.overall.arms)})`);
  if (arms.quarterly) {
    const parts = groupQuarters(arms).map((g) => `${g.n.join(" and ")}, ${blazon(g.arms)}${g.of ? ` (for ${realmEn(g.of.id)})` : ""}`);
    return [`Quarterly: ${parts.join("; ")}`, ...tail].join("; ");
  }
  const main: string[] = [];
  const o = arms.ordinary;
  const ringed = o && (o.kind === "orle" || o.kind === "tressure");
  const between = spot(arms, "between");
  if (o && !ringed) {
    let s = o.on ? `on ${ordEn(o)} ${tw(o.t)} ${chargeEn(o.on, ON[o.kind]?.length ?? 3)}` : `${ordEn(o)} ${tw(o.t)}`;
    if (between) s += ` between ${chargeEn(between, BETWEEN[o.kind]?.length ?? 3)}`;
    main.push(s);
  }
  const c = spot(arms, "center");
  if (c) main.push(ringed ? `${chargeEn(c)} within ${ORDINARY[o!.kind]} ${tw(o!.t)}` : chargeEn(c));
  else if (ringed) main.push(`${ORDINARY[o!.kind]} ${tw(o!.t)}`);
  const hi = spot(arms, "high"), ba = spot(arms, "base");
  if (hi) main.push(chargeEn(hi));
  if (ba) main.push(`in base ${chargeEn(ba)}`);
  const dx = spot(arms, "dexter"), sn = spot(arms, "sinister");
  if (dx) main.push(`dexter ${chargeEn(dx)}`);
  if (sn) main.push(`sinister ${chargeEn(sn)}`);
  const ch = spot(arms, "chief_half"), bh = spot(arms, "base_half");
  if (ch) main.push(`in chief ${chargeEn(ch)}`);
  if (bh) main.push(`in base ${chargeEn(bh)}`);
  const dc = spot(arms, "dexter_chief");
  if (dc) main.push(`in dexter chief ${chargeEn(dc)}`);

  const parts = [fieldEn(arms) + (main.length ? ", " + main.join(", ") : "")];
  if (arms.canton) {
    const k = arms.canton;
    parts.push(
      k.of
        ? `a canton of ${realmEn(k.of.id)} (${cap(tw(k.t))}${k.charge ? ", " + chargeEn(k.charge) : ""})`
        : k.charge
          ? `on a canton ${tw(k.t)} ${chargeEn(k.charge)}`
          : `a canton ${tw(k.t)}`,
    );
  }
  if (arms.chief) {
    const k = arms.chief;
    parts.push(
      k.of
        ? `a chief of ${realmEn(k.of.id)} (${cap(tw(k.t))}, ${chiefList(k.charges)})`
        : k.charges.length
          ? `on a chief${k.line ? " " + k.line : ""} ${tw(k.t)} ${chiefList(k.charges)}`
          : `a chief${k.line ? " " + k.line : ""} ${tw(k.t)}`,
    );
  }
  return [...parts, ...tail].join("; ");
}
