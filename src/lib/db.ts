import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = (typeof process !== 'undefined' ? process.env.DATABASE_URL : '') || 'postgres://postgres:postgrespassword@localhost:5432/luachy';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

export const initDb = async () => {
  try {
    const cols = await db.select().from(schema.columns);
    if (cols.length === 0) {
      await db.insert(schema.columns).values([
        { name: 'To Do', position: 0 },
        { name: 'In Progress', position: 1 },
        { name: 'Done', position: 2 }
      ]);
    }
  } catch (e) {
    console.error("Database initialization check failed:", e);
  }
};
