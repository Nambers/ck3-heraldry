// Copyright and license page.

import { locale } from "../i18n/index.ts";
import { CREDITS } from "../theme/art/credits.ts";
import { ext, readingView } from "./shell.ts";

const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** the pictures behind the pages, with their sources (src/theme/art/credits.ts) */
function pictures(zh: boolean): string {
  const L = (t: { zh: string; en: string }) => esc(zh ? t.zh : t.en);
  const h = zh ? ["作品", "作者与年代", "收藏", "许可", "来源"] : ["Work", "Made", "Held by", "Licence", "Source"];
  const rows = CREDITS.map(
    (c) =>
      `<tr><td>${L(c.title)}</td><td>${L(c.made)}</td><td>${L(c.held) || "—"}</td><td>${zh && c.license === "Public domain" ? "公有领域" : esc(c.license)}</td><td>${ext(c.page, "Wikimedia Commons")}<br>${ext(c.original, zh ? "原图" : "original file")}</td></tr>`,
  ).join("");
  return `<div class="tablewrap"><table><thead><tr>${h.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

const HOLDER = "Eritque Arcus";
const HOLDER_LINK = "https://github.com/Nambers";
const YEAR = 2026;

const MIT = `MIT License

Copyright (c) ${YEAR} ${HOLDER}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

const paradox = ext("https://www.paradoxinteractive.com/", "Paradox Interactive");
const vite = ext("https://vite.dev/", "Vite");
const ts = ext("https://www.typescriptlang.org/", "TypeScript");
const vitest = ext("https://vitest.dev/", "Vitest");

const ZH = () => `
<h1>版权与许可</h1>
<p class="lead">一句话：本站的代码、自绘图案和文字按 MIT 许可开放；《十字军之王 III》的一切归 Paradox；纹章本身是历史资料。</p>

<h2>本站</h2>
<p>本站的源代码、自绘的图案（<code>src/art</code> 里的 SVG）和说明文字，版权属于 ${ext(HOLDER_LINK, HOLDER)}，按 <strong>MIT 许可</strong>开放：可以自由使用、复制、修改、合并、发布、再许可和销售，只要在副本里保留下面的版权和许可声明。本站按"现状"提供，不作任何担保。</p>
<p>用本站生成的纹章和 CK3 代码归你自由使用，不需要署名。</p>
<pre>${MIT}</pre>

<h2>《十字军之王 III》</h2>
<ul>
  <li>《十字军之王 III》（Crusader Kings III）及其中的素材、名称和商标属于 ${paradox}。本站是玩家自制的非官方工具，和 Paradox 没有关系，也没有得到 Paradox 的认可或赞助。</li>
  <li>本站<strong>不托管、不分发</strong>任何游戏文件。生成的代码只写原版贴图的文件名，由你自己的游戏读取，所以不需要 mod。</li>
  <li>"载入游戏贴图"读取的是你电脑上的游戏文件，只在浏览器里解码和显示，不会上传；浏览器记住的只是那个文件夹的访问权限。</li>
  <li>网页预览里七种纹章颜色的数值，是从游戏的颜色定义（<code>default_colors.txt</code>）换算来的，用来让预览和游戏一致。</li>
</ul>

<h2>纹章与历史资料</h2>
<ul>
  <li>历史上的纹章，用纹章术语（blazon）描述的那个设计，是几百年前的历史资料。具体的画法才是作品。本站的图案是自己画的，没有描摹游戏贴图或别人的作品。</li>
  <li>"手抄本戴冠立狮"（保加利亚）是按 Lord Marshal's Roll（约 1295 年；约 1640 年的 Hatton–Dugdale 摹本，伦敦古物学会藏）里"保加利亚国王"纹章上的画原样转成的方块，所用照片见 ${ext("https://heraldika-bg.org/gallery_armorial.htm", "heraldika-bg.org")}。画作本身属于公有领域；本站只存转换后的方块数据，不存照片。</li>
  <li>"规则与出处"页和示例里链接了维基百科、维基共享资源等网站。这些链接指向的内容按各自的许可提供（维基百科多为 CC BY-SA）。</li>
</ul>

<h2>背景图</h2>
<p>页面两侧的背景是 867–1453 年间（CK3 的年代）前后的绘画，都已进入公有领域或按 CC0 提供；个别年代不确定的在下表注明。本站存的是从维基共享资源取得后裁切、缩小，并转成单色墨迹（去掉纸色、只留线条和明暗）的副本，由本站自己提供，不会从外部加载。每幅的出处和完整的许可说明见下表的链接。</p>
${pictures(true)}

<h2>第三方工具</h2>
<p>网页运行时不依赖任何第三方库，也不加载网络字体。构建用 ${vite}（MIT）和 ${ts}（Apache-2.0），测试用 ${vitest}（MIT）；打包结果里可能带有 Vite 的少量辅助代码（MIT）。</p>

<h2>测试样本</h2>
<p>代码仓库里的测试样本（<code>fixtures/samples</code>）都是本项目自己写的，或本项目生成器的输出，同样按 MIT 许可开放。</p>

<h2>隐私</h2>
<ul>
  <li>本站是纯静态网页，没有自己的服务器程序，不收集任何数据；托管服务可能按惯例记录访问日志。</li>
  <li>你的回答保存在网址里；"保存到本地"和几项界面设置（首页的选择、是否再显示贴图提示）存在你的浏览器（localStorage）；记住的游戏目录存在你的浏览器（IndexedDB）。这些都不会发送到任何地方。</li>
  <li>分享链接就是网址，里面带着你的全部回答，包括家族名。</li>
</ul>
`;

const EN = () => `
<h1>Copyright and license</h1>
<p class="lead">In short: this site's code, drawings and text are under the MIT license; everything from Crusader Kings III belongs to Paradox; the arms themselves are historical record.</p>

<h2>This site</h2>
<p>The source code, the drawings made for this site (the SVGs in <code>src/art</code>) and its text are copyright ${ext(HOLDER_LINK, HOLDER)} and released under the <strong>MIT license</strong>: you may use, copy, modify, merge, publish, sublicense and sell them, as long as the copyright and license notice below is kept with every copy. The site is provided "as is", without warranty.</p>
<p>The arms and the CK3 code you make with this site are yours to use as you like; no credit is needed.</p>
<pre>${MIT}</pre>

<h2>Crusader Kings III</h2>
<ul>
  <li>Crusader Kings III, its assets, names and trademarks belong to ${paradox}. This is an unofficial tool made by a player; it is not affiliated with, endorsed or sponsored by Paradox.</li>
  <li>This site <strong>does not host or distribute</strong> any game files. The code it writes only names vanilla textures, which your own game reads; that is why no mod is needed.</li>
  <li>"Load game textures" reads the game files on your computer; they are decoded and shown in your browser only and never uploaded. What the browser remembers is permission to that folder.</li>
  <li>The seven tincture colours in the sketch preview are converted from the game's colour definitions (<code>default_colors.txt</code>), so that the sketch matches the game.</li>
</ul>

<h2>Heraldry and history</h2>
<ul>
  <li>Historical arms, the designs described in blazon, are centuries-old historical record; a particular drawing of them is a work. The drawings on this site are original and not traced from the game's textures or anyone else's work.</li>
  <li>The "manuscript crowned lion" (Bulgaria) is the painting of the King of Bulgaria's arms in the Lord Marshal's Roll (about 1295; the Hatton–Dugdale facsimile of about 1640, Society of Antiquaries of London), turned into blocks as drawn, from the photograph at ${ext("https://heraldika-bg.org/gallery_armorial.htm", "heraldika-bg.org")}. The painting itself is in the public domain; the site keeps only the block data, not the photograph.</li>
  <li>The rules page and the examples link to Wikipedia, Wikimedia Commons and others. The content behind those links is under its own licenses (mostly CC BY-SA on Wikipedia).</li>
</ul>

<h2>Pictures</h2>
<p>The pictures at the sides of the pages are paintings from CK3's years (867–1453), in the public domain or under CC0; where a date is uncertain, the table says so. The site keeps copies taken from Wikimedia Commons — cropped, resized and turned into one-colour ink (the paper removed, lines and shading kept) — and serves them itself, so nothing is loaded from elsewhere. The links below give each one's source and full licence information.</p>
${pictures(false)}

<h2>Third-party tools</h2>
<p>The page uses no third-party libraries at run time and loads no web fonts. It is built with ${vite} (MIT) and ${ts} (Apache-2.0) and tested with ${vitest} (MIT); the built files may include a few small helpers from Vite (MIT).</p>

<h2>Test samples</h2>
<p>The repository's test samples (<code>fixtures/samples</code>) were all written for this project or made by its generator, and are under the same MIT license.</p>

<h2>Privacy</h2>
<ul>
  <li>This is a static site with no server program of its own and collects no data; the host may keep the usual access logs.</li>
  <li>Your answers live in the page address; "Save in this browser" and a few interface settings (your choices on the home page, whether to show the textures note again) use your browser's localStorage; the remembered game folder is kept in your browser's IndexedDB. None of it is sent anywhere.</li>
  <li>A share link is the page address, so it carries all your answers, family name included.</li>
</ul>
`;

export default readingView("license", () => (locale() === "zh-CN" ? ZH() : EN()));
