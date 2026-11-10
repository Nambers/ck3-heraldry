// Every page of the site, in navigation order. Views are loaded on demand, so
// the home page does not pay for the designer. To add a page: add its id and
// loader here, its nav label as app.nav.<id> in each i18n catalog, and (for a
// designer) its entry in src/pages/destinations.ts.

import type { View } from "./view.ts";

export type PageId = "home" | "west" | "examples" | "rules" | "license";

export const ROUTES: { id: PageId; load: () => Promise<{ default: View }> }[] = [
  { id: "home", load: () => import("./pages/home.ts") },
  { id: "west", load: () => import("./west/page.ts") },
  { id: "examples", load: () => import("./pages/examples.ts") },
  { id: "rules", load: () => import("./pages/rules.ts") },
  { id: "license", load: () => import("./pages/license.ts") },
];

export const isPage = (id: string | null): id is PageId => ROUTES.some((r) => r.id === id);

/** a link to a page of the site, keeping the chosen language; `fragment` without "#" */
export function pageHref(id: PageId, fragment = ""): string {
  const q = new URLSearchParams();
  if (id !== "home") q.set("p", id);
  const lang = new URLSearchParams(location.search).get("lang");
  if (lang) q.set("lang", lang);
  const s = q.toString();
  return location.pathname + (s ? `?${s}` : "") + (fragment ? `#${fragment}` : "");
}
