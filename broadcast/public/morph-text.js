// Swaps an element's text character by character, left to right: each old
// character slides up and out while the new text rises into place. Old and new
// text share one grid cell during the swap, so the layout only changes once.

const SPREAD_MS = 450; // from the first character starting to the last
const CHAR_MS = 350; // one character's own movement
const SHIFT = "0.35em"; // how far a character travels

const style = document.createElement("style");
style.textContent = `
  .morph { display: grid; }
  .morph-layer { grid-area: 1 / 1; }
  .morph-word { white-space: nowrap; }
  .morph-char {
    display: inline-block;
    transition:
      opacity ${CHAR_MS}ms ease,
      transform ${CHAR_MS}ms cubic-bezier(0.2, 0.7, 0.2, 1);
    transition-delay: var(--delay);
  }
  .morph-enter .morph-char { opacity: 0; transform: translateY(${SHIFT}); }
  .morph-leave .morph-char { opacity: 0; transform: translateY(-${SHIFT}); }
`;
document.head.append(style);

/** Sets `el`'s text; the first call renders it directly, later changes morph. */
export function morphText(el, text) {
  if (el.dataset.text === text) return;
  const isFirst = el.dataset.text === undefined;
  el.dataset.text = text;
  el.classList.add("morph");

  const next = layer(text);
  if (isFirst) {
    el.replaceChildren(next);
    return;
  }

  // If a swap is still running, drop its outgoing text so only two ever overlap.
  for (const leaving of el.querySelectorAll(".morph-leave")) leaving.remove();
  const current = el.querySelector(".morph-layer");

  next.classList.add("morph-enter");
  el.append(next);
  next.getBoundingClientRect(); // commit the start position so the transition runs
  next.classList.remove("morph-enter");

  current?.classList.add("morph-leave");
  setTimeout(() => current?.remove(), SPREAD_MS + CHAR_MS);
}

/** The text as character spans, delayed left to right; words stay unbreakable. */
function layer(text) {
  const root = document.createElement("span");
  root.className = "morph-layer";
  const step = SPREAD_MS / Math.max([...text].length - 1, 1);
  let index = 0;

  for (const part of text.split(/(\s+)/)) {
    if (/^\s*$/.test(part)) {
      root.append(part);
      index += [...part].length;
      continue;
    }
    const word = document.createElement("span");
    word.className = "morph-word";
    for (const char of part) {
      const span = document.createElement("span");
      span.className = "morph-char";
      span.textContent = char;
      span.style.setProperty("--delay", `${Math.round(index++ * step)}ms`);
      word.append(span);
    }
    root.append(word);
  }
  return root;
}
