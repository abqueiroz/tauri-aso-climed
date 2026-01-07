"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_nanoid = require("nanoid");
var import_zod = require("zod");
var import_puppeteer = __toESM(require("puppeteer"), 1);

// src/db.ts
var import_node_os = __toESM(require("os"), 1);
var import_node_path = __toESM(require("path"), 1);
var import_node_fs = __toESM(require("fs"), 1);
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_better_sqlite32 = require("drizzle-orm/better-sqlite3");

// src/schema.ts
var import_sqlite_core = require("drizzle-orm/sqlite-core");
var todos = (0, import_sqlite_core.sqliteTable)("todos", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  title: (0, import_sqlite_core.text)("title").notNull(),
  notes: (0, import_sqlite_core.text)("notes"),
  createdAt: (0, import_sqlite_core.integer)("created_at", { mode: "number" }).notNull()
});

// src/db.ts
function getDb() {
  const dir = import_node_path.default.join(import_node_os.default.homedir(), ".tauri-hybrid-demo");
  import_node_fs.default.mkdirSync(dir, { recursive: true });
  const dbPath = import_node_path.default.join(dir, "app.sqlite");
  const sqlite = new import_better_sqlite3.default(dbPath);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  return (0, import_better_sqlite32.drizzle)(sqlite, { schema: { todos } });
}

// src/index.ts
var import_drizzle_orm = require("drizzle-orm");
var PORT = 14222;
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "1mb" }));
var allowedOrigins = /* @__PURE__ */ new Set([
  "http://localhost:1420",
  "http://127.0.0.1:1420",
  "tauri://localhost",
  "https://tauri.localhost"
]);
var corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.has(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600
};
app.use((0, import_cors.default)(corsOptions));
app.options("*", (0, import_cors.default)(corsOptions));
var db = getDb();
var CreateTodo = import_zod.z.object({
  title: import_zod.z.string().min(2),
  notes: import_zod.z.string().optional()
});
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/todos", async (req, res) => {
  try {
    const exportMode = String(req.query.export ?? "");
    const search = String(req.query.search ?? "").trim();
    const where = search ? (0, import_drizzle_orm.like)(todos.title, `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`) : void 0;
    const rows = await db.select().from(todos).where(where).orderBy(import_drizzle_orm.sql`${todos.createdAt} DESC`);
    if (exportMode === "pdf") {
      const html = renderHtml(rows);
      const pdfBase64 = await htmlToPdfBase64(html);
      return res.json({ pdfBase64 });
    }
    return res.json(rows);
  } catch (e) {
    return res.status(500).send(e?.message ?? String(e));
  }
});
app.post("/api/todos", async (req, res) => {
  try {
    const parsed = CreateTodo.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const item = {
      id: (0, import_nanoid.nanoid)(),
      title: parsed.data.title,
      notes: parsed.data.notes ?? null,
      createdAt: Date.now()
    };
    await db.insert(todos).values(item);
    return res.status(201).json(item);
  } catch (e) {
    return res.status(500).send(e?.message ?? String(e));
  }
});
app.delete("/api/todos", async (req, res) => {
  try {
    const id = String(req.query.id ?? "").trim();
    if (!id) return res.status(400).send('query param "id" \xE9 obrigat\xF3rio');
    await db.delete(todos).where(import_drizzle_orm.sql`${todos.id} = ${id}`);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).send(e?.message ?? String(e));
  }
});
app.listen(PORT, "127.0.0.1", () => {
  console.log(`[sidecar] listening on http://127.0.0.1:${PORT}`);
});
function renderHtml(rows) {
  const items = rows.map((r) => `
    <tr>
      <td>${escapeHtml(r.title)}</td>
      <td>${escapeHtml(r.notes ?? "")}</td>
      <td>${new Date(r.createdAt).toLocaleString()}</td>
    </tr>
  `).join("");
  return `<!doctype html>
  <html><head><meta charset="utf-8" />
  <style>
    body{font-family:Arial,sans-serif;padding:24px}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ddd;padding:8px;font-size:12px}
    th{background:#f4f4f4;text-align:left}
    .meta{color:#666;margin-bottom:16px;font-size:12px}
  </style>
  </head>
  <body>
    <h1>Relat\xF3rio de Itens</h1>
    <div class="meta">Gerado em ${(/* @__PURE__ */ new Date()).toLocaleString()}</div>
    <table>
      <thead><tr><th>T\xEDtulo</th><th>Notas</th><th>Criado em</th></tr></thead>
      <tbody>${items || '<tr><td colspan="3">Sem itens</td></tr>'}</tbody>
    </table>
  </body></html>`;
}
function escapeHtml(s) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
async function htmlToPdfBase64(html) {
  const browser = await import_puppeteer.default.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdf).toString("base64");
  } finally {
    await browser.close();
  }
}
//# sourceMappingURL=index.cjs.map