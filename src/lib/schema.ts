import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const columns = pgTable('columns', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  position: integer('position').notNull(),
});

export const cards = pgTable('cards', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  column_id: integer('column_id').references(() => columns.id),
  position: integer('position').notNull(),
  color: text('color'),
  action_type: text('action_type'),
  priority: integer('priority').default(4),
  due_date: timestamp('due_date'),
  recurrence: text('recurrence'),
  archived: integer('archived').default(0),
  reminded: integer('reminded').default(0),
  created_at: timestamp('created_at'),
});

export const memos = pgTable('memos', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  card_id: integer('card_id').references(() => cards.id),
  archived: integer('archived').default(0),
  created_at: timestamp('created_at'),
  updated_at: timestamp('updated_at'),
});

export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  memo_id: integer('memo_id').references(() => memos.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  type: text('type'),
  created_at: timestamp('created_at'),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  hashed_password: text('hashed_password').notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
});

export const cardsRelations = relations(cards, ({ one }) => ({
  column: one(columns, {
    fields: [cards.column_id],
    references: [columns.id],
  }),
}));

export const memosRelations = relations(memos, ({ one, many }) => ({
  card: one(cards, {
    fields: [memos.card_id],
    references: [cards.id],
  }),
  attachments: many(attachments),
}));

export const columnsRelations = relations(columns, ({ many }) => ({
  cards: many(cards),
}));
