import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  username: varchar("username", { length: 20 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  webhook: text("webhook"),
  avatarUrl: text("avatarUrl"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const channels = mysqlTable("channels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 40 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const cards = mysqlTable("cards", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId").notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description").notNull(),
  type: mysqlEnum("type", ["prompt", "link"]).notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Channel = typeof channels.$inferSelect;
export type Card = typeof cards.$inferSelect;
