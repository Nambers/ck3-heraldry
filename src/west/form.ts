// The question form of the western rulers' designer: draws the questions and
// turns clicks and edits into new answers. The page around it is shared
// (src/designer/page.ts).

import { chargeName, fmt, realmName } from "../describe.ts";
import { chip, esc, fieldset, icon, sections } from "../designer/kit.ts";
import type { Form } from "../designer/types.ts";
import { CHARGES } from "../charges.ts";
import { TINCTURE, TINCTURES, type Tincture } from "../heraldry/tincture.ts";
import { t } from "../i18n/index.ts";
import { RANKS, canHold, realmAt } from "../realms.ts";
import { ALL_PALETTES, DEFAULT_ANSWERS, MAX_TITLES, PALETTES, geomString, paletteOf, parseGeom, parseParts, partsString, thirdOf, type Answers } from "./answers.ts";
import { CADENCY, DEEDS, EMBLEM_FAMILIES, FAITH_CHARGES, GEOM, GEOM_KEYS, ORIGIN_GROUPS, PARTS, PART_ROLE, SECTIONS, STYLES, YEAR_PRESETS, familyOf, realmOptions, titleOptions, type Family, type GeomKey, type Part } from "./questions.ts";

/** the family last opened in a two-level picker: it stays open while it holds the answer (the bell is in two families) */
const openFamily: Record<"emblem" | "origin", string | null> = { emblem: null, origin: null };
/** whether the detail colours under the palette are unfolded (they start folded) */
let partsOpen = false;

/** one answer changed: the new answers, with what that change implies for the others */
export function setAnswer<K extends keyof Answers>(prev: Answers, k: K, v: Answers[K]): Answers {
  const a: Answers = { ...prev, [k]: v };
  // a lower rank cannot hold the higher titles any more
  if (k === "rank") a.titles = a.titles.filter((id) => canHold(v as Answers["rank"], id, a.free));
  // switching the rules back on drops what they do not allow
  if (k === "free" && !v) {
    a.titles = a.titles.filter((id) => canHold(a.rank, id));
    if (a.palette !== "liege" && !PALETTES.some(([f, c]) => `${f}/${c}` === a.palette)) a.palette = DEFAULT_ANSWERS.palette;
  }
  if (k === "liege") {
    if (v !== "none" && prev.liege === "none" && prev.palette === DEFAULT_ANSWERS.palette) a.palette = "liege";
    if (v === "none") {
      if (a.palette === "liege") a.palette = DEFAULT_ANSWERS.palette;
      if (a.emblem === "liege") a.emblem = DEFAULT_ANSWERS.emblem;
    }
  }
  return a;
}

/** add or remove a held title; null when it cannot be added */
function toggleTitle(a: Answers, id: string): Answers | null {
  const has = a.titles.includes(id);
  if (!has && (a.titles.length >= MAX_TITLES || !canHold(a.rank, id, a.free))) return null;
  return setAnswer(a, "titles", has ? a.titles.filter((x) => x !== id) : [...a.titles, id]);
}

function titlePicker(a: Answers): string {
  const full = a.titles.length >= MAX_TITLES;
  const groups = titleOptions(a.year, a.rank, a.free);
  if (!groups.length) return `<p class="empty">${esc(t("q.titles.noneAtRank", { rank: t(`q.rank.opt.${a.rank}`).toLowerCase() }))}</p>`;
  let s = "";
  for (const g of groups) {
    s += `<div class="tgroup"><span class="glabel">${esc(t(`region.${g.region}`))}</span>`;
    for (const r of g.realms) {
      const at = a.titles.indexOf(r.id);
      const off = r.unavailable !== undefined || (full && at < 0);
      const tip = r.unavailable ? fmt({ key: r.unavailable, p: { r: { realm: r.id } } }) : full && at < 0 ? t("q.titles.full", { n: MAX_TITLES }) : "";
      s += `<button type="button" class="chip${at >= 0 ? " on" : ""}" data-toggle="titles" data-value="${r.id}"${off ? " disabled" : ""}${tip ? ` title="${esc(tip)}"` : ""}>${at >= 0 ? `<b class="ord">${at + 1}</b>` : ""}<span>${esc(realmName(r.id))}</span></button>`;
    }
    s += `</div>`;
  }
  return s;
}

