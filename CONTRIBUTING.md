# 参与贡献 · Contributing

*The docs are in Chinese, but English issues and pull requests are welcome. Run `pnpm install` and `pnpm dev`, and `pnpm check` before you push. Most contributions are data (a charge, a realm's arms, a translation, an example) or a new designer page; each has a recipe below, and `test/data.test.ts` tells you which step is missing. Three rules: no game files, original artwork only, and a checkable source for anything historical.*

想找事做，看 [路线图](docs/roadmap.md)。较大的改动请先开 issue。

## 环境

需要 Node 22.18 以上（`scripts/` 里的 `.ts` 直接用 node 运行）和 pnpm（版本见 `package.json` 的 `packageManager`，运行 `corepack enable` 后会自动使用）。

```sh
pnpm install
pnpm dev      # http://localhost:5173
pnpm check    # 类型检查 + 全部测试，约半分钟
```

装了 CK3 的话，可以用游戏贴图预览，并运行读取游戏文件的测试。游戏装在 Steam 默认位置时会被自动找到，否则把 `CK3_GAME` 设为 `.../Crusader Kings III/game`。Python 工具还需要 Pillow 和 numpy。没有游戏也能做大部分贡献，相关测试会自动跳过。

## 三条底线

1. **不提交游戏文件**：贴图、截图和从游戏文件导出的数据都不行。贴图文件名和从贴图量出的数字（如可见范围）可以。
2. **图案原创**：不描摹游戏贴图或别人的作品。
3. **历史内容附出处**：王国纹章、年代和纹章学规则，在 PR 里附上可核对的链接（维基、Commons 或文献）。

## 代码地图

网站只有一个页面：`?p=` 选择视图，`#` 后面归视图自己用（设计器用来存回答，阅读页用作锚点）。

每种身份和地域各有一个**设计器**，有自己的题目、答案和生成器。预览、候选、CK3 代码、保存分享、游戏贴图这些外围部分由 `src/designer/` 统一提供。核心数据是结构化的 blazon（`src/heraldry/ast.ts`），网页 SVG 和 CK3 代码都由同一份 `layout()` 结果生成：

```
答案 → generate() → 合规候选（blazon）→ layout() → SVG / CK3 代码
```

详见 [docs/design.md](docs/design.md) 和 [docs/ck3-format.md](docs/ck3-format.md)。

| 路径 | 内容 |
|---|---|
| `index.html`、`src/app.ts`、`src/view.ts` | 外壳、路由、视图接口 |
| `src/routes.ts` | 全部页面和导航顺序 |
| `src/style.css` | 版式和组件 |
| `src/theme/` | 美术：页面风格（`theme.css`）、背景画及署名（`art/`）、原创纹样（`motifs/`） |
| `src/pages/` | 阅读页：首页（分流目标在 `destinations.ts`）、示例（`example-list.ts`）、规则与出处（`sources.ts`）、版权 |
| `src/designer/` | 设计器框架：接口 `types.ts`、共用视图 `page.ts`、表单零件 `kit.ts`、保存和分享 `saved.ts` |
| `src/west/` | 西欧统治者设计器：答案与网址编码、题库、表单、生成器、元素对照 |
| `src/charges.ts` | 图案库：纹章学定义和 CK3 配方；其他贴图在 `TEX` |
| `src/art/` | 图案 SVG，一个图案一个文件，`_` 开头的是共用零件 |
| `src/realms.ts` | 各王国按年代的纹章、头衔等级 |
| `src/heraldry/` | 结构化 blazon、色彩规则、英文 blazon |
| `src/layout.ts`、`src/lint.ts` | 排版（网页和 CK3 共用）、排版检查 |
| `src/render/svg.ts` | 网页预览 |
| `src/ck3/` | CK3 代码的解析、序列化、导出；DDS 解码和游戏贴图预览 |
| `src/describe.ts`、`src/i18n/` | 用当前语言描述纹章（量词、复数）；全部界面文字 |
| `test/`、`scripts/`、`tools/` | 测试；开发脚本（Node）；Python 工具（测量和渲染游戏贴图、处理背景画） |
| `fixtures/samples/` | 测试用的 CK3 代码样本 |
| `fixtures/rolls/` | 13 世纪纹章卷的 blazon（公有领域），用来量缺口 |

## 常见改动

### 加图案

以 `rose` 为例：

1. **配方**：在 `src/charges.ts` 的 `LIST` 里加一行，写上 id、类别、英文单复数、可见范围 `bbox` 和 CK3 配方（贴图名，以及每个颜色通道对应的角色）。小图案（默认三个一组、能放在几何图形上）加 `{ small: true }`。`bbox` 和颜色通道用 `python3 tools/measure_textures.py ce_rose` 测量；没装游戏就在 PR 里写明贴图名，留给维护者测量。
2. **画图**：新建 `src/art/rose.ts`。约定见 `src/art/types.ts`，最小的例子是 `_example.ts`，画法工具在 `style.ts`。viewBox 的宽高比要和 `bbox` 一致，图形贴满；颜色只用 `c.body`、`c.armed` 等角色；风格是平涂、深色描边加少量内线。
3. **登记**：运行 `pnpm art:index` 重新生成 `src/art/index.ts`（不要手改）。
4. **名字**：在每个 `src/i18n/*.json` 的 `charge` 下加名字。中文写 `{ "n": "玫瑰", "m": "朵" }`（`m` 是量词），英文写 `{ "n": "rose", "p": "roses" }`。
5. **放进题目**：把 id 加进 `src/west/questions.ts` 的 `EMBLEM_FAMILIES`（主图案）、`ORIGIN_GROUPS`（起家方式）或 `FAITH_CHARGES`（信仰标志）。
6. **检查**：`pnpm art:sheet rose` 画出三种配色下的样张（`out/art/sheet.svg`），然后跑 `pnpm check`。

原版没有的图案可以用原版零件拼，参考 `maiden_eagle`（`src/charges.ts` 和 [design.md](docs/design.md#图案库与画法)）。

### 加或修正王国纹章

1. 在 `src/realms.ts` 的 `LIST` 里加或改 `{ id, region, periods }`。每个时期写 `from`、`to`（不含）、`arms` 和说明的 key。时期要首尾相接，最后一段不写 `to`；纹章出现之前的年代用 `before(年份)`。
2. 在 `TIER` 里写头衔等级；不能作为头衔持有的（共和国、教廷）写 `null`。
3. 在 `src/pages/sources.ts` 的 `REALM_SOURCES` 里加一个英文维基条目。
4. 在每个语言文件里加 `realm.<id>.name`，以及每个时期的说明 `realm.<id>.<key>`；没有纹章的时期共用 `realm._early`。
5. 跑 `pnpm check`。

### 加语言

1. 把 `src/i18n/en.json` 复制成 `<语言代码>.json` 并翻译，`app.langName` 填这种语言自己的名字（如 `Français`），`app.langShort` 填小按钮上的简称（如 `FR`）。
2. 在 `src/i18n/index.ts` 的 import、`Locale` 和 `CATALOGS` 三处登记。语言按钮按登记顺序轮换。
3. 跑 `pnpm check`，它会列出缺少和多余的键。
4. 量词、冠词、复数在 `src/describe.ts` 里处理，中文以外的语言默认按英文规则（单数 `n`、复数 `p`）。规则页和版权页的正文只有中英两版，其他语言显示英文版。

英文 blazon 和 CK3 代码一样，不翻译。

### 加示例

示例页的纹章由 `src/pages/example-list.ts` 里的回答实时生成。

1. 在纹章工坊里答题、选好排法，点「复制分享链接」。
2. 把 `#` 后面的参数转成 `answers`，键名见 `src/west/answers.ts` 的 `Answers`（如 `n` → `name`，`k` → `layout`）。默认值不用写。
3. 写中英文的标题和说明。如果是真实纹章，加上英文 `blazon` 和出处（维基或 Commons），和原纹章不同的地方在说明里写明。
4. 跑 `pnpm check`。`test/examples.test.ts` 会检查排法还在、没有放弃的愿望、blazon 没变。

纹章卷里的实例：用 `python3 tools/roll_gaps.py --show <特征>`（如 `--show "cross engrailed"`）在 `fixtures/rolls/` 里找，放进示例页的「纹章卷」三组，链接写卷名和编号。新支持的图案在页末的图案库里自动出现。

默认的几何图形、分割、条纹、毛皮、散布底和线条由家族名决定。示例里要用 `geom` 把它们固定下来（如 `geom: "ord:fess,line:fusilly"`），这样以后加了新的种类也不会变。

### 加设计器

规划中的设计器列在 `src/pages/destinations.ts`。

1. 照 `src/west/` 新建 `src/<id>/`：
   - `answers.ts`：答案的类型、默认值和网址编码；
   - `generate.ts`：把答案变成候选 `Result`（见 `src/designer/types.ts`）；
   - `form.ts`：题目表单，用 `src/designer/kit.ts` 的零件；
   - `index.ts`：把以上几部分组成一个 `Designer`；
   - `page.ts`：`export default designerView(…)`。
2. 在 `src/routes.ts` 里加路由，在每个语言文件里加 `app.nav.<id>`，在 `destinations.ts` 里填上 `page`。
3. 背景画已经准备好（`src/theme/art/<id>-l.webp`、`-r.webp`），视图返回 `scene: () => "<id>"` 就会使用。需要单独的框体风格时，在 `src/theme/theme.css` 里加 `body[data-view="<id>"]`。
4. 文字放在自己的前缀下（如 `clergy.q.*`），不要和西欧的 `q.*` 混用。
5. 仿照 `test/generate.test.ts` 写抽样测试，并在示例页加一两个例子。

神职和商人与西欧共用纹章规则，可以直接调用 `src/west/generate.ts`。规则完全不同的传统（tamga、家纹）可能需要扩展 `src/heraldry/ast.ts`，请先开 issue。

### 换或加背景画

要求是 867–1453 年间的作品，题材以人物或军队为主，许可为公有领域、CC0、CC BY 或 CC BY-SA（后两种要署名）。

1. 在 Wikimedia Commons 上找到原图，确认许可。
2. 以主体为中心裁成竖幅（宽高比约 0.65–0.75），去掉文字，高度不超过 1100px。页边的图宽度相同，高度由宽高比决定，越接近方形显得越矮。
3. 用 `python3 tools/ink_picture.py 裁好的图 src/theme/art/<传统>-l.webp` 转成墨迹。背景有大片深色的加 `--tone 0.3 --line 1`，石雕照片加 `--paper-offset -0.05 --tone 0.5 --line 1`。用了非默认参数的，记进 `src/theme/art/ink.json`。仓库里只放处理后的图。
4. 在 `src/theme/art/credits.ts` 里加署名：中英文名称、作者与年代、收藏地、Commons 页面、原图链接、许可。
5. 在 `src/theme/theme.css` 的 `.scene[data-scene="<传统>"]` 里设置 `--art-l` / `--art-r` 和对应的 `--ratio-l` / `--ratio-r`（宽 / 高，如 `779 / 1100`）。
6. 跑 `pnpm check`，它会检查署名和图片一一对应、CSS 里的比例和图片一致。

### 改生成器或排版

- 改动前后各跑一次 `pnpm lint:layouts 3000`，对比重叠和切边的汇总。
- `pnpm examples` 把一组固定的例子写到 `out/ex/`。装了游戏的话，用 `python3 tools/ck3_preview.py out/ex/*.txt -o out/preview.png` 渲染出来对照。
- 生成器只输出 i18n 的 key 和参数，文字放在语言文件里。
- 新的纹章机制要有历史依据：在 [design.md](docs/design.md) 里说明，并加一个示例。
- 如果改动让示例变了样，`test/examples.test.ts` 会失败。确认新结果正确后，再更新 `example-list.ts`。

## 测试

| 文件 | 内容 |
|---|---|
| `test/data.test.ts` | 数据一致性：图案都有画和名字、`src/art/index.ts` 是最新的、王国时期首尾相接且有出处、各语言的键一致、每个页面都有路由。加数据时最常失败，报错会说明缺了什么 |
| `test/examples.test.ts` | 示例页的每个例子 |
| `test/generate.test.ts` | 抽样几千组答案：结果合规、CK3 代码能解析、没有重叠和切边、文案完整 |
| `test/rules.test.ts` | 色彩规则和英文 blazon |
| `test/coa.test.ts` | CK3 代码的解析和序列化 |
| `test/dds.test.ts` | DDS 解码（需要游戏） |

## 脚本

脚本的输出都在 `out/`，不进仓库。

| 命令 | 作用 |
|---|---|
| `pnpm art:index` | 增删图案后重新生成 `src/art/index.ts` |
| `pnpm art:sheet <id...> [-o 文件]` | 图案在三种配色下的样张 |
| `pnpm art:grid <id...> [-o 文件]` | 多个图案的总览 |
| `pnpm examples [zh-CN\|en]` | 把固定的例子写到 `out/ex/` |
| `pnpm lint:layouts [数量]` | 批量检查排版并汇总 |
| `pnpm build && pnpm preview` | 构建，并在 4719 端口预览（纯静态站，任何静态托管都能放；`main` 分支通过 CI 后自动部署到 GitHub Pages） |
| `python3 tools/ck3_preview.py in.txt -o out.png` | 用游戏贴图渲染 CK3 代码 |
| `python3 tools/measure_textures.py ce_xxx [--sheet out.png]` | 测量贴图的可见范围和颜色通道 |
| `python3 tools/roll_gaps.py [--show 特征]` | 对照纹章卷统计缺口，结果见 [roll-gaps.md](docs/roll-gaps.md)；支持了新机制后改它的状态再跑 |

## 约定

- 代码和注释用英文，文档用中文。
- TypeScript 开启 `strict`，两格缩进（见 `.editorconfig`）。
- 没有运行时依赖；要加依赖请先开 issue。
- 一个 PR 只做一件事。改了界面附截图，改了历史数据附出处。
- 报告问题时附上分享链接，打开就能复现。
