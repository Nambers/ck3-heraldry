// The western rulers' designer (?p=west): Latin Christian Europe, landed
// rulers and landless adventurers. Its answers, questions and generator live
// in this folder; the page around them is src/designer/page.ts.

import type { Designer } from "../designer/types.ts";
import { DEFAULT_ANSWERS, decodeAnswers, encodeAnswers, type Answers } from "./answers.ts";
import { westForm, setAnswer } from "./form.ts";
import { generate } from "./generate.ts";

export const WEST: Designer<Answers> = {
  id: "west",
  intro: "app.intro",
  defaults: DEFAULT_ANSWERS,
  encode: encodeAnswers,
  decode: decodeAnswers,
  generate,
  name: (a) => a.name,
  pick: (a, id) => setAnswer(a, "layout", id),
  form: westForm,
  free: { get: (a) => a.free, set: (a, on) => setAnswer(a, "free", on) },
};
