# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A static site (Vite + TypeScript, no runtime dependencies) that turns questionnaire answers about a family's story into heraldically correct coats of arms, previewed as SVG and exported as Crusader Kings III coat-of-arms code using vanilla textures only. Only the Western rulers designer (`src/west/`) exists so far.

Detailed docs are in Chinese: `CONTRIBUTING.md` (code map and step-by-step recipes for adding a charge, realm, language, example, designer, or background art), `docs/design.md` (data flow, generator, marshalling, layout lint, charge drawing), `docs/ck3-format.md` (CK3 code format, texture channel quirks, in-game verification checklist), `docs/roadmap.md`, `docs/roll-gaps.md` (what 13th-century rolls of arms use that we cannot yet make, ranked; it orders the roadmap). Follow the CONTRIBUTING recipes rather than improvising: they list every file that must change together.

## Commands

```sh
pnpm dev                          # http://localhost:5173
pnpm check                        # tsc --noEmit + vitest run (~30 s); CI runs typecheck, test, build, then deploys `main` to GitHub Pages
pnpm vitest run test/rules.test.ts          # one test file
pnpm vitest run test/rules.test.ts -t "<name>"  # one test
pnpm build && pnpm preview        # static build to dist/, served on :4719
```

Dev scripts (outputs go to `out/`, which is gitignored):

- `pnpm art:index`: regenerate `src/art/index.ts` after adding or removing a charge drawing (never edit that file by hand; `test/data.test.ts` checks it is current)
- `pnpm art:sheet <id...>` / `pnpm art:grid <id...>`: render charge samples to SVG
- `pnpm examples [zh-CN|en]`: write a fixed set of cases to `out/ex/`
- `pnpm lint:layouts [N]`: run the layout lint over N random answer sets and summarise; run before and after any generator or layout change and compare
- `python3 tools/ck3_preview.py out/ex/*.txt -o out/preview.png`, `python3 tools/measure_textures.py ce_xxx`: need a local CK3 install plus Pillow and numpy
- `python3 tools/roll_gaps.py`: counts which features of the rolls of arms in `fixtures/rolls/` are not yet supported (stdlib only). When you add support for a mechanism, update its status in that file and rerun to refresh `docs/roll-gaps.md`

Tests that read real game files (`test/dds.test.ts`, texture-name checks) locate CK3 through `CK3_GAME` (`.../Crusader Kings III/game`) or the default Steam paths (`test/ck3-game.ts`), and skip without it.

## Architecture

**One page, many views.** `index.html` + `src/app.ts` is the shell (header, nav, language switch). `?p=<id>` picks a view from `src/routes.ts` (lazy-loaded); everything after `#` belongs to the view: a designer's encoded answers (so a share link is just the URL), or an anchor on a reading page. Navigation uses the History API without reloading, so loaded game textures and in-progress designs survive.

**Designers.** Each identity/region gets its own designer with its own answers, questions, and generator, plugged into the shared page `src/designer/page.ts` through the `Designer<A>` interface in `src/designer/types.ts`. The shared page owns preview, candidate list, CK3 code, local saving, sharing, and game-texture preview. `src/west/` is the reference implementation (`answers.ts`, `questions.ts`, `form.ts`, `generate.ts`, `legend.ts`, `index.ts`, `page.ts`).

**Data flow:** the single source of truth is a structured blazon, `Arms` (`src/heraldry/ast.ts`), not an image or CK3 code.

```
Answers → generate() → Candidate[] (each has Arms)
            ├─ checkArms()   tincture rules (src/heraldry/rules.ts)
            ├─ blazon()      English blazon, never translated
            ├─ describe()    localized description (src/describe.ts + i18n)
            └─ layout()      src/layout.ts → positioned draw nodes
                 ├─ renderSvg()   web preview using our own art (src/art/)
                 └─ exportCk3()   CK3 code using vanilla textures (src/ck3/)
                      └─ renderCoa()  optional exact preview from the player's own game textures
```

SVG and CK3 code come from the same `layout()` result, so positions always match; only the artwork differs. `src/lint.ts` samples points in the draw nodes to detect overlap and edge clipping.

**Generator rules that are easy to break:**

