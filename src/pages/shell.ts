// Helpers for the reading pages (home, examples, rules, license): a view that
// draws one block of HTML, and links to outside sources.

import { t } from "../i18n/index.ts";
import type { PageId } from "../routes.ts";
import type { View } from "../view.ts";

/**
 * A reading page: `html()` is drawn into <main class="page"> and drawn again
 * after a language change. `click` gets clicks inside the page, with a way to
 * redraw it.
 */
export const readingView =
  (id: PageId, html: () => string, opts: { click?(e: MouseEvent, redraw: () => void): void; scene?(): string } = {}): View =>
  (root) => {
    const main = document.createElement("main");
    main.className = "page";
    root.append(main);
    const draw = () => (main.innerHTML = html());
    if (opts.click) main.addEventListener("click", (e) => opts.click!(e, draw));
    return { title: () => t(`app.nav.${id}`), render: draw, scene: opts.scene };
  };

/** an outside link */
export const ext = (href: string, label: string) => `<a href="${href}" target="_blank" rel="noopener">${label}</a>`;
/** an English Wikipedia article */
export const wiki = (title: string, label = title.replace(/_/g, " ")) => ext(`https://en.wikipedia.org/wiki/${encodeURIComponent(title).replace(/%2C/g, ",")}`, label);
