import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createTodo } from '../lib/api';
import { useNavigate } from 'react-router-dom';

type FormValues = {
  title: string;
  notes: string;
};

export default function NewTodoPage() {
  const nav = useNavigate();
  const [serverErr, setServerErr] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { title: '', notes: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerErr(null);
    try {
      await createTodo({ title: values.title, notes: values.notes || undefined });
      nav('/');
    } catch (e: any) {
      setServerErr(e?.message ?? String(e));
    }
  });

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Criar item</h1>

      {serverErr && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-red-200">
          {serverErr}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div>
          <label className="text-sm text-zinc-300">Título</label>
          <input
            {...register('title', { required: 'Título é obrigatório', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
          />
          {errors.title && <p className="mt-1 text-sm text-red-200">{errors.title.message}</p>}
        </div>

        <div>
          <label className="text-sm text-zinc-300">Notas</label>
          <textarea
            {...register('notes')}
            rows={4}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
          />
        </div>

        <button
          disabled={isSubmitting}
          className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </section>
  );
}
