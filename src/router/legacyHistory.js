export function legacyHistoryPath(href) {
  const current = new URL(href);
  if (!current.hash.startsWith("#/")) return null;

  const target = new URL(current.hash.slice(1), current.origin);
  // Reject protocol-relative or backslash URLs that would leave this site.
  if (target.origin !== current.origin) return null;

  // Preserve both the original outer query and the route's query, including
  // repeated keys and their existing percent encoding.
  target.search = [current.search.slice(1), target.search.slice(1)]
    .filter(Boolean)
    .join("&");
  return `${target.pathname}${target.search}${target.hash}`;
}
