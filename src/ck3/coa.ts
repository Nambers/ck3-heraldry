// CK3 coat-of-arms code: model, parser and serializer.
// Format follows what the in-game designer copies to the clipboard.

export type Ck3Color = string | { space: "rgb" | "hsv" | "hsv360"; v: number[] };

export interface Instance {
  position?: [number, number]; // default 0.5 0.5
  scale?: [number, number]; // default 1 1; negative = mirrored
  depth?: number; // larger = further back
  rotation?: number; // degrees, clockwise
}

export interface ColoredEmblem {
  texture: string;
  color1?: Ck3Color;
  color2?: Ck3Color;
  color3?: Ck3Color;
  instances: Instance[];
}

export interface Coa {
  key: string;
  custom?: boolean;
  pattern: string;
  color1?: Ck3Color;
  color2?: Ck3Color;
  color3?: Ck3Color;
  emblems: ColoredEmblem[];
}

// ---------------------------------------------------------------- parser
type Value = string | Node[] | { space: "rgb" | "hsv" | "hsv360"; v: number[] };
interface Node {
  key: string | null;
  value: Value;
}

function tokenize(text: string): string[] {
  const noComments = text.replace(/#[^\n]*/g, "");
  return noComments.match(/"[^"]*"|[{}=]|[^\s{}="]+/g) ?? [];
}

function parseBlock(tokens: string[], i: number): [Node[], number] {
  const items: Node[] = [];
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "}") return [items, i + 1];
    if (tokens[i + 1] === "=") {
      const key = t;
      i += 2;
      const v = tokens[i];
      if (v === "{") {
        const [block, j] = parseBlock(tokens, i + 1);
        items.push({ key, value: block });
        i = j;
      } else if ((v === "rgb" || v === "hsv" || v === "hsv360") && tokens[i + 1] === "{") {
        const [block, j] = parseBlock(tokens, i + 2);
        items.push({ key, value: { space: v, v: block.map((n) => Number(n.value)) } });
        i = j;
      } else {
        items.push({ key, value: v.replace(/^"|"$/g, "") });
        i += 1;
      }
    } else if (t === "{") {
      const [block, j] = parseBlock(tokens, i + 1);
      items.push({ key: null, value: block });
      i = j;
    } else {
      items.push({ key: null, value: t.replace(/^"|"$/g, "") });
      i += 1;
    }
  }
  return [items, i];
}

const get = (nodes: Node[], key: string) => nodes.find((n) => n.key === key)?.value;
const getAll = (nodes: Node[], key: string) => nodes.filter((n) => n.key === key).map((n) => n.value);
const pair = (v: Value | undefined): [number, number] | undefined =>
  Array.isArray(v) ? [Number(v[0].value), Number(v[1].value)] : undefined;
const color = (v: Value | undefined): Ck3Color | undefined =>
  v === undefined || Array.isArray(v) ? undefined : v;
const num = (v: Value | undefined): number | undefined => (typeof v === "string" ? Number(v) : undefined);

/** Parse one coat of arms (`coa_xxx = { ... }`) from designer/clipboard text. */
export function parseCoa(text: string): Coa {
  const [top] = parseBlock(tokenize(text), 0);
  const first = top.find((n) => n.key !== null && Array.isArray(n.value));
  const body = (first ? first.value : top) as Node[];
  const key = first?.key ?? "coa";
  const emblems: ColoredEmblem[] = getAll(body, "colored_emblem").map((ev) => {
    const e = ev as Node[];
    return {
      texture: String(get(e, "texture")),
      color1: color(get(e, "color1")),
      color2: color(get(e, "color2")),
      color3: color(get(e, "color3")),
      instances: getAll(e, "instance").map((iv) => {
        const n = iv as Node[];
        const inst: Instance = {};
        const p = pair(get(n, "position"));
        const s = pair(get(n, "scale"));
        const d = num(get(n, "depth"));
        const r = num(get(n, "rotation"));
        if (p) inst.position = p;
        if (s) inst.scale = s;
        if (d !== undefined) inst.depth = d;
        if (r !== undefined) inst.rotation = r;
        return inst;
      }),
    };
  });
  return {
    key,
    custom: get(body, "custom") === "yes" ? true : undefined,
    pattern: String(get(body, "pattern") ?? "pattern_solid.dds"),
    color1: color(get(body, "color1")),
    color2: color(get(body, "color2")),
    color3: color(get(body, "color3")),
    emblems,
  };
}

// ---------------------------------------------------------------- serializer
const f6 = (n: number) => (Object.is(n, -0) ? 0 : n).toFixed(6);
const colorStr = (c: Ck3Color) => (typeof c === "string" ? c : `${c.space} { ${c.v.join(" ")} }`);

/** Serialize in the same shape the in-game designer copies to the clipboard. */
export function serializeCoa(coa: Coa): string {
  const L: string[] = [`${coa.key}={`];
  if (coa.custom) L.push("custom=yes");
  L.push(`pattern="${coa.pattern}"`);
  for (const k of ["color1", "color2", "color3"] as const) if (coa[k] !== undefined) L.push(`${k}=${colorStr(coa[k]!)}`);
  for (const e of coa.emblems) {
    L.push("colored_emblem={");
    for (const k of ["color1", "color2", "color3"] as const) if (e[k] !== undefined) L.push(`${k}=${colorStr(e[k]!)}`);
    L.push(`texture="${e.texture}"`);
    for (const i of e.instances) {
      L.push("instance={");
      if (i.position) L.push(`position={ ${f6(i.position[0])} ${f6(i.position[1])} }`);
      if (i.scale) L.push(`scale={ ${f6(i.scale[0])} ${f6(i.scale[1])} }`);
      if (i.depth !== undefined) L.push(`depth=${f6(i.depth)}`);
      if (i.rotation !== undefined) L.push(`rotation=${Math.round(i.rotation)}`);
      L.push("}");
    }
    L.push("}");
  }
  L.push("}");
  return L.join("\n");
}

export const instanceCount = (coa: Coa): number => coa.emblems.reduce((n, e) => n + e.instances.length, 0);
