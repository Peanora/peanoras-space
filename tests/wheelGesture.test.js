import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWheelGestureGate,
  normalizeWheelDelta,
} from "../src/utils/wheelGesture.js";

test("一次手势达到阈值后，后续惯性即使在转场结束后也不连跳", () => {
  const gate = createWheelGestureGate();
  assert.equal(gate(12, 0), 0);
  assert.equal(gate(13, 35), 0);
  assert.equal(gate(12, 60), 1);
  for (const at of [100, 200, 300, 450, 570, 680])
    assert.equal(gate(80, at), 0);
  assert.equal(gate(100, 1000), 1);
});
test("转场时开始的手势及其惯性被忽略，新手势能恢复上翻", () => {
  const gate = createWheelGestureGate();
  assert.equal(gate(100, 0), 1);
  assert.equal(gate(-100, 220, true), 0);
  assert.equal(gate(-100, 300), 0);
  assert.equal(gate(-100, 600), -1);
});
test("方向反转抵消累积；像素、行和页的滚轮量正确换算", () => {
  const gate = createWheelGestureGate();
  assert.equal(gate(20, 0), 0);
  assert.equal(gate(-20, 40), 0);
  assert.equal(gate(-40, 80), -1);
  assert.equal(normalizeWheelDelta({ deltaY: 3, deltaMode: 1 }, 600), 48);
  assert.equal(normalizeWheelDelta({ deltaY: 1, deltaMode: 2 }, 600), 600);
  assert.equal(normalizeWheelDelta({ deltaY: 60, deltaMode: 0 }, 600), 60);
});
