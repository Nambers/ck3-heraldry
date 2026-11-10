import type { Art } from "./types.ts";
import { fit, lionRampant } from "./_lion-parts.ts";

// Lion rampant crowned, holding a sword erect in its raised forepaw, the blade leaning outward.
// As in the game texture, the claws and tongue share the crown's tincture.
const art: Art = {
  w: 61.7,
  h: 100,
  draw: (c) => fit(lionRampant({ ...c, armed: c.crown }, { crowned: true, sword: { pose: "held", fill: c.second } }), [-4, -39.2, 85.2, 100.8], 61.7, 100),
};
export default art;
