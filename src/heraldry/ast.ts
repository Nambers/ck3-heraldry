// Structured blazon: the single source of truth.
// Questionnaire -> Arms -> (rules, blazon, description, SVG, CK3 code).

import type { Tincture } from "./tincture.ts";

export type ChargeId = string; // a key of CHARGES (src/charges.ts)

export interface Charge {
  id: ChargeId;
  t: Tincture;
  /** 1 (default); 2 = two in pale (one above the other); 3 = two and one; 6 = three, two and one */
  count?: 1 | 2 | 3 | 6;
  /** three in a line instead of two and one: in pale (one above another), in fess (side by side), in bend */
  arr?: "pale" | "fess" | "bend";
  /** claws, beak, tongue, horns, hooves, hilt, haft, jewels */
  armed?: Tincture;
  crowned?: Tincture;
  /** hair (maiden-eagle) */
  crined?: Tincture;
  /** haloes behind the heads (the imperial double-headed eagle) */
  nimbed?: Tincture;
  /** a second object (second key, book, axe blade) */
  second?: Tincture;
  /** doors and windows; undefined = shows the tincture beneath */
  detail?: Tincture;
  /** something borne on the breast of an eagle-like charge */
  breast?: Charge | Escutcheon;
}

export interface RealmRef {
  id: string; // a key of REALMS
}

/** A small shield carrying complete arms (e.g. arms of pretence). */
export interface Escutcheon {
  kind: "escutcheon";
  arms: Arms;
  of?: RealmRef;
  /** the bearer's own family arms (en surtout over arms of dominion) */
  own?: boolean;
}

/** field divisions and variations of two tinctures */
export type Division =
  | "per_pale"
  | "per_fess"
  | "per_bend"
  | "per_bend_sinister"
  | "per_saltire"
  | "quarterly"
  | "gyronny"
  | "barry" // of six
  | "barry8" // of eight
  | "barry10" // of ten (Luxembourg)
  | "barry_indented"
  | "paly" // of six
  | "bendy"
  | "chequy"
  | "lozengy"
  | "lozengy_bend";

/** lines of partition other than straight; each is available only where CK3 has a texture (LINES) */
export type Line = "engrailed" | "indented" | "dancetty" | "embattled" | "nebuly";
export const LINES: Partial<Record<string, Line[]>> = {
  cross: ["engrailed"],
  fess: ["engrailed", "dancetty"],
  bend: ["engrailed", "embattled"],
  chief: ["indented"],
  per_fess: ["indented"],
  per_bend: ["nebuly"],
};

export type Field =
  | { kind: "plain"; t: Tincture }
  | { kind: Division; t: [Tincture, Tincture]; line?: Line }
  /** semé (powdered) with small charges, e.g. France ancient */
  | { kind: "semy"; t: Tincture; charge: Charge };

export type OrdinaryKind =
  | "fess"
  | "pale"
  | "bend"
  | "bend_sinister"
  | "chevron"
  | "saltire"
  | "cross"
  | "pile"
  | "orle"
  | "tressure" // double tressure flory counter-flory
  | "pallets" // four pallets (Aragon)
  | "bars" // two bars
  | "chevronels" // three chevronels (Clare)
  | "pall"; // a Y from the upper corners to the base

export interface Ordinary {
  kind: OrdinaryKind;
  t: Tincture;
  /** charges lying on the ordinary (three, or five on a cross/saltire) */
  on?: Charge;
  line?: Line;
}

/** where charges sit on a field */
export type Spot =
  | "center" // fess point, the whole field
  | "high" // main charge raised to make room for something in base
  | "base"
  | "dexter" // halves of a per-pale field
  | "sinister"
  | "chief_half" // halves of a per-fess field
  | "base_half"
  | "dexter_chief" // small charge in the dexter chief corner
  | "between"; // around the ordinary; how many depends on its kind

export interface Placed {
  at: Spot;
  charge: Charge;
}

export interface Chief {
  t: Tincture;
  /** 0, 1 or 3 charges, left to right */
  charges: Charge[];
  /** "a chief of <realm>": shown with the realm's name in blazon */
  of?: RealmRef;
  line?: "indented";
}

export interface Canton {
  t: Tincture;
  charge?: Charge;
  /** an augmentation: the canton carries a liege's arms */
  of?: RealmRef;
}

/** English-style cadency marks, a label, or a baton sinister */
export type Brisure = "label" | "crescent" | "mullet" | "martlet" | "annulet" | "baton";

export interface Arms {
  field: Field;
  ordinary?: Ordinary;
  chief?: Chief;
  canton?: Canton;
  charges: Placed[];
  /** cadency mark */
  brisure?: { kind: Brisure; t: Tincture };
  /** escutcheon over all, at the fess point */
  overall?: Escutcheon;
  /** a new coat granted by this realm (built from its charge), the family arms en surtout */
  granted?: RealmRef;
  /** these are a realm's historic arms (with something added over them): not ours to correct */
  of?: RealmRef;
  /** quarterly: four coats, in order 1 (dexter chief) .. 4 (sinister base). Field and charges of the outer arms are ignored. */
  quarterly?: { q: [Arms, Arms, Arms, Arms]; of?: (RealmRef | null)[] };
  /** historical arms that break a rule on purpose (Jerusalem's gold on silver) */
  exempt?: boolean;
}

export const isEscutcheon = (x: Charge | Escutcheon | undefined): x is Escutcheon =>
  !!x && (x as Escutcheon).kind === "escutcheon";

export const plain = (t: Tincture): Field => ({ kind: "plain", t });

/** the tincture at the top-left of a field, used when one tincture is needed */
export const firstTincture = (f: Field): Tincture => (f.kind === "plain" || f.kind === "semy" ? f.t : f.t[0]);
