// The home page sends players to a designer page by who they play in CK3
// (role) and where (region and faith). Each tradition has its own rules, so
// each gets its own page, built on the shared designer (src/designer/).
//
// To add a page: build it (see CONTRIBUTING.md), then give it its `page` here.
// Pages without one are shown as planned.

import type { PageId } from "../routes.ts";

export type Text = { zh: string; en: string };

export type Role = "ruler" | "clergy" | "merchant";
export type Region = "latin" | "orthodox" | "islam" | "steppe" | "india" | "china" | "japan";

export const ROLES: { id: Role; title: Text; hint: Text }[] = [
  {
    id: "ruler",
    title: { zh: "统治者", en: "Ruler" },
    hint: { zh: "伯爵、公爵、国王、皇帝，也包括无封地的冒险者", en: "Counts, dukes, kings, emperors — and landless adventurers" },
  },
  {
    id: "clergy",
    title: { zh: "神职", en: "Clergy" },
    hint: { zh: "大主教、教皇（By God Alone）", en: "Archbishops and the Pope (By God Alone)" },
  },
  {
    id: "merchant",
    title: { zh: "商人", en: "Merchant" },
    hint: { zh: "商业共和国、商人家族（Silk & Silver）", en: "Merchant republics and families (Silk & Silver)" },
  },
];

export const REGIONS: { id: Region; title: Text }[] = [
  { id: "latin", title: { zh: "西欧 · 拉丁基督教", en: "Western Europe · Latin Christian" } },
  { id: "orthodox", title: { zh: "拜占庭 · 东正教", en: "Byzantium · Orthodox" } },
  { id: "islam", title: { zh: "伊斯兰世界", en: "The Islamic world" } },
  { id: "steppe", title: { zh: "草原（突厥、蒙古）", en: "The steppe (Turkic, Mongol)" } },
  { id: "india", title: { zh: "印度", en: "India" } },
  { id: "china", title: { zh: "中华", en: "China" } },
  { id: "japan", title: { zh: "日本", en: "Japan" } },
];

export interface Destination {
  id: string;
  /** the page in src/routes.ts; without it the page is planned, not built */
  page?: PageId;
  roles: Role[];
  regions: Region[];
  title: Text;
  /** what decides the arms there */
  blurb: Text;
}

export const DESTINATIONS: Destination[] = [
  {
    id: "west",
    page: "west",
    roles: ["ruler"],
    regions: ["latin"],
    title: { zh: "西欧统治者", en: "Western rulers" },
    blurb: {
      zh: "按英法通行的纹章学规则生成家族纹章：领主、爵位与头衔、宣称、事迹、家族里的位置都会体现在盾上。",
      en: "Family arms by the rules of English and French heraldry: liege, rank and titles, claims, deeds and place in the family all show on the shield.",
    },
  },
  {
    id: "clergy",
    roles: ["clergy"],
    regions: ["latin"],
    title: { zh: "神职纹章", en: "Arms of the clergy" },
    blurb: {
      zh: "大主教把教区的纹章和自己的家族纹章左右对分，教区在观者左侧；教皇用个人纹章。",
      en: "An archbishop impales the arms of his see (on the viewer's left) with his family arms; a pope bears his personal arms.",
    },
  },
  {
    id: "merchant",
    roles: ["merchant"],
    regions: ["latin"],
    title: { zh: "商人纹章", en: "Merchants' arms" },
    blurb: {
      zh: "威尼斯、热那亚等商业共和国的贵族家族纹章；还没有纹章的商人用商人标记（merchant's mark）。",
      en: "Arms of the patrician families of Venice, Genoa and the other merchant republics; merchants without arms used a merchant's mark.",
    },
  },
  {
    id: "byzantium",
    roles: ["ruler", "clergy"],
    regions: ["orthodox"],
    title: { zh: "拜占庭与东正教", en: "Byzantium and the Orthodox world" },
    blurb: {
      zh: "没有世袭纹章，用四 B 十字、双头鹰和花押；塞尔维亚、罗斯后来才有纹章。",
      en: "No hereditary arms: the cross with four betas, the double-headed eagle and monograms. Serbia and the Rus' took up arms later.",
    },
  },
  {
    id: "islam",
    roles: ["ruler"],
    regions: ["islam"],
    title: { zh: "伊斯兰世界", en: "The Islamic world" },
    blurb: {
      zh: "没有世袭纹章。马穆鲁克的徽记随官职授予，跟人不跟家族；另有库法体书法铭文。",
      en: "No hereditary arms. Mamluk blazons came with an office and stayed with the man, not the family; and there is Kufic calligraphy.",
    },
  },
  {
    id: "steppe",
    roles: ["ruler"],
    regions: ["steppe"],
    title: { zh: "草原", en: "The steppe" },
    blurb: {
      zh: "tamga：单色的氏族印记，没有底色和色彩规则；分出去的儿子在父亲的 tamga 上加笔画来区分。",
      en: "The tamga: a one-colour clan mark, with no field and no rule of tincture; a son starting his own line adds a stroke to his father's.",
    },
  },
  {
    id: "india",
    roles: ["ruler"],
    regions: ["india"],
    title: { zh: "印度", en: "India" },
    blurb: {
      zh: "王朝徽记（lanchana）：朱罗是虎、潘地亚是双鱼、哲罗是弓；也看自称的世系和所奉神的坐骑。",
      en: "Dynastic emblems (lanchana): the Chola tiger, the Pandya fish, the Chera bow — and the claimed lineage and the mount of the god worshipped.",
    },
  },
  {
    id: "china",
    roles: ["ruler"],
    regions: ["china"],
    title: { zh: "中华", en: "China" },
    blurb: {
      zh: "没有纹章传统，CK3 用印章式图样；旗上书姓，按五德终始定朝代的颜色，龙按爪数分等级。",
      en: "No heraldic tradition; CK3 uses seal designs. The surname on the banner, dynastic colours from the Five Phases, dragons ranked by their claws.",
    },
  },
  {
    id: "japan",
    roles: ["ruler"],
    regions: ["japan"],
    title: { zh: "日本", en: "Japan" },
    blurb: {
      zh: "家纹（kamon）：单色，常放在圆环里；分家改动本家的家纹（加圈、改数量、换细节）来区分。",
      en: "The kamon: one colour, often in a ring; branch families alter the main line's crest — a ring, a different count, a changed detail.",
    },
  },
];

/** the page for a role in a region, if one is built or planned */
export const destinationFor = (role: Role, region: Region) => DESTINATIONS.find((d) => d.roles.includes(role) && d.regions.includes(region));
