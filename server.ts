import { db, initDb } from './src/lib/db';
import * as schema from './src/lib/schema';
import { eq, desc, asc, and, like, sql } from 'drizzle-orm';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { lucia } from "./src/lib/auth";
import { nanoid } from "nanoid";

console.log("\n-----------------------------------------");
console.log("LUACHY MINIMALIST SERVER STARTING...");
console.log("Database: PostgreSQL (Docker)");
console.log("Port: 3000");
console.log("-----------------------------------------\n");

const PORT = 3000;

try {
  await initDb();
  console.log("Database initialized successfully.");
} catch (err) {
  console.error("Failed to initialize database:", err);
}

const ASSETS_DIR = join(process.cwd(), "assets");
mkdirSync(ASSETS_DIR, { recursive: true });

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "*";
    
    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    };

    if (req.method === "OPTIONS") return new Response(null, { headers });

    // --- AUTH UTILS ---
    let session = null;
    let user = null;
    try {
      const sessionId = lucia.readSessionCookie(req.headers.get("Cookie") ?? "");
      if (sessionId) {
        const result = await lucia.validateSession(sessionId);
        session = result.session;
        user = result.user;
      }
    } catch (e: any) {
      console.error("[AUTH ERROR] Session validation failed:", e.message);
    }

    // --- STATIC ASSETS (Protected if needed, keeping public for now) ---
    if (url.pathname.startsWith("/assets/")) {
      const filename = url.pathname.replace("/assets/", "");
      const file = Bun.file(join(ASSETS_DIR, filename));
      if (await file.exists()) return new Response(file);
      return new Response("Not Found", { status: 404 });
    }

    // --- AUTH ROUTES ---
    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      try {
        const { username, password } = await req.json();
        const users_table = schema.users;
        const existingUser = await db.select().from(users_table).where(eq(users_table.username, username)).limit(1);
        
        if (!existingUser[0]) {
          return Response.json({ error: "Invalid credentials" }, { status: 400, headers });
        }

        const validPassword = await Bun.password.verify(password, existingUser[0].hashed_password);
        if (!validPassword) {
          return Response.json({ error: "Invalid credentials" }, { status: 400, headers });
        }

        const session = await lucia.createSession(existingUser[0].id, {});
        const cookie = lucia.createSessionCookie(session.id);
        
        return new Response(JSON.stringify({ success: true, user: { username: existingUser[0].username } }), {
          headers: {
            ...headers,
            "Set-Cookie": cookie.serialize()
          }
        });
      } catch (err: any) { 
        console.error("[LOGIN ERROR] Detail:", err);
        return Response.json({ error: `Database Error: ${err.message}` }, { status: 400, headers }); 
      }
    }

    if (url.pathname === "/api/auth/logout" && req.method === "POST") {
      if (!session) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
      await lucia.invalidateSession(session.id);
      const cookie = lucia.createBlankSessionCookie();
      return new Response(JSON.stringify({ success: true }), {
        headers: {
          ...headers,
          "Set-Cookie": cookie.serialize()
        }
      });
    }

    if (url.pathname === "/api/auth/me" && req.method === "GET") {
      if (!user) return Response.json({ user: null }, { headers });
      return Response.json({ user: { username: user.username } }, { headers });
    }

    // --- PROTECTED ROUTES MIDDLEWARE ---
    if (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/auth/")) {
      if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers });
      }
    }

    // --- UPLOAD ---
    if (url.pathname === "/api/upload" && req.method === "POST") {
      try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) throw new Error("No file");
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        await Bun.write(join(ASSETS_DIR, filename), file);
        return Response.json({ success: true, filename }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    // --- MEMOS ---
    if (url.pathname === "/api/memos" && req.method === "GET") {
      try {
        const allMemos = await db.select().from(schema.memos).where(eq(schema.memos.archived, 0)).orderBy(desc(schema.memos.created_at));
        const allAttachments = await db.select().from(schema.attachments);
        const rows = allMemos.map(m => {
          const imgs = allAttachments.filter(a => a.memo_id === m.id).map(a => a.filename);
          return { 
            ...m, 
            images: imgs,
            created_at: m.created_at ? new Date(m.created_at).toISOString() : null 
          };
        });
        return Response.json(rows, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 500, headers }); }
    }

    if (url.pathname === "/api/memos/search" && req.method === "GET") {
      try {
        const query = url.searchParams.get("q") || "";
        const searchMemos = await db.select().from(schema.memos)
          .where(and(like(schema.memos.content, `%${query}%`), eq(schema.memos.archived, 0)))
          .orderBy(desc(schema.memos.created_at));
        const allAttachments = await db.select().from(schema.attachments);
        const rows = searchMemos.map(m => {
          const imgs = allAttachments.filter(a => a.memo_id === m.id).map(a => a.filename);
          return { 
            ...m, 
            images: imgs,
            created_at: m.created_at ? new Date(m.created_at).toISOString() : null 
          };
        });
        return Response.json(rows, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 500, headers }); }
    }

    if (url.pathname === "/api/memos" && req.method === "POST") {
      try {
        const { content, images } = await req.json();
        const inserted = await db.insert(schema.memos).values({ 
          content,
          created_at: new Date(),
          updated_at: new Date()
        }).returning({ id: schema.memos.id });
        const memoId = inserted[0].id;
        if (images && Array.isArray(images)) {
          for (const img of images) {
             await db.insert(schema.attachments).values({ memo_id: memoId, filename: img, created_at: new Date() });
          }
        }
        return Response.json({ success: true, id: memoId }, { headers });
      } catch (err: any) { 
        console.error("Create Memo Error:", err);
        return Response.json({ error: err.message }, { status: 400, headers }); 
      }
    }

    if (url.pathname.startsWith("/api/memos/") && req.method === "PATCH") {
      try {
        const id = parseInt(url.pathname.split("/")[3]);
        const { content } = await req.json();
        await db.update(schema.memos).set({ content, updated_at: new Date() }).where(eq(schema.memos.id, id));
        return Response.json({ success: true }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    if (url.pathname.startsWith("/api/memos/") && req.method === "DELETE") {
      try {
        const id = parseInt(url.pathname.split("/")[3]);
        await db.delete(schema.memos).where(eq(schema.memos.id, id));
        return Response.json({ success: true }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    if (url.pathname.startsWith("/api/memos/") && url.pathname.endsWith("/archive") && req.method === "POST") {
      try {
        const id = parseInt(url.pathname.split("/")[3]);
        await db.update(schema.memos).set({ archived: 1 }).where(eq(schema.memos.id, id));
        return Response.json({ success: true }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    if (url.pathname.startsWith("/api/memos/") && url.pathname.endsWith("/unarchive") && req.method === "POST") {
      try {
        const id = parseInt(url.pathname.split("/")[3]);
        await db.update(schema.memos).set({ archived: 0 }).where(eq(schema.memos.id, id));
        return Response.json({ success: true }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    // --- KANBAN ---
    if (url.pathname === "/api/columns" && req.method === "GET") {
      try {
        const res = await db.select().from(schema.columns).orderBy(asc(schema.columns.position));
        return Response.json(res, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 500, headers }); }
    }

    if (url.pathname === "/api/cards" && req.method === "GET") {
      try {
        const res = await db.select().from(schema.cards).where(eq(schema.cards.archived, 0)).orderBy(asc(schema.cards.position));
        return Response.json(res, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 500, headers }); }
    }

    if (url.pathname === "/api/cards" && req.method === "POST") {
      try {
        const { title, columnId, color, actionType, priority, dueDate, description, recurrence } = await req.json();
        await db.insert(schema.cards).values({
          title: title ?? null,
          column_id: columnId ?? null,
          position: 0,
          color: color ?? null,
          action_type: actionType ?? null,
          priority: priority ?? 4,
          due_date: dueDate ? new Date(dueDate) : null,
          description: description ?? null,
          recurrence: recurrence ?? null,
          created_at: new Date()
        });
        return Response.json({ success: true }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    if (url.pathname.startsWith("/api/cards/") && req.method === "PATCH" && !url.pathname.endsWith("/move")) {
      try {
        const id = parseInt(url.pathname.split("/")[3]);
        const { title, description, priority, due_date, recurrence } = await req.json();
        await db.update(schema.cards).set({
          title: title ?? null,
          description: description ?? null,
          priority: priority ?? 4,
          due_date: due_date ? new Date(due_date) : null,
          recurrence: recurrence ?? null
        }).where(eq(schema.cards.id, id));
        return Response.json({ success: true }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    if (url.pathname === "/api/cards/move" && req.method === "PATCH") {
      try {
        const { cardId, columnId, due_date } = await req.json();
        const updateData: any = { column_id: columnId };
        if (due_date) updateData.due_date = new Date(due_date);
        await db.update(schema.cards).set(updateData).where(eq(schema.cards.id, cardId));
        return Response.json({ success: true }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    if (url.pathname.startsWith("/api/cards/") && req.method === "DELETE") {
      try {
        const id = parseInt(url.pathname.split("/")[3]);
        await db.delete(schema.cards).where(eq(schema.cards.id, id));
        return Response.json({ success: true }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    if (url.pathname.startsWith("/api/cards/") && url.pathname.endsWith("/archive") && req.method === "POST") {
      try {
        const id = parseInt(url.pathname.split("/")[3]);
        await db.update(schema.cards).set({ archived: 1 }).where(eq(schema.cards.id, id));
        return Response.json({ success: true }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    if (url.pathname.startsWith("/api/cards/") && url.pathname.endsWith("/unarchive") && req.method === "POST") {
      try {
        const id = parseInt(url.pathname.split("/")[3]);
        await db.update(schema.cards).set({ archived: 0, column_id: 1 }).where(eq(schema.cards.id, id));
        return Response.json({ success: true }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    // --- ARCHIVES ---
    if (url.pathname === "/api/archives/memos" && req.method === "GET") {
      try {
        const res = await db.select().from(schema.memos).where(eq(schema.memos.archived, 1)).orderBy(desc(schema.memos.created_at));
        return Response.json(res, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 500, headers }); }
    }
    if (url.pathname === "/api/archives/cards" && req.method === "GET") {
      try {
        const res = await db.select().from(schema.cards).where(eq(schema.cards.archived, 1)).orderBy(desc(schema.cards.created_at));
        return Response.json(res, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 500, headers }); }
    }

    if (url.pathname === "/api/stats/memos-per-day" && req.method === "GET") {
      try {
        const res = await db.execute(sql`
          SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count 
          FROM memos 
          GROUP BY date 
          ORDER BY date DESC
        `);
        const data = (res as any).rows || res;
        return Response.json(data, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 500, headers }); }
    }

    if (url.pathname === "/api/stats/kanban" && req.method === "GET") {
      try {
        const totalRes = await db.select({ count: sql`count(*)` }).from(schema.cards).where(eq(schema.cards.archived, 0));
        const total = Number((totalRes[0] as any).count || 0);
        const doneColRes = await db.select({ id: schema.columns.id }).from(schema.columns).where(eq(schema.columns.name, 'Done'));
        const doneId = doneColRes[0]?.id;
        const doneRes = await db.select({ count: sql`count(*)` }).from(schema.cards).where(and(eq(schema.cards.column_id, doneId), eq(schema.cards.archived, 0)));
        const completed = Number((doneRes[0] as any).count || 0);
        
        const prioRes = await db.execute(sql`SELECT priority, COUNT(*) as c FROM cards WHERE archived = 0 GROUP BY priority`);
        const priorities = (prioRes as any).rows || prioRes;

        const actRes = await db.execute(sql`SELECT action_type, COUNT(*) as c FROM cards WHERE archived = 0 GROUP BY action_type`);
        const actions = (actRes as any).rows || actRes;
        
        const histRes = await db.execute(sql`
          SELECT TO_CHAR(due_date, 'YYYY-MM-DD') as date, COUNT(*) as count 
          FROM cards 
          WHERE column_id = ${doneId} AND archived = 0 
          AND due_date >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY date
          ORDER BY date ASC
        `);
        const history = (histRes as any).rows || histRes;

        return Response.json({ total, completed, priorities, actions, history }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 500, headers }); }
    }

    if (url.pathname === "/api/cards/cleanup" && req.method === "POST") {
      try {
        const doneColRes = await db.select({ id: schema.columns.id }).from(schema.columns).where(eq(schema.columns.name, 'Done'));
        const doneId = doneColRes[0]?.id;
        const res = await db.execute(sql`
          UPDATE cards 
          SET archived = 1 
          WHERE column_id = ${doneId}
          AND archived = 0
          AND (
            due_date < CURRENT_DATE - INTERVAL '7 days'
            OR (due_date IS NULL AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days')
          )
        `);
        return Response.json({ success: true, count: (res as any).count || 0 }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    // --- EXPORT/IMPORT ---
    if (url.pathname === "/api/export" && req.method === "GET") {
      try {
        const memos = await db.select().from(schema.memos);
        const cards = await db.select().from(schema.cards);
        const columns = await db.select().from(schema.columns);
        return Response.json({ memos, cards, columns }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 500, headers }); }
    }

    if (url.pathname === "/api/import" && req.method === "POST") {
      try {
        const { memos, cards, columns } = await req.json();
        await db.delete(schema.attachments);
        await db.delete(schema.memos);
        await db.delete(schema.cards);
        await db.delete(schema.columns);
        if (columns && columns.length > 0) {
          for(const c of columns) await db.insert(schema.columns).values(c);
        }
        if (cards && cards.length > 0) {
          for(const c of cards) {
             c.due_date = c.due_date ? new Date(c.due_date) : null;
             c.created_at = c.created_at ? new Date(c.created_at) : null;
             await db.insert(schema.cards).values(c);
          }
        }
        if (memos && memos.length > 0) {
          for(const m of memos) {
             m.created_at = m.created_at ? new Date(m.created_at) : null;
             m.updated_at = m.updated_at ? new Date(m.updated_at) : null;
             await db.insert(schema.memos).values(m);
          }
        }
        return Response.json({ success: true }, { headers });
      } catch (err: any) { return Response.json({ error: err.message }, { status: 400, headers }); }
    }

    return new Response("Not Found", { status: 404, headers });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
