// Charge library. A charge is admitted only with BOTH halves:
//   * heraldic definition (blazon names, attributes) — used by blazon and rules
//   * CK3 recipe (vanilla textures + colour roles) — used by the exporter
// Our own SVG art for the web preview lives in src/art/<id>.ts.
//
// Texture facts (names, colour channels, visible bounding boxes) were measured
// from CK3 1.20.1.2 `gfx/coat_of_arms/colored_emblems` with tools/measure_textures.py.
// Display names live in the i18n catalogs (charge.<id>).

import type { ChargeId } from "./heraldry/ast.ts";
import lionManuscript from "./art/raster/lion_manuscript.json" with { type: "json" };

/**
 * Colour roles a recipe part can ask for. "under" = the tincture beneath the charge;
 * "features" = eyes, brows, nose and mouth drawn on a face (sable, or argent on a sable face).
 */
export type Role = "body" | "armed" | "crown" | "hair" | "second" | "detail" | "under" | "nimbus" | "ink" | "features";
/**
 * What a recipe part is painted with: a role's tincture, or for raster charges a
 * blend worked out at export: "edge" halfway between the body and what lies under it
 * (soft edges), "line" the body darkened (the drawing's inner lines).
 */
export type Paint = Role | "edge" | "line";

export interface RecipePart {
  texture: string;
  /** roles for color1..color3 */
  colors: Paint[];
  /** centre and size in the main texture's 0..1 space (default: full texture) */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  /** degrees clockwise; only with uniform w/h (CK3 scales after rotating) */
  rot?: number;
}

/** visible area of the recipe in main-texture space: [x0, y0, x1, y1] */
export type Bbox = [number, number, number, number];

export type Category = "beast" | "bird" | "monster" | "sea" | "plant" | "building" | "object" | "celestial" | "geometric" | "cross";

export interface ChargeDef {
  id: ChargeId;
  cat: Category;
  /** blazon: singular and plural, e.g. "lion rampant" / "lions rampant" */
  en: [string, string];
  /** small charges are borne in threes by default and fit on ordinaries */
  small: boolean;
  /** eagle-like: has a breast that can carry a charge or an escutcheon (bbox-normalised) */
  breast?: { x: number; y: number };
  /** attributes worth naming in blazon */
  attrs?: ("armed" | "crowned" | "crined" | "second" | "detail")[];
  bbox: Bbox;
  /** haloes when nimbed: centre (x, y) and radius r, as fractions of the visible box width/height/width */
  halo?: [number, number, number][];
  /** a realm's whole device (Portugal's five escutcheons): only in that realm's arms, never chosen or borrowed */
  whole?: boolean;
  /**
   * Drawn in CK3 with blocks taken once from a painting in a historical source
   * (src/art/raster/<id>.json): the recipe at several grid sizes, finest first; `ck3`
   * is the finest. The exporter picks one by the charge's size on the shield; the web
   * sketch draws the same blocks.
   */
  raster?: { n: number; ck3: RecipePart[] }[];
  ck3: RecipePart[];
}

const one = (texture: string, colors: Role[] = ["body"]): RecipePart[] => [{ texture, colors }];

const C = (
  id: string,
  cat: Category,
  en: [string, string],
  bbox: Bbox,
  ck3: RecipePart[],
  extra: Partial<ChargeDef> = {},
): ChargeDef => ({ id, cat, en, bbox, ck3, small: false, ...extra });

/**
 * A painting turned into blocks (done once; only the result is kept): per grid size,
 * rectangles of grid cells for each colour role, in painting order. "edge" marks cells
 * the charge covers only partly, "line" the ink inside it (painted nearly black).
 */
interface Raster {
  /** the art's box in the square texture (0..1) */
  box: number[];
  /** width / height of the painted charge */
  aspect: number;
  levels: { n: number; layers: { role: string; rects: number[][] }[] }[];
}

/**
 * A raster charge's recipes: one ce_block_02 per rectangle, each a fifth of a cell
 * larger on every side so that neighbouring blocks leave no seam, in the tool's
 * painting order (soft edge, body, ink lines, crown).
 */
