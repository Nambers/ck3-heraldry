// Shared drawing pieces for the bird charges (eagle, double_eagle, eagle_crowned,
// maiden_eagle, falcon, martlet, swan): feathers, wings, legs with talons, the eagle
// head, an open crown and a curved band for necks.
// Everything is computed in absolute viewBox coordinates so each charge can place
// the pieces to fill its own box; symmetric charges draw the dexter half and mirror it.
import { path, line, INK } from "./style.ts";

export type P = [number, number];

const r2 = (v: number) => String(Math.round(v * 100) / 100);
export const fmt = (p: P) => `${r2(p[0])},${r2(p[1])}`;
const rad = (deg: number) => (deg * Math.PI) / 180;
/** unit vector for an angle in screen degrees (0 = right, 90 = down, 180 = left, 270 = up) */
export const dir = (a: number): P => [Math.cos(rad(a)), Math.sin(rad(a))];
export const add = (p: P, q: P, k = 1): P => [p[0] + q[0] * k, p[1] + q[1] * k];
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** local frame along an axis: u runs from the base along angle a, v across it; bend curves the axis */
function frame(b: P, a: number, L: number, bend = 0) {
  const d = dir(a);
  const n: P = [-d[1], d[0]];
  return (u: number, v: number): P => {
    const vv = v + bend * (u / L) ** 2;
    return [b[0] + d[0] * u + n[0] * vv, b[1] + d[1] * u + n[1] * vv];
  };
}

export interface FeatherOpts {
  /** sideways curve of the tip (positive = clockwise) */
  bend?: number;
  /** width of the base relative to the widest part */
  base?: number;
  /** rounded instead of pointed tip */
  round?: boolean;
  /** draw the quill line */
  rib?: boolean;
}

/** a single feather from base b towards angle a, length L, width wd */
export function feather(b: P, a: number, L: number, wd: number, fill: string, o: FeatherOpts = {}): string {
  const { bend = 0, base = 0.75, round = false, rib = true } = o;
  const f = frame(b, a, L, bend);
  const h = wd / 2;
  const P = (u: number, v: number) => fmt(f(u * L, v * h));
  const tipIn = round ? [0.97, 0.75, 1.0, 0.42] : [0.93, 0.62, 0.99, 0.22];
  const d =
    `M${P(0, -base)} C${P(0.3, -1)} ${P(0.6, -1.04)} ${P(0.84, -0.86)} ` +
    `C${P(tipIn[0], -tipIn[1])} ${P(tipIn[2], -tipIn[3])} ${P(1, 0)} ` +
    `C${P(tipIn[2], tipIn[3])} ${P(tipIn[0], tipIn[1])} ${P(0.84, 0.86)} ` +
    `C${P(0.6, 1.04)} ${P(0.3, 1)} ${P(0, base)} Z`;
  let s = path(d, fill);
  if (rib) s += line(`M${P(0.18, -0.1)} Q${P(0.5, -0.12)} ${P(0.8, -0.05)}`);
  return s;
}

/** point on a cubic Bezier */
export const bez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

export interface WingOpts {
  /** wing arm centre line (cubic): shoulder, two controls, wrist */
  arm: [P, P, P, P];
  /** arm half-width at the shoulder and at the wrist */
  armW: [number, number];
  /** pinions: position along the arm (0 = shoulder, 1 = wrist) and tip point; listed wrist first */
  pinions: [number, P][];
  /** pinion width */
  wd: number;
  /** covert length as a fraction of the pinion length */
  cov?: number;
  bend?: number;
}

/**
 * A wing on the dexter side: a raised arm (body), a row of rounded coverts and
 * long pointed pinions springing from the arm's outer edge.
 */
