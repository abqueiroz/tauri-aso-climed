import { useState } from 'react';
import { exportPdf } from '../lib/api';

function b64ToBlob(base64: string, mime: string) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
}

export default function ReportPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setErr(null);
    try {
      const { pdfBase64 } = await exportPdf();
      const blob = b64ToBlob(pdfBase64, 'application/pdf');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Relatório (Puppeteer)</h1>

      <p className="text-zinc-300">
        Gera um PDF com a lista atual de itens usando Puppeteer no sidecar.
      </p>

      {err && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-red-200">
          {err}
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={loading}
        className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-60"
      >
        {loading ? 'Gerando...' : 'Gerar PDF'}
      </button>
    </section>
  );
}
