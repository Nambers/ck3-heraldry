import type { Art } from "./types.ts";
import { fit, lionRampant } from "./_lion-parts.ts";

// Norwegian lion: rampant, crowned, holding a long-hafted axe upright in its forepaws.
// As in the game texture, the claws and tongue are the lion's own tincture.
const art: Art = {
  w: 82,
  h: 100,
  draw: (c) => fit(lionRampant({ ...c, armed: c.body }, { crowned: true, grip: true }), [-5.6, -8.8, 85.1, 100.6], 82, 100),
};
export default art;
