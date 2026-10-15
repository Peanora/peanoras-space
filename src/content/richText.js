import DOMPurify from "dompurify";
export function cleanRichText(value) {
  return DOMPurify.sanitize(String(value ?? ""), {
    ALLOWED_TAGS: ["p", "div", "br", "strong", "b", "em", "i", "a", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href", "title"], ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false,
  });
}
