// The site is one page (index.html). The app shell (src/app.ts) owns the
// header, the navigation and the language switch; each page of the site is a
// view mounted into it. A view is chosen by ?p=<page> (src/routes.ts); the URL
// fragment belongs to the view — a designer's answers, or an anchor on a
// reading page.

/** parts of the shell a view may fill */
export interface Shell {
  /** header controls shown before the language switch (a designer's switches) */
  tools: HTMLElement;
  /** the line under the title */
  intro: HTMLElement;
  /** the line above the footer navigation */
  footer: HTMLElement;
}

export interface ViewInstance {
  /** the page's name for the browser tab */
  title(): string;
  /** draw everything; called after mounting and after a language change */
  render(): void;
  /** the fragment changed while this view is shown */
  hash?(): void;
  /** the picture behind the page (src/theme/theme.css .scene[data-scene]); none if absent */
  scene?(): string;
  /** leaving the view: stop observers and timers (the shell clears the DOM) */
  unmount?(): void;
}

/** mount a view into `root` (empty) */
export type View = (root: HTMLElement, shell: Shell) => ViewInstance;
