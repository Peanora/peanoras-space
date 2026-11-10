import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer, h, ref } from 'vue';
import { useThemePager } from '../src/composables/useThemePager.js';

function fixture({ overflow = false, onBoundary } = {}) {
  const saved = { window: globalThis.window, document: globalThis.document, performance: globalThis.performance };
  const mediaListeners = new Map();
  const media = { matches: false, addEventListener: (type, fn) => mediaListeners.set(type, fn), removeEventListener: type => mediaListeners.delete(type) };
  let now = 0;
  let top = 88;
  let focusCount = 0;
  const alignments = [];
  globalThis.window = { innerHeight: 800, matchMedia: () => media, scrollBy: options => { alignments.push(options); top -= options.top; } };
  globalThis.document = { activeElement: null };
  globalThis.performance = { now: () => now };
  const panels = Array.from({ length: 3 }, () => ({
    scrollTop: 0, clientHeight: 500, scrollHeight: overflow ? 800 : 500,
    style: { overscrollBehaviorY: '' },
    querySelector: () => ({ focus: () => { focusCount += 1; globalThis.document.activeElement = { insidePager: true }; } }),
    scrollBy({ top: amount }) { this.scrollTop = Math.max(0, Math.min(this.scrollHeight - this.clientHeight, this.scrollTop + amount)); },
  }));
  const count = ref(3);
  let pager;
  const root = { clientHeight: 500, contains: element => !!element?.insidePager, getBoundingClientRect: () => ({ top }), querySelector: () => panels[pager?.current.value ?? 0] };
  const renderer = createRenderer({
    createComment: () => ({}), createText: () => ({}), createElement: () => ({}),
    insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {}, parentNode: () => null, nextSibling: () => null,
  });
  const app = renderer.createApp({ setup() {
    pager = useThemePager({ root: ref(root), count, onBoundary });
    return () => h('div');
  } });
  app.mount({});
  const target = (tool = '') => ({ insidePager: true, closest(selector) {
    if (selector === '.home-theme') return tool === '.theme-pager-footer' ? null : panels[pager.current.value];
    return tool && selector.includes(tool) ? {} : null;
  } });
  const event = (properties = {}) => ({
    target: target(), cancelable: true, prevented: false, stopped: false,
    preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }, ...properties,
  });
  const point = (y, x = 100, identifier = 1) => ({ clientY: y, clientX: x, identifier });
  return {
    pager, panels, count, alignments, media, target, event, point,
    get focusCount() { return focusCount; },
    at(time) { now = time; },
    top(value) { top = value; },
    wheel(time, deltaY, properties = {}) {
      now = time;
      const result = event({ deltaY, deltaX: 0, deltaMode: 0, ...properties });
      pager.onWheel(result);
      return result;
    },
    key(key, properties = {}) {
      const result = event({ key, ...properties });
      pager.onKeydown(result);
      return result;
    },
    start(y, properties = {}) { pager.onTouchStart(event({ touches: [point(y)], ...properties })); },
    move(y, properties = {}) { const result = event({ touches: [point(y)], ...properties }); pager.onTouchMove(result); return result; },
    end(y, properties = {}) { pager.onTouchEnd(event({ changedTouches: [point(y)], ...properties })); },
    cleanup() {
      app.unmount();
      assert.equal(mediaListeners.size, 0);
      Object.assign(globalThis, saved);
    },
  };
}

test('bounded wheel paging swallows each turn’s inertia but releases fresh first-up/last-down gestures', async () => {
  const f = fixture();
  try {
    assert.equal(f.wheel(0, 90).prevented, true);
    assert.equal(f.pager.current.value, 1);
    await f.pager.finishMove();
    for (const at of [60, 160, 290]) {
      assert.equal(f.wheel(at, 80).prevented, true);
      assert.equal(f.pager.current.value, 1, 'inertia remains consumed after the animation');
    }
    f.wheel(600, 90);
    assert.equal(f.pager.current.value, 2);
    await f.pager.finishMove();
    assert.equal(f.wheel(680, 80).prevented, true, 'last-panel inertia must not fall into the feed');
    assert.equal(f.wheel(1000, 80).prevented, false, 'fresh last-down belongs to document scrolling');
    assert.equal(f.wheel(1070, 80).prevented, false, 'a released gesture stays released');
    f.pager.goTo(0, { force: true, align: false });
    await f.pager.finishMove();
    assert.equal(f.wheel(1500, -80).prevented, false, 'fresh first-up returns to the banner');
  } finally { f.cleanup(); }
});

test('reading an overflowing panel requires a fresh wheel gesture before turning', async () => {
  const f = fixture({ overflow: true });
  try {
    const panel = f.panels[0];
    panel.scrollTop = 200;
    assert.equal(f.wheel(0, 50).prevented, false, 'ordinary panel reading stays native');
    assert.equal(panel.style.overscrollBehaviorY, 'contain', 'the read gesture cannot chain into document');
    panel.scrollTop = 250; // The browser applies the preceding native scroll.
    assert.equal(f.wheel(60, 80).prevented, true, 'a large event is clamped instead of chaining to document');
    assert.equal(panel.scrollTop, 300);
    assert.equal(f.wheel(130, 80).prevented, true);
    assert.equal(f.pager.current.value, 0, 'reaching the bottom does not change the original read gesture');
    assert.equal(f.wheel(400, 80).prevented, true);
    assert.equal(f.pager.current.value, 1);
    assert.equal(panel.style.overscrollBehaviorY, '', 'the completed read gesture leaves no permanent boundary trap');
    await f.pager.finishMove();
  } finally { f.cleanup(); }
});

