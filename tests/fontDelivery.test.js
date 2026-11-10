import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('generated WenKai faces preserve complete, disjoint glyph coverage', async () => {
  const cssUrl = new URL('../src/styles/wenkai.css', import.meta.url);
  const css = await readFile(cssUrl, 'utf8');
  const coverage = new Set();
  const faces = [...css.matchAll(/src: url\("([^"]+)"\)[^}]+unicode-range: ([^;]+);/g)];
  assert.ok(faces.length > 1);
  assert.ok(!css.includes('LXGWWenKaiLite-Regular.woff2'), 'Full source font must stay out of delivery CSS');
  for (const [, path, ranges] of faces) {
    const font = await readFile(new URL(path, cssUrl));
    assert.equal(font.toString('ascii', 0, 4), 'wOF2', `Missing/invalid WOFF2: ${path}`);
    for (const range of ranges.split(',')) {
      const [start, end = start] = range.slice(2).split('-').map(hex => parseInt(hex, 16));
      assert.ok(Number.isInteger(start) && end >= start, `Invalid range: ${range}`);
      for (let code = start; code <= end; code++) {
        assert.ok(!coverage.has(code), `Overlapping glyph U+${code.toString(16)} in ${path}`);
        coverage.add(code);
      }
    }
  }
  // Preserved upstream source coverage recorded in LXGW-SOURCE.md.
  assert.equal(coverage.size, 25694, 'Subsetting must not drop characters from the source font');
});
