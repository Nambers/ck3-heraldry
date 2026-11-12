// Real arms of realms, by period. Used for liege colours and charges (arms of
// patronage), "chief of" and augmentation cantons, claims (arms of
// pretension) and collision checks.
//
// Dates are approximate (first well-attested use). Each period has a note key
// in the i18n catalogs: realm.<id>.<key>. Unavailable periods say why.

import { CHARGES } from "./charges.ts";
import type { Arms, Charge, Field, Ordinary } from "./heraldry/ast.ts";
import { plain } from "./heraldry/ast.ts";
import type { Tincture } from "./heraldry/tincture.ts";

export interface Period {
  from: number;
  /** exclusive */
  to?: number;
  arms?: Arms;
  /** i18n key under realm.<id>.* : a note (with arms) or the reason it is unavailable */
  key: string;
}

export interface Realm {
  id: string;
  region: "west" | "iberia" | "italy" | "central" | "north" | "east";
  periods: Period[];
}

const ch = (id: string, t: Tincture, more: Partial<Charge> = {}): Charge => ({ id, t, ...more });
const one = (field: Field | Tincture, charge: Charge, extra: Partial<Arms> = {}): Arms => ({
  field: typeof field === "string" ? plain(field) : field,
  charges: [{ at: "center", charge }],
  ...extra,
});
const ord = (t: Tincture, o: Ordinary): Arms => ({ field: plain(t), ordinary: o, charges: [] });
const before = (to: number, key = "early"): Period => ({ from: 0, to, key });

const FRANCE_ANCIENT: Arms = { field: { kind: "semy", t: "azure", charge: ch("fleur", "or") }, charges: [] };
const FRANCE_MODERN: Arms = one("azure", ch("fleur", "or", { count: 3 }));
const ENGLAND: Arms = {
  field: plain("gules"),
  charges: [{ at: "center", charge: ch("lion_passant_guardant", "or", { count: 3, arr: "pale" }) }],
};
/** England's quarters 1 and 4: the arms of France, borne as a claim */
const QF = [{ id: "france" }, null, null, { id: "france" }];
const CASTILE: Arms = one("gules", ch("castle", "or", { detail: "azure" }));
const LEON: Arms = one("argent", ch("lion_rampant", "purpure"));

