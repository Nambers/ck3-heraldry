# CK3 纹章代码：已知事实

依据：CK3 1.20.1.2 的游戏文件。`tools/ck3_preview.py` 按下列规则渲染过一些现成的代码（国旗这类可以直接对照的图案，以及由大量旋转、拉伸零件拼成的图），结果都符合预期，但还没有和游戏内截图逐像素比对过。

## 格式

```
coa_rd_dynasty_123={
pattern="pattern__solid_designer.dds"
color1=red
colored_emblem={
color1=white
color2=yellow
texture="ce_eagle.dds"
instance={
position={ 0.500000 0.470000 }
scale={ 0.720000 0.720000 }
depth=3.010000
rotation=90
}
}
}
```

- 坐标系：整面纹章是 0..1 的正方形，原点在左上，y 轴向下。盾形由游戏的外框遮罩裁出（`gfx/interface/coat_of_arms/frames/dynasty_mask.dds` 等）。
- `instance` 的默认值：`position` 为 0.5 0.5，`scale` 为 1 1，`depth` 为 0，`rotation` 为 0。设计器导出时会省略默认值。
- `scale` 为 1 时，贴图铺满整面纹章；负值表示镜像。
- 变换顺序：**先旋转贴图，再沿盾面的横竖两轴缩放**。所以压扁的图案旋转后不会变成斜着的长条。
- `rotation` 单位是度，顺时针。
- `depth` 越大越靠后。设计器导出的值是"序号 + 0.01"，最前面的一层省略 depth。
- 同一个 `colored_emblem` 可以有多个 `instance`，每个 instance 的 depth 各自独立。
- 颜色：命名色（`common/named_colors/default_colors.txt` 里的 red、blue、yellow、green、black、white、purple、orange、grey、brown、blue_light、green_light、yellow_light、red_dark、blue_dark），或者 `rgb { r g b }`。

## 贴图通道

- **colored emblem**：A 通道是形状；B 通道是 color1 加明暗（overlay 混合）；G 通道是 color2 的遮罩；R 通道是 color3 的遮罩。
- **pattern**：R 通道恒为 1（color1）；G 通道是 color2 的遮罩；B 通道是 color3 的遮罩；没有透明度。
- 贴图格式：DXT5 编码的 DDS。emblem 多为 256×256，部分是 512×512；pattern 是 128×128。

## 本项目用到的原版贴图

完整清单和量出来的可见范围在 `src/charges.ts`：图案在 `LIST`，其余在 `TEX`。测试会在本机装有游戏时，核对每个贴图名都存在。下面只列不太直观的几点：

| 用途 | 贴图 | 备注 |
|---|---|---|
| 纯色底 | `pattern__solid_designer.dds` | 设计器默认用这个；`pattern_solid.dds` 在设计器里是隐藏的 |
| 左右分 / 上下分 | `pattern_vertical_split_01` / `pattern_horizontal_split_01` | color1 在左 / 在上 |
| 横条纹（六道 / 八道）、方格 | `pattern_barry_06`、`pattern_barruly_08`、`pattern_checkers_06` | color1 在顶 / 左上 |
| 色块、盾头、角区 | `ce_block_02.dds` | 铺满自身方框 |
| 横带、竖带 | `ce_ordinary_fess_5`、`ce_ordinary_pale_5` | 带宽 0.2，居中 |
| 斜带、反斜带、斜十字 | `ce_ordinary_bend_dexter_5` 等 | 沿对角线，垂直宽度约 0.2 |
| 山形带 | `ce_ordinary_chevron_5` | 上沿 y = .215 + \|x − .5\|，竖直厚度 .285 |
| 倒三角（pile） | `ce_ordinary_pile` | 只到盾面中心，导出时竖向拉长 1.6 倍 |
| 斜短带（baton） | `ce_bendlet` 旋转 90° 并缩小 | 旋转时用等比缩放，避开"先转后缩"的变形 |
| 斜分、斜十字分 | `ce_per_bend`、`ce_per_saltire` | per_bend 的 color1 在右上；反斜分 = per_bend 旋转 90° 并交换颜色 |
| 白鼬皮 | `ce_ermine` | color1 底、color2 斑点；只用作纯色底和盾头、角区，不用于图案 |
| 四条竖带（阿拉贡） | `ce_ordinary_pales_4` | |
| 两道横条、三道山形细带、叉形带 | `ce_ordinary_bars_2`、`ce_ordinary_chevron_3`、`ce_ordinary_pall_5` | 横条 y .2–.4、.6–.8；山形细带顶点 y .05/.375/.7，厚 .16 |
| 带线条的几何图形和分割 | `ce_cross_engrailed` 等，见 [design.md](design.md#线条与细带) | 和直线版本占同样位置；锯齿盾头用只有透明通道的 `ce_chief_indented_alpha` |
| 三尖带 | `ce_label_03` | 横跨全宽，原图 y 范围 .113–.355，导出时压进顶部空带 |
| 小盾 | `ce_escutcheon` | 可见范围 x .195–.805，y .141–.859；y ≥ .45 起两侧收窄，每隔 .05 量的左边缘在 `TEX.escutcheon.edge`，小盾里的方块按它切成横条 |

不能用作叠加层的：`ce_chief.dds` 是双色贴图，会盖满整个盾面，所以盾头改用 `ce_block_02` 来画。没有能贴合各种外框的盾缘（bordure）：王朝外框两侧是波浪形，各级头衔的外框形状也不一样，所以不做盾缘。

几个颜色通道容易弄错：

- `ce_sword_simple` 的 color2 是剑身，color1 是剑柄。
- `ce_keys_crossed` 的 color2 是其中一把钥匙。
- `ce_tree` 的 color2 是树叶。
- `ce_stag` 的 color2 是鹿角和蹄。

## 进游戏验证清单

本地预览只是按上面的规则重新实现了一遍，下面这些需要进游戏确认。用网页生成代码，在纹章设计器里点「粘贴」：

1. 粘贴能成功，开头的 `coa_rd_dynasty_<数字>` 这个键名不影响导入。
2. 盾头、四分这类方块拼出来的区域，接缝处没有细缝。
3. 胸前的小盾（`ce_escutcheon` 加一层稍大的黑色描边）看起来正常。小盾里有分割或横带、竖带、十字时（如阿拉贡、匈牙利、卡斯蒂利亚-莱昂），切成横条的方块沿弧线收窄，不露出小盾外面；阶梯感能不能接受。
4. 少女鹰：遮盖鹰头的圆片没有露边，脸、头发、冠的位置合适，地图上缩小显示时还能认出来。
5. 粘贴后在游戏里改动任意一层，没有东西跑位。项目生成的代码不使用镜像，但少女鹰的头发用了 180° 旋转。
6. 四分时下排两区的图案没有被盾底的弧线切掉（不同等级头衔的外框形状不一样）。
7. 王朝纹章和家族（house）纹章都试一下，确认代码应该贴到哪里。
8. 新增的几何图形和盾面分割：山形带、倒三角（拉长过）、斜短带（旋转过）、反斜分（旋转过的 per_bend）、白鼬皮。
9. 法兰西古纹章的散布百合花：边缘被裁切的百合花是否正常，图层数（约 20 个）会不会卡。
10. 线条变体（锯齿盾头、锯齿上下分、云纹斜分、弧齿边十字等）和细带（两道横条、三道山形细带、叉形带）在游戏里的位置和颜色。