- Correct by construction: tinctures are assigned by role so candidates never violate the rule of tincture. When wishes conflict, every valid solution becomes its own candidate, and wishes that could not fit go into `dropped` (shown to the user) rather than being forced in.
- Candidates have stable layout ids (e.g. `chief#0`) stored in the answers, so the user's pick survives other answer changes.
- The family name deterministically picks the default ordinary, division, variation, fur, semé, and line; the player can choose each instead (`Answers.geom`, options in `GEOM` in `src/west/questions.ts`). Changing those rotations changes many families' default arms; old share links are not guaranteed to stay the same for now. Pin examples with `geom` so they do not depend on the name.
- Practices later than the rest are built, not dropped, and opened by year: `opens()` in `src/heraldry/era.ts`, each with the earliest sourced year (`LATE_SOURCES` in `src/pages/sources.ts`; `null` = no source before 1453, free mode only). Impalement opens in 1370, quarterly of six in 1435, eight only in free mode; `maxQuarters()`/`maxTitles()` follow.
- "No regard for history" mode (`Answers.free`, URL `x=true`) lifts only the period: realm arms in any year, later practices in any year. It never lifts CK3's technical limits. Titles above the rank and palettes against the rule of tincture are not behind it: the form folds them away under their questions and the player picks them there (breaches are real heraldry, "armes à enquérir", and get a note). CK3 cannot clip layers, so only arms passing `escutcheonSafe()` may go on an escutcheon. Historical realm arms are used as-is, and rule checks skip quarters and escutcheons marked as a realm's.
- Generators emit i18n messages (`Msg`: key + params), never text. Grammar that differs between languages (Chinese measure words, plurals, articles) lives in `src/describe.ts`.

**Data tables:**

- `src/charges.ts`: `LIST` holds each charge's English singular/plural, visible `bbox` measured from the game texture, and CK3 recipe (vanilla textures + colour-channel roles). `TEX` holds the other textures. Charges missing from vanilla are composed from vanilla parts (see `maiden_eagle`).
- `src/art/<id>.ts`: one original drawing per charge (contract in `src/art/types.ts`). The viewBox aspect must match the texture's `bbox`, and colours come only from roles (`c.body`, `c.armed`, …). Files starting with `_` are shared parts.
- `src/realms.ts`: realm arms by period. Periods must be contiguous, and the last one has no `to`. Each realm needs a source in `src/pages/sources.ts`.
- `src/i18n/*.json`: all UI text, charge names, and realm names. Every catalog must have the same keys.
- `src/pages/example-list.ts`: examples generated live from answers. `test/examples.test.ts` pins each one's layout, dropped wishes, and blazon, so if a generator change alters an example, confirm the new result is correct before updating the list.

`test/data.test.ts` is the consistency net (every charge has art, names, and an up-to-date index; realm periods are contiguous and sourced; catalogs match; every page has a route). Its failure messages say which step is missing. `test/generate.test.ts` samples thousands of answer sets and requires valid tinctures, parseable CK3 code, zero lint issues, and complete text.

## Conventions and constraints

- `scripts/*.ts` run directly under Node ≥ 22.18 type stripping, and they import from `src/`. So all relative imports carry the `.ts` extension, JSON imports use `with { type: "json" }`, type-only imports use `import type` (`verbatimModuleSyntax`), and code must stay erasable-only TS (no enums, namespaces, or parameter properties).
- No runtime dependencies and no external fonts. Open an issue before adding a dependency.
- Never commit game files: no textures, screenshots, or data exported from game files. Texture file names and numbers measured from textures (bboxes, channel roles) are fine. Charge art must be original and not traced. Historical data (realm arms, dates, heraldic rules) needs a checkable source.
- Every heraldic mechanism must correspond to a real historical practice. Don't attach invented symbolism (e.g. "red means courage") to charges or colours.
- Code and comments are in English; docs are in Chinese. Two-space indent, TS `strict`.
- Texture colour channels are easy to get wrong (e.g. `ce_sword_simple` color2 is the blade). Check `docs/ck3-format.md` before writing a CK3 recipe. In CK3 code, rotation is applied before the axis-aligned scale.