const LIST: Realm[] = [
  // --- western Europe
  {
    id: "france", region: "west",
    periods: [before(1211), { from: 1211, to: 1376, arms: FRANCE_ANCIENT, key: "ancient" }, { from: 1376, arms: FRANCE_MODERN, key: "modern" }],
  },
  {
    id: "england", region: "west",
    periods: [
      before(1198),
      { from: 1198, to: 1340, arms: ENGLAND, key: "lions" },
      { from: 1340, to: 1406, arms: { field: plain("azure"), charges: [], quarterly: { q: [FRANCE_ANCIENT, ENGLAND, ENGLAND, FRANCE_ANCIENT], of: QF } }, key: "france_ancient" },
      { from: 1406, arms: { field: plain("azure"), charges: [], quarterly: { q: [FRANCE_MODERN, ENGLAND, ENGLAND, FRANCE_MODERN], of: QF } }, key: "france_modern" },
    ],
  },
  {
    id: "scotland", region: "west",
    periods: [before(1222), { from: 1222, arms: one("or", ch("lion_rampant", "gules"), { ordinary: { kind: "tressure", t: "gules" } }), key: "lion" }],
  },
  {
    id: "brittany", region: "west",
    periods: [before(1316), { from: 1316, arms: { field: plain("ermine"), charges: [] }, key: "ermine" }],
  },
  {
    id: "normandy", region: "west",
    periods: [before(1200), { from: 1200, arms: one("gules", ch("lion_passant_guardant", "or", { count: 2 })), key: "leopards" }],
  },
  {
    id: "aquitaine", region: "west",
    periods: [before(1260), { from: 1260, arms: one("gules", ch("lion_passant_guardant", "or")), key: "leopard" }],
  },
  {
    id: "brabant", region: "west",
    periods: [before(1190), { from: 1190, arms: one("sable", ch("lion_rampant", "or", { armed: "gules" })), key: "lion" }],
  },
  {
    id: "luxembourg", region: "west",
    periods: [
      before(1240),
      { from: 1240, arms: one({ kind: "barry10", t: ["argent", "azure"] }, ch("lion_forked_crowned", "gules", { crowned: "or" })), key: "lion" },
    ],
  },
  {
    id: "flanders", region: "west",
    periods: [before(1160), { from: 1160, arms: one("or", ch("lion_rampant", "sable")), key: "lion" }],
  },
  {
    id: "holland", region: "west",
    periods: [before(1198), { from: 1198, arms: one("or", ch("lion_rampant", "gules")), key: "lion" }],
  },
  // --- Iberia
  {
    id: "castile", region: "iberia",
    periods: [
      before(1170),
      { from: 1170, to: 1230, arms: CASTILE, key: "castle" },
      { from: 1230, arms: { field: plain("gules"), charges: [], quarterly: { q: [CASTILE, LEON, LEON, CASTILE], of: [null, { id: "leon" }, { id: "leon" }, null] } }, key: "leon" },
    ],
  },
  {
    id: "leon", region: "iberia",
    periods: [before(1157), { from: 1157, arms: LEON, key: "lion" }],
  },
  {
    id: "galicia", region: "iberia",
    periods: [before(1250), { from: 1250, arms: one("azure", ch("chalice", "or")), key: "chalice" }],
  },
  {
    id: "aragon", region: "iberia",
    periods: [before(1150), { from: 1150, arms: ord("or", { kind: "pallets", t: "gules" }), key: "pallets" }],
  },
  {
    // the bordure of castles (1248) and the cross of Aviz (1385–1485) wait for bordures
    id: "portugal", region: "iberia",
    periods: [before(1185), { from: 1185, to: 1248, arms: one("argent", ch("quinas", "azure", { second: "argent" })), key: "quinas" }, { from: 1248, key: "bordure" }],
  },
  // --- Italy and the Mediterranean
  {
    id: "sicily", region: "italy",
    periods: [
      before(1194, "hauteville"),
      { from: 1194, to: 1266, arms: one("argent", ch("eagle", "sable")), key: "hohenstaufen" },
      { from: 1266, to: 1282, arms: { ...FRANCE_ANCIENT, brisure: { kind: "label", t: "gules" } }, key: "anjou" },
      { from: 1282, key: "aragonese" },
    ],
  },
  {
    id: "savoy", region: "italy",
    periods: [before(1250), { from: 1250, arms: ord("gules", { kind: "cross", t: "argent" }), key: "cross" }],
  },
  {
    id: "montferrat", region: "italy",
    periods: [before(1200), { from: 1200, arms: { field: plain("argent"), chief: { t: "gules", charges: [] }, charges: [] }, key: "chief" }],
  },
  {
    id: "papacy", region: "italy",
    periods: [before(1300), { from: 1300, arms: one("gules", ch("keys_crossed", "or", { second: "argent" })), key: "keys" }],
  },
  {
    id: "venice", region: "italy",
    periods: [before(1200), { from: 1200, arms: one("azure", ch("lion_st_mark", "or", { second: "argent" })), key: "lion" }],
  },
  {
    id: "genoa", region: "italy",
    periods: [before(1190), { from: 1190, arms: ord("argent", { kind: "cross", t: "gules" }), key: "cross" }],
  },
  {
    id: "jerusalem", region: "east",
    periods: [before(1200), { from: 1200, arms: { ...one("argent", ch("jerusalem", "or")), exempt: true }, key: "cross" }],
  },
  {
    id: "cyprus", region: "east",
    periods: [
      before(1197),
      { from: 1197, arms: one({ kind: "barry8", t: ["argent", "azure"] }, ch("lion_rampant_crowned", "gules", { crowned: "or" })), key: "lusignan" },
    ],
  },
  {
    id: "byzantium", region: "east",
    periods: [before(1261, "comnenian"), { from: 1261, arms: one("gules", ch("double_eagle", "or")), key: "palaiologan" }],
  },
  // --- Empire and central Europe
  {
    id: "hre", region: "central",
    periods: [
      before(1200),
      { from: 1200, to: 1433, arms: one("or", ch("eagle", "sable", { armed: "gules" })), key: "eagle" },
      { from: 1433, arms: one("or", ch("double_eagle", "sable", { armed: "gules", nimbed: "or" })), key: "double" },
    ],
  },
  {
    id: "palatinate", region: "central",
    periods: [before(1229), { from: 1229, arms: one("sable", ch("lion_rampant_crowned", "or", { crowned: "gules" })), key: "lion" }],
  },
  {
    id: "tyrol", region: "central",
    periods: [before(1250), { from: 1250, arms: one("argent", ch("eagle_crowned", "gules", { crowned: "or" })), key: "eagle" }],
  },
  {
    id: "brandenburg", region: "central",
    periods: [before(1170), { from: 1170, arms: one("argent", ch("eagle", "gules")), key: "eagle" }],
  },
  {
    id: "silesia", region: "central",
    periods: [before(1224), { from: 1224, arms: one("or", ch("eagle", "sable", { breast: ch("crescent", "argent") })), key: "eagle" }],
  },
  {
    id: "pomerania", region: "central",
    periods: [before(1214), { from: 1214, arms: one("argent", ch("griffin", "gules")), key: "griffin" }],
  },
  {
    id: "austria", region: "central",
    periods: [before(1230), { from: 1230, arms: ord("gules", { kind: "fess", t: "argent" }), key: "fess" }],
  },
  {
    id: "bavaria", region: "central",
    periods: [before(1242), { from: 1242, arms: { field: { kind: "lozengy_bend", t: ["argent", "azure"] }, charges: [] }, key: "lozengy" }],
  },
  {
    id: "bohemia", region: "central",
    periods: [before(1250), { from: 1250, arms: one("gules", ch("lion_forked_crowned", "argent", { crowned: "or" })), key: "lion" }],
  },
  {
    id: "hungary", region: "central",
    // Coat_of_arms_of_Hungary: the double cross from Béla III (1172–1196, on his arms and coins;
    // Laszlovszky 1989, Engel 2001), the Árpád stripes from Emeric's seal of 1202. The Angevins
    // bore the stripes impaling the lilies of France, as the Gelre Armorial paints Louis I (Gelre
    // 500, first quarter: barry of eight argent and gules; azure semé-de-lis Or). The stripes
    // beside the double cross on its hills come later; not included until a cited date is found.
    periods: [
      before(1172),
      { from: 1172, to: 1202, arms: one("gules", ch("cross_patriarchal", "argent")), key: "cross" },
      { from: 1202, to: 1301, arms: { field: { kind: "barry8", t: ["gules", "argent"] }, charges: [] }, key: "barry" },
      {
        from: 1301, to: 1382, key: "anjou",
        arms: { field: { kind: "barry8", t: ["argent", "gules"] }, charges: [], quarterly: { q: [{ field: { kind: "barry8", t: ["argent", "gules"] }, charges: [] }, FRANCE_ANCIENT] } },
      },
      { from: 1382, arms: { field: { kind: "barry8", t: ["gules", "argent"] }, charges: [] }, key: "barryLater" },
    ],
  },
  {
    id: "poland", region: "central",
    periods: [before(1295), { from: 1295, arms: one("gules", ch("eagle_crowned", "argent", { crowned: "or" })), key: "eagle" }],
  },
  // --- Scandinavia
  {
    id: "denmark", region: "north",
    periods: [before(1190), { from: 1190, arms: one("or", ch("lion_passant_guardant", "azure", { count: 3, arr: "pale" })), key: "lions" }],
  },
  {
    id: "norway", region: "north",
    periods: [before(1280), { from: 1280, arms: one("gules", ch("lion_axe", "or", { crowned: "or", second: "argent" })), key: "lion" }],
  },
  {
    id: "sweden", region: "north",
    periods: [before(1336), { from: 1336, arms: one("azure", ch("crown", "or", { count: 3 })), key: "crowns" }],
  },
  // --- eastern Europe
  {
    id: "serbia", region: "east",
    periods: [before(1220), { from: 1220, arms: one("gules", ch("double_eagle", "argent")), key: "eagle" }],
  },
  {
    // arms given to Bulgaria by western heralds; the Bulgarians did not bear them
    id: "bulgaria", region: "east",
    periods: [before(1294), { from: 1294, arms: one("sable", ch("lion_manuscript", "argent", { crowned: "or" })), key: "marshal" }],
  },
];

