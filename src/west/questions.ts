// The question bank as data: options grouped into families with variants,
// and the realms grouped by region. Labels live in the i18n catalogs.

import { REALMS, REALM_IDS, canHold, realmAt, type Rank } from "../realms.ts";
import type { Answers } from "./answers.ts";

export interface Family {
  id: string; // i18n key fam.<id>
  charges: string[];
}

/** main charge: family -> variants */
export const EMBLEM_FAMILIES: Family[] = [
  { id: "eagle", charges: ["eagle", "eagle_crowned", "double_eagle", "maiden_eagle"] },
  { id: "lion", charges: ["lion_rampant", "lion_rampant_crowned", "lion_passant_guardant", "lion_forked_crowned", "lion_axe", "lion_sword", "lion_sword_sabre", "lion_manuscript"] },
  { id: "monster", charges: ["griffin", "dragon", "lion_st_mark"] },
  { id: "beast", charges: ["boar", "bear", "wolf", "stag", "horse", "bull"] },
  { id: "bird", charges: ["falcon", "swan", "martlet"] },
  { id: "sea", charges: ["dolphin", "fish"] },
  { id: "plant", charges: ["fleur", "sexfoil", "tree"] },
  { id: "celestial", charges: ["mullet", "mullet6", "crescent", "sun"] },
  { id: "object", charges: ["crown", "key", "keys_crossed", "sword", "swords_crossed", "axe", "anchor", "wheel", "bell", "horseshoe", "hand", "heart", "escallop", "chalice"] },
  { id: "geometric", charges: ["roundel", "annulet", "lozenge", "mascle", "billet"] },
  { id: "cross", charges: ["cross", "cross_patty", "cross_potent", "cross_moline", "cross_crosslet", "cross_fleury", "cross_maltese", "cross_patriarchal"] },
];

/** how the family rose: group -> allusive charges */
export const ORIGIN_GROUPS: Family[] = [
  { id: "castle", charges: ["castle", "tower"] },
  { id: "port", charges: ["lymphad", "anchor", "dolphin", "fish"] },
  { id: "forest", charges: ["tree", "stag", "boar", "wolf"] },
  { id: "war", charges: ["sword", "swords_crossed", "axe", "horse"] },
  { id: "trade", charges: ["key", "wheel", "bell"] },
  { id: "farm", charges: ["bull", "horseshoe", "sexfoil"] },
  { id: "church", charges: ["keys_crossed", "chalice", "bell", "escallop"] },
];

/**
 * Parts of a charge the player may colour (the "detail colours" under the palette),
 * and the colour role each one paints in the CK3 recipes and the drawings.
 */
export const PARTS = ["armed", "crowned", "crined", "second", "detail"] as const;
export type Part = (typeof PARTS)[number];
export const PART_ROLE: Record<Part, "armed" | "crown" | "hair" | "second" | "detail"> = {
  armed: "armed", crowned: "crown", crined: "hair", second: "second", detail: "detail",
};

export const FAITH_CHARGES = ["cross", "cross_patty", "cross_potent", "cross_fleury", "cross_moline", "cross_crosslet", "cross_patriarchal", "cross_maltese", "chi_rho"];

// pilgrimages by destination, each with the badge its pilgrims brought home
export const DEEDS = ["none", "crusade", "pilgrimage_santiago", "pilgrimage_rome", "pilgrimage_jerusalem", "service"] as const;
export const CADENCY = ["none", "label", "crescent", "mullet", "martlet", "annulet", "baton"] as const;
export const STYLES = ["auto", "simple", "ordinary", "divided", "patterned"] as const;
/** the questions, grouped by kind (see Cat in legend.ts); the form follows this order */
export const SECTIONS: { cat: "life" | "choice" | "taste"; questions: (keyof Answers)[] }[] = [
  { cat: "life", questions: ["name", "year", "liege", "rank", "titles", "claim", "deed", "cadency"] },
  { cat: "choice", questions: ["emblem", "origin", "faith"] },
  { cat: "taste", questions: ["style", "palette"] },
];

export const REGIONS = ["west", "iberia", "italy", "central", "north", "east"] as const;

export const YEAR_PRESETS = [867, 1066, 1178, 1250, 1350, 1440];

export const familyOf = (groups: Family[], id: string) => groups.find((g) => g.charges.includes(id));

/** realms whose title someone of this rank can hold, grouped by region */
export function titleOptions(year: number, rank: Rank, free = false) {
  return realmOptions(year, free)
    .map((g) => ({ ...g, realms: g.realms.filter((r) => canHold(rank, r.id, free)) }))
    .filter((g) => g.realms.length);
}

/** realm options for a year, grouped by region; `unavailable` holds the i18n key explaining why */
export function realmOptions(year: number, free = false) {
  return REGIONS.map((region) => ({
    region,
    realms: REALM_IDS.filter((id) => REALMS[id].region === region).map((id) => {
      const r = realmAt(id, year, free);
      return { id, unavailable: "unavailable" in r ? r.unavailable : undefined, since: "since" in r ? r.since : undefined };
    }),
  }));
}
