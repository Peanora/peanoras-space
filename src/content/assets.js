import project from "../assets/images/project-placeholder.svg";
import photo from "../assets/images/photo-placeholder.svg";
import record from "../assets/images/record-placeholder.svg";
import portrait from "../assets/images/portrait-placeholder.svg";
const builtins = { "builtin:project": project, "builtin:photo": photo, "builtin:record": record, "builtin:portrait": portrait };
const artwork = import.meta.glob("../assets/artwork/web/*.webp", { eager: true, query: "?url", import: "default" });
for (const [path, src] of Object.entries(artwork)) {
  const name = path.split('/').at(-1).slice(0, -5);
  if (!/-\d+$/.test(name)) builtins[`artwork:${name}`] = src;
}
export const contentImageOptions = [
  { value: 'builtin:photo', label: '占位插画' }, { value: 'builtin:project', label: '占位项目封面' },
  { value: 'builtin:record', label: '占位唱片封面' }, { value: 'builtin:portrait', label: '占位竖图' },
  ...Object.keys(builtins).filter((key) => key.startsWith('artwork:')).map((value) => ({ value, label: `现有插画 · ${value.slice(8)}` })),
];
export function contentImage(source) {
  if (builtins[source]) return builtins[source];
  return /^\/content\/uploads\/[a-f0-9-]+\.(webp|png|jpe?g|gif)$/.test(source || "") ? source : photo;
}
