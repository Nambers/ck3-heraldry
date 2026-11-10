#!/usr/bin/env python3
"""Measure what medieval rolls of arms need that the generator cannot yet make.

Dev tool. Reads fixtures/rolls/walford-perceval-1864.tsv (public domain blazons,
see fixtures/rolls/README.md), breaks every coat into heraldic features, and
classifies each feature by how far we are from supporting it:

  ok       Arms can express it and the generator makes it
  arms     Arms can express it; the generator never makes it
  tex      a vanilla CK3 texture exists; it only needs wiring up
  compose  can be built from vanilla layers (needs an in-game check)
  layout   the textures exist; needs a new placement or count in layout()
  new      no vanilla texture: needs a composition from parts, or cannot be done
  no       CK3 cannot do it (no clipping: counterchanging)

A coat is "expressible" when all of its features are ok or arms. The greedy
table answers "which work item, done next, makes the most coats expressible".

  tools/roll_gaps.py                      summary, gap table, greedy order
  tools/roll_gaps.py --show "maunch"      coats with a feature (substring)
  tools/roll_gaps.py --unknown            words no feature recognises
  tools/roll_gaps.py --markdown           tables as Markdown (for docs/)
"""
import argparse, collections, csv, re, sys
from pathlib import Path

TSV = Path(__file__).resolve().parent.parent / "fixtures/rolls/walford-perceval-1864.tsv"
ROLLS = {"C": "Walford's Roll (c. 1275)", "F": "Charles' Roll (c. 1285)", "E": "St George's Roll (c. 1285)"}

# --------------------------------------------------------------- normalising

# OCR slips in the 1864 print, and spelling variants of the editors
OCR = [
    (r"\bchecquy\b|\bcheckey\b|\bchecky\b|\bcheky\b|\beschekere\b", "chequy"),
    (r"\bbi[lu][lu]?[eiu]tt?(ee|e|y)\b", "billetty"),
    (r"\bbezant(ee|e|y)\b|\bbesantee?\b", "bezanty"), (r"\bplat(ee|e|y)\b", "platy"),
    (r"\bcrus(il+|ul+|iu)y\b|\bcrusily\b", "crusilly"), (r"\bund(ee|e|y)\b|\bwavy\b", "wavy"),
    (r"\bdancett(ee|e|y)?\b", "dancetty"), (r"\bg\w?y?r?onn?(ee|y)\b|\bgjtonny\b|\bgeronne\b", "gyronny"),
    (r"\bfusi(u|l)l?y\b|\bfusily\b", "fusilly"), (r"\binesc[uo]cheons?\b|\binescutcheons?\b", "inescutcheon"),
    (r"\bgem(el|elles|eues|elle|els|ells)\b", "gemel"), (r"\b(koncels|tlocel|lioncell?s?|leonceux|lionceux|leonceaux)\b", "lioncels"),
    (r"\bmuuets\b", "mullets"), (r"\btbree\b", "three"), (r"\bescucheons?\b", "escutcheons"), (r"\btrellis\b", "fretty"),
    (r"\bsixf ?oils\b", "sixfoils"), (r"\bfasils\b", "fusils"), (r"\bnebul(ee|ae|y)\b", "nebuly"),
    (r"\bkons\b|\bicons\b", "lions"), (r"\b(uon|kon|hon|liou)\b", "lion"), (r"\bsix-?foils?\b", "sixfoils"),
    (r"\bhorse-shoes\b", "horseshoes"), (r"\bescall?(ods|- ?lops)\b", "escallops"),
    (r"\bazm\b|\bazurc\b|\baaure\b|\bazutc\b|\ba\.zure\b", "azure"),
    (r"\bafess\b", "a fess"), (r"\bfrettyof\b", "fretty of"), (r"\bpretty\b", "fretty"), (r"\ben- ?grailed\b", "engrailed"),
    (r"\bram- ?pant\b", "rampant"), (r"\bcinque- ?foils?\b", "cinquefoils"), (r"\bfleiirs\b", "fleurs"),
    (r"\bgiqes\b|\bgulcs\b|\bqu\b", "gules"), (r"\bardent\b|\barg\b", "argent"), (r"\byair\b", "vair"),
    (r"\bpassantguardant\b", "passant guardant"), (r"\bcounter- ?changed?\b|\bcounterchange[da]?\b", "counterchanged"),
    (r"\bfesse\b", "fess"), (r"\bcabosh?ed\b", "cabossed"), (r"\bbor- ?dure\b|\bborder\b", "bordure"),
    (r"\bfleurs? de lis\b|\bfleur-de-lis\b", "fleurs-de-lis"), (r"\bquarterly-?(?=\w)", "quarterly "), (r"\bpassant-\b", "passant"),
    (r"\bmth\b", "with"), (r"\berance\b|\bprance\b", "france"),
]

