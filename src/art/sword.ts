// Sword erect, point up: straight blade with a fuller, cross-guard, grip and round pommel.
import type { Art } from "./types.ts";
import { path, line, OUT } from "./style.ts";

const art: Art = {
  w: 27,
  h: 100,
  draw: (c) => {
    const blade = `M13.5,0.5 L18,9 L18.5,70 L8.5,70 L9,9 Z`;
    const guard =
      `M3,68.5 L24,68.5 Q26.5,68.5 26.5,71.5 Q26.5,74.5 24,74.5 L3,74.5 Q0.5,74.5 0.5,71.5 Q0.5,68.5 3,68.5 Z`;
    const grip = `M10.5,74.5 L16.5,74.5 L17,89.5 L10,89.5 Z`;
    return (
      path(blade, c.body) +
      line("M13.5,10 L13.5,66") +
      path(grip, c.armed) +
      line("M10.5,79 L16.5,77 M10.5,84 L16.5,82") +
      path(guard, c.armed) +
      `<circle cx="13.5" cy="94" r="5.5" fill="${c.armed}" ${OUT}/>` +
      `<circle cx="13.5" cy="94" r="2.2" fill="none" ${OUT}/>`
    );
  },
};
export default art;
