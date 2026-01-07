import express from 'express';
import cors, { CorsOptions } from 'cors';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import puppeteer from 'puppeteer';

import { getDb } from './db';
import { todos } from './schema';
import { like, sql } from 'drizzle-orm';

const PORT = 14222;
const app = express();

app.use(express.json({ limit: '1mb' }));

// CORS restrito
const allowedOrigins = new Set([
  'http://localhost:1420',
  'http://127.0.0.1:1420',
  'tauri://localhost',
  'https://tauri.localhost',
]);

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // chamadas internas (reqwest do Rust, Postman)
    if (allowedOrigins.has(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const db = getDb();

const CreateTodo = z.object({
  title: z.string().min(2),
  notes: z.string().optional(),
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/todos', async (req, res) => {
  try {
    const exportMode = String(req.query.export ?? '');
    const search = String(req.query.search ?? '').trim();

    const where = search
      ? like(todos.title, `%${search.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`)
      : undefined;

    const rows = await db.select().from(todos).where(where).orderBy(sql`${todos.createdAt} DESC`);

    if (exportMode === 'pdf') {
      const html = renderHtml(rows);
      const pdfBase64 = await htmlToPdfBase64(html);
      return res.json({ pdfBase64 });
    }

    return res.json(rows);
  } catch (e: any) {
    return res.status(500).send(e?.message ?? String(e));
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const parsed = CreateTodo.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    const item = {
      id: nanoid(),
      title: parsed.data.title,
      notes: parsed.data.notes ?? null,
      createdAt: Date.now(),
    };

    await db.insert(todos).values(item);
    return res.status(201).json(item);
  } catch (e: any) {
    return res.status(500).send(e?.message ?? String(e));
  }
});

app.delete('/api/todos', async (req, res) => {
  try {
    const id = String(req.query.id ?? '').trim();
    if (!id) return res.status(400).send('query param "id" é obrigatório');

    await db.delete(todos).where(sql`${todos.id} = ${id}`);
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).send(e?.message ?? String(e));
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[sidecar] listening on http://127.0.0.1:${PORT}`);
});

function renderHtml(rows: Array<{ id: string; title: string; notes: string | null; createdAt: number }>) {
  const items = rows.map(r => `
    <tr>
      <td>${escapeHtml(r.title)}</td>
      <td>${escapeHtml(r.notes ?? '')}</td>
      <td>${new Date(r.createdAt).toLocaleString()}</td>
    </tr>
  `).join('');

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
    <h1>Relatório de Itens</h1>
    <div class="meta">Gerado em ${new Date().toLocaleString()}</div>
    <table>
      <thead><tr><th>Título</th><th>Notas</th><th>Criado em</th></tr></thead>
      <tbody>${items || '<tr><td colspan="3">Sem itens</td></tr>'}</tbody>
    </table>
  </body></html>`;
}

function escapeHtml(s: string) {
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
}

async function htmlToPdfBase64(html: string) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    return Buffer.from(pdf).toString('base64');
  } finally {
    await browser.close();
  }
}
