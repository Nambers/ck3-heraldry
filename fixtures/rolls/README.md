# 纹章卷数据

`walford-perceval-1864.tsv`：三卷 13 世纪后期英格兰纹章卷的 blazon，每面一行。用来量生成器的缺口（`tools/roll_gaps.py`，结果见 [docs/roll-gaps.md](../../docs/roll-gaps.md)），以后也可以当 blazon 反向解析的测试数据。

**出处。** W. S. Walford & C. S. Perceval, *Three Rolls of Arms of the Latter Part of the Thirteenth Century*, London 1864（Society of Antiquaries 刊行）。原书已进入公有领域，文字取自 Internet Archive `threerollsofarms00walfrich` 的 OCR 文本。按路线图的版权约定，只有这类 19 世纪的公有领域本可以放进仓库；现代校订本只提交统计结果和引用。

| 列 | 内容 |
|---|---|
| `roll` | `C` = Walford's Roll（约 1275，盎格鲁-诺曼法语 blazon，Leland 抄本），`F` = Charles' Roll（约 1285，1864 本称 Society of Antiquaries 藏卷），`E` = St George's Roll（约 1285） |
| `no` | 1864 本的编号。引用写"卷名 + 编号"，如 Charles' Roll 77（F 77） |
| `name` | 持有者，按原书拼写 |
| `ref` | 只对 `E`：这面纹章和 `F` 卷的哪一面相同（原书只写编号，不重复 blazon） |
| `blazon` | 原书的 blazon；`C` 是法语，`F`、`E` 是 19 世纪的英语 |

**怎么来的。** 用一次性脚本按编号把 OCR 文本切开，去掉页眉、页脚和脚注，手工修正了几处 OCR 把两面粘在一起或丢了人名后逗号的地方（C 18、45、103–107、172、177，E 87–88、229–230、530–531、651–652）。文字里还留着 OCR 错误（如 `Kon` 是 `lion`）和原书括号里的校勘注，`tools/roll_gaps.py` 在读入时统一处理，这里不改动原文。

**已知缺口。** E 卷有 5 个编号没切出来（118、200、215、234、265：OCR 把编号认错，内容并进了前一面；其中 199–200、214–215 在原书里本来就是两人共用一面），12 面只剩人名或无法辨认的编号；F 卷有 2 面原书就残缺（F 1、F 161）。
