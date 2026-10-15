import test from "node:test";
import assert from "node:assert/strict";
import { canReadMore, createTouchGesture } from "../src/utils/touchGesture.js";
const panel = (top = 0) => ({ scrollTop: top, clientHeight: 500, scrollHeight: 800 });
const swipe = (options = {}) => createTouchGesture({
  x: 100, y: 300, panel: { clientHeight: 500, scrollHeight: 500, scrollTop: 0 },
  previous: true, next: true, ...options,
});
test("non-overflowing screen turns once for an upward or downward swipe", () => {
  const gesture = swipe();
  assert.equal(gesture.move({ x: 105, y: 270 }).preventScroll, true);
  assert.equal(gesture.end({ x: 110, y: 100 }), 1);
  assert.equal(swipe().end({ x: 100, y: 450 }), -1);
});
test("short screen reads first, then a fresh swipe turns at the boundary", () => {
  const scrolling = panel(200);
  const gesture = swipe({ panel: scrolling });
  assert.equal(gesture.move({ x: 100, y: 270 }).preventScroll, false);
  scrolling.scrollTop = 300;
  assert.equal(gesture.end({ x: 100, y: 100 }), 0);
  assert.equal(swipe({ panel: scrolling }).end({ x: 100, y: 100 }), 1);
  assert.equal(swipe({ panel: panel(0) }).end({ x: 100, y: 450 }), -1);
});
test("reading upward from bottom and downward from top never changes theme", () => {
  assert.equal(swipe({ panel: panel(300) }).end({ x: 100, y: 450 }), 0);
  assert.equal(swipe({ panel: panel(0) }).end({ x: 100, y: 100 }), 0);
});
test("taps, tiny movements, horizontal gestures and reversals do not turn", () => {
  assert.equal(swipe().end({ x: 100, y: 300 }), 0);
  assert.equal(swipe().end({ x: 100, y: 260 }), 0);
  const horizontal = swipe();
  horizontal.move({ x: 130, y: 295 });
  assert.equal(horizontal.end({ x: 180, y: 100 }), 0);
  const reversed = swipe();
  reversed.move({ x: 100, y: 270 });
  assert.equal(reversed.end({ x: 100, y: 400 }), 0);
});
test("first and last screens respect the end of the book", () => {
  assert.equal(swipe({ previous: false }).end({ x: 100, y: 450 }), 0);
  assert.equal(swipe({ next: false }).end({ x: 100, y: 100 }), 0);
  assert.equal(canReadMore(panel(299), 1), false);
});
