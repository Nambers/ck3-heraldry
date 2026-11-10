// Eagle displayed and crowned, as CK3 draws it (ce_eagle_crown): the eagle of eagle.ts
// with a crown on its head. As in the game texture, the beak and legs share the
// crown's tincture. Texture space.
import type { Art } from "./types.ts";
import { inBox } from "./style.ts";
import { crown } from "./_eagle-parts.ts";
import { eagleHeadTex, eagleNeckTex, eagleTex } from "./eagle.ts";

const BBOX = [0.182, 0.064, 0.818, 0.855] as const;

const art: Art = {
  w: 80.4,
  h: 100,
  draw: (c) => {
    const k = { ...c, armed: c.crown };
    return inBox(eagleTex(k, eagleNeckTex(k)) + eagleHeadTex(k) + `<g transform="translate(50.6 12.4) scale(0.5)">${crown(c.crown)}</g>`, BBOX, 80.4);
  },
};
export default art;