export function wing(o: WingOpts, fill: string): string {
  const [S, c1, c2, R] = o.arm;
  const A = (t: number) => bez(S, c1, c2, R, t);
  const feathers = o.pinions.map(([t, tip]) => {
    const b = A(t);
    const dx = tip[0] - b[0],
      dy = tip[1] - b[1];
    return { b, a: (Math.atan2(dy, dx) * 180) / Math.PI, L: Math.hypot(dx, dy) };
  });
  let s = "";
  // pinions: lowest first so the upper ones lie over them
  for (let i = feathers.length - 1; i >= 0; i--) {
    const f = feathers[i];
    s += feather(f.b, f.a, f.L, o.wd, fill, { bend: o.bend ?? -1.2 });
  }
  // coverts over the pinion roots
  const cov = o.cov ?? 0.42;
  for (let i = feathers.length - 1; i >= 1; i--) {
    const f = feathers[i];
    s += feather(f.b, f.a, f.L * cov, o.wd * 1.05, fill, { round: true, rib: false, base: 1 });
  }
  // the arm itself, rounded at the wrist
  const N = 16;
  const left: P[] = [],
    right: P[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = A(t),
      q = A(Math.min(1, t + 0.01)),
      r = A(Math.max(0, t - 0.01));
    const da = Math.atan2(q[1] - r[1], q[0] - r[0]);
    const hw = lerp(o.armW[0], o.armW[1], t);
    left.push(add(p, [Math.sin(da), -Math.cos(da)], hw));
    right.push(add(p, [-Math.sin(da), Math.cos(da)], hw));
  }
  const hwR = o.armW[1];
  let d = `M${fmt(left[0])}`;
  for (let i = 1; i <= N; i++) d += ` L${fmt(left[i])}`;
  d += ` A${r2(hwR)},${r2(hwR)} 0 0 1 ${fmt(right[N])}`;
  for (let i = N - 1; i >= 0; i--) d += ` L${fmt(right[i])}`;
  d += ` A${r2(o.armW[0])},${r2(o.armW[0])} 0 0 1 ${fmt(left[0])}`;
  s += path(d + " Z", fill);
  // small feathers on the arm: arcs across it, bowed towards the wrist
  for (let i = 3; i < N - 1; i += 3) {
    const m = A(Math.min(1, i / N + 0.06));
    s += line(`M${fmt(left[i])} Q${fmt(m)} ${fmt(right[i])}`);
  }
  return s;
}

/** a toe with its claw, from b along angle a; curl = +1/-1 bends the claw clockwise/anticlockwise */
export function toe(b: P, a: number, L: number, w: number, cl: number, curl: number, fill: string): string {
  const d = dir(a);
  const s = curl > 0 ? 1 : -1;
  const n: P = [-d[1] * s, d[0] * s]; // side the claw bends to
  const e = add(b, d, L);
  const hb = w / 2,
    he = w * 0.4;
  const tip = add(add(e, d, cl * 0.78), n, cl * 0.62);
  const outerBase = add(e, n, -he);
  const innerBase = add(e, n, he);
  const dd =
    `M${fmt(add(b, n, -hb))} L${fmt(outerBase)} ` +
    `Q${fmt(add(add(e, d, cl * 0.95), n, -he * 0.2))} ${fmt(tip)} ` +
    `Q${fmt(add(add(e, d, cl * 0.35), n, he * 0.6))} ${fmt(innerBase)} ` +
    `L${fmt(add(b, n, hb))} Z`;
  return path(dd, fill) + line(`M${fmt(outerBase)} L${fmt(innerBase)}`);
}

export interface LegOpts {
  /** top of the thigh (under the body), knee, ankle */
  hip: P;
  knee: P;
  ankle: P;
  /** half-width of the feathered thigh at hip and knee */
  thigh: [number, number];
  /** shank width */
  shank: number;
  /** toe length, width and claw length */
  toe: [number, number, number];
  /** directions of the three front toes and the hind toe */
  toes: [number, number, number, number];
}

