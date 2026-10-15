import test from "node:test";
import assert from "node:assert/strict";
import { createRenderer, h, ref } from "vue";
import { useScreenPager } from "../src/composables/useScreenPager.js";

test("touch handlers support image links, suppress accidental clicks, and preserve taps/zoom/tools", async () => {
  const listeners = new Map();
  const media = { matches: false, addEventListener() {}, removeEventListener() {} };
  const savedWindow = globalThis.window;
  const savedDocument = globalThis.document;
  const windowListeners = new Map();
  globalThis.window = { matchMedia: () => media,
    addEventListener: (type, fn) => windowListeners.set(type, fn),
    removeEventListener: (type) => windowListeners.delete(type),
  };
  globalThis.document = { activeElement: null };
  const panel = { scrollTop: 0, clientHeight: 500, scrollHeight: 800 };
  panel.scrollBy = ({ top }) => { panel.scrollTop = Math.max(0, Math.min(300, panel.scrollTop + top)); };
  const stage = {
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type) => listeners.delete(type),
    querySelector: () => panel,
  };
  const renderer = createRenderer({
    createComment: () => ({}), createText: () => ({}), createElement: () => ({}),
    insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
    parentNode: () => null, nextSibling: () => null,
  });
  let pager;
  const app = renderer.createApp({ setup() {
    pager = useScreenPager(ref(stage), 4);
    return () => h("div");
  } });
  const target = (toolbar = false) => ({ closest(selector) {
    if (selector === ".home-screen") return panel;
    return toolbar && selector.includes(".pager-bottom") ? {} : null;
  } });
  const touch = (y, id = 1) => ({ identifier: id, clientX: 100, clientY: y });
  const start = (y, toolbar = false) => listeners.get("touchstart")({ touches: [touch(y)], target: target(toolbar) });
  const end = (y) => listeners.get("touchend")({ changedTouches: [touch(y)] });
  try {
    app.mount({});
    start(300); end(100);
    assert.equal(pager.current.value, 0, "overflowing content must be read first");
    panel.scrollTop = 300;
    start(300);
    let prevented = false;
    listeners.get("touchmove")({ touches: [touch(270)], cancelable: true, preventDefault() { prevented = true; } });
    assert.equal(prevented, true, "boundary swipe owns the gesture");
    end(100);
    assert.equal(pager.current.value, 1, "link/image surface can flip");
    let clickStopped = false;
    listeners.get("click")({ detail: 1, target: target(), preventDefault() { clickStopped = true; }, stopPropagation() {} });
    assert.equal(clickStopped, true);
    await pager.finishMove();
    start(300); end(300);
    assert.equal(pager.current.value, 1, "tap does not flip");
    start(300, true); end(100);
    assert.equal(pager.current.value, 1, "toolbar stays independent");
    start(300);
    listeners.get("touchmove")({ touches: [touch(270), touch(260, 2)] });
    end(100);
    assert.equal(pager.current.value, 1, "pinch cancels paging");
    start(300); listeners.get("touchcancel")(); end(100);
    assert.equal(pager.current.value, 1);
    panel.scrollTop = 0;
    start(300); end(450);
    assert.equal(pager.current.value, 0, "top boundary goes back");
    await pager.finishMove();
    const key = { key: "PageDown", target: target(), preventDefault() {} };
    windowListeners.get("keydown")(key);
    assert.equal(panel.scrollTop, 300, "keyboard reads the panel even from fixed controls");
    assert.equal(pager.current.value, 0);
    windowListeners.get("keydown")(key);
    assert.equal(pager.current.value, 1, "next key at boundary changes theme");
  } finally {
    app.unmount();
    globalThis.window = savedWindow;
    globalThis.document = savedDocument;
  }
  assert.equal(listeners.size, 0, "listeners removed on unmount");
  assert.equal(windowListeners.size, 0);
});
