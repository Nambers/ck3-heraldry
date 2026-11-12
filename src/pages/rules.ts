// Rules and sources: every rule the generator follows, what kind of rule it
// is, and where to check it. The colour and realm tables come from the data
// the site actually uses, so they cannot drift from it.

import { fmt, realmName } from "../describe.ts";
import { TINCTURE, TINCTURES, isMetal } from "../heraldry/tincture.ts";
import { locale, t } from "../i18n/index.ts";
import { REALMS, REALM_IDS, realmTier } from "../realms.ts";
import { ext, readingView, wiki } from "./shell.ts";
import { CAPO_SOURCE, CK3_WIKI, LATE_SOURCES, REALM_SOURCES } from "./sources.ts";

const zh = () => locale() === "zh-CN";
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const w = (title: string) => wiki(title, title.replace(/_/g, " "));

function tinctureTable(): string {
  const rows = [...TINCTURES, "ermine" as const]
    .map((k) => {
      const x = TINCTURE[k];
      const kind = k === "ermine" ? (zh() ? "毛皮（按金属处理）" : "fur (treated as a metal)") : isMetal(k) ? (zh() ? "金属" : "metal") : zh() ? "颜色" : "colour";
      return `<tr><td><span class="swatch" style="background:${x.svg}"></span>${esc(t(`tinct.${k}`))} <i>${x.en}</i></td><td>${kind}</td><td><code>${x.ck3}</code></td><td><code>${x.svg}</code></td></tr>`;
    })
    .join("");
  const h = zh() ? ["颜色", "类别", "CK3 颜色名", "数值"] : ["Tincture", "Kind", "CK3 colour", "Value"];
  return `<div class="tablewrap"><table><thead><tr>${h.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function realmTable(): string {
  const years = (from: number, to?: number) => (from === 0 ? `– ${to}` : to ? `${from}–${to}` : `${from} –`);
  const rows = REALM_IDS.map((id) => {
    const r = REALMS[id];
    const tier = realmTier(id);
    const periods = r.periods
      .map((p) => `<div><b>${years(p.from, p.to)}</b> ${esc(fmt({ key: `realm.${id}.${p.key}`, p: { r: { realm: id } } }))}</div>`)
      .join("");
    return `<tr><td>${esc(realmName(id))}<br><small>${tier ? esc(t(`q.rank.opt.${tier}`)) : "—"}</small></td><td>${periods}</td><td>${w(REALM_SOURCES[id])}</td></tr>`;
  }).join("");
  const h = zh() ? ["王国 / 诸侯（头衔等级）", "各时期的纹章", "可以核对的资料"] : ["Realm (title tier)", "Arms by period", "To check"];
  return `<div class="tablewrap"><table><thead><tr>${h.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

const ZH = () => `
<h1>规则与出处</h1>
<p class="lead">本站用到的规则分四类：纹章学规则、历史资料、CK3 的技术限制、本站自己的约定。下面逐条写明本站怎么做，以及可以去哪里核对。</p>
<p>勾选右上角的"不考虑历史真实性"后，色彩规则、年代和爵位的限制会解除（见文末）；CK3 的技术限制和本站约定不受影响。</p>

<h2>一、纹章学规则</h2>
<div class="tablewrap"><table>
<thead><tr><th>规则</th><th>本站怎么做</th><th>出处</th></tr></thead><tbody>
<tr><td>色彩规则：金属（金、银）不叠金属，颜色（红、蓝、黑、绿、紫）不叠颜色</td><td>颜色按角色分配（底色、图案色、细部色），生成时就不会违反；测试再逐一检查。白鼬皮按金属处理</td><td>${w("Rule_of_tincture")}、${w("Tincture_(heraldry)")}、${w("Ermine_(heraldry)")}</td></tr>
<tr><td>色彩规则的例外</td><td>跨在分割线上的图案不检查；历史纹章按原样使用，即使它本身违规（耶路撒冷的金十字在银底上，安茹-西西里的红色三尖带在蓝底上）。结果里有违规之处时会注明：英法纹章学把这样的纹章叫 armes fausses（错误的纹章）或 armes à enquérir（引人追问的纹章），违规被看作请人追问来历的邀请</td><td>${w("Rule_of_tincture")}、${w("Jerusalem_cross")}</td></tr>
<tr><td>几何图形与线条</td><td>横带、竖带、斜带、山形带、十字、斜十字、叉形带、内框、盾头、角区；线条有弧齿边、锯齿、大锯齿、城垛、云纹，只用在 CK3 有对应贴图的地方</td><td>${w("Ordinary_(heraldry)")}、${w("Line_(heraldry)")}、${w("Chief_(heraldry)")}、${w("Canton_(heraldry)")}、${w("Pall_(heraldry)")}</td></tr>
<tr><td>盾面分割与条纹</td><td>左右分、上下分、斜分、四分、斜十字分、八等分、条纹、方格、菱格</td><td>${w("Division_of_the_field")}、${w("Variation_of_the_field")}</td></tr>
<tr><td>图案的数量与排列</td><td>三个图案默认两上一下；宽的图案（如正面行狮）竖排，高的横排；也有斜排三个、六个（三二一）</td><td>${w("Charge_(heraldry)")}</td></tr>
<tr><td>区分标记（英格兰体系）</td><td>长子或分支用三尖带，次子到五子用新月、五角星、燕、圆环；私生一脉用斜短带</td><td>${w("Cadency")}、${w("Label_(heraldry)")}、${w("Bend_(heraldry)")}</td></tr>
<tr><td>组合：四分、中盾、胸前小盾</td><td>两面纹章排 1、4 / 2、3；三面排 1、4 / 2 / 3；最多四面。1370 年起两面纹章也可以左右对分，尊位在左；1435 年起五、六面分六区（上下两排各三区），单数时第一面在最后一区重复</td><td>${w("Marshalling_(heraldry)")}、${w("Impalement_(heraldry)")}、${w("Inescutcheon")}、${ext(LATE_SOURCES.impalement!, "Gelre 纹章卷 f. 62r")}、${ext(LATE_SOURCES.quarterlyOfSix!, "剑桥王后学院：勒内的六区纹章")}</td></tr>
<tr><td>领地纹章</td><td>伯爵、公爵把家族纹章放在第 1、4 区；国王、皇帝把领地放前面，家族纹章作中盾；神圣罗马皇帝可以把家族纹章放在帝国鹰胸前</td><td>${w("Arms_of_dominion")}、${w("Coat_of_arms_of_the_Holy_Roman_Empire")}</td></tr>
<tr><td>宣称纹章</td><td>把宣称的王国纹章放在鹰胸前的小盾、正中的小盾，或四分进来</td><td>${w("Inescutcheon")}</td></tr>
<tr><td>荣誉增补与恩赐纹章</td><td>立功的家族得到带领主纹章的角区；或领主用自己的图案组成新纹章，家族纹章作中盾（1433 年的贡扎加家族）</td><td>${w("Augmentation_of_honour")}、${w("House_of_Gonzaga")}</td></tr>
<tr><td>领主盾头（capo）</td><td>意大利的做法：盾头放领主的纹章</td><td>${ext(CAPO_SOURCE, "Capo dell'Impero（意大利文维基）")}</td></tr>
<tr><td>同一王国里纹章不能重复</td><td>和收录的王国纹章完全相同时，对调底色和图案色</td><td>${w("Scrope_v_Grosvenor")}</td></tr>
<tr><td>朝圣徽记</td><td>圣地亚哥 → 扇贝；罗马 → 交叉钥匙；耶路撒冷 → 耶路撒冷十字</td><td>${w("Pilgrim_badge")}、${w("Jerusalem_cross")}</td></tr>
<tr><td>图案没有固定含义</td><td>寓意由持有者自己定；"红色代表勇气"这类说法是后人附会，本站不用</td><td>${w("Tincture_(heraldry)")}</td></tr>
</tbody></table></div>

<h2>二、历史资料：各王国和诸侯的纹章</h2>
<p>下表就是本站使用的数据，年份多为约数。每行附一个可以核对的维基百科条目。早于最早纹章的年份，本站先借用最早的纹章，并提示时代不符。</p>
${realmTable()}

<h2>三、CK3 的技术限制</h2>
<ul>
  <li><b>只用原版贴图。</b>生成的代码只写游戏自带的贴图文件名，所以不需要 mod。出处：游戏的 <code>gfx/coat_of_arms</code> 文件夹；${ext(CK3_WIKI.coa, "CK3 维基：Coat of arms modding")}。</li>
  <li><b>颜色。</b>七种纹章颜色对应游戏的命名颜色（<code>common/named_colors/default_colors.txt</code>），网页预览用的是同一组数值：</li>
</ul>
${tinctureTable()}
<ul>
  <li><b>小盾。</b>CK3 不能裁切图层，所以只有能用方块拼出来的纹章才放上小盾（纯色、左右分、上下分、四分、条纹、方格、横带、竖带、十字、四条竖带、内框、盾头、角区）；小盾里的方块按从 <code>ce_escutcheon</code> 量出的轮廓切成横条。</li>
  <li><b>图层数。</b>每面纹章保持在 150 层以内。</li>
  <li><b>爵位与头衔。</b>CK3 里爵位就是你最高的头衔，所以先列出同级或更低的头衔；更高的折叠在下面，选了会提示它在 CK3 里会让你升级。出处：${ext(CK3_WIKI.titles, "CK3 维基：Titles")}。</li>
  <li><b>冠和头衔框</b>由游戏按头衔等级画在盾外，不画进纹章。</li>
</ul>

<h2>四、本站的约定（不是纹章学规则）</h2>
<ul>
  <li>家族名决定默认的几何图形、分割方式和线条，让不同存档的结果不一样。</li>
  <li>图案不互相重叠，不压到盾头、角区、几何图形上，也不被盾边切掉；每次改动都用排版检查跑几千组答案。</li>
  <li>区分标记放不下时宁可放弃，也不叠在别的图案上。</li>
  <li>组合的区数按年代开放：平时最多四区，1435 年起六区，勾选「不考虑历史真实性」时八区。这不是 CK3 的限制，而是照史料：到 15 世纪初（Gelre 纹章卷，约 1370–1414）没有超过四区的组合，纹章多了是在一区里再分；最早的六区是昂儒的勒内 1435 年起用的；1453 年以前没有找到八区。区里再四分只在领地纹章本身已四分时出现（卡斯蒂利亚-莱昂）。</li>
  <li>候选最多 16 个，按"放弃的愿望少 → 风格偏好 → 排法顺序"排序；恩赐纹章最多两个，优先家族纹章最简单的。</li>
  <li>元素对照表里标"自动"的部分纯属装饰，没有含义。</li>
</ul>

<h2>"不考虑历史真实性"解除了什么</h2>
<div class="tablewrap"><table>
<thead><tr><th>限制</th><th>平时</th><th>勾选后</th></tr></thead><tbody>
<tr><td>年代</td><td>王国按年份给纹章，早于最早纹章时提示时代不符</td><td>任何年份都用最接近的纹章，不提示</td></tr>
<tr><td>晚期才有的做法</td><td>年份到了才用：1370 年起左右对分；组合四区，1435 年起六区（头衔最多 3 个，1435 年起 5 个）</td><td>任何年份都能用：左右对分，组合最多八区（头衔最多 7 个）</td></tr>
</tbody></table></div>
<p>超出爵位的头衔、违反色彩规则的配色不用勾选：它们折叠在各自题目的下面，展开就能选。违反色彩规则的纹章真实存在（英法纹章学叫 armes à enquérir），并不算不符合历史，所以不归这个勾选框管。CK3 的技术限制（第三节）和本站的约定（第四节）不受影响。</p>
`;

const EN = () => `
<h1>Rules and sources</h1>
<p class="lead">The rules this site follows are of four kinds: heraldic rules, historical record, CK3's technical limits, and this site's own conventions. Each is listed below with what the site does and where to check it.</p>
<p>Ticking "Ignore historical accuracy" (top right) lifts the rule of tincture and the limits of period and rank (see the end of this page); CK3's limits and the site's conventions stay.</p>

<h2>1. Heraldic rules</h2>
<div class="tablewrap"><table>
<thead><tr><th>Rule</th><th>What the site does</th><th>Sources</th></tr></thead><tbody>
<tr><td>Rule of tincture: no metal (Or, argent) on metal, no colour (gules, azure, sable, vert, purpure) on colour</td><td>Tinctures are assigned by role (field, charge, details), so the generator cannot break the rule; the tests check every result again. Ermine counts as a metal</td><td>${w("Rule_of_tincture")}, ${w("Tincture_(heraldry)")}, ${w("Ermine_(heraldry)")}</td></tr>
<tr><td>Exceptions to the rule of tincture</td><td>Charges lying across a partition line are not checked; historical arms are used as they are even when they break it (Jerusalem's gold cross on silver, Anjou-Sicily's red label on blue). Where the result breaks the rule, it says so: English and French heralds call such arms armes fausses (false arms) or armes à enquérir (arms of inquiry), a breach being an invitation to ask how it came about</td><td>${w("Rule_of_tincture")}, ${w("Jerusalem_cross")}</td></tr>
<tr><td>Ordinaries and lines</td><td>Fess, pale, bend, chevron, cross, saltire, pall, orle, chief, canton; lines engrailed, indented, dancetty, embattled and nebuly, only where CK3 has a texture for them</td><td>${w("Ordinary_(heraldry)")}, ${w("Line_(heraldry)")}, ${w("Chief_(heraldry)")}, ${w("Canton_(heraldry)")}, ${w("Pall_(heraldry)")}</td></tr>
<tr><td>Divisions and variations of the field</td><td>Per pale, per fess, per bend, quarterly, per saltire, gyronny, barry, chequy, lozengy</td><td>${w("Division_of_the_field")}, ${w("Variation_of_the_field")}</td></tr>
<tr><td>Number and arrangement of charges</td><td>Three are two and one by default; wide charges (lions passant) can go in pale, tall ones in fess; also three in bend and six (three, two and one)</td><td>${w("Charge_(heraldry)")}</td></tr>
<tr><td>Cadency (the English system)</td><td>A label for the eldest son or a cadet line; crescent, mullet, martlet and annulet for the second to fifth sons; a baton sinister for an illegitimate line</td><td>${w("Cadency")}, ${w("Label_(heraldry)")}, ${w("Bend_(heraldry)")}</td></tr>
<tr><td>Marshalling: quarters, escutcheons</td><td>Two coats go 1 and 4 / 2 and 3; three go 1 and 4 / 2 / 3; four at most. From 1370 two coats may also be impaled, the more honourable on the dexter; from 1435 five or six coats go in six quarters (two rows of three), an odd one out repeating the first in the last</td><td>${w("Marshalling_(heraldry)")}, ${w("Impalement_(heraldry)")}, ${w("Inescutcheon")}, ${ext(LATE_SOURCES.impalement!, "Gelre Armorial, f. 62r")}, ${ext(LATE_SOURCES.quarterlyOfSix!, "Queens' College, Cambridge: René's six quarters")}</td></tr>
<tr><td>Arms of dominion</td><td>Counts and dukes keep the family arms in the 1st and 4th quarters; kings and emperors put the realms first with the family arms en surtout; a Holy Roman Emperor may bear the family arms on the imperial eagle's breast</td><td>${w("Arms_of_dominion")}, ${w("Coat_of_arms_of_the_Holy_Roman_Empire")}</td></tr>
<tr><td>Arms of pretension</td><td>A claimed realm's arms on the eagle's breast, on an escutcheon over all, or quartered</td><td>${w("Inescutcheon")}</td></tr>
<tr><td>Augmentations and grants</td><td>A canton of the liege's arms for great service, or a new coat built from the liege's charge with the family arms en surtout (the Gonzaga, 1433)</td><td>${w("Augmentation_of_honour")}, ${w("House_of_Gonzaga")}</td></tr>
<tr><td>Chief of the liege (capo)</td><td>An Italian custom: the liege's arms on a chief</td><td>${ext(CAPO_SOURCE, "Capo dell'Impero (Italian Wikipedia)")}</td></tr>
<tr><td>No two families in a realm with the same arms</td><td>If a result equals a known realm's arms, field and charge colours are swapped</td><td>${w("Scrope_v_Grosvenor")}</td></tr>
<tr><td>Pilgrims' badges</td><td>Santiago → scallop; Rome → crossed keys; Jerusalem → Jerusalem cross</td><td>${w("Pilgrim_badge")}, ${w("Jerusalem_cross")}</td></tr>
<tr><td>Charges have no fixed meaning</td><td>The bearer gives them their meaning; "red stands for courage" and the like are later inventions, not used here</td><td>${w("Tincture_(heraldry)")}</td></tr>
</tbody></table></div>

<h2>2. Historical record: the arms of realms</h2>
<p>This table is the data the site uses; most years are approximate. Each row links a Wikipedia article to check against. Before a realm's first known arms, the site borrows those first arms and points out the anachronism.</p>
${realmTable()}

<h2>3. CK3's technical limits</h2>
<ul>
  <li><b>Vanilla textures only.</b> The code names only textures that ship with the game, so no mod is needed. Sources: the game's <code>gfx/coat_of_arms</code> folder; ${ext(CK3_WIKI.coa, "CK3 wiki: Coat of arms modding")}.</li>
  <li><b>Colours.</b> The seven tinctures map to the game's named colours (<code>common/named_colors/default_colors.txt</code>); the sketch preview uses the same values:</li>
</ul>
${tinctureTable()}
<ul>
  <li><b>Small shields.</b> CK3 cannot clip layers, so only arms that can be built from plain blocks go on an escutcheon (plain, per pale, per fess, quarterly, barry, chequy, fess, pale, cross, four pallets, orle, chief, canton); blocks inside it are cut into strips along the outline measured from <code>ce_escutcheon</code>.</li>
  <li><b>Layers.</b> Fewer than 150 per coat.</li>
  <li><b>Rank and titles.</b> In CK3 your rank is your highest title, so the titles of your tier or below come first; higher ones are folded away below, and picking one says that CK3 would raise you to it. Source: ${ext(CK3_WIKI.titles, "CK3 wiki: Titles")}.</li>
  <li><b>Crowns and title frames</b> are drawn by the game outside the shield, by title tier; they are not part of the arms.</li>
</ul>

<h2>4. This site's conventions (not heraldic rules)</h2>
<ul>
  <li>The family name picks the default ordinary, division and line, so different games get different results.</li>
  <li>Charges never overlap each other, never lie on a chief, canton or ordinary they do not belong to, and are never cut off by the edge; a layout check runs thousands of answer sets after every change.</li>
  <li>When there is no room for a cadency mark it is dropped rather than laid over something else.</li>
  <li>How many quarters a marshalled coat may have opens by period: four normally, six from 1435, eight with “Ignore historical accuracy” ticked. This is not a CK3 limit but follows the record: up to the early 15th century (the Gelre Armorial, c. 1370–1414) no coat has more than four quarters, and with more arms a quarter is divided again; the earliest six are René of Anjou's, from 1435; no eight has been found before 1453. A quarter is quartered again only when a realm's own arms already are (Castile and León).</li>
  <li>At most 16 layouts, ordered by fewest dropped wishes, then style preference, then layout order; at most two grants, preferring the simplest family arms.</li>
  <li>Elements marked "Auto" in the "What it stands for" table are decoration only.</li>
</ul>

<h2>What "Ignore historical accuracy" lifts</h2>
<div class="tablewrap"><table>
<thead><tr><th>Limit</th><th>Normally</th><th>Ticked</th></tr></thead><tbody>
<tr><td>Period</td><td>Realms get the arms of the year; before their first arms the anachronism is pointed out</td><td>Every year gets the nearest arms, without remark</td></tr>
<tr><td>Later practices</td><td>Used from their year: impalement from 1370; four quarters, six from 1435 (three titles at most, five from 1435)</td><td>Any year: impalement, up to eight quarters (seven titles)</td></tr>
</tbody></table></div>
<p>Titles above your rank and colours against the rule of tincture need no box: they are folded away under their questions, to be opened and picked. Arms against the rule of tincture did exist (English and French heralds call them armes à enquérir), so they are not unhistorical and this box leaves them alone. CK3's limits (section 3) and the site's conventions (section 4) stay.</p>
`;

export default readingView("rules", () => (zh() ? ZH() : EN()));