/** a leg on the dexter side: feathered thigh (body), scaly shank and talons (armed) */
export function leg(o: LegOpts, body: string, armed: string): string {
  const [tl, tw, cl] = o.toe;
  let s = "";
  // talons (behind the ankle)
  const [t1, t2, t3, th] = o.toes;
  s += toe(o.ankle, th, tl * 0.7, tw, cl, +1, armed);
  s += toe(o.ankle, t1, tl, tw, cl, -1, armed);
  s += toe(o.ankle, t2, tl * 1.08, tw, cl, -1, armed);
  s += toe(o.ankle, t3, tl, tw, cl, -1, armed);
  // shank
  const da = Math.atan2(o.ankle[1] - o.knee[1], o.ankle[0] - o.knee[0]);
  const n: P = [-Math.sin(da), Math.cos(da)];
  const hw = o.shank / 2;
  const top1 = add(o.knee, n, hw * 1.1),
    top2 = add(o.knee, n, -hw * 1.1);
  const bot1 = add(o.ankle, n, hw * 0.95),
    bot2 = add(o.ankle, n, -hw * 0.95);
  const ankleBall = `M${fmt(bot1)} A${r2(hw * 1.3)},${r2(hw * 1.3)} 0 1 1 ${fmt(bot2)} Z`;
  s += path(`M${fmt(top1)} L${fmt(bot1)} L${fmt(bot2)} L${fmt(top2)} Z`, armed);
  s += path(ankleBall, armed);
  for (const t of [0.35, 0.65]) {
    const c: P = [lerp(o.knee[0], o.ankle[0], t), lerp(o.knee[1], o.ankle[1], t)];
    s += line(`M${fmt(add(c, n, hw * 0.95))} Q${fmt(add(add(c, n, 0), [Math.cos(da), Math.sin(da)], hw * 0.5))} ${fmt(add(c, n, -hw * 0.95))}`);
  }
  // feathered thigh ("hose"): a full, rounded shape whose lower edge is a fringe of points
  const dk = Math.atan2(o.knee[1] - o.hip[1], o.knee[0] - o.hip[0]);
  const nk: P = [-Math.sin(dk), Math.cos(dk)];
  const ak: P = [Math.cos(dk), Math.sin(dk)];
  const [h0, h1] = o.thigh;
  const K = (u: number, v: number): P => add(add(o.knee, ak, u), nk, v);
  const H = (u: number, v: number): P => add(add(o.hip, ak, u), nk, v);
  const len = Math.hypot(o.knee[0] - o.hip[0], o.knee[1] - o.hip[1]);
  let d = `M${fmt(H(0, h0))} C${fmt(H(len * 0.35, h0 + h1 * 0.55))} ${fmt(K(-len * 0.25, h1 * 1.25))} ${fmt(K(0, h1))}`;
  const pts = [1, 0.33, -0.33, -1];
  for (let k = 0; k < pts.length; k++) {
    const v = pts[k] * h1 * 0.92;
    d += ` L${fmt(K(h1 * 0.75, v))}`;
    if (k < pts.length - 1) d += ` L${fmt(K(h1 * 0.15, (v + pts[k + 1] * h1 * 0.92) / 2))}`;
  }
  d += ` L${fmt(K(0, -h1))} C${fmt(K(-len * 0.3, -h1 * 1.05))} ${fmt(H(len * 0.3, -h0))} ${fmt(H(0, -h0))} Z`;
  s += path(d, body);
  for (const v of [0.33, -0.33]) s += line(`M${fmt(K(-h1 * 0.9, v * h1 * 1.2))} L${fmt(K(h1 * 0.15, v * h1 * 0.92 * 0.5 + v * h1 * 0.46))}`);
  return s;
}

/** a path symmetric about x = cx: start on the axis, cubic segments down the dexter side, ending on the axis */
export function symmetric(cx: number, start: P, segs: [P, P, P][]): string {
  const R = (p: P): P => [2 * cx - p[0], p[1]];
  let d = `M${fmt(start)}`;
  for (const [c1, c2, p] of segs) d += ` C${fmt(c1)} ${fmt(c2)} ${fmt(p)}`;
  for (let i = segs.length - 1; i >= 0; i--) {
    const [c1, c2] = segs[i];
    const prev = i === 0 ? start : segs[i - 1][2];
    d += ` C${fmt(R(c2))} ${fmt(R(c1))} ${fmt(R(prev))}`;
  }
  return d + " Z";
}


/**
 * Eagle head facing dexter (left) with open beak and tongue, in local units:
 * skull centre near 0,0, back of the head at x = 8, beak tip at x = -13.5, tongue tip at -16.5.
 * Place it with `<g transform="translate(..) scale(..)">`.
 */
