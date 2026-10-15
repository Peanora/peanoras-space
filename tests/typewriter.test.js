import test from "node:test";
import assert from "node:assert/strict";
import { createTypewriter, splitGraphemes } from "../src/utils/typewriter.js";

test("逐字打出、完整停留、逐字删除、留白后进入下一句并循环", () => {
  const writer = createTypewriter(["早安", "晚安"]);
  assert.deepEqual(writer.next(), { text: "早", delay: 125, phase: "typing" });
  assert.deepEqual(writer.next(), {
    text: "早安",
    delay: 2200,
    phase: "holding",
  });
  assert.deepEqual(writer.next(), { text: "早", delay: 70, phase: "erasing" });
  assert.deepEqual(writer.next(), { text: "", delay: 650, phase: "gap" });
  assert.equal(writer.next().text, "晚");
  assert.equal(writer.next().text, "晚安");
  writer.next();
  writer.next();
  assert.equal(writer.next().text, "早");
});
test("空列表停止；单句也循环；组合字符不拆开", () => {
  assert.equal(createTypewriter(["", "  "]).next().delay, null);
  assert.deepEqual(splitGraphemes("好👩‍💻é"), ["好", "👩‍💻", "é"]);
  const writer = createTypewriter(["好"]);
  assert.equal(writer.next().text, "好");
  assert.equal(writer.next().text, "");
  assert.equal(writer.next().text, "好");
});