test('wheel reading over the footer scrolls the active panel without moving the document', () => {
  const f = fixture({ overflow: true });
  try {
    const footer = f.target('.theme-pager-footer');
    assert.equal(f.wheel(0, 60, { target: footer }).prevented, true);
    assert.equal(f.panels[0].scrollTop, 60, 'footer wheel input reads the active panel explicitly');
    assert.equal(f.wheel(50, 300, { target: footer }).prevented, true);
    assert.equal(f.panels[0].scrollTop, 300);
    assert.equal(f.wheel(100, 80, { target: footer }).prevented, true);
    assert.equal(f.pager.current.value, 0, 'reading to the edge still needs a fresh gesture to turn');
  } finally { f.cleanup(); }
});

test('entry and banner overshoot align the visible region once; modifier wheels remain native', async () => {
  const f = fixture();
  try {
    f.top(220);
    assert.equal(f.wheel(0, 80).prevented, true);
    assert.equal(f.alignments.length, 1);
    assert.equal(f.alignments[0].top, 132);
    assert.equal(f.pager.current.value, 0);
    f.wheel(60, 80);
    assert.equal(f.pager.current.value, 0, 'alignment consumes this gesture');
    f.wheel(400, 80);
    assert.equal(f.pager.current.value, 1);
    await f.pager.finishMove();
    f.top(-100);
    assert.equal(f.wheel(800, 80).prevented, true, 'banner overshoot aligns before any additional turn');
    assert.equal(f.alignments.length, 2);
    assert.equal(f.alignments[1].top, -188);
    assert.equal(f.pager.current.value, 1);
    for (const properties of [{ ctrlKey: true }, { metaKey: true }, { deltaX: 150 }, { target: f.target('input') }, { target: f.target('[contenteditable]') }, { target: f.target('.music-widget') }]) {
      assert.equal(f.wheel(1600, 80, properties).prevented, false);
      assert.equal(f.pager.current.value, 1);
    }
  } finally { f.cleanup(); }
});

test('entry aligns before reading clipped overflow and terminal outward exits never realign', async () => {
  const f = fixture({ overflow: true });
  try {
    f.top(220);
    f.panels[0].scrollTop = 120;
    assert.equal(f.wheel(0, 50).prevented, true);
    assert.equal(f.alignments.length, 1);
    assert.equal(f.panels[0].scrollTop, 120, 'the clipped panel is aligned before scrolling its content');
    assert.equal(f.wheel(50, 50).prevented, true, 'the alignment gesture remains consumed');
    assert.equal(f.wheel(400, 50).prevented, false, 'a fresh gesture can now read the aligned panel');
    f.pager.goTo(2, { force: true, align: false });
    await f.pager.finishMove();
    f.panels[2].scrollTop = 300;
    f.top(180);
    assert.equal(f.wheel(800, 80).prevented, false);
    assert.equal(f.alignments.length, 1, 'last-down with no remaining content does not snap back into the region');
  } finally { f.cleanup(); }
});

test('keyboard reading, deliberate turns and boundary callbacks stay local to the wrapper', async () => {
  const exits = [];
  const f = fixture({ overflow: true, onBoundary: step => exits.push(step) });
  try {
    assert.equal(f.key('PageDown').prevented, true);
    assert.equal(f.panels[0].scrollTop, 300);
    assert.equal(f.pager.current.value, 0);
    f.key('PageDown', { repeat: true });
    assert.equal(f.pager.current.value, 0, 'a held key does not run through themes');
    f.key('PageDown');
    assert.equal(f.pager.current.value, 1);
    await f.pager.finishMove();
    assert.equal(f.focusCount, 1);
    f.key('End');
    await f.pager.finishMove();
    assert.equal(f.pager.current.value, 2);
    f.panels[2].scrollTop = 300;
    assert.equal(f.key('ArrowDown').prevented, true);
    assert.deepEqual(exits, [1]);
    assert.equal(f.key('Home', { target: f.target('input') }).prevented, false);
    assert.equal(f.pager.current.value, 2);
    f.key('Home');
    await f.pager.finishMove();
    assert.equal(f.pager.current.value, 0);
  } finally { f.cleanup(); }
});

