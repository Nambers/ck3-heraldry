// The examples page (?p=examples): real arms the site can reproduce, and one
// example of each practice it knows. Each example is a set of answers plus the
// layout to pick; test/examples.test.ts checks that the generator still offers
// that layout and, for real arms, still gives the same blazon.
//
// To add one: find the answers in the designer, copy the share link, and turn
// its parameters into `answers` (the keys are those of Answers in
// src/west/answers.ts; `layout` is the `k` parameter).

import type { Answers } from "../west/answers.ts";
import { CAPO_SOURCE } from "./sources.ts";

export type Text = { zh: string; en: string };

export type Link =
  /** an English Wikipedia article title */
  | { wiki: string }
  /** a Wikimedia Commons file name (without "File:") */
  | { commons: string }
  | { href: string; label: Text };

export interface Example {
  /** anchor on the page; unique */
  id: string;
  title: Text;
  note: Text;
  answers: Partial<Answers> & { layout: string };
  /** for real arms: the blazon the site must keep producing */
  blazon?: string;
  links: Link[];
}

export interface Section {
  id: string;
  title: Text;
  intro?: Text;
  examples: Example[];
}

export const SECTIONS: Section[] = [
  {
    id: "history",
    title: { zh: "历史上的纹章", en: "Historical arms" },
    intro: {
      zh: "本站能复现的真实纹章。和原版不一样的地方写在说明里。几何图形、分割、条纹、毛皮和线条默认由家族名决定，也可以在「几何图形与线条」里直接指定。",
      en: "Real arms the site can reproduce; where ours differ from the original, the note says so. The ordinary, division, stripes, fur and line follow the family name unless chosen under “Geometry and lines”.",
    },
    examples: [
      {
        id: "bulgaria",
        title: { zh: "保加利亚国王（Lord Marshal's Roll，约 1295）", en: "King of Bulgaria (Lord Marshal's Roll, c. 1295)" },
        note: {
          zh: "黑底银色立狮，戴金冠：英格兰的 Lord Marshal's Roll（约 1295 年）记下的「保加利亚国王」（le Rey de Bugrie）的纹章。这是西欧纹章官的记录，保加利亚人自己并不用西式纹章。人脸、细身、S 形长尾的狮子是按约 1640 年的摹本原样转成方块拼出来的，网页预览和 CK3 里画的是同一组方块。主图案选「手抄本戴冠立狮」，配色选黑底银图案。",
          en: "Sable, a lion rampant argent crowned Or: the arms of “le Rey de Bugrie”, King of Bulgaria, in the English Lord Marshal's Roll (c. 1295). A Western herald's record: the Bulgarians did not bear Western arms themselves. The lion, with its human face, thin body and long S-shaped tail, is turned block by block from the c. 1640 copy of the roll; the preview and CK3 draw the same blocks. Choose the manuscript lion as the main charge, silver on black.",
        },
        answers: { name: "Bulgaria", year: 1300, origin: "none", emblem: "lion_manuscript", palette: "sable/argent", layout: "single#0" },
        blazon: "Sable, a lion rampant argent, crowned Or",
        links: [{ wiki: "Coat_of_arms_of_Bulgaria" }],
      },
      {
        id: "gonzaga",
        title: { zh: "曼托瓦的贡扎加家族（1433）", en: "Gonzaga of Mantua (1433)" },
        note: {
          zh: "1433 年皇帝西吉斯蒙德封 Gianfrancesco I 为曼托瓦侯爵，赐给他新纹章：银底红十字，四角各一只黑鹰，原来的家族纹章作中盾。在本站选领主神圣罗马帝国、事迹「为领主立功」，就会得到这种恩赐纹章。原版的中盾还和波希米亚四分。",
          en: "In 1433 Emperor Sigismund made Gianfrancesco I Marquess of Mantua and granted him new arms: a red cross between four black eagles on silver, with the old family arms on an escutcheon. Choose the Holy Roman Empire as liege and “service to the liege” as deed to get such a grant. The original escutcheon also quarters Bohemia.",
        },
        answers: { name: "Gianfrancesco I Gonzaga", year: 1430, liege: "hre", origin: "none", emblem: "none", deed: "service", palette: "or/sable", geom: "var:barry", layout: "varied-barry#g" },
        blazon: "Argent, a cross gules between four eagles displayed sable, armed gules; over all an escutcheon of the family arms (Barry of six sable and Or)",
        links: [{ commons: "Arms_of_Gianfrancesco_I_Gonzaga,_Marquess_of_Mantua.svg" }, { wiki: "House_of_Gonzaga" }],
      },
      {
        id: "frederick-iii",
        title: { zh: "哈布斯堡皇帝腓特烈三世", en: "Emperor Frederick III (Habsburg)" },
        note: {
          zh: "持有神圣罗马帝国的皇帝可以用帝国双头鹰，胸前托家族纹章，这里是奥地利的红底银横带。",
          en: "An emperor holding the Holy Roman Empire may bear the imperial double-headed eagle with his own arms on its breast — here Austria, gules a fess argent.",
        },
        answers: { name: "Österreich", year: 1440, origin: "none", emblem: "none", rank: "emperor", titles: ["hre"], palette: "gules/argent", layout: "ordinary-fess#1" },
        blazon: "Or, a double-headed eagle displayed sable, armed gules and nimbed Or, bearing on its breast an escutcheon of the family arms (Gules, a fess argent)",
        links: [{ commons: "CoA_Frederick_III_of_Habsburg.svg" }, { wiki: "Frederick_III,_Holy_Roman_Emperor" }],
      },
      {
        id: "bourbon-spain",
        title: { zh: "西班牙波旁王朝的小纹章（1700 年起）", en: "Lesser arms of the Spanish Bourbons (from 1700)" },
        note: {
          zh: "国王把领地纹章放在前面：卡斯蒂利亚-莱昂四分，家族纹章（安茹的蓝底三金百合）作中盾。原版还有格拉纳达和安茹的红色镶边。本站的年份只到 1453 年，所以这里填的是 1440。",
          en: "A king puts his realms first: Castile-León quarterly, with the family arms (Anjou, three gold lilies on blue) en surtout. The original adds Granada and Anjou's red bordure. The site's years stop at 1453, hence 1440 here.",
        },
        answers: { name: "Bourbon", year: 1440, origin: "none", emblem: "fleur", rank: "king", titles: ["castile"], palette: "azure/or", layout: "single#0" },
        blazon:
          "Quarterly: 1 and 4, Gules, a castle Or, ported and windowed azure; 2 and 3, Argent, a lion rampant purpure (for León); over all an escutcheon of the family arms (Azure, three fleurs-de-lis Or)",
        links: [{ commons: "Lesser_Royal_Coat_of_Arms_of_Spain_(1700-1868_and_1834-1930)_Pillars_of_Hercules_Variant.svg" }, { wiki: "Coat_of_arms_of_Spain" }],
      },
      {
        id: "courtenay",
        title: { zh: "库特奈家族", en: "Courtenay" },
        note: {
          zh: "金底三个红圆。法国一支出过君士坦丁堡的拉丁皇帝，英格兰一支是德文伯爵。红色的圆在英语纹章里有专名 torteau。",
          en: "Three red roundels on gold. The French line gave Constantinople Latin emperors; the English line were Earls of Devon. A red roundel has its own name in English blazon: a torteau.",
        },
        answers: { name: "Courtenay", year: 1200, origin: "none", emblem: "roundel", palette: "or/gules", layout: "single#0" },
        blazon: "Or, three torteaux",
        links: [{ wiki: "House_of_Courtenay" }],
      },
      {
        id: "percy",
        title: { zh: "珀西家族（诺森伯兰）", en: "Percy (Northumberland)" },
        note: { zh: "金底蓝色立狮。", en: "A blue lion rampant on gold." },
        answers: { name: "Percy", year: 1300, origin: "none", emblem: "lion_rampant", palette: "or/azure", layout: "single#0" },
        blazon: "Or, a lion rampant azure",
        links: [{ wiki: "Percy_family" }],
      },
      {
        id: "zahringen",
        title: { zh: "策林根家族", en: "Zähringen" },
        note: { zh: "金底红鹰。", en: "A red eagle on gold." },
        answers: { name: "Zähringen", year: 1200, origin: "none", emblem: "eagle", palette: "or/gules", layout: "single#0" },
        blazon: "Or, an eagle displayed gules",
        links: [{ wiki: "House_of_Zähringen" }],
      },
      {
        id: "este",
        title: { zh: "埃斯特家族（费拉拉）", en: "Este (Ferrara)" },
        note: { zh: "蓝底银鹰。后来的鹰戴金冠。", en: "A silver eagle on blue; later the eagle is crowned gold." },
        answers: { name: "Este", year: 1250, origin: "none", emblem: "eagle", palette: "azure/argent", layout: "single#0" },
        blazon: "Azure, an eagle displayed argent",
        links: [{ wiki: "House_of_Este" }],
      },
      {
        id: "clare",
        title: { zh: "克莱尔家族（格洛斯特伯爵）", en: "de Clare (Earls of Gloucester)" },
        note: {
          zh: "金底三道红色山形细带（chevronels）。没有图案时，几何图形默认由家族名决定，这里在「几何图形与线条」里指定了三道山形细带。",
          en: "Three red chevronels on gold. With no charge the ordinary follows the family name by default; here the chevronels are chosen under “Geometry and lines”.",
        },
        answers: { name: "Clare", year: 1250, origin: "none", emblem: "none", palette: "or/gules", geom: "ord:chevronels", layout: "ordinary-chevronels#0" },
        blazon: "Or, three chevronels gules",
        links: [{ wiki: "De_Clare" }],
      },
      {
        id: "stafford",
        title: { zh: "斯塔福德家族", en: "Stafford" },
        note: { zh: "金底红色山形带。", en: "A red chevron on gold." },
        answers: { name: "Nicholas de Stafford", year: 1300, origin: "none", emblem: "none", palette: "or/gules", layout: "ordinary-chevron#0" },
        blazon: "Or, a chevron gules",
        links: [{ wiki: "Baron_Stafford" }],
      },
      {
        id: "neville",
        title: { zh: "内维尔家族", en: "Neville" },
        note: { zh: "红底银色斜十字。", en: "A silver saltire on red." },
        answers: { name: "Neville", year: 1300, origin: "none", emblem: "none", palette: "gules/argent", layout: "ordinary-saltire#0" },
        blazon: "Gules, a saltire argent",
        links: [{ wiki: "Neville_family" }],
      },
      {
        id: "fitzgerald",
        title: { zh: "菲茨杰拉德家族（基尔代尔、德斯蒙德伯爵）", en: "FitzGerald (Earls of Kildare and Desmond)" },
        note: { zh: "银底红色斜十字，和内维尔正好颜色相反。", en: "A red saltire on silver — Neville's colours reversed." },
        answers: { name: "Fitzgerald", year: 1300, origin: "none", emblem: "none", palette: "argent/gules", layout: "ordinary-saltire#0" },
        blazon: "Argent, a saltire gules",
        links: [{ wiki: "FitzGerald_dynasty" }],
      },
      {
        id: "grimaldi",
        title: { zh: "格里马尔迪家族（热那亚，后来的摩纳哥）", en: "Grimaldi (Genoa, later Monaco)" },
        note: {
          zh: "银红菱格。原版的菱格更窄（fusily），本站用普通菱格。",
          en: "Lozengy silver and red. The original's lozenges are narrower (fusily); the site uses plain lozengy.",
        },
        answers: { name: "Grimaldi of Genoa", year: 1300, origin: "none", emblem: "none", palette: "argent/gules", layout: "varied-lozengy#0" },
        blazon: "Lozengy argent and gules",
        links: [{ wiki: "House_of_Grimaldi" }],
      },
    ],
  },
  {
    id: "rolls-charges",
    title: { zh: "纹章卷：图案", en: "Rolls of arms: charges" },
    intro: {
      zh: "取自 13 世纪后期英格兰的三卷纹章卷（Walford & Perceval 1864 年刊本），每面都由本站准确复现，链接指向刊本，写明卷名和编号。这一组按图案各举一例，全部图案见页末的图案库。",
      en: "From three English rolls of arms of the later 13th century (the 1864 edition by Walford and Perceval), each reproduced exactly by the site; the links name the roll and the number. One example per charge; every charge is in the library at the end of the page.",
    },
    examples: [
      {
        id: "cantilupe",
        title: { zh: "坎蒂卢普家族", en: "Cantilupe" },
        note: {
          zh: "红底三朵金色百合花：Charles' Roll 里的 George de Cantilupe。小图案默认三个，两上一下排列。",
          en: "Three gold fleurs-de-lis on red: George de Cantilupe in Charles' Roll. Small charges come three by default, two above one.",
        },
        answers: { name: "Cantilupe", year: 1285, origin: "none", emblem: "fleur", palette: "gules/or", layout: "single#0" },
        blazon: "Gules, three fleurs-de-lis Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 60 面（Walford & Perceval 1864）", en: "Charles' Roll no. 60 (Walford & Perceval 1864)" } }],
      },
      {
        id: "monthermer",
        title: { zh: "蒙瑟默家族", en: "Monthermer" },
        note: {
          zh: "金底一只绿鹰。原文还写明喙和爪是红色（beaked and membered gules），本站的鹰爪默认就是红色。",
          en: "A green eagle on gold. The roll adds a red beak and claws (beaked and membered gules); the site's eagle has red claws by default.",
        },
        answers: { name: "Monthermer", year: 1285, origin: "none", emblem: "eagle", palette: "or/vert", layout: "single#0" },
        blazon: "Or, an eagle displayed vert",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 50 面（Walford & Perceval 1864）", en: "Charles' Roll no. 50 (Walford & Perceval 1864)" } }, { wiki: "Ralph_de_Monthermer,_1st_Baron_Monthermer" }],
      },
      {
        id: "patric",
        title: { zh: "帕特里克", en: "Patric" },
        note: {
          zh: "红底三颗金星。这几卷里的星（mullet）不另说明就是六角的（1864 年刊本的凡例），所以选六角星。",
          en: "Three gold stars on red. In these rolls a mullet has six points unless stated (the 1864 editors' note), so the six-pointed star is chosen.",
        },
        answers: { name: "Patric", year: 1285, origin: "none", emblem: "mullet6", palette: "gules/or", layout: "single#0" },
        blazon: "Gules, three mullets of six points Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 93 面（Walford & Perceval 1864）", en: "Charles' Roll no. 93 (Walford & Perceval 1864)" } }],
      },
      {
        id: "quincy",
        title: { zh: "温切斯特伯爵（昆西家族）", en: "Earl of Winchester (Quincy)" },
        note: {
          zh: "红底六个金色镂空菱形（mascle），三二一排列。小图案还可以选六个。",
          en: "Six gold mascles (voided lozenges) on red, three, two and one. Small charges can also come six.",
        },
        answers: { name: "Quincy", year: 1285, origin: "none", emblem: "mascle", palette: "gules/or", layout: "six#0" },
        blazon: "Gules, six mascles Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 27 面（Walford & Perceval 1864）", en: "Charles' Roll no. 27 (Walford & Perceval 1864)" } }, { wiki: "Earl_of_Winchester" }],
      },
      {
        id: "lemoine",
        title: { zh: "勒穆瓦纳", en: "le Moine" },
        note: {
          zh: "蓝底六只金色无足燕（martlet）。",
          en: "Six gold martlets on blue.",
        },
        answers: { name: "le Moine", year: 1285, origin: "none", emblem: "martlet", palette: "azure/or", layout: "six#0" },
        blazon: "Azure, six martlets Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 144 面（Walford & Perceval 1864）", en: "Charles' Roll no. 144 (Walford & Perceval 1864)" } }],
      },
      {
        id: "plessis",
        title: { zh: "普莱西", en: "Plessis" },
        note: {
          zh: "银底六个红色圆环（annulet）。",
          en: "Six red annulets on silver.",
        },
        answers: { name: "Plessis", year: 1285, origin: "none", emblem: "annulet", palette: "argent/gules", layout: "six#0" },
        blazon: "Argent, six annulets gules",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "St George's Roll 第 294 面（Walford & Perceval 1864）", en: "St George's Roll no. 294 (Walford & Perceval 1864)" } }],
      },
      {
        id: "musard",
        title: { zh: "缪萨尔", en: "Musard" },
        note: {
          zh: "红底三个银色圆片。圆片按颜色有专名：银色叫 plate，金色叫 bezant，红色叫 torteau。",
          en: "Three silver roundels on red. Roundels are named by colour: a silver one is a plate, gold a bezant, red a torteau.",
        },
        answers: { name: "Musard", year: 1285, origin: "none", emblem: "roundel", palette: "gules/argent", layout: "single#0" },
        blazon: "Gules, three plates",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 350 面（Walford & Perceval 1864）", en: "Charles' Roll no. 350 (Walford & Perceval 1864)" } }],
      },
      {
        id: "hurst",
        title: { zh: "赫斯特", en: "Hurst" },
        note: {
          zh: "蓝底三把银斧。",
          en: "Three silver axes on blue.",
        },
        answers: { name: "Hurst", year: 1285, origin: "none", emblem: "axe", palette: "azure/argent", layout: "single#0" },
        blazon: "Azure, three axes argent",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 355 面（Walford & Perceval 1864）", en: "Charles' Roll no. 355 (Walford & Perceval 1864)" } }],
      },
      {
        id: "stone",
        title: { zh: "斯通", en: "Stone" },
        note: {
          zh: "银底一头黑色正面行狮（lion passant guardant），和英格兰王室纹章里的三头狮是同一种姿态。",
          en: "A black lion passant guardant on silver, the pose of the three lions of England.",
        },
        answers: { name: "Stone", year: 1285, origin: "none", emblem: "lion_passant_guardant", palette: "argent/sable", layout: "single#0" },
        blazon: "Argent, a lion passant guardant sable",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 172 面（Walford & Perceval 1864）", en: "Charles' Roll no. 172 (Walford & Perceval 1864)" } }],
      },
      {
        id: "arundel",
        title: { zh: "阿伦德尔伯爵", en: "Earl of Arundel" },
        note: {
          zh: "红底一头金色立狮。",
          en: "A gold lion rampant on red.",
        },
        answers: { name: "Arundel", year: 1285, origin: "none", emblem: "lion_rampant", palette: "gules/or", layout: "single#0" },
        blazon: "Gules, a lion rampant Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 24 面（Walford & Perceval 1864）", en: "Charles' Roll no. 24 (Walford & Perceval 1864)" } }, { wiki: "Earl_of_Arundel" }],
      },
    ],
  },
  {
    id: "rolls-ordinaries",
    title: { zh: "纹章卷：几何图形与线条", en: "Rolls of arms: ordinaries and lines" },
    intro: {
      zh: "取自 13 世纪后期英格兰的三卷纹章卷（Walford & Perceval 1864 年刊本），每面都由本站准确复现，链接指向刊本，写明卷名和编号。这一组是几何图形、线条，以及几何图形周围和上面的图案。",
      en: "From three English rolls of arms of the later 13th century (the 1864 edition by Walford and Perceval), each reproduced exactly by the site; the links name the roll and the number. Ordinaries, lines, and charges around and on them.",
    },
    examples: [
      {
        id: "ufford",
        title: { zh: "阿福德", en: "Ufford" },
        note: {
          zh: "黑底金色弧齿边十字（cross engrailed）。在「几何图形与线条」里选十字和弧齿边。",
          en: "A gold cross engrailed on black. Choose the cross and the engrailed line under “Geometry and lines”.",
        },
        answers: { name: "Ufford", year: 1285, origin: "none", emblem: "none", palette: "sable/or", geom: "ord:cross,line:engrailed", layout: "ordinary-cross#0" },
        blazon: "Sable, a cross engrailed Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 75 面（Walford & Perceval 1864）", en: "Charles' Roll no. 75 (Walford & Perceval 1864)" } }],
      },
      {
        id: "vavasour",
        title: { zh: "瓦瓦苏", en: "Vavasour" },
        note: {
          zh: "银底蓝色大锯齿横带（fess dancetty），加红色三尖带作区分。本站的三尖带是三个尖，纹章卷里一律五个。",
          en: "A blue fess dancetty on silver, with a red label for difference. The site's label has three points; in these rolls it always has five.",
        },
        answers: { name: "Vavasour", year: 1285, origin: "none", emblem: "none", palette: "argent/azure", geom: "ord:fess,line:dancetty", cadency: "label", layout: "ordinary-fess#0" },
        blazon: "Argent, a fess dancetty azure; a label of three points gules",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "St George's Roll 第 638 面（Walford & Perceval 1864）", en: "St George's Roll no. 638 (Walford & Perceval 1864)" } }],
      },
      {
        id: "percy-fusils",
        title: { zh: "珀西家族的早期纹章（约 1285）", en: "Percy, the earlier arms (c. 1285)" },
        note: {
          zh: "St George's Roll 里的 Henry de Perci：蓝底金色菱形连缀横带（原文 five fusils in fess），后来才改用上面的立狮。在「几何图形与线条」里选横带和菱形连缀。原版贴图有七个菱形，比原文多两个。",
          en: "Henry de Perci in St George's Roll: five gold fusils conjoined in fess on blue, before the family took the lion above. Choose the fess and the fusilly line under “Geometry and lines”. The vanilla texture has seven fusils, two more than the roll.",
        },
        answers: { name: "Percy", year: 1285, origin: "none", emblem: "none", palette: "azure/or", geom: "ord:fess,line:fusilly", layout: "ordinary-fess#0" },
        blazon: "Azure, a fess fusilly Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "St George's Roll 第 110 面（Walford & Perceval 1864）", en: "St George's Roll no. 110 (Walford & Perceval 1864)" } }, { wiki: "Percy_family" }],
      },
      {
        id: "walrond",
        title: { zh: "沃尔隆", en: "Walrond" },
        note: {
          zh: "银底红色菱形连缀斜带（bend fusily）。斜带版的菱形比横带版的宽一倍。",
          en: "A red bend fusily on silver. The fusils of the bend are about twice a plain bend's width.",
        },
        answers: { name: "Walrond", year: 1285, origin: "none", emblem: "none", palette: "argent/gules", geom: "ord:bend,line:fusilly", layout: "ordinary-bend#0" },
        blazon: "Argent, a bend fusilly gules",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 76 面（Walford & Perceval 1864）", en: "Charles' Roll no. 76 (Walford & Perceval 1864)" } }],
      },
      {
        id: "harcourt",
        title: { zh: "哈考特家族", en: "Harcourt" },
        note: {
          zh: "金底两道红色横条。没有图案时才会出现，周围放不下图案。",
          en: "Two red bars on gold. Offered only without charges: there is no room around them.",
        },
        answers: { name: "Harcourt", year: 1285, origin: "none", emblem: "none", palette: "or/gules", geom: "ord:bars", layout: "ordinary-bars#0" },
        blazon: "Or, two bars gules",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 61 面（Walford & Perceval 1864）", en: "Charles' Roll no. 61 (Walford & Perceval 1864)" } }, { wiki: "House_of_Harcourt" }],
      },
      {
        id: "baskerville",
        title: { zh: "巴斯克维尔", en: "Baskerville" },
        note: {
          zh: "银底红色山形带，周围三个红色圆片（torteaux）。周围放几个由几何图形定：山形带、横带三个，十字、斜十字四个，斜带、竖带两个。",
          en: "A red chevron between three torteaux on silver. How many go around depends on the ordinary: three for a chevron or fess, four for a cross or saltire, two for a bend or pale.",
        },
        answers: { name: "Baskerville", year: 1285, origin: "none", emblem: "roundel", palette: "argent/gules", geom: "ord:chevron,line:plain", layout: "between-chevron#0" },
        blazon: "Argent, a chevron gules between three torteaux",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 123 面（Walford & Perceval 1864）", en: "Charles' Roll no. 123 (Walford & Perceval 1864)" } }],
      },
      {
        id: "boutevilain",
        title: { zh: "布特维兰", en: "Boutevilain" },
        note: {
          zh: "银底红色横带，周围三弯红色新月。",
          en: "A red fess between three red crescents on silver.",
        },
        answers: { name: "Boutevilain", year: 1285, origin: "none", emblem: "crescent", palette: "argent/gules", geom: "ord:fess,line:plain", layout: "between-fess#0" },
        blazon: "Argent, a fess gules between three crescents gules",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "St George's Roll 第 400 面（Walford & Perceval 1864）", en: "St George's Roll no. 400 (Walford & Perceval 1864)" } }],
      },
      {
        id: "traily",
        title: { zh: "特雷利", en: "Traily" },
        note: {
          zh: "金底红十字，四角各一只红色无足燕。",
          en: "A red cross between four red martlets on gold.",
        },
        answers: { name: "Traily", year: 1285, origin: "none", emblem: "martlet", palette: "or/gules", geom: "ord:cross,line:plain", layout: "between-cross#0" },
        blazon: "Or, a cross gules between four martlets gules",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 193 面（Walford & Perceval 1864）", en: "Charles' Roll no. 193 (Walford & Perceval 1864)" } }],
      },
      {
        id: "kennion",
        title: { zh: "肯尼恩", en: "Kennion" },
        note: {
          zh: "蓝底银十字，四角各一头银色立狮。",
          en: "A silver cross between four silver lions rampant on blue.",
        },
        answers: { name: "Kennion", year: 1285, origin: "none", emblem: "lion_rampant", palette: "azure/argent", geom: "ord:cross,line:plain", layout: "between-cross#0" },
        blazon: "Azure, a cross argent between four lions rampant argent",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 456 面（Walford & Perceval 1864）", en: "Charles' Roll no. 456 (Walford & Perceval 1864)" } }],
      },
      {
        id: "mortimer-escallops",
        title: { zh: "莫蒂默（亨利）", en: "Mortimer (Henry)" },
        note: {
          zh: "银底蓝十字，十字上五枚银色扇贝。十字和斜十字上放五个，其他几何图形上放三个。",
          en: "A blue cross with five silver escallops on silver. A cross or saltire bears five, other ordinaries three.",
        },
        answers: { name: "Mortimer", year: 1285, origin: "none", emblem: "escallop", palette: "argent/azure", geom: "ord:cross,line:plain", layout: "on-cross#0" },
        blazon: "Argent, on a cross azure five escallops argent",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 382 面（Walford & Perceval 1864）", en: "Charles' Roll no. 382 (Walford & Perceval 1864)" } }],
      },
    ],
  },
  {
    id: "rolls-fields",
    title: { zh: "纹章卷：盾面", en: "Rolls of arms: fields" },
    intro: {
      zh: "取自 13 世纪后期英格兰的三卷纹章卷（Walford & Perceval 1864 年刊本），每面都由本站准确复现，链接指向刊本，写明卷名和编号。这一组是分割、条纹、毛皮和散布底。",
      en: "From three English rolls of arms of the later 13th century (the 1864 edition by Walford and Perceval), each reproduced exactly by the site; the links name the roll and the number. Divisions, stripes, furs and semé.",
    },
    examples: [
      {
        id: "warenne",
        title: { zh: "萨里伯爵（瓦伦家族）", en: "Earl of Surrey (Warenne)" },
        note: {
          zh: "蓝金方格。在「几何图形与线条」里选方格。",
          en: "Chequy blue and gold. Choose chequy under “Geometry and lines”.",
        },
        answers: { name: "Warenne", year: 1285, origin: "none", emblem: "none", palette: "azure/or", geom: "var:chequy", layout: "varied-chequy#0" },
        blazon: "Chequy azure and Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 16 面（Walford & Perceval 1864）", en: "Charles' Roll no. 16 (Walford & Perceval 1864)" } }, { wiki: "Earl_of_Surrey" }],
      },
      {
        id: "atholl",
        title: { zh: "阿瑟尔伯爵", en: "Earl of Atholl" },
        note: {
          zh: "金黑相间的六道竖条纹（paly）。",
          en: "Paly of six gold and black.",
        },
        answers: { name: "Atholl", year: 1285, origin: "none", emblem: "none", palette: "or/sable", geom: "var:paly", layout: "varied-paly#0" },
        blazon: "Paly of six Or and sable",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 22 面（Walford & Perceval 1864）", en: "Charles' Roll no. 22 (Walford & Perceval 1864)" } }, { wiki: "Earl_of_Atholl" }],
      },
      {
        id: "grey",
        title: { zh: "格雷", en: "Grey" },
        note: {
          zh: "银蓝相间的六道横条纹（barry）。",
          en: "Barry of six silver and blue.",
        },
        answers: { name: "Grey", year: 1285, origin: "none", emblem: "none", palette: "argent/azure", geom: "var:barry", layout: "varied-barry#0" },
        blazon: "Barry of six argent and azure",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 183 面（Walford & Perceval 1864）", en: "Charles' Roll no. 183 (Walford & Perceval 1864)" } }],
      },
      {
        id: "soleni",
        title: { zh: "索莱尼", en: "Soleni" },
        note: {
          zh: "银红四分。在「几何图形与线条」里选四分。",
          en: "Quarterly silver and red. Choose quarterly under “Geometry and lines”.",
        },
        answers: { name: "Soleni", year: 1285, origin: "none", emblem: "none", palette: "argent/gules", geom: "div:quarterly,line:plain", layout: "division-quarterly#0" },
        blazon: "Quarterly argent and gules",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 469 面（Walford & Perceval 1864）", en: "Charles' Roll no. 469 (Walford & Perceval 1864)" } }],
      },
      {
        id: "ferrers",
        title: { zh: "费勒斯家族（德比伯爵）", en: "Ferrers (Earls of Derby)" },
        note: {
          zh: "金红两色的松鼠皮（vairy）。松鼠皮是毛皮，画成一排排交错的钟形。在「几何图形与线条」里选松鼠皮。",
          en: "Vairy gold and red. Vair is a fur, drawn as rows of interlocking bell shapes. Choose vair under “Geometry and lines”.",
        },
        answers: { name: "Ferrers", year: 1285, origin: "none", emblem: "none", palette: "or/gules", geom: "fur:vairy", layout: "fur-vairy#0" },
        blazon: "Vairy Or and gules",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 20 面（Walford & Perceval 1864）", en: "Charles' Roll no. 20 (Walford & Perceval 1864)" } }, { wiki: "Ferrers_family" }],
      },
      {
        id: "marmion",
        title: { zh: "马米恩家族", en: "Marmion" },
        note: {
          zh: "松鼠皮底上一道红色横带。只说 vair 时专指银蓝两色；毛皮上可以放任何颜色。在「几何图形与线条」里选横带和松鼠皮，配色选银蓝，横带自动用第三种颜色。",
          en: "A red fess on vair. Plain “vair” always means silver and blue; anything may lie on a fur. Choose the fess and vair under “Geometry and lines” with silver and blue: the fess takes a third colour.",
        },
        answers: { name: "Marmion", year: 1285, origin: "none", emblem: "none", palette: "argent/azure", geom: "ord:fess,fur:vairy", layout: "fur-fess-vairy#0" },
        blazon: "Vair, a fess gules",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 58 面（Walford & Perceval 1864）", en: "Charles' Roll no. 58 (Walford & Perceval 1864)" } }, { wiki: "Baron_Marmion" }],
      },
      {
        id: "audley",
        title: { zh: "奥德利家族", en: "Audley" },
        note: {
          zh: "红底金色网格（fretty）：交叉的细斜带铺满盾面。在「几何图形与线条」里选网格。",
          en: "Red, fretty gold: crossing narrow bands over the whole field. Choose fretty under “Geometry and lines”.",
        },
        answers: { name: "Audley", year: 1285, origin: "none", emblem: "none", palette: "gules/or", geom: "fur:fretty", layout: "fur-fretty#0" },
        blazon: "Gules fretty Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 95 面（Walford & Perceval 1864）", en: "Charles' Roll no. 95 (Walford & Perceval 1864)" } }, { wiki: "Baron_Audley" }],
      },
      {
        id: "braose",
        title: { zh: "布劳斯家族", en: "Braose" },
        note: {
          zh: "蓝底散布金色十字端十字（crusilly），一头金色立狮。散布的图案和主图案同色，主图案压在上面，被挡住的只露出一部分。在「几何图形与线条」里选散布十字。",
          en: "Blue crusilly gold, a gold lion rampant. The powdering takes the main charge's colour and lies beneath it, partly hidden. Choose crosslets under “Geometry and lines”.",
        },
        answers: { name: "Braose", year: 1285, origin: "none", emblem: "lion_rampant", palette: "azure/or", geom: "semy:cross_crosslet", layout: "semy-cross_crosslet#0" },
        blazon: "Azure crusilly Or, a lion rampant Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 187 面（Walford & Perceval 1864）", en: "Charles' Roll no. 187 (Walford & Perceval 1864)" } }, { wiki: "House_of_Braose" }],
      },
      {
        id: "kokesey",
        title: { zh: "科克西", en: "Kokesey" },
        note: {
          zh: "红底散布银色十字端十字，一道银色横带。散布的图案和压在上面的几何图形同色。",
          en: "Red crusilly silver, a silver fess: the powdering takes the colour of what lies on it.",
        },
        answers: { name: "Kokesey", year: 1285, origin: "none", emblem: "none", palette: "gules/argent", geom: "ord:fess,semy:cross_crosslet", layout: "semy-fess-cross_crosslet#0" },
        blazon: "Gules crusilly argent, a fess argent",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 277 面（Walford & Perceval 1864）", en: "Charles' Roll no. 277 (Walford & Perceval 1864)" } }],
      },
      {
        id: "coudray",
        title: { zh: "库德雷", en: "Coudray" },
        note: {
          zh: "红底散布金色长方块（billetty），什么都不加。",
          en: "Red billetty gold, with nothing else.",
        },
        answers: { name: "Coudray", year: 1285, origin: "none", emblem: "none", palette: "gules/or", geom: "semy:billet", layout: "semy-billet#0" },
        blazon: "Gules billetty Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Charles' Roll 第 319 面（Walford & Perceval 1864）", en: "Charles' Roll no. 319 (Walford & Perceval 1864)" } }],
      },
      {
        id: "eu",
        title: { zh: "厄伯爵（布列讷家族）", en: "Counts of Eu (Brienne)" },
        note: {
          zh: "蓝底散布金色长方块（billetty），一头金色立狮。在「几何图形与线条」里选散布长方块。",
          en: "Blue billetty gold, a gold lion rampant. Choose billets under “Geometry and lines”.",
        },
        answers: { name: "Brienne", year: 1275, origin: "none", emblem: "lion_rampant", palette: "azure/or", geom: "semy:billet", layout: "semy-billet#0" },
        blazon: "Azure billetty Or, a lion rampant Or",
        links: [{ href: "https://archive.org/details/threerollsofarms00walfrich", label: { zh: "Walford's Roll 第 27 面（Walford & Perceval 1864）", en: "Walford's Roll no. 27 (Walford & Perceval 1864)" } }, { wiki: "Counts_of_Eu" }],
      },
    ],
  },
  {
    id: "liege",
    title: { zh: "领主与恩赐", en: "Liege and reward" },
    intro: { zh: "以下的家族纹章是生成的，不对应真实家族。", en: "From here on the family arms are generated and belong to no real family." },
    examples: [
      {
        id: "liege-arms",
        title: { zh: "沿用领主的颜色和图案", en: "The liege's colours and charge" },
        note: {
          zh: "配色选「领主」，主图案选「领主的图案」。这里的领主是波希米亚，于是用红底和银色双尾狮。",
          en: "Choose “liege” for the colours and “the liege's charge” as emblem. With Bohemia as liege, that is red with the silver double-tailed lion.",
        },
        answers: { name: "Rosenberg", year: 1300, liege: "bohemia", origin: "none", emblem: "liege", palette: "liege", layout: "three-fess#0" },
        links: [{ wiki: "Coat_of_arms_of_Bohemia" }],
      },
      {
        id: "capo",
        title: { zh: "吉伯林派的帝国盾头（capo）", en: "A Ghibelline chief of the Empire (capo)" },
        note: {
          zh: "意大利支持皇帝的吉伯林派家族在盾头放帝国的鹰。领主选神圣罗马帝国，就会出现这种排法。",
          en: "Italian Ghibelline families, the emperor's party, put the imperial eagle in chief. Choose the Holy Roman Empire as liege to be offered it.",
        },
        answers: { year: 1300, liege: "hre", origin: "none", emblem: "tower", palette: "liege", layout: "capo#0" },
        links: [{ href: CAPO_SOURCE, label: { zh: "维基（意大利文）", en: "Wikipedia (Italian)" } }],
      },
      {
        id: "augmentation",
        title: { zh: "英格兰国王恩赐的角区", en: "A canton of England (augmentation of honour)" },
        note: {
          zh: "为领主立过功的家族，在角区加上领主的纹章。事迹选「为领主立功」。",
          en: "For service to the liege, a canton of the liege's arms. Choose “service to the liege” as deed.",
        },
        answers: { year: 1350, liege: "england", origin: "none", emblem: "boar", deed: "service", palette: "argent/sable", layout: "single#0" },
        links: [{ wiki: "Augmentation_of_honour" }],
      },
    ],
  },
  {
    id: "titles",
    title: { zh: "头衔与宣称", en: "Titles and claims" },
    examples: [
      {
        id: "count-dominion",
        title: { zh: "伯爵持有佛兰德与荷兰", en: "A count holding Flanders and Holland" },
        note: {
          zh: "伯爵、公爵把家族纹章放在第 1、4 区，持有的领地按点选顺序排在后面（领地纹章）。",
          en: "Counts and dukes put their family arms in the 1st and 4th quarters and their lands after them, in the order chosen (arms of dominion).",
        },
        answers: { year: 1300, origin: "none", emblem: "lion_rampant", rank: "count", titles: ["flanders", "holland"], palette: "argent/sable", layout: "single#0" },
        links: [{ wiki: "Arms_of_dominion" }],
      },
      {
        id: "king-surtout",
        title: { zh: "国王持有匈牙利与波兰", en: "A king of Hungary and Poland" },
        note: {
          zh: "国王、皇帝把领地纹章放在前面，家族纹章作正中的小盾（en surtout）。",
          en: "Kings and emperors put their realms first and their family arms on an escutcheon in the middle (en surtout).",
        },
        answers: { name: "Lackland", year: 1370, origin: "none", emblem: "mullet", rank: "king", titles: ["hungary", "poland"], palette: "azure/or", layout: "single#0" },
        links: [{ wiki: "Inescutcheon" }],
      },
      {
        id: "tsar-bulgaria",
        title: { zh: "保加利亚沙皇宣称拜占庭（14 世纪）", en: "A Tsar of Bulgaria claiming Byzantium (14th century)" },
        note: {
          zh: "伊凡·亚历山大（1331–1371 在位）自称「保加利亚人和希腊人的沙皇」。这里持有保加利亚、宣称拜占庭：1、4 区是保加利亚的狮子，2、3 区是巴列奥略王朝的双头鹰，家族纹章作中盾。中盾的蓝底金太阳由玩家自己定，保加利亚的王朝并不用西式的家族纹章。爵位选国王，头衔选保加利亚，宣称选拜占庭。",
          en: "Ivan Alexander (r. 1331–1371) styled himself Tsar of the Bulgarians and Greeks. Holding Bulgaria and claiming Byzantium: Bulgaria's lion in the 1st and 4th quarters, the Palaiologan double-headed eagle in the 2nd and 3rd, the family arms on an escutcheon. The gold sun on blue is the player's own: the Bulgarian dynasties bore no Western family arms. Rank king, title Bulgaria, claim Byzantium.",
        },
        answers: { name: "Shishman", year: 1340, rank: "king", titles: ["bulgaria"], claim: "byzantium", origin: "none", emblem: "sun", palette: "azure/or", layout: "single#0" },
        links: [{ wiki: "Ivan_Alexander_of_Bulgaria" }, { wiki: "Coat_of_arms_of_Bulgaria" }],
      },
      {
        id: "claim-breast",
        title: { zh: "宣称西西里：小盾放在少女鹰胸前", en: "Claiming Sicily on a maiden-eagle's breast" },
        note: {
          zh: "本站最初的设想：少女鹰胸前托着宣称的西西里纹章，信仰标志 Chi-Rho 和起家的城堡放在盾头。原版没有少女鹰，导出时用鹰、新月、圆片和小冠拼出来。",
          en: "The idea the site began with: a maiden-eagle bearing the claimed arms of Sicily, with the Chi-Rho and the family's castles in chief. CK3 has no maiden-eagle; the export builds one from an eagle, a crescent, a disc and a small crown.",
        },
        answers: { name: "Hauteville", year: 1250, emblem: "maiden_eagle", faith: "chi_rho", claim: "sicily", palette: "gules/argent", layout: "chief#0" },
        links: [{ wiki: "Inescutcheon" }],
      },
      {
        id: "claim-quartered",
        title: { zh: "宣称法国：与王国纹章四分", en: "Claiming France: quartering the realm" },
        note: {
          zh: "宣称的王国纹章也可以四分进来。1340 年英格兰的爱德华三世就这样宣称法国王位，不过他把法国放在第 1 区。",
          en: "A claimed realm can also be quartered. Edward III of England did so for France in 1340, though he put France in the first quarter.",
        },
        answers: { name: "Valence", year: 1340, origin: "none", emblem: "lion_rampant", claim: "france", palette: "azure/argent", layout: "single#0" },
        links: [{ wiki: "Royal_coat_of_arms_of_England" }],
      },
    ],
  },
  {
    id: "deeds",
    title: { zh: "事迹", en: "Deeds" },
    examples: [
      {
        id: "crusade",
        title: { zh: "十字军：十字端十字", en: "Crusade: crosses crosslet" },
        note: { zh: "参加过十字军的家族，在盾上加十字端十字。", en: "A family that went on crusade adds crosses crosslet." },
        answers: { name: "Crusader", year: 1190, origin: "none", emblem: "lion_passant_guardant", deed: "crusade", palette: "azure/or", layout: "chief#0" },
        links: [{ wiki: "Crosses_in_heraldry" }],
      },
      {
        id: "santiago",
        title: { zh: "圣地亚哥朝圣：扇贝", en: "Pilgrimage to Santiago: escallops" },
        note: { zh: "去圣地亚哥-德孔波斯特拉的朝圣者带回扇贝。", en: "Pilgrims to Santiago de Compostela brought home a scallop shell." },
        answers: { name: "Peregrino", year: 1250, origin: "none", emblem: "tower", deed: "pilgrimage_santiago", palette: "vert/argent", layout: "chief#0" },
        links: [{ wiki: "Escallop" }, { wiki: "Pilgrim_badge" }],
      },
      {
        id: "rome",
        title: { zh: "罗马朝圣：交叉的钥匙", en: "Pilgrimage to Rome: crossed keys" },
        note: { zh: "罗马朝圣者的徽记是圣彼得的两把钥匙。", en: "The badge of Rome's pilgrims was St Peter's two keys." },
        answers: { name: "Romeo", year: 1300, origin: "none", emblem: "boar", deed: "pilgrimage_rome", palette: "sable/or", layout: "canton#0" },
        links: [{ wiki: "Keys_of_Heaven" }, { wiki: "Pilgrim_badge" }],
      },
      {
        id: "jerusalem",
        title: { zh: "耶路撒冷朝圣：耶路撒冷十字", en: "Pilgrimage to Jerusalem: the Jerusalem cross" },
        note: { zh: "耶路撒冷十字：大十字端十字，四角各一个小十字。", en: "The Jerusalem cross: a cross potent between four crosslets." },
        answers: { name: "Palmer", year: 1200, origin: "none", emblem: "stag", deed: "pilgrimage_jerusalem", palette: "azure/argent", layout: "high-base#0" },
        links: [{ wiki: "Jerusalem_cross" }],
      },
    ],
  },
  {
    id: "cadency",
    title: { zh: "区分标记", en: "Cadency" },
    intro: {
      zh: "英格兰的做法：同一家族的不同成员在纹章上加小标记来区分。区分标记永远不会和别的图案重叠。",
      en: "The English way: members of one family add a small mark to tell their arms apart. A mark never overlaps another charge.",
    },
    examples: [
      {
        id: "label",
        title: { zh: "长子或分支：三尖带", en: "Eldest son or cadet branch: a label" },
        note: { zh: "三尖带（label）横在盾面顶部。", en: "The label runs across the top of the shield." },
        answers: { year: 1350, origin: "none", emblem: "mullet", cadency: "label", palette: "sable/argent", layout: "single#0" },
        links: [{ wiki: "Cadency" }],
      },
      {
        id: "crescent",
        title: { zh: "次子：新月", en: "Second son: a crescent" },
        note: {
          zh: "次子用新月，三子五角星，四子燕，五子圆环。",
          en: "A crescent for the second son, a mullet for the third, a martlet for the fourth, an annulet for the fifth.",
        },
        answers: { name: "Secundus", year: 1350, origin: "none", emblem: "griffin", cadency: "crescent", palette: "argent/vert", layout: "single#0" },
        links: [{ wiki: "Cadency" }],
      },
      {
        id: "baton",
        title: { zh: "私生一脉：斜短带", en: "A bastard line: the baton sinister" },
        note: {
          zh: "斜短带压在整个盾面上，从观者看是右上到左下。",
          en: "The baton lies over everything, running from the viewer's upper right to lower left.",
        },
        answers: { name: "FitzRoy", year: 1350, origin: "none", emblem: "lion_rampant_crowned", cadency: "baton", palette: "azure/or", layout: "single#0" },
        links: [{ wiki: "Bend_sinister" }],
      },
    ],
  },
  {
    id: "rules",
    title: { zh: "形式与规则", en: "Form and rules" },
    examples: [
      {
        id: "lines",
        title: { zh: "带线条的几何图形", en: "Lines of partition" },
        note: {
          zh: "几何图形和分割可以带弧齿边、锯齿、大锯齿、城垛、云纹，横带和斜带还可以由菱形连缀而成；只用在 CK3 原版有贴图的地方。默认由家族名决定，也可以在「几何图形与线条」里指定，这里是城垛斜带。",
          en: "Ordinaries and divisions may be engrailed, indented, dancetty, embattled or nebuly, and a fess or bend may be fusilly — only where CK3 has the texture. The family name decides unless you choose under “Geometry and lines”; here, a bend embattled.",
        },
        answers: { name: "Ondes", year: 1300, origin: "none", emblem: "none", palette: "azure/or", geom: "ord:bend,line:embattled", layout: "ordinary-bend#0" },
        links: [{ wiki: "Line_(heraldry)" }],
      },
      {
        id: "clash",
        title: { zh: "撞车：哈布斯堡与荷兰", en: "A clash: Habsburg and Holland" },
        note: {
          zh: "哈布斯堡家族早期的纹章是金底红狮，和荷兰伯国一模一样。本站不让家族纹章和收录的王国纹章相同，撞上时对调颜色，并在说明里提到。中世纪也有为纹章相同打官司的，如 1385–1390 年英格兰的 Scrope 诉 Grosvenor 案。",
          en: "The early Habsburg arms, a red lion on gold, are exactly those of the County of Holland. The site never lets family arms equal a realm's: it swaps the colours and says so. Medieval knights went to court over such clashes, as in Scrope v Grosvenor (England, 1385–1390).",
        },
        answers: { name: "Habsburg", year: 1200, origin: "none", emblem: "lion_rampant", palette: "or/gules", layout: "single#0" },
        links: [{ wiki: "House_of_Habsburg" }, { wiki: "Scrope_v_Grosvenor" }],
      },
      {
        id: "free",
        title: { zh: "不考虑历史真实性", en: "History switched off" },
        note: {
          zh: "勾选右上角的框后，900 年的伯爵也能持有法国，金底银鹰这种违反色彩规则的配色也能选。CK3 的技术限制仍然保留。",
          en: "With the box at the top right ticked, a count in 900 may hold France, and silver on gold is allowed despite the rule of tincture. CK3's technical limits still apply.",
        },
        answers: { name: "Anywhere", year: 900, origin: "none", emblem: "eagle", rank: "count", titles: ["france"], palette: "or/argent", free: true, layout: "single#0" },
        links: [{ wiki: "Rule_of_tincture" }],
      },
    ],
  },
];

export const EXAMPLES: Example[] = SECTIONS.flatMap((s) => s.examples);