function raster(r: Raster): { bbox: Bbox; ck3: RecipePart[]; raster: { n: number; ck3: RecipePart[] }[] } {
  const k = 0.2;
  const levels = r.levels.map(({ n, layers }) => ({
    n,
    ck3: layers.flatMap((l) =>
      l.rects.map(([x, y, w, h]): RecipePart => ({
        texture: "ce_block_02.dds",
        colors: [l.role as Paint],
        x: (x + w / 2) / n,
        y: (y + h / 2) / n,
        w: (w + 2 * k) / n,
        h: (h + 2 * k) / n,
      })),
    ),
  }));
  return { bbox: r.box as Bbox, ck3: levels[0].ck3, raster: levels };
}
const MANUSCRIPT = raster(lionManuscript);

const LIST: ChargeDef[] = [
  // birds
  C("eagle", "bird", ["eagle displayed", "eagles displayed"], [0.184, 0.102, 0.816, 0.855], one("ce_eagle.dds", ["body", "armed", "armed"]), { breast: { x: 0.5, y: 0.43 }, attrs: ["armed"] }),
  C("eagle_crowned", "bird", ["eagle displayed", "eagles displayed"], [0.182, 0.064, 0.818, 0.855], one("ce_eagle_crown.dds", ["body", "crown", "armed"]), { breast: { x: 0.5, y: 0.47 }, attrs: ["crowned", "armed"] }),
  C("double_eagle", "bird", ["double-headed eagle displayed", "double-headed eagles displayed"], [0.068, 0.107, 0.93, 0.879], one("ce_eagle_double.dds", ["body", "armed", "armed"]), {
    breast: { x: 0.5, y: 0.45 },
    attrs: ["armed"],
    // as in CK3's own e_hre: gold discs behind the two heads
    halo: [[0.398, 0.062, 0.157], [0.602, 0.062, 0.157]],
  }),
  C("maiden_eagle", "bird", ["maiden-eagle displayed", "maiden-eagles displayed"], [0.184, 0.05, 0.816, 0.855], [
    // not in vanilla: the eagle, its whole head (beak, tongue, crest) hidden under a
    // mass of hair with two locks to the shoulders; a face with eyes, brows, nose and
    // mouth made of small vanilla shapes; a small crown. Nothing is painted in the
    // field's tincture, so it works on any field, ermine too. src/art/maiden_eagle.ts
    // draws the same parts at the same places.
    { texture: "ce_eagle.dds", colors: ["body", "armed", "armed"] },
    { texture: "ce_circle_mask.dds", colors: ["hair"], x: 0.432, y: 0.25, w: 0.055, h: 0.11 },
    { texture: "ce_circle_mask.dds", colors: ["hair"], x: 0.568, y: 0.25, w: 0.055, h: 0.11 },
    { texture: "ce_circle_mask.dds", colors: ["hair"], x: 0.5, y: 0.165, w: 0.225, h: 0.18 },
    { texture: "ce_circle_mask.dds", colors: ["body"], x: 0.5, y: 0.195, w: 0.1, h: 0.125 },
    { texture: "ce_circle_mask.dds", colors: ["features"], x: 0.481, y: 0.188, w: 0.016, h: 0.01 },
    { texture: "ce_circle_mask.dds", colors: ["features"], x: 0.519, y: 0.188, w: 0.016, h: 0.01 },
    { texture: "ce_block_02.dds", colors: ["features"], x: 0.481, y: 0.1775, w: 0.018, h: 0.003 },
    { texture: "ce_block_02.dds", colors: ["features"], x: 0.519, y: 0.1775, w: 0.018, h: 0.003 },
    { texture: "ce_block_02.dds", colors: ["features"], x: 0.5, y: 0.204, w: 0.004, h: 0.02 },
    { texture: "ce_circle_mask.dds", colors: ["features"], x: 0.5, y: 0.231, w: 0.022, h: 0.006 },
    { texture: "ce_crown_small.dds", colors: ["crown"], x: 0.5, y: 0.08, w: 0.12, h: 0.12 },
  ], { breast: { x: 0.5, y: 0.45 }, attrs: ["crined", "crowned", "armed"] }),
  C("falcon", "bird", ["falcon", "falcons"], [0.234, 0.09, 0.855, 0.906], one("ce_falcon.dds", ["body", "armed", "armed"]), { attrs: ["armed"] }),
  C("martlet", "bird", ["martlet", "martlets"], [0.105, 0.215, 0.879, 0.762], one("ce_martlet.dds", ["body", "body", "body"]), { small: true }),
  C("swan", "bird", ["swan", "swans"], [0.16, 0.078, 0.898, 0.93], one("ce_swan.dds", ["body", "armed", "armed"]), { attrs: ["armed"] }),
  // lions and monsters
  C("lion_rampant", "beast", ["lion rampant", "lions rampant"], [0.129, 0.082, 0.848, 0.926], one("ce_lion_rampant.dds", ["body", "armed"]), { attrs: ["armed"] }),
  C("lion_rampant_crowned", "beast", ["lion rampant", "lions rampant"], [0.129, 0.051, 0.848, 0.926], one("ce_lion_rampant_crown.dds", ["body", "crown"]), { attrs: ["crowned"] }),
  C("lion_forked_crowned", "beast", ["lion rampant queue fourchée", "lions rampant queue fourchée"], [0.129, 0.07, 0.852, 0.922], one("ce_lion_rampant_crown_forked.dds", ["body", "crown", "armed"]), { attrs: ["crowned"] }),
  C("lion_axe", "beast", ["lion rampant holding an axe", "lions rampant holding axes"], [0.141, 0.07, 0.848, 0.93], [
    // vanilla's axe lion is uncrowned (axe blade and haft in color2, claws in the body): a small crown is added
    { texture: "ce_lion_rampant_axe.dds", colors: ["body", "second", "armed"] },
    { texture: "ce_crown_small.dds", colors: ["crown"], x: 0.54, y: 0.118, w: 0.13, h: 0.13, rot: 350 },
  ], { attrs: ["crowned", "second"] }),
  C("lion_sword", "beast", ["lion rampant holding a sword", "lions rampant holding swords"], [0.26, 0.004, 0.838, 0.941], [
    // not in vanilla (ce_lion_rampant_holding_sword holds none): the crowned lion,
    // made smaller to leave room, and the plain sword behind its raised forepaw
    { texture: "ce_sword_simple.dds", colors: ["second", "second"], x: 0.331, y: 0.199, w: 0.5, h: 0.5, rot: 348 },
    { texture: "ce_lion_rampant_crown.dds", colors: ["body", "crown"], x: 0.56, y: 0.6, w: 0.8, h: 0.8 },
  ], { attrs: ["crowned", "second"] }),
  // vanilla's "crown_sword" is the uncrowned lion of Finland (1580s): sword, armoured arm, sabre, claws and tongue all in color3
  C("lion_sword_sabre", "beast", ["lion rampant brandishing a sword and trampling a sabre", "lions rampant brandishing swords and trampling sabres"], [0.152, 0.074, 0.816, 0.9], one("ce_lion_rampant_crown_sword.dds", ["body", "body", "second"]), { attrs: ["second"] }),
  // not in vanilla: the lion of "le Rey de Bugrie" in the Lord Marshal's Roll (c. 1295), built from blocks taken from the painting
  C("lion_manuscript", "beast", ["lion rampant", "lions rampant"], MANUSCRIPT.bbox, MANUSCRIPT.ck3, { attrs: ["crowned"], raster: MANUSCRIPT.raster }),
  C("lion_passant_guardant", "beast", ["lion passant guardant", "lions passant guardant"], [0.08, 0.098, 0.881, 0.824], one("ce_lion_passant_guardant.dds", ["body", "armed", "armed"]), { attrs: ["armed"] }),
  C("lion_st_mark", "monster", ["lion of St Mark", "lions of St Mark"], [0.078, 0.137, 0.928, 0.75], one("ce_lion_saint_mark.dds", ["body", "armed", "second"])),
  C("griffin", "monster", ["griffin segreant", "griffins segreant"], [0.162, 0.084, 0.836, 0.914], one("ce_griffin_rampant.dds", ["body", "armed", "armed"]), { attrs: ["armed"] }),
  C("dragon", "monster", ["dragon rampant", "dragons rampant"], [0.152, 0.105, 0.852, 0.852], one("ce_dragon.dds", ["body", "armed", "armed"]), { attrs: ["armed"] }),
  // beasts
  C("boar", "beast", ["boar passant", "boars passant"], [0.115, 0.164, 0.893, 0.725], one("ce_boar_passant.dds", ["body", "armed", "armed"]), { attrs: ["armed"] }),
  C("bear", "beast", ["bear rampant", "bears rampant"], [0.207, 0.053, 0.684, 0.916], one("ce_bear_rampant.dds", ["body", "armed", "armed"])),
  C("wolf", "beast", ["wolf passant", "wolves passant"], [0.031, 0.238, 0.969, 0.762], one("ce_wolf_passant.dds", ["body", "armed", "armed"])),
  C("stag", "beast", ["stag trippant", "stags trippant"], [0.176, 0.076, 0.795, 0.842], one("ce_stag.dds", ["body", "armed", "armed"]), { attrs: ["armed"] }),
  C("horse", "beast", ["horse rampant", "horses rampant"], [0.135, 0.055, 0.852, 0.939], one("ce_horse_rampant.dds", ["body", "armed", "armed"])),
  C("bull", "beast", ["bull passant", "bulls passant"], [0.113, 0.102, 0.869, 0.73], one("ce_bull_passant.dds", ["body", "armed", "armed"]), { attrs: ["armed"] }),
  C("dolphin", "sea", ["dolphin embowed", "dolphins embowed"], [0.209, 0.109, 0.832, 0.891], one("ce_dolphin.dds", ["body", "armed", "armed"])),
  C("fish", "sea", ["fish naiant", "fishes naiant"], [0.051, 0.314, 0.938, 0.66], one("ce_fish.dds", ["body", "body", "body"]), { small: true }),
  // plants
  C("fleur", "plant", ["fleur-de-lis", "fleurs-de-lis"], [0.137, 0.078, 0.863, 0.926], one("ce_fleur.dds"), { small: true }),
  C("sexfoil", "plant", ["sexfoil", "sexfoils"], [0.195, 0.152, 0.805, 0.848], one("ce_rosetta_06.dds", ["body", "armed"]), { small: true }),
  C("tree", "plant", ["tree eradicated", "trees eradicated"], [0.156, 0.066, 0.844, 0.936], one("ce_tree.dds", ["body", "body"])),
  // buildings and objects
  C("castle", "building", ["castle", "castles"], [0.195, 0.121, 0.809, 0.852], one("ce_castle.dds", ["body", "detail"]), { attrs: ["detail"] }),
  C("tower", "building", ["tower", "towers"], [0.301, 0.094, 0.699, 0.824], one("ce_tower.dds"), { small: true }),
  C("lymphad", "object", ["lymphad", "lymphads"], [0.092, 0.121, 0.85, 0.865], one("ce_ship_lymphad.dds", ["body", "body", "body"])),
  C("key", "object", ["key", "keys"], [0.355, 0.137, 0.633, 0.863], one("ce_key.dds"), { small: true }),
  C("keys_crossed", "object", ["two keys in saltire", "pairs of keys in saltire"], [0.164, 0.105, 0.842, 0.76], one("ce_keys_crossed.dds", ["body", "second"]), { attrs: ["second"] }),
  C("sword", "object", ["sword erect", "swords erect"], [0.391, 0.102, 0.609, 0.902], one("ce_sword_simple.dds", ["armed", "body"]), { small: true, attrs: ["armed"] }),
  C("swords_crossed", "object", ["two swords in saltire", "pairs of swords in saltire"], [0.172, 0.105, 0.828, 0.746], one("ce_swords_crossed.dds", ["body", "armed"]), { attrs: ["armed"] }),
  C("axe", "object", ["axe", "axes"], [0.193, 0.07, 0.686, 0.855], one("ce_axe.dds", ["body", "armed"]), { small: true }),
  C("horseshoe", "object", ["horseshoe", "horseshoes"], [0.182, 0.119, 0.822, 0.848], one("ce_horse_shoe.dds"), { small: true }),
  C("anchor", "object", ["anchor", "anchors"], [0.184, 0.082, 0.816, 0.836], one("ce_anchor.dds"), { small: true }),
  C("wheel", "object", ["wheel", "wheels"], [0.145, 0.145, 0.855, 0.855], one("ce_wheel.dds", ["body", "body"]), { small: true }),
  C("bell", "object", ["bell", "bells"], [0.168, 0.07, 0.832, 0.887], one("ce_bell.dds"), { small: true }),
  C("chalice", "object", ["chalice", "chalices"], [0.293, 0.227, 0.707, 0.77], one("ce_chalice.dds"), { small: true }),
  C("crown", "object", ["crown", "crowns"], [0.066, 0.205, 0.934, 0.787], one("ce_crown.dds", ["body", "armed"]), { small: true }),
  C("hand", "object", ["dexter hand appaumée", "dexter hands appaumée"], [0.314, 0.09, 0.738, 0.873], one("ce_hand.dds"), { small: true }),
  C("heart", "object", ["heart", "hearts"], [0.164, 0.137, 0.836, 0.859], one("ce_heart.dds"), { small: true }),
  C("escallop", "object", ["escallop", "escallops"], [0.172, 0.164, 0.828, 0.828], one("ce_escallop.dds"), { small: true }),
  // celestial and geometric
  C("sun", "celestial", ["sun in splendour", "suns in splendour"], [0.129, 0.037, 0.869, 0.875], one("ce_sun.dds", ["body", "body", "body"])),
  C("mullet", "celestial", ["mullet", "mullets"], [0.141, 0.121, 0.855, 0.801], one("ce_star_05.dds"), { small: true }),
  C("mullet6", "celestial", ["mullet of six points", "mullets of six points"], [0.195, 0.148, 0.805, 0.852], one("ce_star_06.dds"), { small: true }),
  C("crescent", "celestial", ["crescent", "crescents"], [0.199, 0.277, 0.801, 0.723], one("ce_crescent.dds"), { small: true }),
  C("quinas", "geometric", ["five escutcheons in cross", "crosses of five escutcheons"], [0.107, 0.107, 0.893, 0.893], [
    // Portugal before 1485: the side escutcheons point to the centre
    ...([[0.5, 0.23, 0], [0.5, 0.5, 0], [0.5, 0.77, 0], [0.23, 0.5, 270], [0.77, 0.5, 90]] as const).map(([x, y, rot]): RecipePart => (
      { texture: "ce_shield_portugal.dds", colors: ["body", "second"], x, y, w: 0.48, h: 0.48, ...(rot ? { rot } : {}) })),
  ], { attrs: ["second"], whole: true }),
  C("roundel", "geometric", ["roundel", "roundels"], [0.012, 0.012, 0.988, 0.988], one("ce_circle_mask.dds"), { small: true }),
  C("annulet", "geometric", ["annulet", "annulets"], [0.203, 0.203, 0.797, 0.797], one("ce_annulet.dds"), { small: true }),
  C("lozenge", "geometric", ["lozenge", "lozenges"], [0.25, 0.004, 0.75, 0.996], one("ce_lozenge.dds"), { small: true }),
  C("mascle", "geometric", ["mascle", "mascles"], [0.219, 0.055, 0.781, 0.945], one("ce_mascle.dds"), { small: true }),
  C("billet", "geometric", ["billet", "billets"], [0.32, 0.148, 0.68, 0.852], one("ce_billet.dds"), { small: true }),
  // crosses
  C("cross", "cross", ["cross couped", "crosses couped"], [0.125, 0.125, 0.875, 0.875], one("ce_cross_couped.dds"), { small: true }),
  C("cross_patty", "cross", ["cross patty", "crosses patty"], [0.164, 0.164, 0.836, 0.836], one("ce_cross_patty.dds"), { small: true }),
  C("cross_potent", "cross", ["cross potent", "crosses potent"], [0.262, 0.262, 0.738, 0.738], one("ce_cross_potent.dds"), { small: true }),
  C("cross_moline", "cross", ["cross moline", "crosses moline"], [0.148, 0.148, 0.852, 0.852], one("ce_cross_moline.dds"), { small: true }),
  C("cross_crosslet", "cross", ["cross crosslet", "crosses crosslet"], [0.141, 0.141, 0.859, 0.859], one("ce_cross_crosslet.dds"), { small: true }),
  C("cross_fleury", "cross", ["cross fleury", "crosses fleury"], [0.148, 0.148, 0.852, 0.852], one("ce_cross_fleury.dds"), { small: true }),
  C("cross_maltese", "cross", ["Maltese cross", "Maltese crosses"], [0.172, 0.172, 0.828, 0.828], one("ce_cross_maltese.dds"), { small: true }),
  C("cross_patriarchal", "cross", ["patriarchal cross", "patriarchal crosses"], [0.262, 0.18, 0.738, 0.82], one("ce_cross_patriarchal.dds"), { small: true }),
  // Hungary's double cross on three hills, as vanilla draws k_hungary: the slender
  // ce_cross_patriarchal_hungary standing in the middle hill of ce_mount (the hills in
  // color "second", so the player may make them vert as Hungary's are)
  C("cross_patriarchal_mount", "cross", ["patriarchal cross on a trimount", "patriarchal crosses on trimounts"], [0.243, 0.102, 0.757, 1.0], [
    { texture: "ce_mount.dds", colors: ["second"], x: 0.5, y: 0.65, w: 0.7, h: 0.7 },
    { texture: "ce_cross_patriarchal_hungary.dds", colors: ["body"], x: 0.5, y: 0.43, w: 0.8, h: 0.8 },
  ], { attrs: ["second"] }),
  C("jerusalem", "cross", ["cross potent between four crosslets", "Jerusalem crosses"], [0.188, 0.188, 0.812, 0.812], one("ce_jerusalem.dds")),
  C("chi_rho", "cross", ["chi-rho", "chi-rhos"], [0.199, 0.137, 0.805, 0.867], one("ce_chi_rho.dds"), { small: true }),
];

