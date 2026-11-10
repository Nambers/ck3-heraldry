// The designer view shared by every designer: header switches (start over,
// optional "no regard for history"), the designer's question form on the left,
// and on the right the preview, the candidates, the description, the legend,
// the CK3 code, saving and sharing. Answers live in the URL fragment, so a
// share link, a saved design and the browser's Back button all just work.

import { renderCoa, TextureStore } from "../ck3/canvas.ts";
import { serializeCoa } from "../ck3/coa.ts";
import { exportCk3 } from "../ck3/export.ts";
import { canPickDirectory, findCoatOfArms, forgetDir, listTextures, pickDirectory, recallDir, rememberDir, type DirHandle } from "../ck3/texdir.ts";
import { describe, fmt, fmtList } from "../describe.ts";
import type { Arms } from "../heraldry/ast.ts";
import { blazon } from "../heraldry/blazon.ts";
import { LOCALES, locale, localeShort, t } from "../i18n/index.ts";
import { renderSvg } from "../render/svg.ts";
import type { View } from "../view.ts";
import { catTag } from "./kit.ts";
import { savedStore, shareLink, type Saved } from "./saved.ts";
import type { Designer, Result } from "./types.ts";
import { esc, hash } from "./util.ts";

// Kept while the site is open, across visits to other pages: the game
// textures (loaded once, used by every designer) and each designer's answers
// (so coming back through the navigation finds the design where it was left).
const tex: { store: TextureStore | null; remembered: DirHandle | null; from: string | null; mode: "svg" | "game"; recalled: boolean } = {
  store: null,
  remembered: null,
  from: null,
  mode: "svg",
  recalled: false,
};
const lastFragment = new Map<string, string>();
/** above this many layers the code comes with a warning (the game slows on weak machines) */
const MANY_LAYERS = 1200;

/** the note about sketch and game textures: once per visit, unless switched off for good */
const TIP_KEY = "ck3-heraldry.textureTip.v1";
let tipShown = false;
const tipOff = () => {
  try {
    return localStorage.getItem(TIP_KEY) === "off";
  } catch {
    return false;
  }
};

const FREE_ICON = `<!-- a sealed chronicle; the seal cracks when history is ignored -->
<svg class="freeico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M7.5 5.5V17M5.5 3.5h11a2 2 0 0 1 0 4h-1M5.5 3.5a2 2 0 0 0 0 4h2M15.5 7.5V16M7.5 17h-2a2 2 0 0 0 0 4h9" />
  <path d="M9.8 10h3.4M9.8 12.6h3.4M14 17.2l-1.2 4M17.4 17.2l1.2 4" stroke-width="1.2" />
  <circle class="seal" cx="15.7" cy="16.7" r="2.6" stroke-width="1.2" />
  <path class="crack" d="M14.1 14.9l1.3 1.5-.9 1 1.6 1.6" stroke-width="1.1" />
</svg>`;

