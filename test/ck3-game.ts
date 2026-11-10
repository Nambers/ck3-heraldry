// Where the local CK3 install is, for the tests that read real game files.
// Set CK3_GAME to ".../Crusader Kings III/game"; otherwise the usual Steam
// locations are tried. Without an install those tests are skipped.
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const IN_STEAM = "steamapps/common/Crusader Kings III/game";
const STEAM_ROOTS = [
  join(homedir(), ".steam/steam"),
  join(homedir(), ".local/share/Steam"),
  join(homedir(), "Library/Application Support/Steam"),
  "C:/Program Files (x86)/Steam",
];

export const GAME: string | undefined =
  process.env.CK3_GAME || STEAM_ROOTS.map((r) => join(r, IN_STEAM)).find((p) => existsSync(p));

/** a path inside the game directory, or undefined without an install */
export const gamePath = (rel: string): string | undefined => (GAME ? join(GAME, rel) : undefined);

/** true when the file or folder exists in the local install */
export const inGame = (rel: string): boolean => {
  const p = gamePath(rel);
  return !!p && existsSync(p);
};
