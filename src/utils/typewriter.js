export function splitGraphemes(text) {
  return typeof Intl.Segmenter === "function"
    ? [
        ...new Intl.Segmenter("zh", { granularity: "grapheme" }).segment(text),
      ].map((item) => item.segment)
    : Array.from(text);
}

// One deterministic frame per call; the view owns timing and pause/resume.
export function createTypewriter(phrases, timing = {}) {
  const lines = phrases
    .filter((line) => typeof line === "string" && line.trim())
    .map(splitGraphemes);
  const speed = { type: 125, erase: 70, hold: 2200, gap: 650, ...timing };
  let index = 0;
  let length = 0;
  let deleting = false;
  return {
    next() {
      if (!lines.length) return { text: "", delay: null, phase: "empty" };
      const line = lines[index];
      let delay;
      let phase;
      if (deleting) {
        length -= 1;
        phase = length ? "erasing" : "gap";
        delay = length ? speed.erase : speed.gap;
      } else {
        length += 1;
        phase = length === line.length ? "holding" : "typing";
        delay = length === line.length ? speed.hold : speed.type;
      }
      const text = line.slice(0, length).join("");
      if (length === line.length) deleting = true;
      if (!length) {
        deleting = false;
        index = (index + 1) % lines.length;
      }
      return { text, delay, phase };
    },
  };
}
