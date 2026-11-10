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
      zh: "本站能复现的真实纹章。和原版不一样的地方写在说明里。家族名会影响默认的几何图形，所以有几个例子填的是具体的人名。",
      en: "Real arms the site can reproduce; where ours differ from the original, the note says so. The family name steers the default ordinary, which is why some examples use a person's name.",
    },
    examples: [
      {
        id: "gonzaga",
        title: { zh: "曼托瓦的贡扎加家族（1433）", en: "Gonzaga of Mantua (1433)" },
        note: {
          zh: "1433 年皇帝西吉斯蒙德封 Gianfrancesco I 为曼托瓦侯爵，赐给他新纹章：银底红十字，四角各一只黑鹰，原来的家族纹章作中盾。在本站选领主神圣罗马帝国、事迹「为领主立功」，就会得到这种恩赐纹章。原版的中盾还和波希米亚四分。",
          en: "In 1433 Emperor Sigismund made Gianfrancesco I Marquess of Mantua and granted him new arms: a red cross between four black eagles on silver, with the old family arms on an escutcheon. Choose the Holy Roman Empire as liege and “service to the liege” as deed to get such a grant. The original escutcheon also quarters Bohemia.",
        },
        answers: { name: "Gianfrancesco I Gonzaga", year: 1430, liege: "hre", origin: "none", emblem: "none", deed: "service", palette: "or/sable", layout: "varied-barry#g" },
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
          zh: "金底三道红色山形细带（chevronels）。没有图案时，几何图形由家族名决定；这里填 Gilbert de Clare 正好得到三道细带。",
          en: "Three red chevronels on gold. With no charge the ordinary follows the family name; “Gilbert de Clare” happens to give the chevronels.",
        },
        answers: { name: "Gilbert de Clare", year: 1250, origin: "none", emblem: "none", palette: "or/gules", layout: "ordinary-chevronels#0" },
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
          zh: "几何图形和分割可以带弧齿边、锯齿、大锯齿、城垛、云纹，由家族名决定，只用在 CK3 原版有贴图的地方。",
          en: "Ordinaries and divisions may be engrailed, indented, dancetty, embattled or nebuly — chosen by the family name, and only where CK3 has the texture.",
        },
        answers: { name: "Ondes", year: 1300, origin: "none", emblem: "none", palette: "azure/or", layout: "ordinary-bend#0" },
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