const rankPicker = (a: Answers) => `<div class="opts">${RANKS.map((r) => chip("rank", r, t(`q.rank.opt.${r}`), a.rank === r)).join("")}</div>`;

function picker(a: Answers, name: "emblem" | "origin", groups: Family[], extra: string[]): string {
  const value = a[name];
  // the family shown open holds the answer; with no charge chosen ("none", the liege's) none is open
  const last = groups.find((g) => g.id === openFamily[name]);
  const fam = last?.charges.includes(value) ? last.id : familyOf(groups, value)?.id;
  let s = `<div class="opts">`;
  for (const v of extra) s += chip(name, v, t(`q.${name}.${v}`), value === v);
  for (const g of groups) s += `<button type="button" class="chip fam${fam === g.id ? " on" : ""}" data-family="${name}" data-value="${g.id}">${icon(g.charges[0], 20)}<span>${t(`fam.${g.id}`)}</span></button>`;
  s += `</div>`;
  const open = groups.find((g) => g.id === fam);
  if (open) {
    s += `<div class="opts variants">`;
    for (const id of open.charges) s += chip(name, id, chargeName(id), value === id, "", icon(id));
    s += `</div>`;
  }
  return s;
}

function realmSelect(a: Answers, name: "liege" | "claim"): string {
  const value = a[name];
  let s = `<select name="${name}"><option value="none"${value === "none" ? " selected" : ""}>${t(`q.${name}.none`)}</option>`;
  for (const g of realmOptions(a.year, a.free)) {
    s += `<optgroup label="${esc(t(`region.${g.region}`))}">`;
    for (const r of g.realms) {
      const suffix = r.unavailable ? " —" : r.since ? t("app.since", { y: r.since }) : "";
      s += `<option value="${r.id}"${value === r.id ? " selected" : ""}${r.unavailable ? " disabled" : ""}>${esc(realmName(r.id))}${esc(suffix)}</option>`;
    }
    s += `</optgroup>`;
  }
  s += `</select>`;
  if (value !== "none") {
    const r = realmAt(value, a.year, a.free);
    const since = "since" in r && r.since ? " " + fmt({ key: "note.anachronism", p: { r: { realm: value }, y: r.since } }) : "";
    s += `<p class="why">${esc(fmt({ key: "unavailable" in r ? r.unavailable : r.key, p: { r: { realm: value } } }) + since)}</p>`;
  }
  return s;
}

function palettePicker(a: Answers): string {
  let sw = `<div class="swatches">`;
  if (a.liege !== "none") sw += `<button type="button" class="sw liege${a.palette === "liege" ? " on" : ""}" data-set="palette" data-value="liege"><span>${t("q.palette.liege")}</span></button>`;
  // without the rules every pair is offered; the ones that break the rule of tincture come after a divider
  for (const [i, [f, c]] of (a.free ? ALL_PALETTES : PALETTES).entries()) {
    if (i === PALETTES.length) sw += `<span class="swdiv">${esc(t("q.palette.illegal"))}</span>`;
    const v = `${f}/${c}`;
    const bg = (x: string) => (x === "ermine" ? `background:${TINCTURE.argent.svg} radial-gradient(${TINCTURE.sable.svg} 1.4px, transparent 1.6px) 0 0/7px 7px` : `background:${TINCTURE[x as keyof typeof TINCTURE].svg}`);
    sw += `<button type="button" class="sw${a.palette === v ? " on" : ""}" data-set="palette" data-value="${v}" title="${esc(t(`tinct.${f}`))} / ${esc(t(`tinct.${c}`))}"><span class="pair"><i style="${bg(f)}"></i><i style="${bg(c)}"></i></span></button>`;
  }
  return sw + `</div>`;
}

/** the third tincture: automatic, or any but the pair's own (shown, but off; see thirdOf) */
function thirdRow(a: Answers): string {
  const pair = paletteOf(a);
  const x = thirdOf(a, pair);
  const label = t("q.palette.third");
  let s = `<div class="partrow third" role="group" aria-label="${esc(label)}"><span class="plabel">${esc(label)}</span><div class="pcs">`;
  s += `<button type="button" class="pc auto${x ? "" : " on"}" data-set="third" data-value="" aria-pressed="${!x}">${esc(t("q.parts.auto"))}</button>`;
  for (const c of TINCTURES) {
    const off = !thirdOf({ ...a, third: c }, pair);
    const name = esc(t(`tinct.${c}`));
    s += `<button type="button" class="pc${x === c ? " on" : ""}" data-set="third" data-value="${c}" aria-pressed="${x === c}"${off ? " disabled" : ""} title="${name}" aria-label="${name}"><i style="background:${TINCTURE[c].svg}"></i></button>`;
  }
  return s + `</div></div><p class="mech">${esc(t("q.palette.thirdMech"))}</p>`;
}

