"""Locate the local CK3 install for the dev tools.

Set CK3_GAME to ".../Crusader Kings III/game" (or pass --game); otherwise the
usual Steam locations are tried. Mirrors test/ck3-game.ts.
"""
from __future__ import annotations

import os
from pathlib import Path

IN_STEAM = "steamapps/common/Crusader Kings III/game"
STEAM_ROOTS = [
    Path.home() / ".steam/steam",
    Path.home() / ".local/share/Steam",
    Path.home() / "Library/Application Support/Steam",
    Path("C:/Program Files (x86)/Steam"),
]


def find_game() -> str | None:
    env = os.environ.get("CK3_GAME")
    if env:
        return env
    for root in STEAM_ROOTS:
        if (root / IN_STEAM).is_dir():
            return str(root / IN_STEAM)
    return None
