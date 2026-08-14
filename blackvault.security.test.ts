import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { maskWebhook, sendWebhookSafely } from "./webhookService";

const baseContext = (): TrpcContext => ({
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => undefined, cookie: () => undefined } as TrpcContext["res"],
});

describe("BLACK VAULT security contracts", () => {
  it("configures the Master Beams application title", () => {
    expect(process.env.VITE_APP_TITLE).toBe("MASTER BEAMS");
  });
  it("rejects non-HTTP(S) card URLs at the backend boundary", async () => {
    const context = baseContext(); context.user = { id: 1, openId: "local:test", name: "test", email: null, loginMethod: "username", username: "test", passwordHash: null, webhook: null, avatarUrl: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    const caller = appRouter.createCaller(context);
    await expect(caller.cards.create({ channelId: 1, title: "x", description: "", type: "link", content: "javascript:alert(1)" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects non-HTTP(S) card URLs during updates too", async () => {
    const context = baseContext(); context.user = { id: 1, openId: "local:test", name: "test", email: null, loginMethod: "username", username: "test", passwordHash: null, webhook: null, avatarUrl: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    const caller = appRouter.createCaller(context);
    await expect(caller.cards.update({ id: 1, channelId: 1, title: "x", description: "", type: "link", content: "javascript:alert(1)" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects invalid channel names before touching the database", async () => {
    const context = baseContext(); context.user = { id: 1, openId: "local:test", name: "test", email: null, loginMethod: "username", username: "test", passwordHash: null, webhook: null, avatarUrl: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    const caller = appRouter.createCaller(context);
    await expect(caller.channels.update({ id: 1, name: "!" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("blocks destructive CRUD operations without an authenticated owner", async () => {
    const caller = appRouter.createCaller(baseContext());
    await expect(caller.channels.remove({ id: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.cards.remove({ id: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("masks webhook values and requires explicit sending", async () => {
    expect(maskWebhook("https://hooks.example.com/secret-token")).toContain("••••••");
    await expect(sendWebhookSafely("https://hooks.example.com/secret-token", {})).resolves.toMatchObject({ sent: false });
  });
  it("does not expose an unauthenticated user", async () => {
    const caller = appRouter.createCaller(baseContext());
    await expect(caller.auth.me()).resolves.toBeNull();
  });

  it("rejects channel reads without an authenticated owner", async () => {
    const caller = appRouter.createCaller(baseContext());
    await expect(caller.channels.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
