// Home page: who you play and where, then on to the designer page for that.

import { locale } from "../i18n/index.ts";
import { DESTINATIONS, REGIONS, ROLES, destinationFor, type Destination, type Region, type Role, type Text } from "./destinations.ts";
import { pageHref } from "../routes.ts";
import { setScene } from "../theme/scene.ts";
import { readingView } from "./shell.ts";

const zh = () => locale() === "zh-CN";
const L = (x: Text) => (zh() ? x.zh : x.en);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// the last choice is remembered in this browser, only as a convenience
const KEY = "ck3-heraldry.home.v1";
let role: Role = "ruler";
let region: Region = "latin";
try {
  const v = JSON.parse(localStorage.getItem(KEY) ?? "{}");
  if (ROLES.some((r) => r.id === v.role)) role = v.role;
  if (REGIONS.some((r) => r.id === v.region)) region = v.region;
} catch {
  /* no storage: start from the defaults */
}
const remember = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ role, region }));
  } catch {
    /* fine without it */
  }
};

const href = (d: Destination) => pageHref(d.page!);
const planned = () => (zh() ? "规划中" : "Planned");

function card(d: Destination | undefined): string {
  if (!d)
    return `<div class="dest none"><p>${
      zh() ? "这个组合还没有规划。下面是已有和计划中的全部页面。" : "Nothing is planned for this combination yet. All pages, built and planned, are listed below."
    }</p></div>`;
  const action = d.page
    ? `<a class="start" href="${esc(href(d))}">${zh() ? "开始" : "Start"}</a>`
    : `<span class="badge">${planned()}</span>`;
  return `<div class="dest${d.page ? "" : " planned"}" data-tradition="${d.id}"><h3>${esc(L(d.title))}</h3><p>${esc(L(d.blurb))}</p>${action}</div>`;
}

const chips = (name: string, items: { id: string; title: Text; hint?: Text }[], on: string) =>
  `<div class="opts">${items
    .map(
      (x) =>
        `<button type="button" class="chip${x.id === on ? " on" : ""}" data-${name}="${x.id}" aria-pressed="${x.id === on}"${x.hint ? ` title="${esc(L(x.hint))}"` : ""}><span>${esc(L(x.title))}</span></button>`,
    )
    .join("")}</div>`;

const render = () => `
<h1>${zh() ? "你在 CK3 里是谁？" : "Who do you play in CK3?"}</h1>
<p class="lead">${
  zh()
    ? "不同身份、不同地域的徽记，规则完全不一样：西欧的纹章、教会的对分、草原的 tamga、日本的家纹……所以每一种各有一个页面。先选身份和地域，再进入对应的页面答题。"
    : "Different roles and regions follow entirely different rules — Western arms, the clergy's impaled arms, the steppe's tamga, Japan's kamon — so each has its own page. Pick your role and region to get to yours."
}</p>
<h2>${zh() ? "身份" : "Role"}</h2>
${chips("role", ROLES, role)}
<p class="hint">${esc(L(ROLES.find((r) => r.id === role)!.hint))}</p>
<h2>${zh() ? "地域与信仰" : "Region and faith"}</h2>
${chips("region", REGIONS, region)}
${card(destinationFor(role, region))}
<h2>${zh() ? "全部页面" : "All pages"}</h2>
<ul class="destlist">${DESTINATIONS.map(
  (d) =>
    `<li data-tradition="${d.id}">${d.page ? `<a href="${esc(href(d))}">${esc(L(d.title))}</a>` : `${esc(L(d.title))} <span class="badge">${planned()}</span>`}<span class="sub">${esc(
      d.roles.map((r) => L(ROLES.find((x) => x.id === r)!.title)).join(" / ") + " · " + d.regions.map((g) => L(REGIONS.find((x) => x.id === g)!.title)).join(" / "),
    )}</span></li>`,
).join("")}</ul>
<p class="lead">${
  zh()
    ? `规划中的页面欢迎一起做，见仓库里的 <code>CONTRIBUTING.md</code> 和 <code>docs/roadmap.md</code>。`
    : `Help with the planned pages is welcome: see <code>CONTRIBUTING.md</code> and <code>docs/roadmap.md</code> in the repository.`
}</p>`;

/** the picture behind the page follows the choice: the world it leads to, or the chart when none is planned */
const scene = () => destinationFor(role, region)?.id ?? "portolan";

export default readingView("home", render, {
  scene,
  click(e, redraw) {
    const b = (e.target as HTMLElement).closest<HTMLElement>("button");
    if (!b) return;
    if (b.dataset.role) role = b.dataset.role as Role;
    else if (b.dataset.region) region = b.dataset.region as Region;
    else return;
    remember();
    redraw();
    setScene(scene());
  },
});
