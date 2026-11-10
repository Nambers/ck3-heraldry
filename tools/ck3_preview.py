#!/usr/bin/env python3
"""Render CK3 coat-of-arms code to PNG using the textures of a local CK3 install.

Dev tool only: game textures are Paradox content and are never copied into the
repo. The renderer reimplements the parts of the in-game look we rely on:

  * emblem channels: B = color1 + shading (overlay), G = color2 mask,
    R = color3 mask, A = shape  (checked visually against vanilla emblems)
  * pattern channels: R = 1 (color1), G = color2 mask, B = color3 mask
  * instance transform: rotate the texture, then scale along the shield axes
    (so a squashed emblem cannot be rotated into a slanted shape)
  * depth: larger depth is further back; equal depth keeps file order

Usage:
  tools/ck3_preview.py [--game DIR] [--size N] in.txt [more.txt ...] -o out.png
  (several inputs -> a horizontal strip)
"""
from __future__ import annotations

import argparse
import colorsys
import math
import os
import re
import sys
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image

from ck3_game import find_game

DEFAULT_GAME = find_game()


# ---------------------------------------------------------------- parsing
TOKEN = re.compile(r'"[^"]*"|[{}=]|[^\s{}="]+')


def tokenize(text: str) -> list[str]:
    text = re.sub(r"#[^\n]*", "", text)
    return TOKEN.findall(text)


def parse_block(tokens: list[str], i: int) -> tuple[list, int]:
    """Parse until matching '}' -> list of (key, value) or bare values."""
    items: list = []
    while i < len(tokens):
        t = tokens[i]
        if t == "}":
            return items, i + 1
        if i + 1 < len(tokens) and tokens[i + 1] == "=":
            key = t
            i += 2
            if tokens[i] == "{":
                val, i = parse_block(tokens, i + 1)
            elif tokens[i] in ("rgb", "hsv", "hsv360") and tokens[i + 1] == "{":
                space = tokens[i]
                inner, i = parse_block(tokens, i + 2)
                val = ("__color__", (space, inner))
            else:
                val = tokens[i].strip('"')
                i += 1
            items.append((key, val))
        elif t == "{":
            val, i = parse_block(tokens, i + 1)
            items.append((None, val))
        else:
            items.append((None, t.strip('"')))
            i += 1
    return items, i


def get(items, key, default=None):
    for k, v in items:
        if k == key:
            return v
    return default


def get_all(items, key):
    return [v for k, v in items if k == key]


def nums(v, n, default):
    if v is None:
        return default
    vals = [float(x) for k, x in v if k is None]
    return tuple(vals[:n]) if len(vals) >= n else default


# ---------------------------------------------------------------- colors
def hsv_to_rgb(h, s, v):
    return np.array(colorsys.hsv_to_rgb(h, s, v))


@lru_cache(maxsize=None)
def named_colors(game: str) -> dict[str, np.ndarray]:
    text = (Path(game) / "common/named_colors/default_colors.txt").read_text(encoding="utf-8-sig")
    out = {}
    for m in re.finditer(r"(\w+)\s*=\s*(hsv360|hsv|rgb)\s*\{\s*([\d.\s]+)\}", text):
        name, space, vals = m.group(1), m.group(2), [float(x) for x in m.group(3).split()]
        if space == "hsv":
            out[name] = hsv_to_rgb(*vals)
        elif space == "hsv360":
            out[name] = hsv_to_rgb(vals[0] / 360, vals[1] / 100, vals[2] / 100)
        else:
            out[name] = np.array(vals) / 255
    return out


def color_value(v, game: str) -> np.ndarray | None:
    if v is None:
        return None
    if isinstance(v, tuple) and v[0] == "__color__":
        space, inner = v[1]
        vals = [float(x) for k, x in inner if k is None]
        if space == "rgb":
            return np.array(vals[:3]) / 255
        if space == "hsv360":
            return hsv_to_rgb(vals[0] / 360, vals[1] / 100, vals[2] / 100)
        return hsv_to_rgb(*vals[:3])
    c = named_colors(game).get(v)
    if c is None:
        print(f"warning: unknown color {v!r}", file=sys.stderr)
        return np.array([1.0, 0.0, 1.0])
    return c


# ---------------------------------------------------------------- textures
@lru_cache(maxsize=None)
def load_texture(game: str, sub: str, name: str) -> np.ndarray:
    path = Path(game) / "gfx/coat_of_arms" / sub / name
    if not path.exists():
        print(f"warning: missing texture {sub}/{name}", file=sys.stderr)
        return np.zeros((64, 64, 4))
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float32) / 255


def overlay(base: np.ndarray, blend: np.ndarray) -> np.ndarray:
    return np.where(base < 0.5, 2 * base * blend, 1 - 2 * (1 - base) * (1 - blend))


def colorize(tex: np.ndarray, c1, c2, c3) -> np.ndarray:
    r, g, b, a = tex[..., 0:1], tex[..., 1:2], tex[..., 2:3], tex[..., 3:4]
    col = c1 * (1 - g) + c2 * g
    col = col * (1 - r) + c3 * r
    col = overlay(col, b)
    return np.concatenate([np.clip(col, 0, 1), a], axis=-1)


