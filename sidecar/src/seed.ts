import { getDb } from './db';
import { todos } from './schema';
import { nanoid } from 'nanoid';

async function main() {
    const db = getDb();

    const result = await db.insert(todos).values([
        { id: nanoid(), title: 'Comprar mel', notes: 'no mercado', createdAt: Date.now() },
        { id: nanoid(), title: 'Treino', notes: 'agachamento 3x12', createdAt: Date.now() },
        { id: nanoid(), title: 'Estudar', notes: 'Drizzle migrations', createdAt: Date.now() },
    ]);

    console.log('Seed OK', result);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}); 