import type { Art } from "./types.ts";
import { fit, lionRampant } from "./_lion-parts.ts";

// Lion rampant crowned; the tail swings a little wider to balance the crown.
// As in the game texture, the claws and tongue share the crown's tincture.
const art: Art = {
  w: 82,
  h: 100,
  draw: (c) => fit(lionRampant({ ...c, armed: c.crown }, { crowned: true, tailOut: 4 }), [0.4, -8.8, 89.1, 100.6], 82, 100),
};
export default art;
