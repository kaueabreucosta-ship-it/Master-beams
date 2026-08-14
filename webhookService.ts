import { createHash } from "node:crypto";

export function maskWebhook(webhook: string | null | undefined) {
  if (!webhook) return null;
  try { const url = new URL(webhook); return `${url.origin}/••••••${url.pathname.slice(-4)}`; } catch { return "••••••••"; }
}

/** Camada explícita para futuras ações de webhook; nenhuma rotina chama isto automaticamente. */
export async function sendWebhookSafely(webhook: string, payload: unknown) {
  if (!webhook) throw new Error("Webhook ausente");
  const auditId = createHash("sha256").update(webhook).digest("hex").slice(0, 12);
  return { sent: false, auditId, reason: "Explicit user action required" } as const;
}
