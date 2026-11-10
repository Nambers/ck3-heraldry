// Designs saved in this browser, by name. Each entry is just the answers as
// encoded in the URL, so a saved design and a shared link are the same thing.
// Each designer page has its own list (their answers mean different things).
// Browser storage can be missing or blocked (private windows, previews): every
// access is guarded and the page works without it.

export interface Saved {
  name: string;
  /** encodeAnswers() output, without the leading "#" */
  hash: string;
  /** ms since epoch */
  at: number;
}

/** the western designer keeps the key it had before there were several designers */
const keyOf = (designer: string) => (designer === "west" ? "ck3-heraldry.saved.v1" : `ck3-heraldry.${designer}.saved.v1`);

export interface SavedStore {
  load(): Saved[];
  /** save under a name (replacing an entry of the same name); newest first */
  save(name: string, hash: string): { ok: boolean; replaced: boolean };
  remove(name: string): Saved | undefined;
  restore(s: Saved): void;
}

export function savedStore(designer: string): SavedStore {
  const KEY = keyOf(designer);
  const load = () => loadSaved(KEY);
  const write = (list: Saved[]) => writeSaved(KEY, list);
  return {
    load,
    save(name, hash) {
      const list = load();
      const replaced = list.some((s) => s.name === name);
      const ok = write([{ name, hash, at: Date.now() }, ...list.filter((s) => s.name !== name)].slice(0, 200));
      return { ok, replaced };
    },
    remove(name) {
      const list = load();
      const gone = list.find((s) => s.name === name);
      write(list.filter((s) => s.name !== name));
      return gone;
    },
    restore(s) {
      write([...load().filter((x) => x.name !== s.name), s].sort((a, b) => b.at - a.at));
    },
  };
}

function loadSaved(KEY: string): Saved[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(v)) return [];
    return v.filter((s): s is Saved => s && typeof s.name === "string" && typeof s.hash === "string" && typeof s.at === "number");
  } catch {
    return [];
  }
}

function writeSaved(KEY: string, list: Saved[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/** a link that opens the same design in the same designer; the language is left to the recipient's browser */
export function shareLink(designer: string, hash: string): string {
  return `${location.origin}${location.pathname}?p=${encodeURIComponent(designer)}${hash ? "#" + hash : ""}`;
}