# Walford's Roll is in Anglo-Norman: map its words onto the English used below
FRENCH = [
    (r"\bd' ?or\b|\bde or\b", "or"), (r"\bd' ?argent\b|\bde argent\b", "argent"), (r"\b(de )?(gulez|goules|giilez)\b|\bde gules\b", "gules"),
    (r"\bd' ?a[iz]+ure\b|\bde azure\b", "azure"), (r"\bde sable\b", "sable"), (r"\bde vert\b", "vert"), (r"\bpurpur\b", "purpure"),
    (r"\b(d'|de )?erm(in|ine|yn)\b", "ermine"), (r"\b(de )?(veire|voire|veyre|veir|verry)\b|\bveiree\b", "vair"),
    (r"\bescart(ille|elle|ele|ile)\b", "quarterly"), (r"\bparty\b", "per pale"), (r"(?<!per )\bpal(ee|e)\b", "paly"),
    (r"\bbur(ule|ulee|elle|ele|ue|uue|uUe|ulle)\b|\bbarre\b", "barry"), (r"\bmenue bu\w+\b", "of many pieces"),
    (r"\bmasculee\b", "masculy"), (r"\bcheveronnee\b", "chevronny"), (r"\bfrette\b", "fretty"),
    (r"^(undee|wavy)\b", "barry wavy"), (r"\b(lez )?armes (du )?[br]oy (de )?[bf]rance\b", "france"),
    (r"\b(seme|poudre)( de| a)? (floretes|florettes|florete|florette)\b|\bflorettee\b", "semee of fleurs-de-lis"),
    (r"\b(seme|poudre)( de| a)? (croisel+|croisele|croisille)\b|\bcrusuly\b", "crusilly"),
    (r"\bpoudre( de| a)? egletes\b", "semee of eaglets"), (r"\bpoudre( de| a)? turells\b|\bpoudre turells\b", "semee of towers"),
    (r"\bpoudre a faux losengez\b", "semee of mascles"), (r"\bpoudre a circle\b", "semee of annulets"),
    (r"\bestenzele\b", "semee of sparks"),
    (r"\bove deux testes\b", "double-headed"), (r"\b(vng|vnd|vn|ove|un)\b", "a"), (r"\bal (cheif|chief)\b", "a chief"),
    (r"\btroi[sz]?\b|\b3\b", "three"), (r"\bdeux\b|\b2\b", "two"), (r"\bquatre\b|\b4\b", "four"), (r"\bsiz\b|\bsix\b|\b6\b", "six"),
    (r"\b15\b", "fifteen"),
    (r"\bleons?\b", "lion"), (r"\bleopards?\b|\bleopardz\b", "lions passant guardant"), (r"\bleopard rampand\b", "lion rampant"),
    (r"\bpassan[sz]t?z?\b", "passant"), (r"\b(la |le )?(cowe|queve) ?(furche|fourche|croise|croyze)\b|\bcowefurche\b", "tail forked"),
    (r"\bcoronne\b", "crowned"), (r"\begle\b", "eagle"), (r"\bespany\b|\bdisplaye\b", "displayed"),
    (r"\beglettes\b", "eaglets"), (r"\bmerlo[tz]s?\b|\bmerlos\b", "martlets"), (r"\bpapegayes\b", "popinjays"),
    (r"\b(buzes|bousses)\b", "water-bougets"), (r"\bbresses\b", "brays"),
    (r"\bpercees\b", "pierced"), (r"\br[ou]u?ells?\b|\brovells?\b", "spur-rowels"),
    (r"\bcress?antes?\b|\bcrescant\b", "crescent"), (r"\brondells\b|\bgastells\b", "roundels"),
    (r"\bcrois (gules) passant\b", "cross gules"), (r"\bcrois passant\b", "cross"), (r"\bcrois (patee|formy)\b", "cross patty"), (r"\bcrois\b", "cross"), (r"\bres[e]?rs?cele\b", "recercelee"),
    (r"\bcroisel+\b|\bcroise\b", "crosslets"),
    (r"\bquintefo(il|ile|iles|yles)\b", "cinquefoils"), (r"\bgarbes\b", "garbs"), (r"\bfaux (losengez|lozenges)\b", "mascles"),
    (r"\blosengez\b", "lozenges"), (r"\bfaux escocheon\b", "orle"), (r"\bescocheons?\b", "escutcheons"), (r"\bluz\b", "luces"),
    (r"\bmartells\b", "hammers"), (r"\bfermaulx\b", "fermaux"), (r"\bturells\b", "towers"), (r"\bchasteau\b", "castle"),
    (r"\biambes armes\b", "legs armed"), (r"\bperch de daimes\b", "buck attires"), (r"\bchivall\b", "horse"),
    (r"\bbeauff\b", "ox"), (r"\brastells\b", "rakes"), (r"\bganfanon\b", "gonfanon"), (r"\bcarbuncle de\W* flurte\b", "carbuncle"),
    (r"\bdolphin del mere\b", "dolphin"), (r"\bpeuz\b", "pallets"),
    (r"\bvn danse\b|\bdansee\b|\bdanse\b", "fess dancetty"), (r"\bfes\b", "fess"), (r"\bbarres\b", "bars"),
    (r"\bbende\b", "bendy"), (r"\bgobony\b", "compony"), (r"\b(les |a )?(listes|cousteces)\b", "cotised"),
    (r"\bche[uv]erones?\b|\bcheueron\b", "chevron"), (r"\bsau[l]?t(our|oir)\b", "saltire"),
    (r"\bc[bhl]i?e[iy]?fe?\b", "chief"), (r"\b(en|in) chief\b", "in chief"), (r"\bcant(ell|el)\b", "canton"),
    (r"\bborde florette\b", "tressure"), (r"\bborde\b", "bordure"), (r"\bentere\b", ""), (r"\blab(ell|er)\b", "label"),
    (r"\b(merloz|martlets|escallops|crosslets) \w* ?bordean(s|tes)\b", r"\1 in orle"), (r"\bbor ?deant?e?s\b", "in orle"),
    (r"\bde l'un et l'autre\b|\bde i'un et i'autre\b|\bde ivn et i'autre\b", "counterchanged"),
    (r"\bengrel+e?s?\b", "engrailed"), (r"\bindent(e|ee|ez|ed)\b", "indented"),
    (r"\bdiaspres\b|\bdiapres\b", ""), (r"\bcollered\b", "collared"), (r"\bsur le chief\b", "on the chief"),
    (r"\bin le bend\b", "on the bend"), (r"\ben le pre\b", "in dexter canton"), (r"\bin le petrine\b", "on the breast"),
    (r"\bsur t?'?espalle\b", "on the shoulder"), (r"\bpoudre\b", "semee of"), (r"\bmull?ett?es\b|\bmuuettes\b", "mullets"),
    (r"\bperc[e]+s?\b", "pierced"), (r"\brampand\b", "rampant"), (r"\bpassantz\b", "passant"),
    (r"(?<![\w-])(de|le|la|les|en|al|du|lez)(?![\w-])", ""), (r"\bet\b", "and"),
]