/**
 * Detail colours, folded under the palette. They are numbered, not named: colour 1 is
 * the charge's own tincture (the palette), then one entry for each other colour the
 * chosen charges have, in the fixed order of PARTS. Saved by role, so the numbers can
 * change with the charges without breaking shared links.
 */
function partsPanel(a: Answers): string {
  const ids = [a.emblem, a.origin, a.faith].filter((id) => id in CHARGES);
  const roles = new Set(ids.flatMap((id) => CHARGES[id].ck3.flatMap((p) => p.colors)));
  const parts = PARTS.filter((p) => roles.has(PART_ROLE[p]));
  const set = parseParts(a.parts);
  const n = parts.filter((p) => set[p]).length;
  let s = `<div class="parts"><button type="button" class="partstoggle" data-parts-toggle aria-expanded="${partsOpen}"><span>${esc(t("q.parts.title"))}</span>${n ? `<b class="count">${n}</b>` : ""}</button>`;
  if (partsOpen) {
    s += `<div class="partsbody"><p class="mech">${esc(t("q.parts.mech"))}</p>`;
    if (!parts.length) s += `<p class="empty">${esc(t("q.parts.none"))}</p>`;
    parts.forEach((p, i) => {
      const label = t("q.parts.colour", { n: i + 2 });
      s += `<div class="partrow" role="group" aria-label="${esc(label)}"><span class="plabel">${esc(label)}</span><div class="pcs">`;
      s += `<button type="button" class="pc auto${set[p] ? "" : " on"}" data-part="${p}" data-value="auto" aria-pressed="${!set[p]}">${esc(t("q.parts.auto"))}</button>`;
      for (const x of TINCTURES) {
        s += `<button type="button" class="pc${set[p] === x ? " on" : ""}" data-part="${p}" data-value="${x}" aria-pressed="${set[p] === x}" title="${esc(t(`tinct.${x}`))}" aria-label="${esc(t(`tinct.${x}`))}"><i style="background:${TINCTURE[x].svg}"></i></button>`;
      }
      s += `</div></div>`;
    });
    s += `</div>`;
  }
  return s + `</div>`;
}

/** the name of one geometry option, from the catalogs the descriptions use */
const geomLabel = (k: GeomKey, v: string) =>
  k === "ord" ? t(`ord.${v}`) : k === "line" ? (v === "plain" ? t("q.geom.plain") : t(`line.${v}`)) : k === "semy" ? t(`div.semy_${v}`) : t(`div.${v}`);

/** the ordinary, division, striped field, fur, semé and line: by the family name unless chosen here */
function geomPicker(a: Answers): string {
  const g = parseGeom(a.geom);
  return GEOM_KEYS.map((k) => {
    const label = t(`q.geom.${k}`);
    let s = `<label class="partrow"><span class="plabel">${esc(label)}</span><select name="geom:${k}" aria-label="${esc(label)}">`;
    s += `<option value=""${g[k] ? "" : " selected"}>${esc(t("q.geom.auto"))}</option>`;
    for (const v of GEOM[k]) s += `<option value="${v}"${g[k] === v ? " selected" : ""}>${esc(geomLabel(k, v))}</option>`;
    return s + `</select></label>`;
  }).join("");
}