def colorize_pattern(tex: np.ndarray, c1, c2, c3) -> np.ndarray:
    """Patterns: R is always 1 (color1), G = color2 mask, B = color3 mask, no alpha."""
    g, b = tex[..., 1:2], tex[..., 2:3]
    col = c1 * (1 - g) + c2 * g
    col = col * (1 - b) + c3 * b
    return np.concatenate([col, np.ones_like(g)], axis=-1)


def sample_affine(src: np.ndarray, n: int, pos, scale, rot_deg) -> np.ndarray:
    """Place src (H,W,4) into an n x n canvas: p = pos + S . R . (u - 0.5)."""
    h, w = src.shape[:2]
    sx, sy = scale
    if abs(sx) < 1e-6 or abs(sy) < 1e-6:
        return np.zeros((n, n, 4), np.float32)
    th = math.radians(rot_deg)
    c, s = math.cos(th), math.sin(th)
    # inverse: u = 0.5 + R^-1 S^-1 (p - pos);  R^-1 = [[c, s], [-s, c]]
    m00, m01 = c / sx, s / sy
    m10, m11 = -s / sx, c / sy
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    px = (xs + 0.5) / n - pos[0]
    py = (ys + 0.5) / n - pos[1]
    u = 0.5 + m00 * px + m01 * py
    v = 0.5 + m10 * px + m11 * py
    inside = (u >= 0) & (u < 1) & (v >= 0) & (v < 1)
    ui = np.clip((u * w).astype(int), 0, w - 1)
    vi = np.clip((v * h).astype(int), 0, h - 1)
    out = src[vi, ui]
    out[~inside] = 0
    return out


def composite(dst: np.ndarray, src: np.ndarray) -> None:
    a = src[..., 3:4]
    dst[..., :3] = src[..., :3] * a + dst[..., :3] * (1 - a)
    dst[..., 3:4] = a + dst[..., 3:4] * (1 - a)


# ---------------------------------------------------------------- render
def render(code: str, game: str, n: int = 256) -> Image.Image:
    tokens = tokenize(code)
    items, _ = parse_block(tokens, 0)
    # top level: coa_xxx = { ... }  (or a bare body)
    body = items[0][1] if items and isinstance(items[0][1], list) and items[0][0] else items
    canvas = np.zeros((n, n, 4), np.float32)

    pc = [color_value(get(body, f"color{i}"), game) for i in (1, 2, 3)]
    pc = [c if c is not None else np.zeros(3) for c in pc]
    pattern = get(body, "pattern", "pattern_solid.dds")
    ptex = colorize_pattern(load_texture(game, "patterns", pattern), *pc)
    composite(canvas, sample_affine(ptex, n, (0.5, 0.5), (1, 1), 0))

    layers = []
    order = 0
    for em in get_all(body, "colored_emblem"):
        cols = [color_value(get(em, f"color{i}"), game) for i in (1, 2, 3)]
        cols = [c if c is not None else pc[min(i, 2)] for i, c in enumerate(cols)]
        tex = colorize(load_texture(game, "colored_emblems", get(em, "texture")), *cols)
        instances = get_all(em, "instance") or [[]]
        for inst in instances:
            pos = nums(get(inst, "position"), 2, (0.5, 0.5))
            scale = nums(get(inst, "scale"), 2, (1.0, 1.0))
            depth = float(get(inst, "depth", 0))
            rot = float(get(inst, "rotation", 0))
            layers.append((depth, order, tex, pos, scale, rot))
            order += 1
    for depth, _, tex, pos, scale, rot in sorted(layers, key=lambda l: (-l[0], l[1])):
        composite(canvas, sample_affine(tex, n, pos, scale, rot))

    mask_path = Path(game) / "gfx/interface/coat_of_arms/frames/dynasty_mask.dds"
    if mask_path.exists():
        m = np.asarray(Image.open(mask_path).convert("RGBA").resize((n, n))).astype(np.float32) / 255
        alpha = m[..., 3:4] if m[..., 3].min() < 0.99 else m[..., 0:1]
        canvas[..., 3:4] *= alpha
    return Image.fromarray((np.clip(canvas, 0, 1) * 255).astype(np.uint8), "RGBA")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inputs", nargs="+")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--game", default=DEFAULT_GAME)
    ap.add_argument("--size", type=int, default=256)
    args = ap.parse_args()
    if not args.game or not Path(args.game).is_dir():
        sys.exit(f"CK3 game dir not found: {args.game} (set --game or CK3_GAME)")
    tiles = [render(Path(p).read_text(encoding="utf-8-sig"), args.game, args.size) for p in args.inputs]
    pad = 8
    strip = Image.new("RGBA", (len(tiles) * (args.size + pad) + pad, args.size + 2 * pad), (200, 200, 200, 255))
    for i, t in enumerate(tiles):
        strip.alpha_composite(t, (pad + i * (args.size + pad), pad))
    strip.save(args.out)


if __name__ == "__main__":
    main()
