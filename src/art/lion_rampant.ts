import type { Art } from "./types.ts";
import { fit, lionRampant } from "./_lion-parts.ts";

// Lion rampant: the plain lion of the shared kit, fitted to its box.
const art: Art = { w: 85, h: 100, draw: (c) => fit(lionRampant(c), [0.4, -0.4, 85.1, 100.6], 85, 100) };
export default art;
