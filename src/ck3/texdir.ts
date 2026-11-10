// Remembering the game's texture folder between visits (Chromium's File System
// Access API). The directory handle lives in this browser's IndexedDB; the
// browser asks again for permission on a later visit. Where the API is
// missing, the page falls back to <input webkitdirectory> and remembers nothing.

export interface DirHandle {
  kind: "directory";
  name: string;
  values(): AsyncIterable<DirHandle | FileHandle>;
  getDirectoryHandle(name: string): Promise<DirHandle>;
  queryPermission?(o: { mode: "read" }): Promise<PermissionState>;
  requestPermission?(o: { mode: "read" }): Promise<PermissionState>;
}
export interface FileHandle {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
}

type Picker = (o: { id?: string; mode?: "read" }) => Promise<DirHandle>;
const picker = (): Picker | undefined => (globalThis as { showDirectoryPicker?: Picker }).showDirectoryPicker;
export const canPickDirectory = () => typeof picker() === "function";

export function pickDirectory(): Promise<DirHandle> {
  return picker()!({ id: "ck3-coat-of-arms", mode: "read" });
}

/** the coat_of_arms folder, whether the player picked it, gfx, game, or the game's root */
export async function findCoatOfArms(dir: DirHandle): Promise<DirHandle | null> {
  const has = async (d: DirHandle, name: string) => {
    for await (const e of d.values()) if (e.kind === "directory" && e.name.toLowerCase() === name) return e as DirHandle;
    return null;
  };
  if (await has(dir, "colored_emblems")) return dir;
  for (const path of [["coat_of_arms"], ["gfx", "coat_of_arms"], ["game", "gfx", "coat_of_arms"]]) {
    let d: DirHandle | null = dir;
    for (const p of path) d = d && (await has(d, p));
    if (d && (await has(d, "colored_emblems"))) return d;
  }
  return null;
}

/** every .dds under colored_emblems/ and patterns/, as lazily opened files */
export async function listTextures(coa: DirHandle): Promise<Map<string, FileHandle>> {
  const out = new Map<string, FileHandle>();
  for await (const sub of coa.values()) {
    const name = sub.name.toLowerCase();
    if (sub.kind !== "directory" || (name !== "colored_emblems" && name !== "patterns")) continue;
    for await (const f of (sub as DirHandle).values()) if (f.kind === "file" && /\.dds$/i.test(f.name)) out.set(`${name}/${f.name.toLowerCase()}`, f as FileHandle);
  }
  return out;
}

// --- IndexedDB: one record holding the handle

const DB = "ck3-heraldry", STORE = "handles", KEY = "coat_of_arms";

function db(): Promise<IDBDatabase> {
  return new Promise((ok, no) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((ok, no) => {
    const r = f(d.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
}

export async function rememberDir(h: DirHandle): Promise<void> {
  try {
    await tx("readwrite", (s) => s.put(h, KEY));
  } catch {
    /* storage blocked: nothing to remember */
  }
}

export async function recallDir(): Promise<DirHandle | null> {
  try {
    return ((await tx("readonly", (s) => s.get(KEY))) as DirHandle | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function forgetDir(): Promise<void> {
  try {
    await tx("readwrite", (s) => s.delete(KEY));
  } catch {
    /* nothing stored */
  }
}