export const REALMS: Record<string, Realm> = Object.fromEntries(LIST.map((r) => [r.id, r]));

/** title tier as CK3 ranks it; republics and the Papacy cannot be held as a title here */
export type Rank = "none" | "count" | "duke" | "king" | "emperor";
export const RANKS: readonly Rank[] = ["none", "count", "duke", "king", "emperor"];
/** every realm needs an entry here (null: cannot be held as a title) */
export const TIER: Record<string, Rank | null> = {
  france: "king", england: "king", scotland: "king", brittany: "duke", flanders: "count", holland: "count",
  castile: "king", leon: "king", aragon: "king", sicily: "king", papacy: null, venice: null, genoa: null,
  jerusalem: "king", byzantium: "emperor", hre: "emperor", austria: "duke", bavaria: "duke", bohemia: "king",
  hungary: "king", poland: "king", denmark: "king", norway: "king", sweden: "king", serbia: "king",
  normandy: "duke", aquitaine: "duke", brabant: "duke", luxembourg: "count", galicia: "king", savoy: "count",
  montferrat: "count", cyprus: "king", palatinate: "duke", tyrol: "count", brandenburg: "duke", silesia: "duke", pomerania: "duke",
  portugal: "king", bulgaria: "king",
};
export const realmTier = (id: string): Rank | null => TIER[id] ?? null;
export const rankAtLeast = (a: Rank, b: Rank) => RANKS.indexOf(a) >= RANKS.indexOf(b);
/**
 * In CK3 your rank is your highest title, so a bearer holds titles of their
 * own tier or below: a duke may hold counties, never a kingdom.
 */
