import { API_URL } from '../env';

export type Todo = {
  id: string;
  title: string;
  notes: string | null;
  createdAt: number;
};

export async function listTodos(search: string): Promise<Todo[]> {
  const url = new URL(`${API_URL}/api/todos`);
  if (search.trim()) url.searchParams.set('search', search.trim());
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createTodo(input: { title: string; notes?: string }): Promise<Todo> {
  const res = await fetch(`${API_URL}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteTodo(id: string): Promise<{ ok: true }> {
  const url = new URL(`${API_URL}/api/todos`);
  url.searchParams.set('id', id); // query param explícito
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function exportPdf(): Promise<{ pdfBase64: string }> {
  const url = new URL(`${API_URL}/api/todos`);
  url.searchParams.set('export', 'pdf');
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