export const CHARGES: Record<ChargeId, ChargeDef> = Object.fromEntries(LIST.map((c) => [c.id, c]));
export const CHARGE_IDS: ChargeId[] = LIST.map((c) => c.id);

export const isEagleLike = (id: ChargeId) => !!CHARGES[id]?.breast;

// --- non-charge vanilla textures (measured) ----------------------------------

export const TEX = {
  block: "ce_block_02.dds", // fills its whole box
  escutcheon: {
    texture: "ce_escutcheon.dds",
    bbox: [0.195, 0.141, 0.805, 0.859] as Bbox,
    /** left edge of the visible shape at relative heights 0, .05, .. 1 (right edge mirrors it) */
    edge: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0.013, 0.026, 0.038, 0.064, 0.077, 0.115, 0.141, 0.192, 0.244, 0.308, 0.372, 0.487],
  },
  halo: "ce_circle.dds",
  label: { texture: "ce_label_03.dds", y0: 0.113, y1: 0.355 }, // full width; pendants at x .25/.5/.75, .078 wide
  pallets4: { texture: "ce_ordinary_pales_4.dds", edges: [0.109, 0.223, 0.332, 0.445, 0.555, 0.668, 0.777, 0.891] },
  patternSolid: "pattern__solid_designer.dds",
  // ordinaries, all drawn over the full box
  fess: "ce_ordinary_fess_5.dds", // band y .402..602
  pale: "ce_ordinary_pale_5.dds", // band x .402..602
  bend: "ce_ordinary_bend_dexter_5.dds", // along the diagonal, perpendicular width ≈ .2
  bendSinister: "ce_ordinary_bend_sinister_5.dds",
  saltire: "ce_ordinary_saltire_5.dds",
  chevron: "ce_ordinary_chevron_5.dds", // top edge y = .215 + |x - .5|, vertical thickness .285
  pile: "ce_ordinary_pile.dds", // triangle from the top edge (x .0..1) to (.5, .5)
  orle: "ce_orle.dds",
  tressure: "ce_double_tressure.dds",
  bendlet: "ce_bendlet.dds", // dexter, full length, width ≈ .105
  // divisions and variations
  perBend: "ce_per_bend.dds", // color1 upper-right, color2 lower-left
  perSaltire: "ce_per_saltire.dds", // color1 chief and base, color2 flanks
  gyronny: "ce_gyronny_08.dds",
  bendy: "ce_bendy_06.dds",
  lozengy: "ce_lozengy.dds",
  lozengyBend: "ce_lozengy_bend.dds",
  ermine: "ce_ermine.dds", // color1 ground, color2 spots
  barryIndented: "ce_barry_indented.dds",
  // furs: whole-box two-colour textures, color1 the metal
  vairy: "ce_vairy.dds", // 24 px cells of 128: rows of bells, color1 pointing up, color2 down; see VAIR in layout.ts
  fretty: "ce_fretty.dds", // color1 field, color2 a lattice of 45° bands; see FRET in layout.ts
  // diminutives and other ordinaries
  bars: "ce_ordinary_bars_2.dds", // y .2–.4 and .6–.8
  chevronels: "ce_ordinary_chevron_3.dds", // apexes at y .05/.375/.7, each .16 thick, slope ≈ 1
  pall: "ce_ordinary_pall_5.dds", // arms from the upper corners meet at (.5, .36–.64), then a pale x .4–.6
  // bends and chevrons in numbers (the straight ones are blocks: BAND_ORDINARIES in layout.ts)
  bends2: "ce_bends_02.dds", // two bends: x − y in −.39…−.078 and .218….532
  bends3: "ce_bends_03.dds", // three bendlets, each .23 across in x − y
  bends4: "ce_bends_04.dds", // four bendlets, .17
  bends5: "ce_bends_05.dds", // five bendlets, .13
  chevrons2: "ce_ordinary_chevron_2.dds", // apexes at y .129 and .453, each .16 thick, slope 1
  fessChevrons: "ce_fess_betw_two_chevrons.dds", // fess y .383–.578; the upper chevron stops at it
  // lines of partition: "<ordinary or division>_<line>", same footprint as the straight one
  line: {
    cross_engrailed: "ce_cross_engrailed.dds",
    fess_engrailed: "ce_fess_engrailed.dds",
    fess_dancetty: "ce_fess_dancetty.dds", // zigzag band, envelope y .36–.65
    bend_engrailed: "ce_bend_engrailed.dds", // a little wider than the plain bend
    bend_embattled: "ce_bend_embattled.dds",
    chief_indented: "ce_chief_indented_alpha.dds", // solid to y .277, teeth to .387 (ce_chief_indented also paints the field)
    per_fess_indented: "ce_per_fess_indented.dds", // color1 above; teeth between y .37 and .63
    per_bend_nebuly: "ce_per_bend_nebuly.dds", // color1 upper right, like ce_per_bend
    fess_fusilly: "ce_fess_lozenges.dds", // seven upright fusils side by side, y .281–.719; see fusils() in layout.ts
    bend_fusilly: "ce_bend_lozenges.dds", // the same turned 45° along the dexter diagonal, about twice a bend's width
  } as Record<string, string>,
  patterns: {
    per_pale: "pattern_vertical_split_01.dds", // color1 dexter
    per_fess: "pattern_horizontal_split_01.dds", // color1 chief
    barry: "pattern_barry_06.dds", // color1 top
    barry8: "pattern_barruly_08.dds",
    barry10: "pattern_barruly_10.dds",
    chequy: "pattern_checkers_06.dds",
  } as Record<string, string>,
} as const;