test('touch swipes work on image links while taps, pinch, controls and horizontal gestures remain independent', async () => {
  const f = fixture();
  try {
    f.start(300);
    assert.equal(f.move(270).prevented, true);
    f.end(100);
    assert.equal(f.pager.current.value, 1);
    const accidentalClick = f.event({ detail: 1 });
    f.pager.onClickCapture(accidentalClick);
    assert.equal(accidentalClick.prevented, true);
    assert.equal(accidentalClick.stopped, true);
    await f.pager.finishMove();
    f.start(300); f.end(300);
    const tap = f.event({ detail: 1 });
    f.pager.onClickCapture(tap);
    assert.equal(tap.prevented, false, 'a fresh short tap is usable even shortly after a swipe');
    f.start(300, { target: f.target('.theme-pager-footer') }); f.end(100);
    assert.equal(f.pager.current.value, 1);
    f.start(300);
    f.move(280, { touches: [f.point(280), f.point(260, 120, 2)] });
    f.end(100);
    assert.equal(f.pager.current.value, 1, 'a second finger cancels paging for browser zoom');
    f.start(300);
    assert.equal(f.move(295, { touches: [f.point(295, 180)] }).prevented, false);
    f.end(100, { changedTouches: [f.point(100, 180)] });
    assert.equal(f.pager.current.value, 1, 'a gesture that began horizontally never becomes a turn');
    f.start(300); f.pager.onTouchCancel(); f.end(100);
    assert.equal(f.pager.current.value, 1);
  } finally { f.cleanup(); }
});

test('short-panel touch reading freezes its starting boundary and fresh terminal swipes release to the document', async () => {
  const f = fixture({ overflow: true });
  try {
    const panel = f.panels[0];
    panel.scrollTop = 200;
    f.start(300);
    assert.equal(f.move(270).prevented, false);
    assert.equal(panel.style.overscrollBehaviorY, 'contain', 'native reading cannot chain into document mid-swipe');
    panel.scrollTop = 300;
    f.end(100);
    assert.equal(f.pager.current.value, 0, 'the swipe that read to the bottom cannot also turn');
    f.start(300);
    assert.equal(panel.style.overscrollBehaviorY, '', 'the next swipe starts with document handoff available');
    f.move(270); f.end(100);
    assert.equal(f.pager.current.value, 1);
    await f.pager.finishMove();
    f.pager.goTo(2, { force: true, align: false });
    await f.pager.finishMove();
    f.panels[2].scrollTop = 300;
    f.start(300);
    assert.equal(f.move(270).prevented, false, 'fresh last-down remains a native document swipe');
    f.end(100);
    assert.equal(f.pager.current.value, 2);
    f.start(100);
    assert.equal(f.move(130).prevented, false, 'reading back upward remains native');
    f.end(250);
    assert.equal(f.panels[2].style.overscrollBehaviorY, 'contain');
    assert.equal(f.wheel(1000, 80).prevented, false, 'switching to a fresh wheel releases previous touch containment');
    assert.equal(f.panels[2].style.overscrollBehaviorY, '');
    f.pager.goTo(0, { force: true, align: false });
    await f.pager.finishMove();
    panel.scrollTop = 0;
    f.start(300);
    assert.equal(f.move(330).prevented, false, 'fresh first-up remains a native document swipe');
    f.end(450);
    assert.equal(f.pager.current.value, 0);
  } finally { f.cleanup(); }
});

test('forced editor/hash navigation bypasses movement and changing visible theme count clamps the current index', async () => {
  const f = fixture();
  try {
    f.panels[1].scrollTop = 200;
    f.pager.goTo(1, { align: false });
    await Promise.resolve();
    assert.equal(f.panels[1].scrollTop, 0, 'a newly revealed theme starts at its beginning');
    assert.equal(f.pager.goTo(2, { align: false }), false);
    assert.equal(f.pager.goTo(2, { force: true, focus: false, align: false }), true);
    assert.equal(f.pager.current.value, 2);
    f.count.value = 1;
    assert.equal(f.pager.current.value, 0);
    await f.pager.finishMove();
    f.count.value = 0;
    assert.equal(f.pager.current.value, 0);
    assert.equal(f.pager.moving.value, false);
    assert.equal(f.pager.goTo(1), false);
    assert.equal(f.alignments.length, 0);
  } finally { f.cleanup(); }
});

test('a fresh native boundary exit hands lingering pager focus out once without canceling scroll', async () => {
  const exits = [];
  const f = fixture({ onBoundary: (step, context) => {
    exits.push([step, context.source]);
    globalThis.document.activeElement = null; // Root focuses feed/cover with preventScroll.
  } });
  try {
    f.key('End');
    await f.pager.finishMove();
    assert.equal(globalThis.document.activeElement.insidePager, true);
    assert.equal(f.wheel(0, 80).prevented, false);
    assert.deepEqual(exits, [[1, 'wheel']]);
    globalThis.document.activeElement = { insidePager: true };
    f.wheel(50, 80);
    assert.deepEqual(exits, [[1, 'wheel']], 'the remaining wheel tail does not repeat focus handoff');
    f.pager.goTo(0, { force: true, align: false, focus: true });
    await f.pager.finishMove();
    f.start(300);
    assert.equal(f.move(330).prevented, false);
    f.move(380); f.end(450);
    assert.deepEqual(exits, [[1, 'wheel'], [-1, 'touch']], 'a native terminal swipe also moves focus only once');
    f.start(300); f.move(330); f.end(450);
    assert.equal(exits.length, 2, 'pointer-only exits with focus already outside need no callback');
  } finally { f.cleanup(); }
});