export function eagleHead(body: string, armed: string): string {
  // tongue (behind the mandibles), curling up in front of the beak into an arrow head
  let s = path(
    "M-4.4,1.4 C-8,1.9 -10.8,2.8 -12.4,3.3 C-13.6,3.6 -14.3,2.8 -14.6,1.6 L-13.8,1.4 L-15.6,-2.2 L-16.9,1.8 L-15.8,1.6 C-15.6,3.6 -14,4.8 -12.4,4.5 C-10.6,4.2 -8,3.4 -4.4,2.8 Z",
    armed,
  );
  // lower mandible
  s += path("M-4.2,2 C-6.4,2.6 -8.4,3.6 -10.2,5 C-8.6,5.6 -6.2,5.4 -4,4.2 Z", armed);
  // skull: flat crown, pointed feathers at the nape
  s += path(
    "M-4.2,-4.4 C-2.6,-5.6 0,-6 3,-5.8 C5.6,-5.6 7.6,-4.4 8.2,-2 C8.4,-0.6 8.4,0.6 8.2,1.4 L10.4,3.4 L7.4,3.8 L8.2,6.4 L4.6,5.4 C2,5.8 -1.2,5 -2.8,3.6 C-3.8,2.8 -4.4,1.6 -4.5,0.4 C-4.6,-1.2 -4.6,-3 -4.2,-4.4 Z",
    body,
  );
  // upper mandible: straight ridge, then a sharp hook
  s += path(
    "M-3.8,-4.6 C-7,-4.6 -10.2,-3.8 -12,-1.9 C-13.2,-0.6 -13.6,1.2 -13,3.1 C-12.6,1.9 -12,1.3 -11,1.1 C-9,0.8 -6.4,0.7 -4.2,1.1 Z",
    armed,
  );
  s += line("M-4,-4.3 C-4.5,-2.8 -4.5,-1.2 -4.2,0.2"); // cere
  s += `<circle cx="-1.6" cy="-2" r="1.2" fill="${INK}"/>`;
  s += line("M-3.9,-2.8 Q-1.6,-4.4 1.6,-4.1"); // brow
  s += line("M1,2.4 Q4,2.6 6.4,0.2"); // cheek
  return s;
}

/** one fleuron (trefoil leaf) of a crown, base centre at (x, y), width w, height h */
function fleuron(x: number, y: number, w: number, h: number, fill: string): string {
  const pts: [number, number][][] = [
    [[-0.24, -0.2], [-0.4, -0.28], [-0.55, -0.32]],
    [[-0.8, -0.4], [-0.78, -0.78], [-0.46, -0.78]],
    [[-0.32, -0.78], [-0.24, -0.7], [-0.2, -0.6]],
    [[-0.28, -0.8], [-0.14, -0.94], [0, -1]],
    [[0.14, -0.94], [0.28, -0.8], [0.2, -0.6]],
    [[0.24, -0.7], [0.32, -0.78], [0.46, -0.78]],
    [[0.78, -0.78], [0.8, -0.4], [0.55, -0.32]],
    [[0.4, -0.28], [0.24, -0.2], [0.22, 0]],
  ];
  const T = ([u, v]: [number, number]) => fmt([x + u * w, y + v * h]);
  let d = `M${T([-0.22, 0])}`;
  for (const [a, b, e] of pts) d += ` C${T(a)} ${T(b)} ${T(e)}`;
  return path(d + " Z", fill);
}

/**
 * An open crown seen from the front: a jewelled band with three fleurons.
 * Local units: base centre at 0,0, 18 wide, 12 tall (top at y = -12).
 */
export function crown(fill: string): string {
  let s = "";
  s += fleuron(-6.2, -3, 5, 7.2, fill) + fleuron(6.2, -3, 5, 7.2, fill) + fleuron(0, -3, 7, 9, fill);
  s += path("M-9,-4.4 Q0,-5.8 9,-4.4 L9,0 Q0,-1.4 -9,0 Z", fill);
  s += line("M-9,-1.2 Q0,-2.6 9,-1.2");
  for (const x of [-5.4, 0, 5.4]) s += path(`M${x - 1.2},-2.8 L${x},-4 L${x + 1.2},-2.8 L${x},-1.8 Z`, fill);
  return s;
}

/**
 * A band of varying width along a chain of cubic Bezier segments (e.g. a swan's neck).
 * `segs` continue from `start`; `w` gives the width at the start and the end.
 */
export function tube(start: P, segs: [P, P, P][], w: [number, number], steps = 10): string {
  const pts: P[] = [];
  let p0 = start;
  for (const [c1, c2, p3] of segs) {
    for (let i = pts.length ? 1 : 0; i <= steps; i++) pts.push(bez(p0, c1, c2, p3, i / steps));
    p0 = p3;
  }
  const a: P[] = [],
    b: P[] = [];
  for (let i = 0; i < pts.length; i++) {
    const q = pts[Math.min(pts.length - 1, i + 1)],
      r = pts[Math.max(0, i - 1)];
    const da = Math.atan2(q[1] - r[1], q[0] - r[0]);
    const hw = lerp(w[0], w[1], i / (pts.length - 1)) / 2;
    a.push(add(pts[i], [-Math.sin(da), Math.cos(da)], hw));
    b.push(add(pts[i], [Math.sin(da), -Math.cos(da)], hw));
  }
  return "M" + a.map(fmt).join(" L") + " L" + b.reverse().map(fmt).join(" L") + " Z";
}