/** the view of a designer, for src/routes.ts */
export const designerView =
  <A>(d: Designer<A>): View =>
  (root, shell) => {
  root.innerHTML = `<main class="layout"><form id="quiz" class="quiz" autocomplete="off"></form><section id="result" class="result" aria-live="polite"></section></main>
    <button type="button" id="mini" class="mini" hidden></button>`;
  shell.tools.innerHTML = `${d.free ? `<label class="freebox" id="freebox"><input type="checkbox" id="free" />${FREE_ICON}<span id="freelabel"></span></label>` : ""}
    <button type="button" id="reset" class="langbtn"></button>`;
  shell.intro.hidden = shell.footer.hidden = false;

  const form = root.querySelector("#quiz") as HTMLFormElement;
  const result = root.querySelector("#result") as HTMLElement;
  const store = savedStore(d.id);
  const fragment = () => location.hash.replace(/^#/, "");
  let alive = true;

  // a plain link to the page (the navigation) brings back the design left here
  if (!fragment() && lastFragment.get(d.id)) history.replaceState(null, "", location.search + "#" + lastFragment.get(d.id));
  let shown = fragment();
  let answers: A = shown ? d.decode(shown) : { ...d.defaults };
  let renderToken = 0;
  let last: Result | null = null;
  let lastDeleted: Saved | null = null;
  const thumbCache = new Map<string, string>();

  /** new answers: into the URL, then redraw */
  function update(next: A) {
    answers = next;
    shown = d.encode(answers);
    lastFragment.set(d.id, shown);
    history.replaceState(null, "", location.search + "#" + shown);
    render();
  }

  // ---------------------------------------------------------------- result

  const layoutName = (c: { name: Parameters<typeof fmt>[0][] }) => {
    const s = c.name.map(fmt).join(t("app.layoutNameSep"));
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  function savedThumb(h: string): string {
    let s = thumbCache.get(h);
    if (!s) {
      s = renderSvg(d.generate(d.decode(h)).chosen.arms, { size: 64 });
      thumbCache.set(h, s);
    }
    return s;
  }

  function renderSavedList(current: string): string {
    const list = store.load();
    let html = `<h2>${esc(t("app.save.title", { n: list.length }))}</h2><p class="how">${esc(t("app.save.local"))}</p><p class="actstatus" id="savedstatus" aria-live="polite"></p>`;
    if (!list.length) return html + `<p class="empty">${esc(t("app.save.empty"))}</p>`;
    html += `<div class="saved">`;
    list.forEach((s, i) => {
      const date = new Date(s.at).toLocaleDateString(locale());
      html += `<div class="sv${s.hash === current ? " on" : ""}">
      <button type="button" class="svload" data-load="${i}" title="${esc(t("app.save.open", { name: s.name }))}"><span class="thumb">${savedThumb(s.hash)}</span><span class="lname">${esc(s.name)}</span><span class="cap">${esc(date)}</span></button>
      <button type="button" class="svdel" data-del="${i}" aria-label="${esc(t("app.save.del", { name: s.name }))}" title="${esc(t("app.save.del", { name: s.name }))}">×</button>
    </div>`;
    });
    return html + `</div>`;
  }

  function flash(id: string, html: string, ms = 4000) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html;
    const token = String(Math.random());
    el.dataset.token = token;
    setTimeout(() => {
      if (el.dataset.token === token) el.innerHTML = "";
    }, ms);
  }

  /** the name to offer in the save box: the saved entry this design came from, else the bearer's name */
  const saveNameFor = (h: string) => store.load().find((s) => s.hash === h)?.name ?? d.name(answers);

  function openDesign(h: string) {
    answers = d.decode(h);
    shown = h;
    lastFragment.set(d.id, h);
    d.form.reset?.();
    history.pushState(null, "", location.search + "#" + h);
    render();
    window.scrollTo({ top: 0 });
  }

  function renderResult() {
    const r = d.generate(answers);
    last = r;
    const chosen = r.chosen;
    const pick = r.candidates.indexOf(chosen);
    const current = d.encode(answers);
    const { coa, instances } = exportCk3(chosen.arms, `coa_rd_dynasty_${hash(current)}`);
    const code = serializeCoa(coa);
    const name = d.name(answers);
    const title = name ? t("app.armsOf", { name }) : t("app.arms");
    const free = d.free?.get(answers) ?? false;

    let html = `<div class="viewbar">
      <div class="seg" role="group">
        <button type="button" data-mode="svg" class="${tex.mode === "svg" ? "on" : ""}">${t("app.preview.svg")}</button>
        <button type="button" data-mode="game" class="${tex.mode === "game" ? "on" : ""}" ${tex.store ? "" : "disabled"}>${t("app.preview.game")}</button>
      </div>
      ${canPickDirectory()
        ? `<button type="button" class="load linkbtn" id="texpick">${t("app.preview.load")}</button>`
        : `<label class="load">${t("app.preview.load")}<input type="file" id="texdir" webkitdirectory multiple hidden></label>`}
    </div>
    <p class="texstatus" id="texstatus">${texStatus()}</p>
    <div class="shield" id="main-shield">${renderSvg(chosen.arms, { size: 300, title })}</div>`;
    // said right under the arms, not among the notes: these arms are already someone's
    if (chosen.warnings?.length) html += `<p class="warn arms-warn" role="note">${esc(fmtList(chosen.warnings))}</p>`;
    if (r.candidates.length > 1) {
      // with the rules switched off they may break the rule of tincture: do not call them legal
      html += `<h2>${t(free ? "app.alternativesFree" : "app.alternatives", { n: r.candidates.length })}</h2><div class="alts">`;
      r.candidates.forEach((c, i) => {
        const label = fmtList(c.label);
        const lname = layoutName(c);
        const warn = c.warnings?.length ? fmtList(c.warnings) : "";
        html += `<button type="button" class="alt${i === pick ? " on" : ""}${c.dropped.length ? " partial" : ""}${warn ? " warned" : ""}" data-pick="${i}" title="${esc(lname + "：" + label + (warn ? "\n" + warn : ""))}">
        <span class="thumb" data-thumb="${i}">${renderSvg(c.arms, { size: 76 })}</span>${warn ? `<b class="warnmark" aria-label="${esc(warn)}">!</b>` : ""}<span class="lname">${esc(lname)}</span><span class="cap">${esc(label)}</span></button>`;
      });
      html += `</div>`;
    }
    html += `<h2>${esc(title)}<span class="lname-h">${esc(layoutName(chosen))}</span></h2><p class="desc">${esc(describe(chosen.arms))}</p>
    <p class="blazon" lang="en"><span class="tag">${t("app.blazonTag")}</span> ${esc(blazon(chosen.arms))}</p>`;
    if (chosen.dropped.length) html += `<p class="dropped">${esc(t("app.dropped", { list: fmtList(chosen.dropped) }))}</p>`;
    if (r.legend.length) {
      html += `<h2>${t("app.legend.title")}</h2><table class="legend"><thead><tr><th>${t("app.legend.what")}</th><th>${t("app.legend.cat")}</th><th>${t("app.legend.means")}</th></tr></thead><tbody>`;
      for (const row of r.legend) html += `<tr><td>${esc(fmt(row.what))}</td><td>${catTag(row.cat)}</td><td>${esc(fmt(row.means))}</td></tr>`;
      html += `</tbody></table>`;
    }
    if (r.notes.length) {
      html += `<h2>${t("app.notes")}</h2><ul class="notes">${r.notes
        .map((n) => `<li><span class="tag">${t(`app.noteKind.${n.kind}`)}</span>${esc(fmt(n.msg))}</li>`)
        .join("")}</ul>`;
    }
    html += `<h2>${t("app.code")}</h2><p class="how">${t("app.codeHow", { n: instances })}</p>`;
    // many layers (charges built from blocks) can slow the game: say so, but do not refuse
    if (instances > MANY_LAYERS) html += `<p class="warn">${esc(t("app.codeMany", { n: instances }))}</p>`;
    html += `
    <div class="code"><button type="button" id="copy">${t("app.copy")}</button><pre>${esc(code)}</pre></div>`;
    // naming, saving and sharing sit at the end, with the saved designs
    html += `<h2>${t("app.save.section")}</h2>
    <div class="actions">
      <input type="text" id="savename" maxlength="60" value="${esc(saveNameFor(current))}" placeholder="${esc(t("app.save.placeholder"))}" aria-label="${esc(t("app.save.name"))}">
      <button type="button" id="save">${t("app.save.button")}</button>
      <button type="button" id="share">${t("app.share.button")}</button>
    </div>
    <p class="actstatus" id="actstatus" aria-live="polite"></p>`;
    html += renderSavedList(current);
    result.innerHTML = html;

    (result.querySelector("#save") as HTMLButtonElement).onclick = () => {
      const input = result.querySelector("#savename") as HTMLInputElement;
      const saveName = input.value.trim().slice(0, 60) || d.name(answers) || t("app.save.untitled", { n: store.load().length + 1 });
      const s = store.save(saveName, current);
      if (!s.ok) return flash("actstatus", esc(t("app.save.failed")));
      renderResult();
      flash("actstatus", esc(t(s.replaced ? "app.save.replaced" : "app.save.saved", { name: saveName })));
    };
    (result.querySelector("#share") as HTMLButtonElement).onclick = async () => {
      const link = shareLink(d.id, current);
      try {
        // some browsers leave the clipboard promise pending instead of refusing
        await Promise.race([navigator.clipboard.writeText(link), new Promise((_, no) => setTimeout(no, 1500))]);
        flash("actstatus", esc(t("app.share.copied")));
      } catch {
        flash("actstatus", `${esc(t("app.share.failed"))} <input class="linkbox" readonly value="${esc(link)}" onfocus="this.select()">`, 30000);
      }
    };
    (result.querySelector("#copy") as HTMLButtonElement).onclick = async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = t("app.copied");
      } catch {
        btn.textContent = t("app.copyFailed");
      }
      setTimeout(() => (btn.textContent = t("app.copy")), 1600);
    };
    const input = result.querySelector<HTMLInputElement>("#texdir");
    if (input) input.onchange = (e) => loadTextures((e.target as HTMLInputElement).files);

    if (tex.mode === "game" && tex.store) paintGame(r.candidates.map((c) => c.arms), pick, title);
    updateMini(chosen.arms);
  }

  // ---------------------------------------------------------------- mini preview

  const mini = root.querySelector("#mini") as HTMLButtonElement;
  let miniWatch: IntersectionObserver | null = null;
  let tip: HTMLDialogElement | null = null;

  /** a small copy of the arms in the corner, shown while the big preview is scrolled away */
  function updateMini(arms: Arms) {
    mini.innerHTML = renderSvg(arms, { size: 76 });
    mini.setAttribute("aria-label", t("app.mini"));
    mini.title = t("app.mini");
    const slot = document.getElementById("main-shield");
    miniWatch?.disconnect();
    if (!slot || typeof IntersectionObserver === "undefined") return;
    // show the copy once less than a quarter of the big preview is left in view
    miniWatch = new IntersectionObserver(([e]) => (mini.hidden = e.intersectionRatio >= 0.25), { threshold: [0, 0.25, 0.5, 1] });
    miniWatch.observe(slot);
  }
  mini.addEventListener("click", () => document.getElementById("main-shield")?.scrollIntoView({ behavior: "smooth", block: "center" }));

  // ---------------------------------------------------------------- game textures

  async function paintGame(all: Arms[], pick: number, title: string) {
    const token = ++renderToken;
    const textures = tex.store!;
    const main = await renderCoa(exportCk3(all[pick]).coa, textures, 300);
    if (token !== renderToken) return;
    const slot = document.getElementById("main-shield");
    if (slot) {
      // sized by the stylesheet like the sketch (.shield svg / .shield canvas), not by renderCoa's inline size
      main.canvas.style.removeProperty("width");
      main.canvas.style.removeProperty("height");
      main.canvas.setAttribute("role", "img");
      main.canvas.setAttribute("aria-label", title);
      slot.replaceChildren(main.canvas);
    }
    // the corner copy shows the same picture as the big preview
    const small = await renderCoa(exportCk3(all[pick]).coa, textures, 64);
    if (token !== renderToken) return;
    small.canvas.style.removeProperty("width");
    small.canvas.style.removeProperty("height");
    mini.replaceChildren(small.canvas);
    const status = document.getElementById("texstatus");
    if (status && main.missing.length) status.textContent = t("app.preview.missing", { list: main.missing.join(", ") });
    for (let i = 0; i < all.length; i++) {
      const th = await renderCoa(exportCk3(all[i]).coa, textures, 76);
      if (token !== renderToken) return;
      document.querySelector(`[data-thumb="${i}"]`)?.replaceChildren(th.canvas);
    }
  }

  function texStatus(): string {
    if (tex.store) {
      const loaded = esc(tex.from ? t("app.preview.loadedFrom", { n: tex.store.size, name: tex.from }) : t("app.preview.loaded", { n: tex.store.size }));
      return tex.remembered ? `${loaded} · <button type="button" class="linkbtn" id="texforget">${esc(t("app.preview.forget"))}</button>` : loaded;
    }
    if (tex.remembered) return `<button type="button" class="linkbtn" id="texreconnect">${esc(t("app.preview.reconnect", { name: tex.remembered.name }))}</button>`;
    return esc(t(canPickDirectory() ? "app.preview.helpPick" : "app.preview.help"));
  }

  async function useDir(h: DirHandle, remember: boolean) {
    const status = document.getElementById("texstatus");
    if (status) status.textContent = t("app.preview.loading");
    const coa = await findCoatOfArms(h).catch(() => null);
    const map = coa ? await listTextures(coa).catch(() => new Map()) : new Map();
    if (!map.size) {
      if (status) status.textContent = t("app.preview.error");
      return;
    }
    tex.store = TextureStore.fromHandles(map);
    tex.from = h.name;
    tex.mode = "game";
    if (remember) {
      await rememberDir(h);
      tex.remembered = h;
    }
    if (alive) renderResult();
  }

  async function loadTextures(files: FileList | null) {
    const status = document.getElementById("texstatus");
    if (!files || !files.length) return;
    if (status) status.textContent = t("app.preview.loading");
    const store = TextureStore.fromFiles(files);
    if (store.size === 0) {
      if (status) status.textContent = t("app.preview.error");
      return;
    }
    tex.store = store;
    tex.from = null;
    tex.mode = "game";
    renderResult();
  }

  result.addEventListener("click", async (e) => {
    const id = (e.target as HTMLElement).closest("button")?.id;
    if (id === "texpick") {
      try {
        await useDir(await pickDirectory(), true);
      } catch {
        /* the player closed the picker */
      }
    } else if (id === "texreconnect" && tex.remembered) {
      // asking again needs this click; the browser shows its own prompt
      if ((await tex.remembered.requestPermission?.({ mode: "read" })) === "granted") await useDir(tex.remembered, false);
    } else if (id === "texforget") {
      await forgetDir();
      tex.remembered = null;
      renderResult();
    }
  });

  // a folder chosen on an earlier visit: load it straight away if the browser still allows it (once per visit)
  if (!tex.recalled) {
    tex.recalled = true;
    recallDir()
      .catch(() => null)
      .then(async (h) => {
        if (h && canPickDirectory()) {
          tex.remembered = h;
          if ((await h.queryPermission?.({ mode: "read" })) === "granted") await useDir(h, false);
          else if (alive) renderResult();
        }
        if (alive) textureTip();
      });
  } else textureTip();

  /**
   * Without game textures the preview is our own sketch. Say so once per visit: why
   * the site has no textures (copyright), what the sketch is for, and how to load them.
   */
  function textureTip() {
    if (tipShown || tex.store || tipOff() || typeof HTMLDialogElement === "undefined") return;
    tipShown = true;
    const pick = canPickDirectory();
    const dlg = document.createElement("dialog");
    tip = dlg;
    dlg.className = "textip";
    dlg.setAttribute("aria-labelledby", "textip-title");
    /** (re)write the text in the current language, keeping the checkbox */
    const fill = () => {
      const never = (dlg.querySelector("#textip-never") as HTMLInputElement | null)?.checked ?? false;
      const go = tex.remembered ? t("app.preview.reconnect", { name: tex.remembered.name }) : t(pick ? "app.texTip.pick" : "app.texTip.pickFolder");
      const langs = LOCALES.map(
        (l) => `<button type="button" data-lang="${l}" lang="${l}" aria-pressed="${l === locale()}"${l === locale() ? ' class="on"' : ""}>${esc(localeShort(l))}</button>`,
      ).join("");
      dlg.lang = locale();
      dlg.innerHTML = `<div class="langs" role="group" aria-label="${esc(t("app.texTip.lang"))}">${langs}</div>
        <h2 id="textip-title">${esc(t("app.texTip.title"))}</h2>
        <p>${esc(t("app.texTip.sketch"))}</p>
        <p>${esc(t("app.texTip.why"))}</p>
        <p class="note">${esc(t(pick ? "app.preview.helpPick" : "app.preview.help"))}</p>
        <label class="never"><input type="checkbox" id="textip-never"${never ? " checked" : ""}> ${esc(t("app.texTip.never"))}</label>
        <div class="row"><button type="button" class="later">${esc(t("app.texTip.later"))}</button><button type="button" class="go">${esc(go)}</button></div>`;
    };
    const close = () => {
      if ((dlg.querySelector("#textip-never") as HTMLInputElement).checked) {
        try {
          localStorage.setItem(TIP_KEY, "off");
        } catch {
          /* it will ask again next visit */
        }
      }
      dlg.close();
      dlg.remove();
      tip = null;
    };
    dlg.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });
    dlg.addEventListener("click", async (e) => {
      const b = (e.target as HTMLElement).closest("button");
      if (!b) return;
      if (b.dataset.lang) {
        // the shell's language button switches the whole page (address, header, view); press it until it lands here
        const want = b.dataset.lang;
        const shellLang = document.getElementById("lang");
        for (let i = 0; i < LOCALES.length && locale() !== want; i++) shellLang?.click();
        fill();
        (dlg.querySelector(`[data-lang="${want}"]`) as HTMLButtonElement | null)?.focus();
      } else if (b.classList.contains("later")) close();
      else if (b.classList.contains("go")) {
        close();
        // still inside the click, so the browser lets us ask for the folder
        if (tex.remembered) {
          if ((await tex.remembered.requestPermission?.({ mode: "read" })) === "granted") await useDir(tex.remembered, false);
        } else if (pick) {
          try {
            await useDir(await pickDirectory(), true);
          } catch {
            /* the player closed the picker */
          }
        } else (document.getElementById("texdir") as HTMLInputElement | null)?.click();
      }
    });
    fill();
    document.body.append(dlg);
    dlg.showModal();
    (dlg.querySelector(".go") as HTMLButtonElement).focus();
  }

  // ---------------------------------------------------------------- shell

  const freebox = shell.tools.querySelector("#freebox") as HTMLElement | null;
  const reset = shell.tools.querySelector("#reset") as HTMLButtonElement;

  function renderShell() {
    shell.intro.textContent = t(d.intro);
    shell.footer.textContent = t("app.footer");
    if (d.free && freebox) {
      const on = d.free.get(answers);
      (freebox.querySelector("#freelabel") as HTMLElement).textContent = t("app.free");
      freebox.title = t("app.freeHint");
      (freebox.querySelector("#free") as HTMLInputElement).checked = on;
      freebox.classList.toggle("on", on);
    }
    reset.textContent = t("app.reset");
    reset.title = t("app.resetHint");
  }

  const renderForm = () => (form.innerHTML = d.form.render(answers));

  function render() {
    renderShell();
    renderForm();
    renderResult();
  }

  /** what the designer's form made of an event */
  function apply(r: A | "form" | null) {
    if (r === "form") renderForm();
    else if (r !== null) update(r);
  }

  form.addEventListener("change", (e) => {
    if (d.form.change) apply(d.form.change(e.target as HTMLInputElement | HTMLSelectElement, answers));
  });
  form.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("button");
    if (b && d.form.click) apply(d.form.click(b, answers));
  });
  result.addEventListener("click", (e) => {
    const el = e.target as HTMLElement;
    const ld = el.closest<HTMLElement>("[data-load]");
    if (ld) {
      const s = store.load()[Number(ld.dataset.load)];
      if (s) openDesign(s.hash);
      return;
    }
    const del = el.closest<HTMLElement>("[data-del]");
    if (del) {
      const s = store.load()[Number(del.dataset.del)];
      if (!s) return;
      lastDeleted = store.remove(s.name) ?? null;
      renderResult();
      flash("savedstatus", `${esc(t("app.save.deleted", { name: s.name }))} <button type="button" class="linkbtn" data-undo>${esc(t("app.save.undo"))}</button>`, 10000);
      return;
    }
    if (el.closest("[data-undo]")) {
      if (lastDeleted) store.restore(lastDeleted);
      lastDeleted = null;
      renderResult();
      return;
    }
    const p = el.closest<HTMLElement>("[data-pick]");
    if (p) {
      const c = last?.candidates[Number(p.dataset.pick)];
      if (c) update(d.pick(answers, c.id));
      return;
    }
    const m = el.closest<HTMLElement>("[data-mode]");
    if (m && !(m as HTMLButtonElement).disabled) {
      tex.mode = m.dataset.mode as "svg" | "game";
      renderResult();
    }
  });
  freebox?.querySelector("#free")!.addEventListener("change", (e) => {
    if (d.free) update(d.free.set(answers, (e.target as HTMLInputElement).checked));
  });
  // start over; pushState (not replace) so the browser's Back button restores the old answers
  reset.addEventListener("click", () => {
    answers = { ...d.defaults };
    shown = "";
    lastFragment.delete(d.id);
    d.form.reset?.();
    if (fragment()) history.pushState(null, "", location.search + "#");
    render();
    window.scrollTo({ top: 0 });
  });

  return {
    title: () => t(`app.nav.${d.id}`),
    render,
    scene: () => d.id,
    // Back / Forward, an opened design, a pasted link: the fragment is the answers
    hash() {
      if (fragment() === shown) return;
      shown = fragment();
      answers = shown ? d.decode(shown) : { ...d.defaults };
      lastFragment.set(d.id, shown);
      render();
    },
    unmount() {
      alive = false;
      renderToken++; // stop painting game textures
      miniWatch?.disconnect();
      tip?.remove();
    },
  };
  };
