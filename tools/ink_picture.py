#!/usr/bin/env python3
"""Turn a painting into an ink mask for the page backgrounds (src/theme/art/).

    python3 tools/ink_picture.py <cropped picture> <out.webp> [--target 0.16]

The paper (the picture's median brightness) becomes transparent; lines and
shading become ink, black with the ink amount as alpha. The page prints the
mask in its own ink colour (src/theme/theme.css), light or dark.

Every picture is brought to the same overall amount of ink (--target, the mean
alpha), so a sparse silk scroll and a crowded miniature look equally strong
beside each other: a sparse picture's lines get darker, a crowded one's lighter.

Crop around the figures first, portrait (width / height about 0.65-0.75: every
picture in a margin gets the same width, so a squarer one stands shorter), and
keep the height at 1100px or less. Needs Pillow and numpy.

Two kinds of picture need other settings (keep them in src/theme/art/ink.json):
  * a large flat dark area (a black wall behind the figures) would take all the
    ink: draw from the lines rather than the tone, e.g. --tone 0.3 --line 1
  * photographs of carvings (grey stone): keep some stone, draw the shadows as
    lines, e.g. --paper-offset -0.05 --tone 0.5 --line 1
"""
import argparse

import numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("src")
ap.add_argument("out")
ap.add_argument("--target", type=float, default=0.16, help="mean ink over the picture, 0..1 (default 0.16)")
ap.add_argument("--paper-offset", type=float, default=0.05, help="how far below the paper the white point sits (default 0.05)")
ap.add_argument("--tone", type=float, default=1.0, help="weight of the picture's light and dark (default 1)")
ap.add_argument("--line", type=float, default=0.0, help="weight of local detail: lines, folds, edges (default 0)")
args = ap.parse_args()

img = Image.open(args.src).convert("L")
L = np.asarray(img, dtype=np.float64) / 255
lo, hi = np.percentile(L, 1), np.percentile(L, 99)
L = np.clip((L - lo) / max(hi - lo, 1e-6), 0, 1)
# local detail: how much darker each point is than its surroundings (flat areas give none)
blur = np.asarray(img.filter(ImageFilter.GaussianBlur(radius=max(img.size) / 120)), dtype=np.float64) / 255
blur = np.clip((blur - lo) / max(hi - lo, 1e-6), 0, 1)
detail = np.clip(blur - L, 0, 1)
detail = np.clip(detail / max(np.percentile(detail, 99.5), 1e-6), 0, 1)

# anything as light as the paper (or lighter) carries no ink
paper = float(np.median(L))
white = max(0.15, paper - args.paper_offset)
black = 0.04
base = np.clip(args.tone * np.clip((white - L) / (white - black), 0, 1) + args.line * detail, 0, 1)

# the curve that gives the target amount of ink (more ink as p falls); kept in a sane range
lo_p, hi_p = 0.35, 4.0
for _ in range(40):
    p = (lo_p * hi_p) ** 0.5
    if (base ** p).mean() > args.target:
        lo_p = p
    else:
        hi_p = p
alpha = base ** p

rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
rgba[..., 3] = np.round(alpha * 255).astype(np.uint8)
Image.fromarray(rgba, "RGBA").save(args.out, "WEBP", quality=70, alpha_quality=70, method=6)
print(f"{args.out}: paper {paper:.2f}, white {white:.2f}, curve {p:.2f}, ink {alpha.mean():.3f}"
      + ("  (sparse picture: the curve is at its limit)" if p <= 0.36 or p >= 3.9 else ""))
