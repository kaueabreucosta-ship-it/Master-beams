import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { sendWebhookSafely, maskWebhook } from "./webhookService";
import * as db from "./db";

const scrypt = promisify(nodeScrypt);
const usernameSchema = z.string().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username inválido");
const webhookSchema = z.string().trim().url("Webhook inválido").max(1000);
const linkSchema = z.string().trim().url("URL inválida").refine(value => ["http:", "https:"].includes(new URL(value).protocol), "Somente URLs HTTP(S) são permitidas");

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function publicUser(user: NonNullable<Awaited<ReturnType<typeof db.getUserByUsername>>>) {
  return { id: user.id, username: user.username ?? user.name ?? "", name: user.name ?? user.username ?? "", email: user.email, avatarUrl: user.avatarUrl, status: "VAULT ONLINE" };
}

function setSession(res: any, token: string, req: any) {
  res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: 1000 * 60 * 60 * 24 * 365 });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ? publicUser(opts.ctx.user) : null),
    register: publicProcedure.input(z.object({ username: usernameSchema, password: z.string().min(6).max(128), confirmPassword: z.string(), webhook: webhookSchema })).mutation(async ({ input, ctx }) => {
      if (input.password !== input.confirmPassword) throw new Error("As senhas não coincidem");
      if (await db.getUserByUsername(input.username)) throw new Error("Username já está em uso");
      const user = await db.createLocalUser({ username: input.username, passwordHash: await hashPassword(input.password), webhook: input.webhook });
      const token = await sdk.createSessionToken(user.openId, { name: input.username });
      setSession(ctx.res, token, ctx.req);
      return publicUser(user);
    }),
    login: publicProcedure.input(z.object({ username: usernameSchema, password: z.string().min(1).max(128) })).mutation(async ({ input, ctx }) => {
      const user = await db.getUserByUsername(input.username);
      if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) throw new Error("Credenciais inválidas");
      const token = await sdk.createSessionToken(user.openId, { name: input.username });
      setSession(ctx.res, token, ctx.req);
      return publicUser(user);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  channels: router({
    list: protectedProcedure.query(({ ctx }) => db.listChannels(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2, "O nome do canal precisa ter pelo menos 2 caracteres.").max(40, "O nome do canal pode ter no máximo 40 caracteres.").regex(/^[a-zA-Z0-9_\- ]+$/, "Use apenas letras, números, espaços, hífen ou underscore.") })).mutation(({ ctx, input }) => db.createChannel(ctx.user.id, input.name.toUpperCase())),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2, "O nome do canal precisa ter pelo menos 2 caracteres.").max(40, "O nome do canal pode ter no máximo 40 caracteres.").regex(/^[a-zA-Z0-9_\- ]+$/, "Use apenas letras, números, espaços, hífen ou underscore.") })).mutation(({ ctx, input }) => db.updateChannel(ctx.user.id, { id: input.id, name: input.name.toUpperCase() })),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteChannel(ctx.user.id, input.id)),
  }),
  cards: router({
    list: protectedProcedure.input(z.object({ channelId: z.number().int().positive() })).query(({ ctx, input }) => db.listCards(ctx.user.id, input.channelId)),
    create: protectedProcedure.input(z.object({ channelId: z.number().int().positive(), title: z.string().trim().min(1).max(120), description: z.string().trim().max(1000).default(""), type: z.enum(["prompt", "link"]), content: z.string().trim().min(1).max(20000), imageUrl: z.string().optional(), imageKey: z.string().optional() }).superRefine((value, ctx) => { if (value.type === "link") { const parsed = (() => { try { return new URL(value.content); } catch { return null; } })(); if (!parsed || !["http:", "https:"].includes(parsed.protocol)) ctx.addIssue({ code: "custom", path: ["content"], message: "URL HTTP(S) inválida" }); } })).mutation(({ ctx, input }) => db.createCard(ctx.user.id, { ...input, description: input.description ?? (input.type === "prompt" ? "Prompt privado" : "Recurso externo") })),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), channelId: z.number().int().positive(), title: z.string().trim().min(1).max(120), description: z.string().trim().max(1000), type: z.enum(["prompt", "link"]), content: z.string().trim().min(1).max(20000), imageUrl: z.string().optional(), imageKey: z.string().optional() }).superRefine((value, ctx) => { if (value.type === "link") { const parsed = (() => { try { return new URL(value.content); } catch { return null; } })(); if (!parsed || !["http:", "https:"].includes(parsed.protocol)) ctx.addIssue({ code: "custom", path: ["content"], message: "URL HTTP(S) inválida" }); } })).mutation(({ ctx, input }) => db.updateCard(ctx.user.id, input)),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteCard(ctx.user.id, input.id)),
  }),
  profile: router({
    update: protectedProcedure.input(z.object({ username: usernameSchema.optional(), webhook: webhookSchema.optional(), avatarUrl: z.string().url().nullable().optional(), newPassword: z.string().min(6).max(128).optional() })).mutation(async ({ ctx, input }) => {
      if (input.username && input.username !== ctx.user.username && await db.getUserByUsername(input.username)) throw new Error("Username já está em uso");
      return publicUser(await db.updateProfile(ctx.user.id, { username: input.username, webhook: input.webhook, avatarUrl: input.avatarUrl, passwordHash: input.newPassword ? await hashPassword(input.newPassword) : undefined }));
    }),
  }),
  media: router({
    upload: protectedProcedure.input(z.object({ filename: z.string().max(120), mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]), base64: z.string().max(7_000_000) })).mutation(async ({ ctx, input }) => {
      const raw = input.base64.replace(/^data:[^;]+;base64,/, "");
      const bytes = Buffer.from(raw, "base64");
      if (bytes.length > 5 * 1024 * 1024) throw new Error("Imagem excede o limite de 5 MB");
      const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const result = await storagePut(`users/${ctx.user.id}/${Date.now()}-${safeName}`, bytes, input.mimeType);
      return result;
    }),
  }),
});

export type AppRouter = typeof appRouter;
