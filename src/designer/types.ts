// The contract between the shared designer page (page.ts) and each designer:
// the western rulers' page in src/west/, and later others (clergy, merchants,
// other traditions). A designer owns its answers, questions and generator; the
// page owns everything around them — preview, candidates, CK3 code, saving,
// sharing, game textures — and looks the same for every designer.

import type { Arms, ChargeId } from "../heraldry/ast.ts";
import type { Tincture } from "../heraldry/tincture.ts";

/** a translatable message: i18n key plus parameters (formatted by describe.ts fmt) */
export type Param = string | number | { charge: ChargeId } | { realm: string } | { t: Tincture } | { ord: string; line?: string } | { div: string; line?: string };
export interface Msg {
  key: string;
  p?: Record<string, Param>;
}

/** one coat of arms to choose from */
export interface Candidate {
  /** stable id of the layout (e.g. "chief#0"), kept in the answers so the choice survives other changes */
  id: string;
  /** the layout's name, as heraldry would call it (short) */
  name: Msg[];
  /** pieces of the description of this layout */
  label: Msg[];
  arms: Arms;
  /** wishes that could not be kept in this layout */
  dropped: Msg[];
  /** what the player must see right by these arms (e.g. they are a realm's own arms) */
  warnings?: Msg[];
}

export interface Note {
  kind: "history" | "heraldry" | "ck3";
  msg: Msg;
}

/**
 * Kinds of answer, shown as tags in the form and in the legend.
 * life: facts about the character in the game; choice: symbols the player
 * picks; taste: looks only; auto: decided by the generator.
 */
export type Cat = "life" | "choice" | "taste" | "auto";

/** a row of the legend: what an element of the arms stands for */
export interface LegendRow {
  cat: Cat;
  what: Msg;
  means: Msg;
}

export interface Result<C extends Candidate = Candidate> {
  candidates: C[];
  notes: Note[];
  chosen: C;
  /** what each element of the chosen arms stands for */
  legend: LegendRow[];
}

/** the question form of a designer; it renders HTML and turns events into new answers */
export interface Form<A> {
  render(a: A): string;
  /**
   * An input or select changed, or a button was clicked, inside the form.
   * Return the new answers, "form" to redraw only the form (local UI state
   * changed), or null when nothing happened.
   */
  change?(el: HTMLInputElement | HTMLSelectElement, a: A): A | "form" | null;
  click?(button: HTMLElement, a: A): A | "form" | null;
  /** forget local UI state (open pickers) on start over or when a design is opened */
  reset?(): void;
}

export interface Designer<A> {
  /** page id (also the nav entry and the saved-designs store) */
  id: string;
  /** i18n key of the line under the title */
  intro: string;
  /** answers for whatever a link leaves out */
  defaults: A;
  /** answers on a page without a design and after "start over": nothing chosen (defaults when not given) */
  blank?: A;
  /** answers <-> the URL fragment (without "#"); a share link is just this */
  encode(a: A): string;
  decode(fragment: string): A;
  generate(a: A): Result;
  /** the bearer's name for "Arms of …", or "" */
  name(a: A): string;
  /** the answers with another candidate chosen */
  pick(a: A, layoutId: string): A;
  form: Form<A>;
  /** an optional "no regard for history" switch in the header */
  free?: { get(a: A): boolean; set(a: A, on: boolean): A };
}
