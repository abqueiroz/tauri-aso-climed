import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});
