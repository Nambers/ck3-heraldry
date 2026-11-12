import type { Late } from "../heraldry/era.ts";

// Where each realm's arms can be checked: an English Wikipedia article
// (checked to exist; not every one is a "Coat of arms of ..." page).
export const REALM_SOURCES: Record<string, string> = {
  france: "Coat_of_arms_of_France", england: "Royal_coat_of_arms_of_England", scotland: "Royal_coat_of_arms_of_Scotland",
  brittany: "Flag_of_Brittany", flanders: "Coat_of_arms_of_Flanders", holland: "County_of_Holland", castile: "Coat_of_arms_of_Castile",
  leon: "Coat_of_arms_of_León", aragon: "Coat_of_arms_of_Aragon", sicily: "Coat_of_arms_of_Sicily", papacy: "Coat_of_arms_of_the_Holy_See",
  venice: "Lion_of_Saint_Mark", genoa: "Flag_of_Genoa", jerusalem: "Jerusalem_cross", byzantium: "Byzantine_heraldry",
  hre: "Coat_of_arms_of_the_Holy_Roman_Empire", austria: "Coat_of_arms_of_Austria", bavaria: "Coat_of_arms_of_Bavaria",
  bohemia: "Coat_of_arms_of_Bohemia", hungary: "Coat_of_arms_of_Hungary", poland: "Coat_of_arms_of_Poland", denmark: "Coat_of_arms_of_Denmark",
  norway: "Coat_of_arms_of_Norway", sweden: "Coat_of_arms_of_Sweden", serbia: "Coat_of_arms_of_Serbia", normandy: "Coat_of_arms_of_Normandy",
  aquitaine: "Coat_of_arms_of_Aquitaine", brabant: "Duchy_of_Brabant", luxembourg: "Coat_of_arms_of_Luxembourg",
  galicia: "Coat_of_arms_of_Galicia_(Spain)", savoy: "House_of_Savoy", montferrat: "March_of_Montferrat", cyprus: "Kingdom_of_Cyprus",
  palatinate: "Electoral_Palatinate", tyrol: "Coat_of_arms_of_Tyrol", brandenburg: "Coat_of_arms_of_Brandenburg",
  silesia: "Coat_of_arms_of_Silesia", pomerania: "Coat_of_arms_of_Pomerania",
  portugal: "Coat_of_arms_of_Portugal", bulgaria: "Coat_of_arms_of_Bulgaria",
};

/** where each late practice with a year (src/heraldry/era.ts) can be checked */
export const LATE_SOURCES: Partial<Record<Late, string>> = {
  // Gelre 646, 647 (f. 62r): the Aragonese counts of Urgell and Empúries, Aragon impaling their counties
  impalement: "http://www.heraldique-europeenne.org/Armoriaux/Gelre/F62r.htm",
  // René of Anjou's six quarters (Armorial de l'Europe et de la Toison d'or f. 100; his Hours, f. 4v, 1442–43),
  // kept by Queens' College, Cambridge, from his daughter Margaret of Anjou
  quarterlyOfSix: "https://history.queens.cam.ac.uk/college/heraldic-arms",
};

export const CAPO_SOURCE = "https://it.wikipedia.org/wiki/Capo_dell%27Impero";
export const CK3_WIKI = { coa: "https://ck3.paradoxwikis.com/Coat_of_arms_modding", titles: "https://ck3.paradoxwikis.com/Titles" };
