import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { deleteTodo, listTodos, type Todo } from '../lib/api';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? ''; // searchParams na URL (UI)
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const debouncedQ = useMemo(() => q, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    listTodos(debouncedQ)
      .then((data) => {
        if (!cancelled) setTodos(data);
      })
      .catch((e) => !cancelled && setErr(e?.message ?? String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  async function onDelete(id: string) {
    setErr(null);
    const backup = todos;
    setTodos((t) => t.filter((x) => x.id !== id));
    try {
      await deleteTodo(id);
    } catch (e: any) {
      setTodos(backup);
      setErr(e?.message ?? String(e));
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-sm text-zinc-300">Buscar (via searchParams: ?q=)</label>
          <input
            value={q}
            onChange={(e) => {
              const val = e.target.value;
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (val.trim()) next.set('q', val);
                else next.delete('q');
                return next;
              });
            }}
            placeholder="ex: mel"
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600"
          />
        </div>
        <div className="text-sm text-zinc-400">
          {loading ? 'carregando...' : `${todos.length} itens`}
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-red-200">
          {err}
        </div>
      )}

      <ul className="space-y-2">
        {todos.map((t) => (
          <li key={t.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{t.title}</div>
                {t.notes && <div className="text-sm text-zinc-300 mt-1">{t.notes}</div>}
                <div className="text-xs text-zinc-500 mt-2">
                  {new Date(t.createdAt).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => onDelete(t.id)}
                className="shrink-0 rounded-xl border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!loading && todos.length === 0 && (
        <div className="text-zinc-500">Nenhum item encontrado.</div>
      )}
    </section>
  );
}
