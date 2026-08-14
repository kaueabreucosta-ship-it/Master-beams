import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, cards, channels, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const fields = ["name", "email", "loginMethod", "username", "passwordHash", "webhook", "avatarUrl"] as const;
  for (const field of fields) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByUsername(username: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0];
}

export async function createLocalUser(input: { username: string; passwordHash: string; webhook: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [created] = await db.insert(users).values({
    openId: `local:${input.username}`,
    name: input.username,
    username: input.username,
    passwordHash: input.passwordHash,
    webhook: input.webhook,
    loginMethod: "username",
  }).$returningId();
  const user = await getUserByUsername(input.username);
  if (!user) throw new Error("Failed to create user");
  await db.insert(channels).values({ userId: user.id, name: "AVISOS" });
  return user;
}

export async function listChannels(userId: number) {
  const db = await getDb(); if (!db) return [];
  const existing = await db.select().from(channels).where(eq(channels.userId, userId)).orderBy(channels.createdAt);
  if (!existing.some(channel => channel.name.toUpperCase() === "AVISOS")) {
    await db.insert(channels).values({ userId, name: "AVISOS" });
  }
  return db.select().from(channels).where(eq(channels.userId, userId)).orderBy(channels.createdAt);
}

export async function createChannel(userId: number, name: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(channels).values({ userId, name });
  const rows = await db.select().from(channels).where(and(eq(channels.userId, userId), eq(channels.name, name))).orderBy(desc(channels.id)).limit(1);
  return rows[0];
}

export async function deleteChannel(userId: number, channelId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const owned = await db.select().from(channels).where(and(eq(channels.id, channelId), eq(channels.userId, userId))).limit(1);
  if (!owned[0]) throw new Error("Channel not found");
  await db.delete(cards).where(eq(cards.channelId, channelId));
  await db.delete(channels).where(eq(channels.id, channelId));
  return { success: true } as const;
}

export async function listCards(userId: number, channelId: number) {
  const db = await getDb(); if (!db) return [];
  const owned = await db.select({ id: channels.id }).from(channels).where(and(eq(channels.id, channelId), eq(channels.userId, userId))).limit(1);
  if (!owned[0]) throw new Error("Channel not found");
  return db.select().from(cards).where(eq(cards.channelId, channelId)).orderBy(desc(cards.createdAt));
}

export async function createCard(userId: number, input: { channelId: number; title: string; description: string; type: "prompt" | "link"; content: string; imageUrl?: string; imageKey?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const owned = await db.select({ id: channels.id }).from(channels).where(and(eq(channels.id, input.channelId), eq(channels.userId, userId))).limit(1);
  if (!owned[0]) throw new Error("Channel not found");
  await db.insert(cards).values(input);
  const rows = await db.select().from(cards).where(eq(cards.channelId, input.channelId)).orderBy(desc(cards.id)).limit(1);
  return rows[0];
}

export async function deleteCard(userId: number, cardId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const owned = await db.select({ id: cards.id }).from(cards).innerJoin(channels, eq(cards.channelId, channels.id)).where(and(eq(cards.id, cardId), eq(channels.userId, userId))).limit(1);
  if (!owned[0]) throw new Error("Card not found");
  await db.delete(cards).where(eq(cards.id, cardId));
  return { success: true } as const;
}

export async function updateProfile(userId: number, input: { username?: string; webhook?: string; avatarUrl?: string | null; passwordHash?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(users).set(input).where(eq(users.id, userId));
  return db.select().from(users).where(eq(users.id, userId)).limit(1).then(rows => rows[0]);
}

export async function updateCard(userId: number, input: { id: number; channelId: number; title: string; description: string; type: "prompt" | "link"; content: string; imageUrl?: string; imageKey?: string }) {
  const database = await getDb(); if (!database) throw new Error("Database unavailable");
  const owned = await database.select({ id: cards.id }).from(cards).innerJoin(channels, eq(cards.channelId, channels.id)).where(and(eq(cards.id, input.id), eq(channels.userId, userId))).limit(1);
  if (!owned[0]) throw new Error("Card not found");
  await database.update(cards).set({ title: input.title, description: input.description, type: input.type, content: input.content, imageUrl: input.imageUrl, imageKey: input.imageKey }).where(eq(cards.id, input.id));
  const rows = await database.select().from(cards).where(eq(cards.id, input.id)).limit(1);
  return rows[0];
}

export async function updateChannel(userId: number, input: { id: number; name: string }) {
  const database = await getDb(); if (!database) throw new Error("Banco de dados indisponível no momento.");
  const owned = await database.select({ id: channels.id }).from(channels).where(and(eq(channels.id, input.id), eq(channels.userId, userId))).limit(1);
  if (!owned[0]) throw new Error("Canal não encontrado ou sem permissão para editá-lo.");
  await database.update(channels).set({ name: input.name }).where(eq(channels.id, input.id));
  const rows = await database.select().from(channels).where(eq(channels.id, input.id)).limit(1);
  return rows[0];
}
