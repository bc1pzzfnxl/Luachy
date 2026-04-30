import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const connectionString = (typeof process !== 'undefined' ? process.env.DATABASE_URL : '') || 'postgres://postgres:postgrespassword@localhost:5432/luachy';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

export const initDb = async () => {
  try {
    // Sync Columns
    const cols = await db.select().from(schema.columns);
    if (cols.length === 0) {
      await db.insert(schema.columns).values([
        { name: 'To Do', position: 0 },
        { name: 'In Progress', position: 1 },
        { name: 'Done', position: 2 }
      ]);
    }

    // Sync Admin User from .env
    const adminUser = process.env.LUACHY_USER || 'admin';
    const adminPass = process.env.LUACHY_PASSWORD || 'password123';
    
    // Check by fixed ID 'owner' instead of username to allow username updates
    const existing = await db.select().from(schema.users).where(eq(schema.users.id, 'owner')).limit(1);
    const hashed = await Bun.password.hash(adminPass);

    if (existing.length === 0) {
      // Create owner if not exists (check username uniqueness just in case)
      const nameCheck = await db.select().from(schema.users).where(eq(schema.users.username, adminUser)).limit(1);
      if (nameCheck.length === 0) {
        await db.insert(schema.users).values({
          id: 'owner',
          username: adminUser,
          hashed_password: hashed
        });
        console.log(`[AUTH] Admin user '${adminUser}' created from .env`);
      }
    } else {
      // Sync both username and password from .env to the 'owner' record
      await db.update(schema.users).set({ 
        username: adminUser,
        hashed_password: hashed 
      }).where(eq(schema.users.id, 'owner'));
      console.log(`[AUTH] Admin user '${adminUser}' synchronized`);
    }
  } catch (e: any) {
    console.error("[DB ERROR] Initialization failed:", e.message);
  }
};
