// The picture behind the page: one scene at a time, cross-faded when it
// changes (instantly when the reader asks for reduced motion). Scenes are
// drawn by CSS (src/theme/theme.css, .scene[data-scene=…]).

const FADE_MS = 700;
let current = "";

/** show a scene ("" for none) */
export function setScene(id: string) {
  if (id === current) return;
  current = id;
  const host = document.getElementById("scene");
  if (!host) return;
  for (const old of [...host.children] as HTMLElement[]) {
    old.classList.remove("on");
    setTimeout(() => old.remove(), FADE_MS);
  }
  if (!id) return;
  const el = document.createElement("div");
  el.className = "scene";
  el.dataset.scene = id;
  host.append(el);
  // lay it out at opacity 0 first (reading a size forces that), so the change of class fades it in
  void el.offsetWidth;
  el.classList.add("on");
}
