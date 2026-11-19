import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

const SECRET = process.env.SESSION_SECRET || "warehub-insecure-dev-secret-change-me";
const COOKIE = "wh_session";

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(pw, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return test.length === expected.length && timingSafeEqual(test, expected);
}

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 32);
}

export function issueToken(userId: number): string {
  return `${userId}.${sign(String(userId))}`;
}

export function readToken(token: string | undefined): number | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(id);
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return /^\d+$/.test(id) ? Number(id) : null;
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const id = readToken(store.get(COOKIE)?.value);
  if (!id) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const u = rows[0];
  if (!u || u.blocked) return null;
  return u;
}

export async function setSession(userId: number): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, issueToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Public-safe shape: never leaks password hashes. */
export function publicUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    mobile: u.mobile,
    role: u.role,
    provider: u.provider,
    city: u.city,
    joinedAt: u.joinedAt.toISOString(),
  };
}

export function deviceSeed(): string {
  return createHash("sha256").update(String(Date.now())).digest("hex").slice(0, 12);
}
