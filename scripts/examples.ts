// Write example outputs (CK3 code + SVG + description) to out/ for checking.
//   node --experimental-strip-types --no-warnings scripts/examples.ts [zh-CN|en]
// then preview the CK3 code with the real textures:
//   python3 tools/ck3_preview.py out/ex/*.txt -o out/preview.png

import { mkdirSync, writeFileSync } from "node:fs";
import { serializeCoa } from "../src/ck3/coa.ts";
import { exportCk3 } from "../src/ck3/export.ts";
import { describe, fmt, fmtList } from "../src/describe.ts";
import { blazon } from "../src/heraldry/blazon.ts";
import { setLocale, type Locale } from "../src/i18n/index.ts";
import { DEFAULT_ANSWERS, type Answers } from "../src/west/answers.ts";
import { generate } from "../src/west/generate.ts";
import { renderSvg } from "../src/render/svg.ts";

setLocale((process.argv[2] as Locale) ?? "zh-CN");

export const CASES: Record<string, Partial<Answers>> = {
  // the original idea: maiden-eagle, chi-rho, Sicily claim, castle origin
  byzantine_sicily: { year: 1250, emblem: "maiden_eagle", faith: "chi_rho", claim: "sicily", origin: "castle", palette: "gules/argent" },
  lion_alone: { origin: "none", emblem: "lion_rampant", palette: "or/gules", name: "Mortimer" },
  hre_vassal: { year: 1300, liege: "hre", palette: "liege", origin: "tower", emblem: "liege", deed: "service" },
  cadet_mullets: { origin: "none", emblem: "mullet", cadency: "label", palette: "sable/argent", name: "Vere" },
  aragon_claim: { year: 1200, emblem: "crescent", origin: "lymphad", claim: "aragon", palette: "vert/or" },
  crusader: { year: 1190, emblem: "lion_passant_guardant", origin: "none", deed: "crusade", faith: "cross_patty", palette: "azure/or" },
  pilgrim_cadet: { year: 1320, emblem: "boar", origin: "tree", deed: "pilgrimage_santiago", cadency: "crescent", palette: "ermine/sable" },
  france_claim: { year: 1340, emblem: "double_eagle", origin: "none", claim: "france", palette: "purpure/or", cadency: "baton" },
  nothing: { origin: "none", emblem: "none", palette: "argent/azure", name: "Grey" },
  // rank and held titles (arms of dominion)
  count_two_titles: { year: 1250, rank: "count", titles: ["flanders", "holland"], emblem: "lion_rampant", origin: "none", palette: "argent/sable" },
  king_two_realms: { year: 1370, rank: "king", titles: ["hungary", "poland"], emblem: "fleur", origin: "none", palette: "azure/or", name: "Anjou" },
  king_one_realm: { year: 1300, rank: "king", titles: ["aragon"], emblem: "eagle", origin: "none", palette: "azure/or", name: "Barcelona" },
  emperor_only: { year: 1440, rank: "emperor", titles: ["hre"], emblem: "lion_rampant", origin: "none", palette: "gules/argent", name: "Habsburg" },
  emperor_hre: { year: 1440, rank: "emperor", titles: ["hre", "hungary", "bohemia"], emblem: "lion_rampant", origin: "none", palette: "gules/argent", name: "Luxemburg" },
  // later practices: six quarters from 1435, eight with history set aside, impalement from 1370
  six_quarters: { year: 1440, rank: "king", titles: ["hungary", "jerusalem", "cyprus", "bohemia", "poland"], emblem: "fleur", origin: "none", palette: "azure/or", name: "Anjou" },
  eight_quarters: { year: 1440, free: true, rank: "duke", titles: ["castile", "england", "aragon", "hungary", "bohemia", "poland", "flanders"], emblem: "lion_rampant", origin: "none", palette: "or/sable", cadency: "label" },
  impaled_claim: { year: 1390, claim: "jerusalem", emblem: "fleur", origin: "none", palette: "azure/or", name: "Anjou" },
  impaled_castile: { year: 1440, rank: "king", titles: ["castile"], emblem: "eagle", origin: "none", palette: "or/sable" },
  // a quartered realm inside a quarter: its castles must stay red in the export
  claim_castile: { year: 1300, claim: "castile", emblem: "lion_rampant", origin: "none", palette: "azure/or" },
};

mkdirSync("out/ex", { recursive: true });
const index: string[] = [];
for (const [name, partial] of Object.entries(CASES)) {
  const r = generate({ ...DEFAULT_ANSWERS, ...partial });
  r.candidates.forEach((c, i) => {
    const file = `out/ex/${name}_${String(i).padStart(2, "0")}`;
    const { coa, instances } = exportCk3(c.arms, `coa_rd_dynasty_${i}`);
    writeFileSync(`${file}.txt`, serializeCoa(coa) + "\n");
    writeFileSync(`${file}.svg`, renderSvg(c.arms, { size: 256 }));
    index.push(`## ${file}  [${c.id}] ${fmtList(c.label)}${c.dropped.length ? `  (dropped: ${fmtList(c.dropped)})` : ""}  ${instances} layers\n${describe(c.arms)}\n${blazon(c.arms)}\n`);
  });
  index.push(`notes: ${r.notes.map((n) => fmt(n.msg)).join(" | ")}\n`);
}
writeFileSync("out/ex/index.md", index.join("\n"));
console.log(index.join("\n"));
