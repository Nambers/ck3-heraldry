import type { Art } from "./types.ts";
import { fit, lionRampant } from "./_lion-parts.ts";

// Lion rampant brandishing a sword over its head and trampling a sabre (the lion of Finland).
const art: Art = {
  w: 80.4,
  h: 100,
  // as in the game texture, the claws and tongue share the sword's tincture
  draw: (c) => fit(lionRampant({ ...c, armed: c.second }, { sword: { pose: "brandished", fill: c.second }, sabre: c.second }), [-5, -13.8, 85.2, 100.8], 80.4, 100),
};
export default art;