function render(a: Answers): string {
  const q: Partial<Record<keyof Answers, string>> = {};
  q.name = fieldset(t("q.name.title"), t("q.name.mech"), `<input type="text" name="name" maxlength="60" placeholder="${esc(t("app.namePlaceholder"))}" value="${esc(a.name)}">`);
  q.year = fieldset(
    t("q.year.title"),
    t("q.year.mech"),
    `<div class="opts"><input type="number" name="year" min="867" max="1453" value="${a.year}">${YEAR_PRESETS.map((y) => chip("year", String(y), String(y), y === a.year)).join("")}</div>`,
  );
  q.liege = fieldset(t("q.liege.title"), t("q.liege.mech"), realmSelect(a, "liege"));
  q.rank = fieldset(t("q.rank.title"), t("q.rank.mech"), rankPicker(a));
  // without a rank there are no titles to hold: skip the question
  if (a.rank !== "none" || a.free) q.titles = fieldset(t("q.titles.title"), t("q.titles.mech", { n: MAX_TITLES, rank: t(`q.rank.opt.${a.rank}`).toLowerCase() }), titlePicker(a));
  q.claim = fieldset(t("q.claim.title"), t("q.claim.mech"), realmSelect(a, "claim"));
  q.deed = fieldset(t("q.deed.title"), t("q.deed.mech"), `<div class="opts">${DEEDS.map((d) => chip("deed", d, t(`q.deed.opt.${d}`), a.deed === d)).join("")}</div>`);
  q.cadency = fieldset(t("q.cadency.title"), t("q.cadency.mech"), `<div class="opts">${CADENCY.map((c) => chip("cadency", c, t(`q.cadency.opt.${c}`), a.cadency === c)).join("")}</div>`);
  q.emblem = fieldset(t("q.emblem.title"), t("q.emblem.mech"), picker(a, "emblem", EMBLEM_FAMILIES, a.liege !== "none" ? ["none", "liege"] : ["none"]));
  q.origin = fieldset(t("q.origin.title"), t("q.origin.mech"), picker(a, "origin", ORIGIN_GROUPS, ["none"]));
  q.faith = fieldset(
    t("q.faith.title"),
    t("q.faith.mech"),
    `<div class="opts">${chip("faith", "none", t("q.faith.none"), a.faith === "none")}${FAITH_CHARGES.map((id) => chip("faith", id, chargeName(id), a.faith === id, "", icon(id))).join("")}</div>`,
  );
  q.style = fieldset(t("q.style.title"), t("q.style.mech"), `<div class="opts">${STYLES.map((s) => chip("style", s, t(`q.style.opt.${s}`), a.style === s)).join("")}</div>`);
  q.geom = fieldset(t("q.geom.title"), t("q.geom.mech"), geomPicker(a));
  q.palette = fieldset(t("q.palette.title"), t("q.palette.mech"), palettePicker(a) + thirdRow(a) + partsPanel(a));
  // questions grouped by kind: facts of the character's life, the family's own choices, looks
  return sections(SECTIONS.map((sec) => ({ cat: sec.cat, html: sec.questions.map((k) => q[k] ?? "") })));
}

export const westForm: Form<Answers> = {
  render,
  change(el, a) {
    if (el.name === "year") return setAnswer(a, "year", Math.min(1453, Math.max(867, Math.round(Number(el.value) || DEFAULT_ANSWERS.year))));
    if (el.name === "name") return setAnswer(a, "name", el.value.slice(0, 60));
    if (el.name === "liege" || el.name === "claim") return setAnswer(a, el.name, el.value);
    if (el.name.startsWith("geom:")) {
      const g = parseGeom(a.geom);
      const k = el.name.slice(5) as GeomKey;
      if (el.value) g[k] = el.value;
      else delete g[k];
      return setAnswer(a, "geom", geomString(g));
    }
    return null;
  },
  click(b, a) {
    if (b.dataset.family) {
      const name = b.dataset.family as "emblem" | "origin";
      openFamily[name] = b.dataset.value!;
      const g = (name === "emblem" ? EMBLEM_FAMILIES : ORIGIN_GROUPS).find((x) => x.id === b.dataset.value)!;
      // choosing a family selects its first variant unless one of it is already chosen
      return g.charges.includes(a[name]) ? "form" : setAnswer(a, name, g.charges[0]);
    }
    if (b.dataset.toggle === "titles") return toggleTitle(a, b.dataset.value!);
    if (b.dataset.partsToggle !== undefined) {
      partsOpen = !partsOpen;
      return "form";
    }
    if (b.dataset.part) {
      const p = parseParts(a.parts);
      const k = b.dataset.part as Part;
      if (b.dataset.value === "auto") delete p[k];
      else p[k] = b.dataset.value as Tincture;
      return setAnswer(a, "parts", partsString(p));
    }
    const k = b.dataset.set as keyof Answers | undefined;
    if (!k) return null;
    const v = b.dataset.value!;
    return k === "year" ? setAnswer(a, "year", Number(v)) : setAnswer(a, k, v as never);
  },
  reset() {
    openFamily.emblem = openFamily.origin = null;
    partsOpen = false;
  },
};
