// Axe as CK3 draws it (ce_axe): a broad bearded blade to dexter, its long curved edge
// sweeping down into the beard, hung on a socket at the top of a straight haft; a
// round notch under the head. Head c.body, haft c.armed. Texture space.
import type { Art } from "./types.ts";
import { path, line, inBox } from "./style.ts";

const BBOX = [0.193, 0.07, 0.686, 0.855] as const;

const HAFT = "M58.8,16 H68 V85.5 H58.8 Z";
const HEAD =
  "M58.8,20.6 L47,20.6 C38.4,19 30.4,14.4 25.6,7 C18.4,22 18.2,50 26,66.6 C28.6,72 31.2,76 34,78.4 " +
  "C36.6,69.8 39.6,61.6 43.2,57 C45.4,54.2 46.6,51 46.6,46.6 C47.4,42.2 50,39.8 53,39.8 C55.8,39.8 57.8,41.8 58.8,44.4 Z";
const SOCKET = "M58.2,20 H68.6 V44.4 H58.2 Z";

const art: Art = {
  w: 62.8,
  h: 100,
  draw: (c) =>
    inBox(
      path(HAFT, c.armed) +
        line("M58.8,18.4 H68") +
        path(HEAD, c.body) +
        line("M27.2,12.4 C21.4,26 21.2,49 27.4,62.6") +
        path(SOCKET, c.body) +
        line("M58.2,23 H68.6 M58.2,41.4 H68.6"),
      BBOX,
      62.8,
    ),
};
export default art;
