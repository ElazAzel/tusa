import "server-only";
import { recordPlatformError } from "@/lib/observability";
import { createEmailDelivery } from "@/lib/operations";
import { runtimeEnvironment } from "@/lib/runtime-status";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function renderEmail(payload: Record<string, unknown>) {
  const template = String(payload.template ?? "auth");
  const name = escapeHtml(payload.name || "участник");
  const isReset = template === "password-reset";
  const actionUrl = String(isReset ? payload.resetUrl ?? "" : payload.verificationUrl ?? "");
  const title = isReset ? "Сброс пароля TUSA.game" : "Подтвердите email в TUSA.game";
  const action = isReset ? "Сбросить пароль" : "Подтвердить email";
  const expiry = isReset ? `${Number(payload.expiresInMinutes ?? 30)} минут` : `${Number(payload.expiresInHours ?? 24)} часа`;
  const text = `Привет, ${String(payload.name ?? "участник")}!\n\n${action}: ${actionUrl}\n\nСсылка действует ${expiry}. Если запрос сделали не вы, проигнорируйте письмо.`;
  const html = `<!doctype html><html lang="ru"><body style="font-family:Arial,sans-serif;color:#111;background:#f5f5f0;padding:24px"><main style="max-width:560px;margin:auto;background:#fff;border:3px solid #111;padding:28px"><strong>TUSA.game</strong><h1 style="font-size:28px">${title}</h1><p>Привет, ${name}!</p><p><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#c6ff00;color:#111;border:3px solid #111;padding:14px 18px;font-weight:700;text-decoration:none">${action}</a></p><p>Ссылка действует ${expiry}. Если запрос сделали не вы, проигнорируйте письмо.</p></main></body></html>`;
  return { template, actionUrl, title, text, html };
}

export async function deliverAuthEmail(payload: Record<string, unknown>) {
  const to = String(payload.to ?? "").trim();
  if (!to) return false;
  const rendered = renderEmail(payload);
  if (process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM, to: [to], subject: rendered.title, html: rendered.html, text: rendered.text }),
        signal: AbortSignal.timeout(8_000),
      });
      const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
      if (!response.ok || !result.id) throw new Error(`Resend returned ${response.status}: ${result.message ?? "unknown error"}`);
      await createEmailDelivery({ provider: "resend", providerMessageId: result.id, template: rendered.template, recipient: to, status: "sent" });
      return true;
    } catch (error) {
      await createEmailDelivery({ provider: "resend", template: rendered.template, recipient: to, status: "failed", errorCode: error instanceof Error ? error.name : "Error" }).catch(() => undefined);
      void recordPlatformError({ source: "server", route: "auth-email", method: "POST", error, context: { provider: "resend", template: rendered.template } }).catch(() => undefined);
      return false;
    }
  }
  if (runtimeEnvironment() === "production" || !process.env.AUTH_EMAIL_WEBHOOK_URL) return false;
  try {
    const response = await fetch(process.env.AUTH_EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AUTH_EMAIL_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.AUTH_EMAIL_WEBHOOK_SECRET}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Auth email webhook returned ${response.status}.`);
    await createEmailDelivery({ provider: "webhook", template: rendered.template, recipient: to, status: "sent" }).catch(() => undefined);
    return true;
  } catch (error) {
    await createEmailDelivery({ provider: "webhook", template: rendered.template, recipient: to, status: "failed", errorCode: error instanceof Error ? error.name : "Error" }).catch(() => undefined);
    void recordPlatformError({ source: "server", route: "auth-email", method: "POST", error, context: { template: payload.template ?? "unknown" } }).catch(() => undefined);
    return false;
  }
}
