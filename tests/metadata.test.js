import test from "node:test";
import assert from "node:assert/strict";
import { pageMetadata, metadataFor, renderMetadata } from "../src/data/metadata.js";

test("each static entry has its own share metadata before JavaScript runs", () => {
  const descriptions = new Set();
  for (const path of Object.keys(pageMetadata)) {
    const metadata = metadataFor(path);
    const html = renderMetadata(path);
    descriptions.add(metadata.description);
    assert.ok(html.includes(`href="${metadata.url}"`));
    assert.ok(html.includes('property="og:image" content="https://peanora.cn/social-cover.png"'));
    assert.equal((html.match(/<title>/g) || []).length, 1);
    assert.ok(html.includes('name="description"'));
    assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
    assert.ok(!html.includes("Peanora's"), "HTML attributes and titles escape apostrophes");
  }
  assert.equal(descriptions.size, 4);
});

test("trailing slash URLs canonicalize and unknown pages are not indexed", () => {
  assert.deepEqual(metadataFor("/music/"), metadataFor("/music"));
  assert.equal(metadataFor("/music").url, "https://peanora.cn/music/");
  const html = renderMetadata("/missing");
  assert.ok(html.includes('content="noindex,follow"'));
  assert.ok(!html.includes('rel="canonical"'));
  assert.ok(!html.includes('property="og:url"'));
});
