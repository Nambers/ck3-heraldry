// Examples page: each example drawn from its answers by the real generator,
// with a link that opens it in the designer. The list is in example-list.ts.

import { CHARGES, CHARGE_IDS, type Category } from "../charges.ts";
import { chargeName } from "../describe.ts";
import { icon } from "../designer/kit.ts";
import { blazon } from "../heraldry/blazon.ts";
import { locale } from "../i18n/index.ts";
import { DEFAULT_ANSWERS, encodeAnswers } from "../west/answers.ts";
import { generate } from "../west/generate.ts";
import { renderSvg } from "../render/svg.ts";
import { SECTIONS, type Example, type Link, type Text } from "./example-list.ts";
import { pageHref } from "../routes.ts";
import { ext, readingView, wiki } from "./shell.ts";

const zh = () => locale() === "zh-CN";
const L = (x: Text) => (zh() ? x.zh : x.en);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function link(l: Link): string {
  // English Wikipedia: the article title says what is behind the link
  if ("wiki" in l) return wiki(l.wiki);
  if ("commons" in l) return ext(`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(l.commons).replace(/%2C/g, ",")}`, "Commons");
  return ext(l.href, esc(L(l.label)));
}

// generating is a few milliseconds per example; keep the arms across language switches
const arms = new Map<string, ReturnType<typeof generate>["chosen"]["arms"]>();

function card(ex: Example): string {
  const answers = { ...DEFAULT_ANSWERS, ...ex.answers };
  let a = arms.get(ex.id);
  if (!a) arms.set(ex.id, (a = generate(answers).chosen.arms));
  const open = pageHref("west", encodeAnswers(answers));
  const title = L(ex.title);
  const links = [`<a href="${esc(open)}">${zh() ? "在纹章工坊里打开" : "Open in the designer"}</a>`, ...ex.links.map(link)];
  return `<article class="excard" id="${ex.id}">
    <a class="exshield" href="${esc(open)}" tabindex="-1" aria-hidden="true">${renderSvg(a, { size: 104, title })}</a>
    <div class="exbody">
      <h3>${esc(title)}</h3>
      <p>${esc(L(ex.note))}</p>
      <p class="blazon" lang="en">${esc(blazon(a))}</p>
      <p class="exlinks">${links.join(`<span class="dot" aria-hidden="true">·</span>`)}</p>
    </div>
  </article>`;
}

// every charge, by kind; each opens the designer with it as the main charge
const KINDS: [Category, Text][] = [
  ["beast", { zh: "走兽", en: "Beasts" }],
  ["bird", { zh: "鸟", en: "Birds" }],
  ["monster", { zh: "神兽", en: "Monsters" }],
  ["sea", { zh: "水生", en: "Sea creatures" }],
  ["plant", { zh: "花木", en: "Plants" }],
  ["building", { zh: "建筑", en: "Buildings" }],
  ["object", { zh: "器物", en: "Objects" }],
  ["celestial", { zh: "星月", en: "Celestial" }],
  ["geometric", { zh: "几何", en: "Geometric" }],
  ["cross", { zh: "十字", en: "Crosses" }],
];

// a realm's whole device (Portugal's quinas) is never chosen
const CHOOSABLE = CHARGE_IDS.filter((id) => !CHARGES[id].whole);

function library(): string {
  let s = "";
  for (const [kind, name] of KINDS) {
    const ids = CHOOSABLE.filter((id) => CHARGES[id].cat === kind);
    if (!ids.length) continue;
    s += `<h3>${esc(L(name))}</h3><div class="exlib">`;
    for (const id of ids) {
      const href = pageHref("west", encodeAnswers({ ...DEFAULT_ANSWERS, emblem: id, origin: "none" }));
      s += `<a class="libitem" href="${esc(href)}">${icon(id, 44)}<span>${esc(chargeName(id))}</span></a>`;
    }
    s += `</div>`;
  }
  return `<section id="library">
  <h2>${zh() ? "图案库" : "Charge library"}</h2>
  <p>${
    zh()
      ? `本站能画、能导出到 CK3 的全部 ${CHOOSABLE.length} 种图案。点一个，就在纹章工坊里以它为主图案打开。`
      : `All ${CHOOSABLE.length} charges the site can draw and export to CK3. Click one to open the designer with it as the main charge.`
  }</p>
  ${s}
</section>`;
}

const render = () => `
<h1>${zh() ? "示例" : "Examples"}</h1>
<p class="lead">${
  zh()
    ? "下面每面纹章都是本站按一组回答现场生成的。点盾或「在纹章工坊里打开」，可以带着这组回答接着改。"
    : "Every coat below is generated on the spot from a set of answers. Click the shield or “Open in the designer” to carry on from those answers."
}</p>
<nav class="extoc">${[...SECTIONS.map((s) => `<a href="#${s.id}">${esc(L(s.title))}</a>`), `<a href="#library">${zh() ? "图案库" : "Charge library"}</a>`].join(`<span class="dot" aria-hidden="true">·</span>`)}</nav>
${SECTIONS.map(
  (s) => `<section id="${s.id}">
  <h2>${esc(L(s.title))}</h2>
  ${s.intro ? `<p>${esc(L(s.intro))}</p>` : ""}
  <div class="exgrid">${s.examples.map(card).join("")}</div>
</section>`,
).join("")}
${library()}
<p class="lead">${
  zh()
    ? `想补一个例子？见仓库里的 <code>src/pages/example-list.ts</code>。`
    : `Want to add an example? See <code>src/pages/example-list.ts</code> in the repository.`
}</p>`;

export default readingView("examples", render);
