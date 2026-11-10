// Entry of the site (index.html): the shell — title, navigation, language —
// and a router that mounts one view at a time. Moving between pages changes
// ?p= with the History API, so nothing reloads: game textures loaded in a
// designer stay loaded, and the Back button works as usual.

import { detectLocale, locale, localeName, nextLocale, setLocale, t } from "./i18n/index.ts";
import { ROUTES, isPage, pageHref, type PageId } from "./routes.ts";
import { setScene } from "./theme/scene.ts";
import type { Shell, ViewInstance } from "./view.ts";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

setLocale(detectLocale(location.search, navigator.languages ?? [navigator.language]));

const root = document.getElementById("view") as HTMLElement;
const shell: Shell = {
  tools: document.getElementById("tools") as HTMLElement,
  intro: document.getElementById("intro") as HTMLElement,
  footer: document.getElementById("footer") as HTMLElement,
};

let current: { id: PageId; view: ViewInstance } | null = null;
let routing = 0;

/** links between the pages, keeping the chosen language */
function siteNav(here: PageId): string {
  return ROUTES.map(({ id }) =>
    id === here ? `<span aria-current="page">${esc(t(`app.nav.${id}`))}</span>` : `<a href="${esc(pageHref(id))}">${esc(t(`app.nav.${id}`))}</a>`,
  ).join(`<span class="dot" aria-hidden="true">·</span>`);
}

function drawShell() {
  if (!current) return;
  document.documentElement.lang = locale();
  document.title = current.id === "home" ? t("app.title") : `${current.view.title()} · ${t("app.title")}`;
  (document.getElementById("title") as HTMLElement).innerHTML = `<a href="${esc(pageHref("home"))}">${esc(t("app.title"))}</a>`;
  (document.getElementById("lang") as HTMLElement).textContent = localeName(nextLocale());
  const repo = document.getElementById("repo") as HTMLElement;
  repo.title = t("app.source");
  repo.setAttribute("aria-label", t("app.source"));
  document.querySelectorAll("[data-nav]").forEach((el) => (el.innerHTML = siteNav(current!.id)));
}

/** the page in the URL; links from before ?p= existed carried a design's answers in the fragment */
function pageFromUrl(): PageId {
  const url = new URL(location.href);
  const p = url.searchParams.get("p");
  if (isPage(p)) return p;
  if (!p && location.hash.includes("=")) {
    url.searchParams.set("p", "west");
    history.replaceState(null, "", url);
    return "west";
  }
  return "home";
}

function scrollToFragment() {
  const id = decodeURIComponent(location.hash.slice(1));
  const el = id && !id.includes("=") ? document.getElementById(id) : null;
  if (el) el.scrollIntoView();
  else window.scrollTo({ top: 0 });
}

async function route() {
  const id = pageFromUrl();
  if (current?.id === id) {
    current.view.hash?.();
    return;
  }
  const token = ++routing;
  const mod = await ROUTES.find((r) => r.id === id)!.load();
  if (token !== routing) return; // another navigation won
  current?.view.unmount?.();
  root.replaceChildren();
  shell.tools.replaceChildren();
  shell.intro.replaceChildren();
  shell.footer.replaceChildren();
  shell.intro.hidden = shell.footer.hidden = true;
  current = { id, view: mod.default(root, shell) };
  document.body.dataset.view = id; // picks the page's art (src/theme/theme.css)
  drawShell();
  current.view.render();
  setScene(current.view.scene?.() ?? "");
  scrollToFragment();
}

// links inside the site move between views without reloading
document.addEventListener("click", (e) => {
  const a = (e.target as Element).closest?.("a");
  if (!a || a.target || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname) return;
  // only the fragment differs: an anchor or a design, the browser and hashchange handle it
  if (url.search === location.search && url.hash) return;
  e.preventDefault();
  history.pushState(null, "", url);
  route();
});
window.addEventListener("popstate", () => route());
window.addEventListener("hashchange", () => current?.view.hash?.());

document.getElementById("lang")!.addEventListener("click", () => {
  const next = nextLocale();
  setLocale(next);
  const url = new URL(location.href);
  url.searchParams.set("lang", next);
  history.replaceState(null, "", url);
  drawShell();
  current?.view.render();
});

route();
