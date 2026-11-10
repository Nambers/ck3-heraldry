// Building blocks for a designer's question form, so every designer's form
// looks and behaves alike. Buttons carry data-set="<answer>" data-value="…";
// the designer's Form.click turns them into new answers.

import { ART } from "../art/index.ts";
import { t } from "../i18n/index.ts";
import type { Cat } from "./types.ts";
import { esc } from "./util.ts";

export { esc };

/** a charge's drawing as a small icon (our own art) */
export function icon(id: string, size = 26): string {
  const art = ART[id];
  if (!art) return "";
  const c = { body: "#5b4a3a", armed: "#c9a03a", crown: "#c9a03a", hair: "#c9a03a", second: "#a9a39a", detail: "#efe7d6", under: "#efe7d6", features: "#efe7d6" };
  return `<svg class="ico" viewBox="0 0 ${art.w} ${art.h}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${art.draw(c)}</svg>`;
}

/** an option button; `label` is HTML (escape text yourself) */
export const chip = (name: string, value: string, label: string, on: boolean, extra = "", ico = "") =>
  `<button type="button" class="chip${on ? " on" : ""}" data-set="${name}" data-value="${esc(value)}" ${extra}>${ico}<span>${label}</span></button>`;

/** one question: title, the heraldic mechanism behind it, and its inputs */
export const fieldset = (title: string, mech: string, inner: string) =>
  `<fieldset class="q"><legend>${title}</legend>${mech ? `<p class="mech">${mech}</p>` : ""}${inner}</fieldset>`;

/** the tag of a kind of answer (life / choice / taste / auto) */
export const catTag = (cat: Cat, hint = true) =>
  `<span class="cattag cat-${cat}"${hint ? ` title="${esc(t(`app.cat.${cat}.hint`))}"` : ""}>${esc(t(`app.cat.${cat}.name`))}</span>`;

/** the questions grouped by kind, each group under its tag */
export const sections = (groups: { cat: Cat; html: string[] }[]) =>
  groups
    .map(
      (g) =>
        `<section class="qsec qsec-${g.cat}"><div class="qsec-h">${catTag(g.cat, false)}<span>${esc(t(`app.cat.${g.cat}.hint`))}</span></div>${g.html.join("")}</section>`,
    )
    .join("");
