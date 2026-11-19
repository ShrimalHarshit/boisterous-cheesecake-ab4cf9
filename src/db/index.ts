import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Resolved lazily so that importing this module never throws. Next.js imports
// every route (including layouts) while collecting page config at build time,
// when no database URL may be configured. The error surfaces only when a query
// is actually attempted at request time.
function resolveDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ??
    process.env.NETLIFY_DATABASE_URL ??
    process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required (set DATABASE_URL, or deploy with Netlify Database, which provides NETLIFY_DATABASE_URL automatically)",
    );
  }
  return url;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: NodePgDatabase;
};

function getPool(): Pool {
  let pool = globalForDb.__arenaNextJsPostgresqlPool;
  if (!pool) {
    pool = new Pool({ connectionString: resolveDatabaseUrl() });
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }
  return pool;
}

function getDb(): NodePgDatabase {
  let db = globalForDb.__arenaNextJsPostgresqlDb;
  if (!db) {
    db = drizzle(getPool());
    globalForDb.__arenaNextJsPostgresqlDb = db;
  }
  return db;
}

function lazy<T extends object>(getTarget: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const target = getTarget();
      const value = Reflect.get(target, prop, target) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

// Lazily-initialized clients: safe to import at build time.
export const pool: Pool = lazy(getPool);
export const db: NodePgDatabase = lazy(getDb);
