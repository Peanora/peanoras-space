import { randomBytes, randomUUID, createHash, timingSafeEqual } from "node:crypto";
import { readFile, writeFile, mkdir, rename, readdir, stat, realpath, lstat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { validateContent } from "../src/content/model.js";

const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
const loopback = (value) => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(value);
export function editorRequestAllowed(request) {
  if (!loopback(request.socket?.remoteAddress) || request.headers["x-peanora-editor"] !== "1") return false;
  try {
    const host = request.headers.host;
    const url = new URL(`http://${host}`);
    if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) return false;
    return !request.headers.origin || request.headers.origin === url.origin;
  } catch { return false; }
}
async function bytes(request, limit) {
  let length = 0;
  const chunks = [];
  for await (const chunk of request) {
    length += chunk.length;
    if (length > limit) throw Object.assign(new Error("上传内容过大"), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
export function imageExtension(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "png";
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return "jpg";
  if (["GIF87a", "GIF89a"].includes(buffer.subarray(0,6).toString())) return "gif";
  if (buffer.subarray(0,4).toString() === "RIFF" && buffer.subarray(8,12).toString() === "WEBP") return "webp";
  throw Object.assign(new Error("仅支持 PNG、JPEG、WebP、GIF 图片，不接受 SVG 或其他文件"), { status: 415 });
}
export async function createContentStore(root) {
  const file = resolve(root, "src/data/content.json");
  const backups = resolve(root, ".editor-backups");
  const uploads = resolve(root, "public/content/uploads");
  let queue = Promise.resolve();
  const read = async () => {
    const raw = await readFile(file);
    return { document: JSON.parse(raw.toString("utf8")), revision: digest(raw) };
  };
  async function safeDirectory(path) {
    await mkdir(path, { recursive: true });
    const actualRoot = await realpath(root);
    const actual = await realpath(path);
    if (!actual.startsWith(actualRoot + (process.platform === "win32" ? "\\" : "/"))) throw new Error("资源目录必须位于当前项目中");
  }
  return {
    read,
    save(document, revision) {
      const operation = queue.then(async () => {
        validateContent(document);
        const current = await read();
        if (revision !== current.revision) throw Object.assign(new Error("内容文件已被其他窗口或程序修改。草稿仍保留，请导出草稿后重新载入。"), { status: 409 });
        if ((await lstat(file)).isSymbolicLink()) throw new Error("不允许写入符号链接");
        await safeDirectory(backups);
        const id = `${Date.now()}-${randomUUID()}`;
        await writeFile(join(backups, `${id}.json`), await readFile(file), { flag: "wx" });
        const raw = JSON.stringify(document, null, 2) + "\n";
        const temporary = `${file}.${id}.tmp`;
        await writeFile(temporary, raw, { flag: "wx" });
        await rename(temporary, file);
        return { document, revision: digest(raw) };
      });
      queue = operation.catch(() => {});
      return operation;
    },
    async upload(buffer) {
      const extension = imageExtension(buffer);
      await safeDirectory(uploads);
      const name = `${randomUUID()}.${extension}`;
      await writeFile(join(uploads, name), buffer, { flag: "wx" });
      return { src: `/content/uploads/${name}`, bytes: buffer.length };
    },
    async images() {
      try {
        const names = (await readdir(uploads)).filter((name) => /^[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(name));
        return await Promise.all(names.map(async (name) => ({ src: `/content/uploads/${name}`, bytes: (await stat(join(uploads, name))).size })));
      } catch (error) { if (error.code === "ENOENT") return []; throw error; }
    },
  };
}

export function localContentEditor() {
  return {
    name: "peanora-local-content-editor",
    apply: "serve",
    async configureServer(server) {
      if (![undefined, "127.0.0.1", "localhost", "::1"].includes(server.config.server.host)) {
        throw new Error("本地编辑器只允许监听本机，请使用 npm run dev，不要使用 --host 0.0.0.0 或公网隧道。");
      }
      const store = await createContentStore(server.config.root);
      const token = randomBytes(32).toString("hex");
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url, "http://127.0.0.1");
        if (!url.pathname.startsWith("/__editor/api/")) return next();
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        const send = (status, data) => { response.statusCode = status; response.end(JSON.stringify(data)); };
        if (!editorRequestAllowed(request)) return send(403, { error: "编辑接口仅允许当前本地页面访问" });
        if (url.pathname === "/__editor/api/session" && request.method === "GET") return send(200, { token });
        const supplied = Buffer.from(String(request.headers["x-peanora-token"] || ""));
        const expected = Buffer.from(token);
        if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return send(403, { error: "编辑会话失效，请重新载入编辑器" });
        try {
          if (url.pathname === "/__editor/api/content") {
            if (request.method === "GET") return send(200, await store.read());
            if (request.method === "PUT") {
              if (!String(request.headers["content-type"]).startsWith("application/json")) return send(415, { error: "需要 JSON 内容" });
              const body = JSON.parse((await bytes(request, 2 * 1024 * 1024)).toString("utf8"));
              return send(200, await store.save(body.document, body.revision));
            }
          }
          if (url.pathname === "/__editor/api/images") {
            if (request.method === "GET") return send(200, { images: await store.images() });
            if (request.method === "POST") return send(201, await store.upload(await bytes(request, 12 * 1024 * 1024)));
          }
          return send(404, { error: "编辑接口不存在" });
        } catch (error) { return send(error.status || 400, { error: error.message || "保存失败，草稿仍保留" }); }
      });
    },
  };
}
