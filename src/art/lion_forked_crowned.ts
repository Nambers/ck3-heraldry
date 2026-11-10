import type { Art } from "./types.ts";
import { fit, lionRampant } from "./_lion-parts.ts";

// Bohemian lion: crowned, queue fourchée (two tails crossed once, each tufted).
// As in the game texture, the claws and tongue share the crown's tincture.
const art: Art = {
  w: 85,
  h: 100,
  draw: (c) => fit(lionRampant({ ...c, armed: c.crown }, { crowned: true, forked: true }), [0.4, -8.8, 93.0, 100.6], 85, 100),
};
export default art;