export const canHold = (rank: Rank, id: string): boolean => {
  const t = realmTier(id);
  return t !== null && rank !== "none" && rankAtLeast(rank, t);
};
/** a title anyone could hold (not a republic or the Papacy): the player may pick one above their rank */
export const holdable = (id: string): boolean => realmTier(id) !== null;
export const REALM_IDS: string[] = LIST.map((r) => r.id);
/**
 * The realm's arms in a given year. Before a realm had arms we still offer its
 * first arms (history is a hint, not a limit) and say so with `since`. A gap
 * after it had arms (arms we have not drawn yet) stays unavailable.
 */
/**
 * A realm's arms in a year. Before its first known arms the first ones are used,
 * with `since` so the anachronism can be pointed out. With `free` (no regard for
 * history) every year gets the nearest known arms, without remark.
 */
export function realmAt(id: string, year: number, free = false): { arms: Arms; key: string; since?: number } | { unavailable: string } {
  const r = REALMS[id];
  const p = r.periods.find((p) => year >= p.from && (p.to === undefined || year < p.to));
  if (p?.arms) return { arms: p.arms, key: `realm.${id}.${p.key}` };
  const first = r.periods.find((q) => q.arms);
  if (first && year < first.from) return free ? { arms: first.arms!, key: `realm.${id}.${first.key}` } : { arms: first.arms!, key: `realm.${id}.${first.key}`, since: first.from };
  if (free) {
    const last = [...r.periods].reverse().find((q) => q.arms && q.from <= year);
    if (last) return { arms: last.arms!, key: `realm.${id}.${last.key}` };
  }
  return { unavailable: `realm.${id}.${p?.key ?? "early"}` };
}

/** a quartered realm's own coat: the first quarter not marked as another realm's (England puts France first) */
const ownQuarter = (arms: Arms): Arms => {
  const q = arms.quarterly!;
  return q.q.find((_, i) => !q.of?.[i]) ?? q.q[0];
};

function mainCharge(arms: Arms): Charge | undefined {
  if (arms.quarterly) return mainCharge(ownQuarter(arms));
  if (arms.field.kind === "semy") return { ...arms.field.charge, count: 1 };
  return arms.charges[0]?.charge;
}

/** the main charge of a realm's arms, for arms of patronage; none when the charge is the realm's whole device */
export function realmMainCharge(arms: Arms): Charge | undefined {
  const c = mainCharge(arms);
  return c && !CHARGES[c.id].whole ? c : undefined;
}

/** the two tinctures of a realm's arms: [field, main charge or ordinary] */
export function realmPalette(arms: Arms): [Tincture, Tincture] {
  if (arms.quarterly) return realmPalette(ownQuarter(arms));
  const f = arms.field;
  const field = f.kind === "plain" || f.kind === "semy" ? f.t : f.t[0];
  const other = arms.ordinary?.t ?? mainCharge(arms)?.t ?? (f.kind !== "plain" && f.kind !== "semy" ? f.t[1] : undefined);
  const metal = field === "or" || field === "argent" || field === "ermine";
  return [field === "ermine" ? "argent" : field, other ?? (metal ? "sable" : "or")];
}
