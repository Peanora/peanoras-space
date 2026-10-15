import project from "../assets/images/project-placeholder.svg";
import photo from "../assets/images/photo-placeholder.svg";
import record from "../assets/images/record-placeholder.svg";
import portrait from "../assets/images/portrait-placeholder.svg";
const builtins = { "builtin:project": project, "builtin:photo": photo, "builtin:record": record, "builtin:portrait": portrait };
export function contentImage(source) {
  if (builtins[source]) return builtins[source];
  return /^\/content\/uploads\/[a-f0-9-]+\.(webp|png|jpe?g|gif)$/.test(source || "") ? source : photo;
}
