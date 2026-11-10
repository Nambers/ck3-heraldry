#!/usr/bin/env python3
"""Measure CK3 emblem textures: visible bbox, colour-channel usage; optional contact sheet.

Dev tool. Output JSON goes to stdout; game textures never leave the machine.
  tools/measure_textures.py ce_eagle ce_castle ... [--sheet out.png] [--game DIR]
"""
import argparse, json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

from ck3_game import find_game

GAME = None  # set from --game / CK3_GAME below


def load(name):
    sub = "patterns" if name.startswith("pattern") else "colored_emblems"
    p = Path(GAME) / "gfx/coat_of_arms" / sub / f"{name}.dds"
    return np.asarray(Image.open(p).convert("RGBA")).astype(np.float32) / 255


def colorize(t):
    r, g, b, a = (t[..., i:i + 1] for i in range(4))
    c1, c2, c3 = np.array([.8, .15, .12]), np.array([.95, .78, .15]), np.array([.15, .45, .9])
    col = c1 * (1 - g) + c2 * g
    col = col * (1 - r) + c3 * r
    col = np.where(col < .5, 2 * col * b, 1 - 2 * (1 - col) * (1 - b))
    bg = np.ones(3) * .86
    return (col * a + bg * (1 - a)).clip(0, 1)


ap = argparse.ArgumentParser()
ap.add_argument("names", nargs="+")
ap.add_argument("--sheet")
ap.add_argument("--game", default=find_game())
args = ap.parse_args()
if not args.game or not Path(args.game).is_dir():
    sys.exit(f"CK3 game dir not found: {args.game} (set --game or CK3_GAME)")
GAME = args.game
out, tiles = {}, []
for n in args.names:
    t = load(n)
    h, w = t.shape[:2]
    m = t[..., 3] > .5
    ys, xs = np.nonzero(m)
    if len(xs) == 0:
        out[n] = None
        continue
    out[n] = {
        "bbox": [round(xs.min() / w, 3), round(ys.min() / h, 3), round((xs.max() + 1) / w, 3), round((ys.max() + 1) / h, 3)],
        "c2": round(float((t[..., 1][m] > .5).mean()), 3),
        "c3": round(float((t[..., 0][m] > .5).mean()), 3),
        "size": w,
    }
    if args.sheet:
        img = Image.fromarray((colorize(t) * 255).astype(np.uint8)).resize((160, 160))
        d = ImageDraw.Draw(img)
        d.text((3, 2), n.replace("ce_", ""), fill=(0, 0, 0))
        tiles.append(img)
json.dump(out, sys.stdout, indent=None)
print()
if args.sheet and tiles:
    cols = 8
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 164, rows * 164), (200, 200, 200))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * 164 + 2, (i // cols) * 164 + 2))
    sheet.save(args.sheet)
