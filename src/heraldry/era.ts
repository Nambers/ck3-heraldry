// Practices that came later than the rest of what the generator does, opened by
// the year the player chose (docs/roadmap.md, "年代").
//
// Each has the earliest year a checkable source shows it in use (LATE_SOURCES in
// src/pages/sources.ts); before that year it is left out, unless the player has
// set history aside (Answers.free). One with no source before 1453, the end of
// CK3, opens only then (null).

export interface Era {
  year: number;
  free: boolean;
}

export const LATE = {
  /** two coats side by side (impaled): the Gelre Armorial, c. 1370, has it; the earlier rolls do not */
  impalement: 1370,
  /** more than four quarters: René of Anjou bore six from 1435 */
  quarterlyOfSix: 1435,
  /** quarterly of eight: no example found before 1453 */
  quarterlyOfEight: null,
} as const satisfies Record<string, number | null>;

export type Late = keyof typeof LATE;

/** may this late practice be used in this year? */
export function opens(k: Late, e: Era): boolean {
  const since: number | null = LATE[k];
  return e.free || (since !== null && e.year >= since);
}
