// Contract for charge artwork used by the web preview (our own art, no game assets).
//
// Each charge has its own file src/art/<id>.ts with a default export `Art`.
// The drawing fills a viewBox "0 0 w h" tightly: the art's outer edges should
// touch (or nearly touch) all four sides, because that box is stretched onto
// the same visible box the CK3 texture occupies in game. w/h therefore matches
// the aspect ratio of the vanilla texture's visible area.

export interface ArtColors {
  /** main tincture of the charge */
  body: string;
  /** secondary details: claws, beak, tongue, horns/antlers, hooves, tusks, sword hilt, axe haft, jewels */
  armed: string;
  /** a crown worn by the charge */
  crown: string;
  /** hair (maiden-eagle) */
  hair: string;
  /** a second object of another tincture: the second key, the book of St Mark, an axe blade */
  second: string;
  /** doors and windows of buildings, port-holes */
  detail: string;
  /** the tincture lying beneath the charge (for openings) */
  under: string;
  /** eyes, brows, nose and mouth on a face (sable, or argent on a sable face) */
  features: string;
}

export interface Art {
  w: number;
  h: number;
  draw: (c: ArtColors) => string;
}
