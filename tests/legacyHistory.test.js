import test from "node:test";
import assert from "node:assert/strict";
import { legacyHistoryPath } from "../src/router/legacyHistory.js";

test("old home and all existing hash pages become clean paths", () => {
  for (const path of ["/", "/world", "/music", "/little-things"]) {
    assert.equal(legacyHistoryPath(`https://peanora.cn/#${path}`), path);
  }
  assert.equal(legacyHistoryPath("https://peanora.cn/peanoras-space/#/world"), "/world");
});
test("query parameters on either side of the hash and section anchors survive", () => {
  assert.equal(
    legacyHistoryPath("https://peanora.cn/?from=friend#/music?track=1982799628#songs"),
    "/music?from=friend&track=1982799628#songs",
  );
  assert.equal(legacyHistoryPath("https://peanora.cn/?a=1#/world"), "/world?a=1");
  assert.equal(legacyHistoryPath("https://peanora.cn/#/world?q=hello%20world&tag=A%26B&tag=C+D#about"),
    "/world?q=hello%20world&tag=A%26B&tag=C+D#about");
  assert.equal(legacyHistoryPath("https://peanora.cn/?tag=1#/music?tag=2&tag=3"), "/music?tag=1&tag=2&tag=3");
});
test("native history URLs and anchors are untouched, so migration cannot loop", () => {
  for (const path of ["/", "/world", "/music?tag=1#songs", "/#main-content"]) {
    assert.equal(legacyHistoryPath(`https://peanora.cn${path}`), null);
  }
  const migrated = legacyHistoryPath("https://peanora.cn/?from=old#/world?topic=algorithms#about");
  assert.equal(legacyHistoryPath(new URL(migrated, "https://peanora.cn").href), null);
});
test("unknown routes keep the existing not-found behavior and external paths are rejected", () => {
  assert.equal(legacyHistoryPath("https://peanora.cn/#/missing?x=1"), "/missing?x=1");
  assert.equal(legacyHistoryPath("https://peanora.cn/#//example.com/music"), null);
  assert.equal(legacyHistoryPath("https://peanora.cn/#/\\example.com/music"), null);
});
