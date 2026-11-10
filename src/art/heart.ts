// Heart: plump symmetrical lobes, drawn-out point at the base.
import type { Art } from "./types.ts";
import { path } from "./style.ts";

const art: Art = {
  w: 93,
  h: 100,
  draw: (c) =>
    path(
      "M46.5,99.5 C38,84 0.5,64 0.5,30 C0.5,12 12,0.5 25,0.5 C35,0.5 43,7 46.5,17 " +
        "C50,7 58,0.5 68,0.5 C81,0.5 92.5,12 92.5,30 C92.5,64 55,84 46.5,99.5 Z",
      c.body,
    ),
};
export default art;
