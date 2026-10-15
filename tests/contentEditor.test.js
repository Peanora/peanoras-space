import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";
import { createContentStore, editorRequestAllowed, imageExtension, localContentEditor } from "../server/contentEditor.js";
import { blockTypes, clone, createBlock, safeLink, setField, validateContent } from "../src/content/model.js";
import { createHistory } from "../src/editor/history.js";
const existing = JSON.parse(await readFile(new URL("../src/data/content.json", import.meta.url), "utf8"));
// Test fixtures must stay independent of the owner's block order/content edits.
const original = { version: 1, pages: { world: { title: "My World", eyebrow: "", blocks: [createBlock("profile", "about"), createBlock("projects", "projects")] } } };
original.pages.world.blocks[0].data.socials = [{ label: "GitHub", url: "https://github.com/Peanora" }];
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=", "base64");
async function workspace(t) {
  const root = await mkdtemp(join(tmpdir(), "peanora-editor-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "src/data"), { recursive: true });
  await writeFile(join(root, "src/data/content.json"), JSON.stringify(original));
  return root;
}

test("content schema preserves existing content and validates each supported block", () => {
  assert.equal(validateContent(clone(existing)).version, 1);
  for (const type of Object.keys(blockTypes)) {
    const document = clone(original);
    document.pages.world.blocks.push(createBlock(type, `new-${type}`));
    assert.doesNotThrow(() => validateContent(document));
  }
  for (const change of [
    (d) => { d.pages.world.blocks[0].layout.width = 150; },
    (d) => { d.pages.world.blocks[0].layout.preset = "absolute"; },
    (d) => { d.pages.world.blocks[1].id = d.pages.world.blocks[0].id; },
    (d) => { d.pages.world.blocks[0].data.socials[0].url = "javascript:alert(1)"; },
    (d) => { d.pages.world.blocks[0].data.introduction = "x".repeat(50001); },
  ]) { const d = clone(original); change(d); assert.throws(() => validateContent(d)); }
  assert.throws(() => setField({}, "__proto__.polluted", true));
  assert.throws(() => setField({}, "missing.name", true));
  assert.equal(safeLink("javascript:alert(1)"), "");
  assert.equal(safeLink("//evil.example"), "");
  assert.equal(safeLink("/world#about"), "/world#about");
});

test("undo groups typing but keeps structural operations and redo recoverable", () => {
  const history = createHistory(3);
  history.record({ text: "a" }, "text", 1000);
  history.record({ text: "ab" }, "text", 1100);
  history.record({ text: "abc" }, "", 1200);
  assert.deepEqual(history.undo({ text: "new block" }), { text: "abc" });
  assert.deepEqual(history.undo({ text: "abc" }), { text: "a" });
  assert.deepEqual(history.redo({ text: "a" }), { text: "abc" });
  history.record({ text: "abc" });
  assert.equal(history.canRedo, false);
});

test("local gate rejects remote hosts, network clients, cross-origin requests and missing header", () => {
  const request = (headers = {}, address = "127.0.0.1") => ({ socket: { remoteAddress: address }, headers: { host: "127.0.0.1:5173", "x-peanora-editor": "1", ...headers } });
  assert.equal(editorRequestAllowed(request()), true);
  assert.equal(editorRequestAllowed(request({ origin: "http://127.0.0.1:5173" })), true);
  assert.equal(editorRequestAllowed(request({ origin: "https://evil.example" })), false);
  assert.equal(editorRequestAllowed(request({ host: "evil.example" })), false);
  assert.equal(editorRequestAllowed(request({ "x-peanora-editor": "" })), false);
  assert.equal(editorRequestAllowed(request({}, "192.168.1.2")), false);
});

test("atomic project save creates a backup and rejects stale or concurrent revisions", async (t) => {
  const root = await workspace(t), store = await createContentStore(root);
  const first = await store.read(), next = clone(first.document);
  next.pages.world.title = "本地编辑";
  const result = await store.save(next, first.revision);
  assert.equal((await store.read()).document.pages.world.title, "本地编辑");
  const files = await readdir(join(root, ".editor-backups"));
  assert.deepEqual(JSON.parse(await readFile(join(root, ".editor-backups", files[0]), "utf8")), first.document);
  await assert.rejects(store.save(first.document, first.revision), { status: 409 });
  const attempts = await Promise.allSettled([store.save(first.document, result.revision), store.save(next, result.revision)]);
  assert.equal(attempts.filter((attempt) => attempt.status === "fulfilled").length, 1);
  assert.equal((await readdir(join(root, "src/data"))).some((file) => file.endsWith(".tmp")), false);
});

test("uploads use generated safe filenames and reject executable image formats", async (t) => {
  const root = await workspace(t), store = await createContentStore(root);
  assert.equal(imageExtension(png), "png");
  assert.throws(() => imageExtension(Buffer.from('<svg onload="alert(1)"/>')), { status: 415 });
  const result = await store.upload(png);
  assert.match(result.src, /^\/content\/uploads\/[a-f0-9-]+\.png$/);
  assert.deepEqual(await readFile(join(root, "public", result.src)), png);
  assert.deepEqual(await store.images(), [result]);
});

test("dev HTTP API requires an owner session and actually persists JSON and image bytes", async (t) => {
  const root = await workspace(t);
  const server = await createServer({ configFile: false, root, logLevel: "silent", plugins: [localContentEditor()], server: { host: "127.0.0.1", port: 0 } });
  t.after(() => server.close());
  await server.listen();
  const address = `http://127.0.0.1:${server.httpServer.address().port}`;
  const route = `${address}/__editor/api/`;
  assert.equal((await fetch(route + "content")).status, 403);
  assert.equal((await fetch(route + "session", { headers: { "X-Peanora-Editor": "1", Origin: "https://evil.example" } })).status, 403);
  const session = await (await fetch(route + "session", { headers: { "X-Peanora-Editor": "1" } })).json();
  const headers = { "X-Peanora-Editor": "1", "X-Peanora-Token": session.token };
  const content = await (await fetch(route + "content", { headers })).json();
  content.document.pages.world.title = "HTTP 保存验证";
  const response = await fetch(route + "content", { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(content) });
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(await readFile(join(root, "src/data/content.json"))).pages.world.title, "HTTP 保存验证");
  assert.equal((await fetch(route + "content", { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(content) })).status, 409);
  assert.equal((await fetch(route + "images", { method: "POST", headers, body: png })).status, 201);
});
