// The player's answers. Everything downstream is a pure function of these,
// so the same answers always give the same arms and can live in the URL.

import { CHARGES } from "../charges.ts";
import type { Brisure } from "../heraldry/ast.ts";
import { TINCTURES, isMetal, type Tincture } from "../heraldry/tincture.ts";
import { RANKS, REALM_IDS, canHold, type Rank } from "../realms.ts";
import { DEEDS, PARTS, type Part } from "./questions.ts";

export type Deed = (typeof DEEDS)[number];
export type Style = "auto" | "simple" | "ordinary" | "divided" | "patterned";

export interface Answers {
  name: string;
  year: number;
  liege: string; // "none" or a realm id
  /** charge id or "none" */
  origin: string;
  /** charge id, "none" or "liege" (the liege's own charge) */
  emblem: string;
  /** charge id or "none" */
  faith: string;
  deed: Deed;
  claim: string; // "none" or a realm id
  /** the bearer's current rank; it limits which titles can be held (see canHold) */
  rank: Rank;
  /** realms whose titles the bearer holds now, at most MAX_TITLES, in order of importance */
  titles: string[];
  cadency: "none" | Brisure;
  style: Style;
  /** "liege" or "<field>/<charge>", e.g. "gules/or" */
  palette: string;
  /** no regard for history or the rule of tincture: every realm in every year, any title, any colours */
  free: boolean;
  /**
   * the chosen layout, by its id (e.g. "chief#0"), not by position: it stays
   * chosen when other answers change, as long as that layout is still legal
   */
  layout: string;
  /** the player's detail colours, e.g. "crined:argent,armed:azure" (see parseParts); empty = all automatic */
  parts: string;
}

export const DEFAULT_ANSWERS: Answers = {
  name: "",
  year: 1178,
  liege: "none",
  origin: "castle",
  emblem: "eagle",
  faith: "none",
  deed: "none",
  claim: "none",
  rank: "none",
  titles: [],
  cadency: "none",
  style: "auto",
  palette: "gules/or",
  free: false,
  layout: "",
  parts: "",
};

/** every legal field/charge pair: one metal (or ermine), one colour */
export const PALETTES: [Tincture, Tincture][] = [
  ...TINCTURES.flatMap((f) => TINCTURES.filter((c) => isMetal(c) !== isMetal(f)).map((c) => [f, c] as [Tincture, Tincture])),
  ["ermine", "gules"],
  ["ermine", "azure"],
  ["ermine", "sable"],
];

/** with the rules switched off: any two different tinctures, the legal ones first */
export const ALL_PALETTES: [Tincture, Tincture][] = [
  ...PALETTES,
  ...[...TINCTURES, "ermine" as Tincture]
    .flatMap((f) => TINCTURES.filter((c) => c !== f).map((c) => [f, c] as [Tincture, Tincture]))
    .filter(([f, c]) => !PALETTES.some(([pf, pc]) => pf === f && pc === c)),
];

const KEYS: Record<keyof Answers, string> = {
  name: "n", year: "y", liege: "l", origin: "o", emblem: "e", faith: "f", deed: "d", claim: "c", rank: "r", titles: "t", cadency: "b", style: "s", palette: "p", free: "x", layout: "k", parts: "h",
};

export const MAX_TITLES = 3;

/** "crined:argent,armed:azure" -> { crined: "argent", armed: "azure" }; anything unknown is dropped */
export function parseParts(s: string): Partial<Record<Part, Tincture>> {
  const out: Partial<Record<Part, Tincture>> = {};
  for (const item of s.split(",")) {
    const [k, v] = item.split(":");
    if ((PARTS as readonly string[]).includes(k) && TINCTURES.includes(v as Tincture)) out[k as Part] = v as Tincture;
  }
  return out;
}

/** the canonical string for a set of detail colours (in the order of PARTS) */
export const partsString = (p: Partial<Record<Part, Tincture>>) =>
  PARTS.filter((k) => p[k]).map((k) => `${k}:${p[k]}`).join(",");

export function encodeAnswers(a: Answers): string {
  const q = new URLSearchParams();
  for (const k of Object.keys(KEYS) as (keyof Answers)[]) {
    if (String(a[k]) !== String(DEFAULT_ANSWERS[k])) q.set(KEYS[k], String(a[k]));
  }
  return q.toString();
}

const oneOf = <T extends string>(v: string | null, allowed: readonly string[], d: T): T =>
  v !== null && allowed.includes(v) ? (v as T) : d;

export function decodeAnswers(s: string): Answers {
  const q = new URLSearchParams(s.replace(/^#/, ""));
  const d = DEFAULT_ANSWERS;
  const realms = ["none", ...REALM_IDS];
  const charges = ["none", ...Object.keys(CHARGES)];
  const year = Number(q.get("y"));
  const layout = q.get("k") ?? "";
  const palette = q.get("p");
  const rank = oneOf<Rank>(q.get("r"), RANKS, d.rank);
  const free = q.get("x") === "true";
  return {
    name: (q.get("n") ?? d.name).slice(0, 60),
    year: q.has("y") && Number.isFinite(year) && year >= 867 && year <= 1453 ? Math.round(year) : d.year,
    liege: oneOf(q.get("l"), realms, d.liege),
    origin: oneOf(q.get("o"), charges, d.origin),
    emblem: oneOf(q.get("e"), [...charges, "liege"], d.emblem),
    faith: oneOf(q.get("f"), charges, d.faith),
    deed: oneOf(q.get("d"), DEEDS, d.deed),
    claim: oneOf(q.get("c"), realms, d.claim),
    rank,
    titles: [...new Set((q.get("t") ?? "").split(","))].filter((id) => canHold(rank, id, free)).slice(0, MAX_TITLES),
    cadency: oneOf(q.get("b"), ["none", "label", "crescent", "mullet", "martlet", "annulet", "baton"], d.cadency),
    style: oneOf(q.get("s"), ["auto", "simple", "ordinary", "divided", "patterned"], d.style),
    palette: palette === "liege" || (free ? ALL_PALETTES : PALETTES).some(([f, c]) => `${f}/${c}` === palette) ? (palette as string) : d.palette,
    free,
    layout: /^[a-z0-9_-]{1,40}(#(\d{1,2}|g))?$/.test(layout) ? layout : d.layout,
    parts: partsString(parseParts(q.get("h") ?? "")),
  };
}
