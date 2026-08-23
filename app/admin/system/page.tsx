import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminAccess } from "@/lib/admin-auth";
import { getRuntimeStatus, type RuntimeServiceState } from "@/lib/runtime-status";
import { normalizeLocale } from "@/lib/i18n";
import { getDatabaseHealth, getPlatformErrorSummary } from "@/lib/observability";
import { getEmailDeliverySummary, getOperationalSummary } from "@/lib/operations";
import { getAdminMfaStatus } from "@/lib/admin-mfa";
import AdminMfaPanel from "./AdminMfaPanel";

export const dynamic = "force-dynamic";

const serviceLabels = {
  database: { ru: "База данных", en: "Database" },
  localAuth: { ru: "Вход", en: "Authentication" },
  clerk: { ru: "Clerk", en: "Clerk" },
  realtime: { ru: "Realtime", en: "Realtime" },
  rateLimit: { ru: "Rate limit", en: "Rate limit" },
  media: { ru: "Медиа", en: "Media" },
  observability: { ru: "Наблюдаемость", en: "Observability" },
  email: { ru: "Email-доставка", en: "Email delivery" },
  adminMfa: { ru: "MFA админа", en: "Admin MFA" },
} as const;

function stateLabel(state: RuntimeServiceState | "live" | "development" | "unconfigured", locale: "ru" | "en") {
  const labels = locale === "ru"
    ? { ready: "готово", fallback: "локальный fallback", missing: "не настроено", live: "live ключи", development: "development ключи", unconfigured: "не настроено" }
    : { ready: "ready", fallback: "local fallback", missing: "not configured", live: "live keys", development: "development keys", unconfigured: "not configured" };
  return labels[state];
}

export default async function AdminSystemPage() {
  const access = await getAdminAccess();
  if (!access) redirect("/admin/login");
  if (!access.permissions.includes("system_read")) redirect("/admin");
  const locale = normalizeLocale((await cookies()).get("tusa_locale")?.value);
  const runtime = getRuntimeStatus();
  const [database, errors, slo, email, mfa] = await Promise.all([
    getDatabaseHealth().catch(() => ({ ready: false, schemaVersion: 0, latencyMs: 0, appliedAt: null })),
    getPlatformErrorSummary().catch(() => ({ lastHour: 0, last24Hours: 0, latestAt: null, top: [] })),
    getOperationalSummary(),
    getEmailDeliverySummary(),
    getAdminMfaStatus("root"),
  ]);
  const title = locale === "ru" ? "Здоровье системы" : "System health";
  const lead = locale === "ru"
    ? "Показывает только состояние интеграций: без ключей, личных данных и содержимого тусы."
    : "Shows integration state only — never keys, personal data, or party content.";

  return <main className="admin-page">
    <header className="admin-header">
      <Link href="/" className="admin-brand">TUSA<span>.game</span></Link>
      <div className="admin-nav"><Link href="/admin" className="admin-text-button">{locale === "ru" ? "Админка" : "Admin"}</Link><span className="admin-role-chip">{access.displayName} · {access.role}</span></div>
    </header>
    <section className="admin-hero">
      <div><span className="admin-kicker">OPERATIONS</span><h1>{title}</h1><p>{lead}</p></div>
      <div className="admin-capacity-card"><span>{locale === "ru" ? "Общее состояние" : "Overall state"}</span><strong>{runtime.overall}</strong><p>{runtime.environment} · {runtime.strictDistributedServices ? "strict distributed" : "fallback allowed"}</p></div>
    </section>
    <section className="admin-metrics" aria-label={title}>
      {Object.entries(runtime.services).map(([service, state]) => <article key={service}><span>{serviceLabels[service as keyof typeof serviceLabels][locale]}</span><strong>{stateLabel(state, locale)}</strong><small>{state === "fallback" ? (locale === "ru" ? "нужна production-интеграция" : "production integration needed") : "TUSA.game"}</small></article>)}
    </section>
    <section className="admin-metrics" aria-label={locale === "ru" ? "Операционные метрики" : "Operational metrics"} style={{ marginTop: 24 }}>
      <article><span>{locale === "ru" ? "База данных" : "Database latency"}</span><strong>{database.latencyMs} ms</strong><small>schema v{database.schemaVersion}</small></article>
      <article><span>{locale === "ru" ? "Ошибки за час" : "Errors, 1 hour"}</span><strong>{errors.lastHour}</strong><small>{errors.latestAt ? new Date(errors.latestAt).toLocaleString(locale) : (locale === "ru" ? "ошибок нет" : "no errors")}</small></article>
      <article><span>{locale === "ru" ? "Ошибки за сутки" : "Errors, 24 hours"}</span><strong>{errors.last24Hours}</strong><small>{locale === "ru" ? "сервер и браузер" : "server and browser"}</small></article>
    </section>
    <section className="admin-metrics admin-slo-grid" aria-label="SLO, 24 hours" style={{ marginTop: 24 }}>
      <article><span>Join success</span><strong>{(slo.joinSuccessRate * 100).toFixed(1)}%</strong><small>p95 {slo.joinP95Ms ?? "—"} ms</small></article>
      <article><span>Game action p95</span><strong>{slo.actionP95Ms ?? "—"} ms</strong><small>{slo.roundCompletes} rounds complete</small></article>
      <article><span>Reconnect p95</span><strong>{slo.reconnectP95Ms ?? "—"} ms</strong><small>{slo.reconnects} reconnects</small></article>
      <article><span>Error rate</span><strong>{(slo.errorRate * 100).toFixed(2)}%</strong><small>{slo.total} events / 24h</small></article>
      <article><span>Email delivery</span><strong>{email.delivered}</strong><small>{email.bounced} bounced · {email.failed} failed</small></article>
    </section>
    {errors.top.length > 0 && <section className="admin-table-card" style={{ marginTop: 24 }}>
      <div className="admin-table-head"><div><span className="admin-kicker">ERROR LOG</span><h2>{locale === "ru" ? "Частые ошибки за 24 часа" : "Top errors in 24 hours"}</h2></div></div>
      <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>{locale === "ru" ? "Маршрут" : "Route"}</th><th>{locale === "ru" ? "Тип" : "Type"}</th><th>{locale === "ru" ? "Количество" : "Count"}</th><th>{locale === "ru" ? "Последняя" : "Latest"}</th></tr></thead><tbody>{errors.top.map((item) => <tr key={item.fingerprint}><td><code>{item.route || "/"}</code></td><td>{item.errorName}</td><td>{item.count}</td><td>{new Date(item.latestAt).toLocaleString(locale)}</td></tr>)}</tbody></table></div>
    </section>}
    {access.source === "root" && <AdminMfaPanel enabled={mfa.enabled} recoveryCodesRemaining={mfa.recoveryCodesRemaining} locale={locale} />}
    <section className="admin-table-card" style={{ marginTop: 24 }}>
      <div className="admin-table-head"><div><span className="admin-kicker">NEXT ACTION</span><h2>{locale === "ru" ? "Перед строгим production-режимом" : "Before strict production mode"}</h2></div></div>
      <p className="admin-empty">{locale === "ru" ? "Добавьте Ably и Upstash в Production, затем установите TUSA_REQUIRE_DISTRIBUTED_SERVICES=true. До этого экран честно показывает fallback, а не выдаёт локальную память за распределённый realtime." : "Add Ably and Upstash to Production, then set TUSA_REQUIRE_DISTRIBUTED_SERVICES=true. Until then, this screen reports fallback instead of presenting local memory as distributed realtime."}</p>
    </section>
  </main>;
}
