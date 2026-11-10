// Tiny i18n: JSON catalogs keyed by dotted paths, with {param} placeholders.
// Missing keys fall back to zh-CN.
//
// To add a language: copy en.json to <locale>.json, translate it, and register
// it in the three places below (import, Locale, CATALOGS). The language button
// cycles through LOCALES in order and shows each catalog's own app.langName.
// test/data.test.ts checks that every catalog has the same keys.

import zh from "./zh-CN.json" with { type: "json" };
import en from "./en.json" with { type: "json" };

export type Locale = "zh-CN" | "en";
const CATALOGS: Record<Locale, unknown> = { "zh-CN": zh, en };
export const LOCALES = Object.keys(CATALOGS) as Locale[];

let current: Locale = "zh-CN";
export const locale = () => current;
export function setLocale(l: Locale) {
  current = l;
}

function lookup(cat: unknown, key: string): unknown {
  let v: unknown = cat;
  for (const part of key.split(".")) {
    if (v === null || typeof v !== "object") return undefined;
    v = (v as Record<string, unknown>)[part];
  }
  return v;
}

export function has(key: string, l: Locale = current): boolean {
  return typeof lookup(CATALOGS[l], key) === "string";
}

/** translate `key`, filling {placeholders} from `params` */
export function t(key: string, params: Record<string, string | number> = {}): string {
  let s = lookup(CATALOGS[current], key);
  if (typeof s !== "string") s = lookup(CATALOGS["zh-CN"], key);
  if (typeof s !== "string") return key;
  return (s as string).replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

/** the language the switch button goes to next */
export const nextLocale = (l: Locale = current): Locale => LOCALES[(LOCALES.indexOf(l) + 1) % LOCALES.length];

/** a language's name in that language, for the switch button */
export const localeName = (l: Locale): string => String(lookup(CATALOGS[l], "app.langName") ?? l);
/** a language's short name for small switches ("中", "EN") */
export const localeShort = (l: Locale): string => String(lookup(CATALOGS[l], "app.langShort") ?? l);

const primary = (tag: string) => tag.toLowerCase().split("-")[0];

/**
 * Pick a locale from the URL (?lang=en) or the browser. Any Chinese in the
 * browser's list wins (many Chinese readers keep English first); otherwise the
 * first browser language we have a catalog for, else English.
 */
export function detectLocale(search: string, languages: readonly string[]): Locale {
  const q = new URLSearchParams(search).get("lang");
  if (q && (LOCALES as string[]).includes(q)) return q as Locale;
  if (languages.length === 0 || languages.some((l) => primary(l) === "zh")) return "zh-CN";
  for (const l of languages) {
    const hit = LOCALES.find((loc) => primary(loc) === primary(l));
    if (hit) return hit;
  }
  return "en";
}
