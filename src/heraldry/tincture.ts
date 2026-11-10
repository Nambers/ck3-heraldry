// Heraldic tinctures and their CK3 / SVG renderings.
//
// Rule of tincture: metal must not lie on metal, nor colour on colour.
// Ermine (a fur) behaves like a metal here: it is argent with sable spots.

export const METALS = ["or", "argent"] as const;
export const COLOURS = ["gules", "azure", "sable", "vert", "purpure"] as const;
export type Metal = (typeof METALS)[number];
export type Colour = (typeof COLOURS)[number];
/** tinctures a charge can have */
export type Tincture = Metal | Colour | "ermine";
export const TINCTURES: readonly Tincture[] = [...METALS, ...COLOURS];

interface TinctureInfo {
  metal: boolean;
  en: string; // blazon word
  /** CK3 named color (common/named_colors/default_colors.txt, CK3 1.20) */
  ck3: string;
  /**
   * flat colour for our SVG renderer: the CK3 named colour converted from HSV,
   * so the sketch matches the game (a solid field shows exactly this colour;
   * the block emblem's shading channel is neutral). Kept in sync by a test.
   */
  svg: string;
}

export const TINCTURE: Record<Tincture, TinctureInfo> = {
  or: { metal: true, en: "Or", ck3: "yellow", svg: "#bf8630" },
  argent: { metal: true, en: "argent", ck3: "white", svg: "#cccac8" },
  gules: { metal: false, en: "gules", ck3: "red", svg: "#732217" },
  azure: { metal: false, en: "azure", ck3: "blue", svg: "#143f66" },
  sable: { metal: false, en: "sable", ck3: "black", svg: "#1a1713" },
  vert: { metal: false, en: "vert", ck3: "green", svg: "#1f4d23" },
  purpure: { metal: false, en: "purpure", ck3: "purple", svg: "#591b40" },
  ermine: { metal: true, en: "ermine", ck3: "white", svg: "#cccac8" },
};

export const isMetal = (t: Tincture): boolean => TINCTURE[t].metal;

/** true when `top` may lie on `under` under the rule of tincture */
export const contrasts = (top: Tincture, under: Tincture): boolean => isMetal(top) !== isMetal(under);