TINCT = r"(?:or|argent|gules|azure|sable|vert|purpure|ermine|vair|proper)"
NUM = {"a": 1, "an": 1, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
       "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16}


def norm(blazon: str, french: bool) -> str:
    s = blazon.lower().replace("’", "'")
    s = re.sub(r"\([^)]*\)|\[[^\]]*\]|\{[^}]*\}|\"[^\"]*\"", " ", s)
    s = re.sub(r"\bsee\b.*$|\bas \d+ supra.*$|\bhere,? as elsewhere\b.*$", " ", s)
    for a, b in OCR:
        s = re.sub(a, b, s)
    if french:
        for a, b in FRENCH:
            s = re.sub(a, b, s)
    s = re.sub(r"[^a-z0-9 ,;.'-]", " ", s)
    return re.sub(r"\s+", " ", s).strip(" ,.;")


# ------------------------------------------------------------------ features
# (name, regex on the normalised blazon, status, work item, note)
# The work items are the units of the greedy ranking; they match roadmap entries.

W = {
    "furs": "Furs and patterned fields (vair, vairy, fretty, chevronny)",
    "semy": "Semé fields for families (crusilly, billetty, bezanty)",
    "fur_ord": "Ordinaries in fur or chequy (fess ermine, saltire vair, bend chequy)",
    "dimin": "Diminutives, multiples and voided ordinaries (three bars, bars gemel, bendlets, pallets, two chevrons, cotises, piles, fret)",
    "fusils": "Ordinaries of fusils (fess/bend fusilly)",
    "bordure": "Bordure (backlog: frame alignment)",
    "label": "Label variants (five points, compony, charged)",
    "lines": "More lines of partition on more ordinaries",
    "in_chief": "Charges in chief without a chief (a fess, in chief two mullets)",
    "orle": "Charges in orle",
    "counts": "Other counts and groupings (4, 5, 7+; six about a fess or bend)",
    "overall": "An ordinary over all (a lion debruised by a bend)",
    "quarter": "The quarter (an enlarged canton)",
    "divisions": "More divisions (per pale indented, quarterly indented, barry of 12+)",
    "charges_tex": "Charges with a vanilla texture",
    "charges_new": "Charges without a vanilla texture",
    "counterchange": "Counterchanging",
    "generator": "Generator only (Arms already expresses it)",
    "unknown": "Not recognised (a charge or word this tool does not know)",
}

F = []  # filled below


def feat(group, name, rx, status, item, note=""):
    # each charge is a work item of its own
    if item in ("charges_tex", "charges_new"):
        item = f"{item}:{name}"
    F.append({"group": group, "name": name, "rx": re.compile(rx), "status": status, "item": item, "note": note})


# field: the first match wins
FIELD = [
    ("royal arms (England, France, Scotland)", r"^(england|scotland|france)\b", "arms", "generator", "realm arms used as a family's base"),
    ("quarterly indented", r"^(quarterly|per pale and fess) (indented|dancetty)|^quarterly [^,;]*\bindented$", "new", "divisions", "no texture; clipping would be needed"),
    ("quarterly", r"^quarterly\b", "ok", "", ""),
    ("per pale indented", r"^per pale (indented|dancetty)", "compose", "divisions", "ce_per_fess_indented turned 90°"),
    ("per pale", r"^per pale\b", "ok", "", ""),
    ("per fess indented", r"^per fess (indented|dancetty)", "ok", "", ""),
    ("per fess", r"^per fess\b", "ok", "", ""),
    ("per bend", r"^per bend\b", "ok", "", ""),
    ("per saltire", r"^per saltire\b", "ok", "", ""),
    ("gyronny", r"^gyronny\b", "ok", "", ""),
    ("barry wavy", r"^barry (of \w+ )?wavy\b", "tex", "lines", "ce_barry_undy"),
    ("barry of 12 or more", r"^(barry of (twelve|fourteen|sixteen)|barry sans nombre|barry of many|barruly)", "tex", "divisions", "pattern_barruly_12"),
    ("barry of vair or ermine and a colour", r"^barry (of \w+ )?(vair|vairy|ermine)", "compose", "furs", "vair or ermine field, bars of the colour over it"),
    ("paly of vair and a colour", r"^paly (of \w+ )?(vair|vairy)", "compose", "furs", "vair field, pallets of the colour over it"),
    ("barry", r"^barry\b", "ok", "", ""),
    ("paly", r"^paly\b", "ok", "", ""),
    ("bendy", r"^bendy\b", "ok", "", ""),
    ("chequy", r"^chequy\b", "ok", "", ""),
    ("lozengy / masculy / fusilly", r"^(lozengy|masculy|fusilly)\b", "ok", "", ""),
    ("fretty field", r"^fretty\b", "ok", "", "ce_fretty"),
    ("chevronny", r"^chevronny\b", "tex", "furs", "ce_chevronny"),
    ("vairy of two tinctures", r"^vairy\b|^vair " + TINCT + r" and\b", "ok", "", "ce_vairy"),
    ("vair", r"^vair\b", "ok", "", "ce_vairy (argent and azure)"),
    ("ermine", r"^ermine\b", "ok", "", ""),
    ("plain", r"^" + TINCT + r"\b", "ok", "", ""),
]
SEMY = [
    ("semé of crosslets (crusilly)", r"\bcrusilly\b", "ok", "", "semy with cross_crosslet"),
    ("semé of billets (billetty)", r"\bbilletty\b", "ok", "", "semy with billet"),
    ("semé of roundels (bezanty, platy)", r"\b(bezanty|platy)\b|\bsemee? of (plates|bezants|roundels)\b", "ok", "", "semy with roundel"),
    ("semé of fleurs-de-lis", r"\bsemee? of fleurs|^france\b", "ok", "", "semy with fleur (only when chosen)"),
    ("semé of other charges", r"\bsemee? of (?!fleurs|plates|bezants|roundels)\w+|\bgutty\b", "arms", "semy", ""),
    ("fretty field", r"^" + TINCT + r",? fretty\b|^fretty\b", "ok", "", "ce_fretty"),
    ("fretty over a divided field", r"^(barry|paly|quarterly|per \w+) [^,]* fretty\b", "new", "furs", "ce_fretty paints its field too: a fret-only layer is missing"),
]
for n, rx, st, it, no in SEMY:
    feat("field", n, rx, st, it, no)

for n, rx, st, it, no in [
    ("fess", r"\b(?<!per )(?<!in )fess\b(?! (point|dancetty|indented))", "ok", "", ""),
    ("fess dancetty / a dance", r"\bfess (dancetty|indented)\b|\bdancetty fess\b", "ok", "", ""),
    ("two bars", r"\btwo bars\b(?! gemel)", "ok", "", ""),
    ("three or four bars", r"\b(three|four) bars\b(?! gemel)", "tex", "dimin", "ce_bars_03"),
    ("bars gemel", r"\bbars gemel\b|\bgemel\b", "tex", "dimin", "ce_bars_gemel_03 (three pairs); two pairs from ce_barrulets_2"),
    ("barrulets", r"\bbarrulets\b", "tex", "dimin", "ce_barrulets_2"),
    ("pale", r"\b(?<!per )(?<!in )pale\b", "ok", "", ""),
    ("pallets", r"\bpallets\b|\b(two|three|four) pales\b", "tex", "dimin", "ce_pales_02..05 (four: ok)"),
    ("bend", r"\b(?<!per )(?<!in )bend\b(?! sinister)", "ok", "", ""),
    ("bend sinister", r"\bbend sinister\b", "ok", "", ""),
    ("bends (two, three)", r"\b(two|three) bends\b", "tex", "dimin", "ce_bends_02 / _03"),
    ("bendlets (several)", r"\b(two|three|four|five|six) bendlets\b", "tex", "dimin", "ce_bends_04 / _05"),
    ("bendlet or baston over all", r"\b(a|of a|by a) bendlet\b|\bbaston\b|\bbaton\b", "compose", "overall", "ce_bendlet (already used for the baton sinister)"),
    ("chevron", r"\bchevron\b", "ok", "", ""),
    ("three chevrons", r"\bthree chevrons\b|\bchevronels\b", "ok", "", ""),
    ("two chevrons", r"\btwo chevrons\b", "tex", "dimin", "ce_ordinary_chevron_2"),
    ("fess between two chevrons", r"\bfess between two chevrons\b", "tex", "dimin", "ce_fess_betw_two_chevrons"),
    ("saltire", r"\b(?<!per )(?<!in )saltire\b", "ok", "", ""),
    ("cross", r"\b(a|on a|plain) cross\b(?! (patonce|moline|fleury|crosslet|recercel\w*|pat\w*|potent|fitch\w*|formy|flory))", "ok", "", ""),
    ("chief", r"\b(a|on a|and a|the|of a) chief\b", "ok", "", ""),
    ("canton", r"\bcanton\b", "ok", "", ""),
    ("quarter", r"\b(a|on a) quarter\b", "compose", "quarter", "a block, like the canton but half the field"),
    ("bordure", r"\bbordure\b", "tex", "bordure", "ce_border_shield; frame alignment unconfirmed (roadmap backlog)"),
    ("orle (a voided escutcheon)", r"\b(an|on an|a) orle\b(?! of)", "ok", "", ""),
    ("tressure", r"\btressure\b", "arms", "generator", "realm arms only"),
    ("inescutcheon", r"\binescutcheon\b|\ban escutcheon\b", "ok", "", ""),
    ("pile", r"\ba pile\b", "arms", "generator", ""),
    ("piles (two, three)", r"\b(two|three) piles\b", "compose", "dimin", "ce_ordinary_pile_03 three times"),
    ("fret", r"\bfret\b", "tex", "dimin", "ce_fret_01"),
    ("label", r"\blabel\b", "ok", "", ""),
    ("cotises", r"\bcotis\w*", "compose", "dimin", "ce_bend_thin / ce_barrulets_2 beside the ordinary"),
    ("cross voided", r"\bcross voided\b", "compose", "dimin", "a narrower ce_ordinary_cross_thin in the field's tincture"),
]:
    feat("ordinary", n, rx, st, it, no)

# lines of partition, per ordinary
LINE = r"(engrailed|indented|dancetty|wavy|embattled|nebuly|raguly|invected)"
LINE_STATUS = {
    ("fess", "engrailed"): ("ok", ""), ("bend", "engrailed"): ("ok", ""), ("cross", "engrailed"): ("ok", ""),
    ("bend", "embattled"): ("ok", ""), ("chief", "indented"): ("ok", ""), ("fess", "dancetty"): ("ok", ""), ("fess", "indented"): ("ok", ""),
    ("saltire", "engrailed"): ("compose", "ce_cross_engrailed turned 45°"),
    ("bordure", "engrailed"): ("tex", "ce_border_shield_engrailed_01"), ("bordure", "indented"): ("new", ""),
    ("bars", "dancetty"): ("tex", "ce_bars_dancetty_02"), ("bars", "embattled"): ("tex", "ce_bars_embattled_02"),
    ("bars", "wavy"): ("new", ""), ("pale", "wavy"): ("tex", "ce_pales_undy_04"),
}
for (o, l) in sorted({(o, l) for o in ["fess", "bend", "cross", "saltire", "chevron", "chief", "pale", "bordure", "bars", "canton", "orle"]
                      for l in ["engrailed", "indented", "dancetty", "wavy", "embattled", "nebuly", "raguly"]}):
    st, no = LINE_STATUS.get((o, l), ("new", ""))
    rx = rf"(?<!per )\b{o} (\w+ )?{l}\b|(?<!per )\b{o} {LINE} and {l}\b|\b{l} {o}\b"
    feat("line", f"{o} {l}", rx, st, "lines" if st != "ok" else "", no)

for n, rx, st, it, no in [
    ("fusils conjoined in fess or bend", r"\b(bend|fess) fusilly\b|\bfusils in (fess|bend)\b|\b(bend|fess) of fusils\b|\bfusils conjoined\b", "ok", "", "ce_fess_lozenges, ce_bend_lozenges (when chosen)"),
    ("label compony", r"\blabel [^,;]{0,15}compony\b|\bcompony\b[^,;]{0,15}\blabel\b", "tex", "label", "ce_label_compony"),
    ("bordure compony", r"\bbordure [^,;]{0,15}compony\b", "tex", "bordure", "ce_border_shield_compony"),
    ("bend compony", r"\bbend [^,;]{0,15}compony\b", "new", "fur_ord", ""),
    ("chief or canton ermine", r"\b(chief|canton) ermine\b", "ok", "", ""),
    ("ordinary in ermine", r"\b(fess|bend|chevron|cross|saltire|pale|orle|bars|quarter|pallets) ermine\b", "compose", "fur_ord", "ce_ermine_pattern tiled over the ordinary"),
    ("cross patonce vair", r"\bcross patonce vair\b|\bcross patty vair\b", "tex", "fur_ord", "ce_cross_patonce_vair"),
    ("ordinary in vair", r"\b(fess|bend|chevron|cross|saltire|pale|orle|bars|chief|canton|pallets|bordure|label|eagle) (vair|vairy)\b(?! and)", "compose", "fur_ord", "ce_vair_pattern tiled over the ordinary"),
    ("ordinary chequy", r"\b(fess|bend|cross|chevron|bordure|pale) chequy\b", "tex", "fur_ord", "ce_fess_checky, ce_bend_checky; others composed"),
    ("Mortimer's arms (chief paly, corners gyronny)", r"\bthe inescutcheon\b|\bcorners gyroned\b|\bcomers gyroned\b", "new", "fur_ord", "needs clipping"),
    ("ordinary or charge lozengy, barry or bendy", r"\beach per (fess|pale)\b|\b(cross|saltire|fess|lion|escutcheons|bend|chief)( plain)? (lozengy|barry|bendy|paly|gyronny)\b|\beach (barry|bendy|paly)\b|\bchief paly\b", "new", "fur_ord", "needs clipping"),
]:
    feat("treatment", n, rx, st, it, no)

for n, rx, st, it, no in [
    ("lion rampant", r"\blions? rampant\b(?! guardant)|\blion\b(?! (passant|statant|couchant|of england|rampant guardant|'s))(?!s)", "ok", "", ""),
    ("lion with a forked tail", r"\btails? forked\b|\bqueue fourch|\bdouble-queued\b", "tex", "charges_tex", "ce_lion_rampant_forked (crowned: ok)"),
    ("lion crowned", r"\blions? [^,;]{0,25}crowned\b", "ok", "", ""),
    ("lion passant guardant", r"\blions? passant guardant\b|\bleopards?\b|\blion of england\b", "ok", "", ""),
    ("lion passant", r"\blions? passant\b(?! guardant)", "tex", "charges_tex", "ce_lion_passant"),
    ("lion statant", r"\blions? statant\b", "new", "charges_new", ""),
    ("lioncels (six lions)", r"\blioncels\b", "arms", "generator", "lion_rampant count 6 (ce_lion_rampant_small)"),
    ("demi-lion", r"\bdemi-lions?\b", "new", "charges_new", ""),
    ("eagle", r"\beagles?\b", "ok", "", ""),
    ("eaglets", r"\beaglets\b", "arms", "generator", "eagle count 3 or 6"),
    ("martlets", r"\bmartlets?\b", "ok", "", ""),
    ("raven", r"\bravens?\b|\bcorbies?\b", "new", "charges_new", "only Norse ravens in vanilla"),
    ("popinjay", r"\bpopinjays?\b", "new", "charges_new", ""),
    ("cock", r"\bcocks?\b", "tex", "charges_tex", "ce_cockerel"),
    ("heron", r"\bherons?\b", "new", "charges_new", ""),
    ("escallops", r"\bescallops?\b", "ok", "", ""),
    ("mullets", r"\bmullets?\b(?! pierced)", "ok", "", "rolls: of six points unless stated"),
    ("mullets pierced / spur-rowels", r"\bmullets? pierced\b|\bspur-rowels?\b|\browels?\b", "tex", "charges_tex", "ce_star_06_pierced, ce_star_05_pierced"),
    ("estoiles", r"\bestoiles?\b|\bsparks\b", "new", "charges_new", ""),
    ("crescents", r"\bcrescents?\b", "ok", "", ""),
    ("roundels (bezants, plates, torteaux, hurts, pellets)", r"\b(bezants?|plates?|torteaux|torteau|hurts?|pellets?|ogresses|roundels?|pommes)\b", "ok", "", ""),
    ("annulets", r"\bannulets?\b", "ok", "", ""),
    ("crosslets", r"\bcrosslets?\b|\bcross(es)? crosslet\b", "ok", "", ""),
    ("cross patonce / flory", r"\bcross(es)? (patonce|fleury|flory)\b", "tex", "charges_tex", "ce_cross_patonce (cross_fleury: ok)"),
    ("cross moline", r"\bcross(es)? moline\b", "ok", "", ""),
    ("cross recercelée", r"\bcross(es)? [^,;]{0,10}recercel\w*\b|\brecercelee\b", "new", "charges_new", ""),
    ("cross of Toulouse (patty pierced)", r"\bcross patty pierced\b", "tex", "charges_tex", "ce_cross_occitan"),
    ("cross patty", r"\bcross(es)? (patty|pat[eé]e|formy)\b", "ok", "", ""),
    ("cross fitchy", r"\bfitch\w*\b|\bfiche\b", "tex", "charges_tex", "ce_crosslet_fitchy"),
    ("fleurs-de-lis", r"\bfleurs-de-lis\b|\bfleur\b|\bfleurette\b", "ok", "", ""),
    ("cinquefoils", r"\bcinquefoils?\b", "tex", "charges_tex", "ce_cinquefoil_01 (pierced), ce_cinquefoil_02"),
    ("sixfoils", r"\bsixfoils\b", "ok", "", ""),
    ("quatrefoils", r"\bquatrefoils?\b", "tex", "charges_tex", "ce_rosetta_04"),
    ("roses", r"\broses?\b", "new", "charges_new", "no heraldic rose in vanilla"),
    ("leaves, trefoils, slips", r"\btrefoils?\b|\bleaves\b|\bslipped\b", "new", "charges_new", ""),
    ("garbs", r"\bgarbs?\b", "new", "charges_new", ""),
    ("fusils or lozenges (separate)", r"\b(?<!five )(?<!four )fusils\b(?! in)|\blozenges?\b", "ok", "", ""),
    ("mascles", r"\bmascles?\b", "ok", "", ""),
    ("billets", r"\bbillets\b", "ok", "", ""),
    ("escutcheons as charges", r"\b(two|three|four|five|six) escutcheons\b", "tex", "charges_tex", "ce_escutcheon"),
    ("water-bougets", r"\bwater-bougets?\b|\bbougets?\b", "new", "charges_new", ""),
    ("maunch", r"\bmaunch\b", "tex", "charges_tex", "ce_maunch"),
    ("chess-rooks", r"\bchess-rooks?\b|\brooks\b", "tex", "charges_tex", "ce_rook"),
    ("fermaux (buckles)", r"\bfermaux\b|\bfermail\b|\bbuckles?\b", "new", "charges_new", ""),
    ("horseshoes", r"\bhorseshoes?\b", "ok", "", ""),
    ("hammers", r"\bhammers?\b", "new", "charges_new", "only Ukko's hammer in vanilla"),
    ("trumpets", r"\btrumpets?\b", "new", "charges_new", ""),
    ("clarions", r"\bclarions?\b", "tex", "charges_tex", "ce_clarion"),
    ("cushions", r"\bcushions?\b", "new", "charges_new", ""),
    ("gloves", r"\bgloves?\b|\bgauntz\b", "new", "charges_new", ""),
    ("chaplets", r"\bchaplets?\b", "new", "charges_new", ""),
    ("cups", r"\bcups?\b", "new", "charges_new", "covered cups; the chalice is ok"),
    ("birdbolts, bourdons, crooks", r"\bbirdbolts?\b|\bbourdons?\b|\bcrooks?\b", "new", "charges_new", ""),
    ("axes", r"\baxes?\b", "ok", "", ""),
    ("helmets", r"\bhelmets?\b", "tex", "charges_tex", "ce_sugarloaf_helmet"),
    ("hose", r"\bhose\b", "new", "charges_new", ""),
    ("carbuncle (escarbuncle)", r"\bcarbuncle\b", "tex", "charges_tex", "ce_carbuncle, ce_escarbuncle_flory"),
    ("wings", r"\bwings?\b", "tex", "charges_tex", "ce_wings"),
    ("buck or stag", r"\bbucks?\b(?!'s)|\bstags?\b|\bharts?\b", "ok", "", ""),
    ("buck's heads or attires", r"\bbuck'?s? (heads?|attires)\b|\battires\b|\bheads? cabossed\b|\bcabossed\b", "new", "charges_new", ""),
    ("boar's heads", r"\bboar'?s? heads?\b", "tex", "charges_tex", "ce_boar_head"),
    ("leopard's or lion's heads", r"\b(leopard|lion)'?s? (heads?|faces?)\b", "tex", "charges_tex", "ce_lion_head"),
    ("other beast heads", r"\b(?<!buck's )(?<!boar's )(?<!leopard's )(?<!lion's )heads?\b(?! cabossed)", "new", "charges_new", ""),
    ("boar", r"\bboars?\b(?!'s)", "ok", "", ""),
    ("greyhounds, talbots", r"\bgreyhounds?\b|\btalbots?\b", "tex", "charges_tex", "ce_greyhound_courant, ce_hound"),
    ("fish (luces, barbels, dolphins)", r"\bluces?\b|\bfish(es)?\b|\bbarbels?\b|\bdolphins?\b", "ok", "", ""),
    ("pine-cones", r"\bpine-cones?\b", "new", "charges_new", ""),
    ("tree", r"\btrees?\b", "ok", "", ""),
    ("hands", r"\bhands?\b", "ok", "", ""),
    ("crown", r"\bcrowns?\b", "ok", "", ""),
    ("gonfanon", r"\bgonfanon\b", "tex", "charges_tex", "ce_gonfanon"),
    ("castle or tower", r"\bcastles?\b|\btowers?\b", "ok", "", ""),
    ("horse", r"\bhorses?\b", "ok", "", ""),
    ("legs (Man)", r"\blegs\b", "tex", "charges_tex", "ce_manx_triskele_armored"),
    ("brays", r"\bbrays\b", "tex", "charges_tex", "ce_horsebrays"),
    ("rakes", r"\brakes\b", "new", "charges_new", ""),
    ("ox", r"\box\b", "ok", "", "bull"),
    ("unidentified charge", r"\bbysse\b|\bmole\b", "new", "unknown", "bisse (serpent?), mole: unclear in the source"),
]:
    feat("charge", n, rx, st, it, no)

for n, rx, st, it, no in [
    ("between charges", r"\bbetween\b", "ok", "", ""),  # refined by count below
    ("charges in orle", r"\borle of\b|\bin orle\b", "layout", "orle", "roadmap: in orle"),
    ("bordure charged", r"\bentoyre\b|\bbordure [^,;]{0,25}(bezanty|platy|billetty|crusilly|charged|of [a-z-]+s)\b", "layout", "bordure", ""),
    ("charges in chief without a chief", r"\b(and )?in (the )?chief\b(?! of)", "layout", "in_chief", ""),
    ("small charge in dexter chief", r"\bin (the )?dexter (chief|quarter|canton)\b", "ok", "", ""),
    ("charges in fess, bend or pale", r"\bin (fess|bend|pale)\b", "ok", "", ""),
    ("an ordinary over all", r"^(england|france|scotland),? (a|with a) (bend|bendlet|baston)\b|\bsurtout\b(?! an? (inescutcheon|escutcheon|label))|\bover all\b|\bdebruised\b|\bsurmounted\b", "layout", "overall", ""),
    ("on the breast", r"\bon the breast\b", "ok", "", ""),
    ("counterchanged", r"\bcounterchanged\b", "no", "counterchange", "needs clipping (roadmap: not doing)"),
    ("label charged", r"\blabel [^,;]{0,20}(each|charged|bezanty|platy|billetty|semee)\b|\bon (a|the|each) (label|pendant)\b|\blabel of \w+ (bezanty|platy)", "tex", "label", "ce_label_roundely, ce_label_castles"),
]:
    feat("arrangement", n, rx, st, it, no)

CHARGE_NOUN = (r"(lions?|lioncels|eagles?|eaglets|martlets|escallops?|mullets|spur-rowels|crescents|bezants|plates|torteaux|hurts|pellets|roundels|ogresses|"
               r"annulets|crosslets|cross(?:es)? \w+|fleurs-de-lis|cinquefoils|sixfoils|quatrefoils|roses|garbs|fusils|lozenges|mascles|billets|"
               r"escutcheons|water-bougets|chess-rooks|fermaux|horseshoes|hammers|trumpets|clarions|cushions|chaplets|cups|birdbolts|heads|luces|fishes|"
               r"bucks|ravens|popinjays|cocks|herons|greyhounds|talbots|estoiles|pine-cones|hands|gloves|wings|leaves|axes|helmets|garbs|towers|bougets)")
NW = "|".join(NUM)
# a charged ordinary holds 3 (5 on a cross or saltire; 1 or 3 on a chief; 1 on a canton)
ON_OK = {"fess": {3}, "bend": {3}, "chevron": {3}, "pale": {3}, "cross": {5}, "saltire": {5}, "chief": {1, 3}, "canton": {1}, "quarter": {1}, "bars": set(), "bordure": set(), "label": set(), "orle": set()}
# charges about an ordinary: src/layout.ts BETWEEN
BETWEEN_OK = {"fess": {3}, "chevron": {3}, "bend": {2}, "bend sinister": {2}, "pale": {2}, "cross": {4}, "saltire": {4}, "pile": {2}, "pall": {3}}


def counts(t):
    """extra features from the numbers of charges"""
    out = []
    for clause in re.split(r"[,;]", t):
        on = re.search(r"\bon (?:a|an|the|each) (\w+)(?: \w+){0,2}? (" + NW + r")\b", clause)
        if on:
            o, n = on.group(1), NUM[on.group(2)]
            if o in ON_OK and n not in ON_OK[o]:
                out.append(("arrangement", f"{n} on a {o}" if n < 7 else f"7+ on a {o}", "layout", "counts", ""))
            clause = clause[:on.start()] + clause[on.end():]
        bt = re.search(r"\b(fess|chevron|bend sinister|bend|pale|cross|saltire|pile|pall)\b[^,;]{0,30}\bbetween (" + NW + r")\b(?! (chevrons|bars|cotises|bendlets|barrulets))", clause)
        if bt:
            o, n = bt.group(1), NUM[bt.group(2)]
            if n not in BETWEEN_OK.get(o, set()):
                out.append(("arrangement", f"{o} between {n}", "layout", "counts", ""))
            clause = clause[:bt.start()] + clause[bt.end():]
        for m in re.finditer(r"\b(" + NW + r")\s+(?:[a-z-]+\s+){0,2}?" + CHARGE_NOUN + r"\b", clause):
            n = NUM[m.group(1)]
            if re.search(r"\bin (orle)\b", clause) or re.match(r"fusils in (fess|bend)", clause[m.end(2) - 6:m.end(2) + 8]):
                continue
            if n in (4, 5) or n >= 7:
                out.append(("count", f"{n} charges on the field" if n < 7 else "7+ charges on the field", "layout", "counts", ""))
    return out


# words that carry no feature of their own
KNOWN = set("""a an and the of on in with each between or argent gules azure sable vert purpure ermine vair proper
one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen first second third last same
rampant passant guardant displayed crowned armed langued beaked membered tied nailed pierced hauriant naiant couped erased
statant courant sejant collared gorged pointes points plain voided conjoined meeting base dexter sinister field charged
counter quarterly per pale fess bend saltire chief canton cross bordure label orle bars piles pile chevron chevrons
pallets bends bendlets bendlet fusilly lozengy barry paly bendy chequy gyronny fretty vairy semee seme crusilly billetty bezanty platy
fourth fifth sixth over all surtout debruised surmounted another like but not as is are also coat arms roll here where this that
wavy engrailed indented dancetty embattled nebuly raguly compony counter-compony tail forked double-headed heads head
an orle tressure inescutcheon escutcheon fret cotised cotises gemel fleury flory patonce moline patty formy recercelee fitchy
lion lions eagle eagles martlet martlets escallop escallops mullet mullets crescent crescents roundel roundels annulet annulets
crosslet crosslets fleurs-de-lis fleur cinquefoil cinquefoils sixfoils quatrefoil quatrefoils rose roses garb garbs fusil fusils
lozenge lozenges mascle mascles billet billets water-bougets maunch chess-rooks fermaux horseshoes hammers trumpets clarions
cushions gloves chaplets cups birdbolts axes helmets hose carbuncle wings buck bucks stag boar boars greyhounds talbots luces fish
pine-cones tree hands crown gonfanon castle towers horse legs brays rakes ox bezants plates torteaux hurts pellets ogresses
popinjays cocks herons ravens raven estoiles lioncels eaglets demi-lion demi-lions spur-rowels attires cabossed leopard leopards
counterchanged entoyre quarter whole escutcheons barrulets sans nombre many pieces masculy chevronny england france scotland
embowed fructed covered saltires cantons pendant pendants buck's within joined interlaced enfiled holding sword dexter-chief rays eight to by""".split())


def analyse(rows):
    coats = []
    for r in rows:
        if not r["blazon"]:
            continue
        t = norm(r["blazon"], r["roll"] == "C")
        fs = {}
        for name, rx, st, it, no in FIELD:
            if re.search(rx, t):
                fs[("field", name)] = (st, it, no)
                break
        else:
            fs[("field", "?")] = ("new", "unknown", "")
        for f in F:
            if f["rx"].search(t):
                fs[(f["group"], f["name"])] = (f["status"], f["item"], f["note"])
        for g, n, st, it, no in counts(t):
            fs[(g, n)] = (st, it, no)
        # a line named on an ordinary also matches the plain ordinary: keep the line's status
        words = re.findall(r"[a-z][a-z'-]+", t)
        unknown = sorted({w for w in words if w not in KNOWN and not any(f["rx"].search(w) for f in F if f["group"] == "charge")})
        coats.append({**r, "norm": t, "features": fs, "unknown": unknown})
    return coats


def blocking(c):
    return {k: v for k, v in c["features"].items() if v[0] not in ("ok", "arms")}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tsv", default=str(TSV))
    ap.add_argument("--show")
    ap.add_argument("--unknown", action="store_true")
    ap.add_argument("--markdown", action="store_true")
    args = ap.parse_args()
    rows = list(csv.DictReader(open(args.tsv, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))
    coats = analyse(rows)

    if args.show:
        for c in coats:
            if any(args.show in f"{g}: {n}" for g, n in c["features"]):
                print(f'{c["roll"]} {c["no"]:>3} {c["name"][:28]:28} | {c["norm"]}')
        return
    if args.unknown:
        cnt = collections.Counter(w for c in coats for w in c["unknown"])
        print(" ".join(f"{w}:{n}" for w, n in cnt.most_common()))
        return

    md = args.markdown
    n = len(coats)
    by_roll = collections.Counter(c["roll"] for c in coats)
    ok = [c for c in coats if not blocking(c)]
    print(f"{n} coats with a blazon: " + ", ".join(f"{ROLLS[r]} {by_roll[r]}" for r in "CFE"))
    print(f"expressible now (every feature ok or arms): {len(ok)} ({100 * len(ok) / n:.0f}%)")
    gen = [c for c in coats if all(v[0] == "ok" for v in c["features"].values())]
    print(f"of which the generator could make: {len(gen)} ({100 * len(gen) / n:.0f}%)\n")

    # feature table: occurrences, and coats where it is the only blocker
    occ = collections.Counter()
    only = collections.Counter()
    ex = collections.defaultdict(list)
    info = {}
    for c in coats:
        b = blocking(c)
        for k, v in c["features"].items():
            occ[k] += 1
            info[k] = v
            if len(ex[k]) < 3:
                ex[k].append(f'{c["roll"]} {c["no"]}')
        if len(b) == 1:
            only[next(iter(b))] += 1
    rows_out = sorted(occ, key=lambda k: (info[k][0] in ("ok", "arms"), -occ[k], k))
    if md:
        print("| feature | coats | only blocker | status | vanilla / note | e.g. |\n|---|---:|---:|---|---|---|")
    for k in rows_out:
        st, it, no = info[k]
        if md:
            print(f"| {k[0]}: {k[1]} | {occ[k]} | {only[k] or ''} | {st} | {no} | {', '.join(ex[k])} |")
        else:
            print(f"{occ[k]:4d} {only[k] or '':>4} {st:8} {k[0]}: {k[1]}  [{no}]  e.g. {', '.join(ex[k])}")

    # greedy: which work item, done next, unblocks the most coats
    print()
    items = collections.defaultdict(set)
    for c in coats:
        for k, v in blocking(c).items():
            items[v[1]].add(k)
    done, left = set(), [c for c in coats if blocking(c)]
    expressible = len(ok)
    if md:
        print("| step | work item | coats unblocked | expressible after |\n|---:|---|---:|---:|")
    step = 0
    while True:
        gain = collections.Counter()
        for c in left:
            its = {v[1] for v in blocking(c).values()} - done
            if len(its) == 1:
                gain[next(iter(its))] += 1
        cand = [i for i in items if i not in done and i not in ("counterchange", "unknown")]
        if not cand:
            break
        # break ties by how many coats the item touches at all
        touch = {i: sum(1 for c in left if i in {v[1] for v in blocking(c).values()}) for i in cand}
        best = max(cand, key=lambda i: (gain[i], touch[i]))
        if gain[best] == 0 and touch[best] == 0:
            break
        done.add(best)
        expressible += gain[best]
        left = [c for c in left if {v[1] for v in blocking(c).values()} - done]
        step += 1
        kind, _, cname = best.partition(":")
        line = W.get(best) or (f"Charge ({'vanilla' if kind == 'charges_tex' else 'new art'}): {cname}")
        if md:
            print(f"| {step} | {line} | {gain[best]} (touches {touch[best]}) | {expressible} ({100 * expressible / n:.0f}%) |")
        else:
            print(f"{step:2d}. +{gain[best]:3d} (touches {touch[best]:3d}) -> {expressible} ({100 * expressible / n:.0f}%)  {line}")
    rest = collections.Counter(v[1] for c in left for v in blocking(c).values())
    print(f"\nstill blocked: {len(left)} coats; by item: {dict(rest)}")

    # expressible, but the generator never makes it: what stands in the way
    held = collections.Counter()
    for c in ok:
        for k, v in c["features"].items():
            if v[0] == "arms":
                held[f"{k[0]}: {k[1]}"] += 1
    print(f"\nexpressible but not generated: {len(ok) - len(gen)} coats; features: " + ", ".join(f"{k} {v}" for k, v in held.most_common()))


if __name__ == "__main__":
    main()
