// Example of the art contract (a plain roundel). Not a real charge file.
import type { Art } from "./types.ts";
import { path } from "./style.ts";

const art: Art = {
  w: 100,
  h: 100,
  draw: (c) => path("M50,1 A49,49 0 1 1 49.99,1 Z", c.body),
};
export default art;
