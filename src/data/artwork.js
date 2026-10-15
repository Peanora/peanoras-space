// Generated delivery files stay local and respect Vite's deployment base.
const files = import.meta.glob("../assets/artwork/web/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
const images = new Map();
for (const [path, src] of Object.entries(files)) {
  if (/-\d+\.webp$/.test(path)) continue;
  if (path.endsWith("/avatar.webp")) continue;
  const stem = path.slice(0, -5);
  const variants = [640, 1080, 1920].map((width) => ({
    width,
    src: width === 1920 ? src : files[`${stem}-${width}.webp`],
  })).filter((item) => item.src);
  images.set(src, {
    thumbnail: files[`${stem}-240.webp`] || src,
    small: variants[0]?.src || src,
    srcset: variants.map((item) => `${item.src} ${item.width}w`).join(", "),
    backgroundSrcset: variants.filter((item) => item.width <= 1080)
      .map((item) => `${item.src} ${item.width}w`).join(", "),
  });
}
export function artworkFor(src) {
  return images.get(src) || { thumbnail: src, small: src, srcset: undefined };
}
