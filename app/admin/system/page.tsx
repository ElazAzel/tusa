import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminAccess } from "@/lib/admin-auth";
import { getRuntimeStatus, type RuntimeServiceState } from "@/lib/runtime-status";
import { normalizeLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const serviceLabels = {
  database: { ru: "База данных", en: "Database" },
  localAuth: { ru: "Вход", en: "Authentication" },
  clerk: { ru: "Clerk", en: "Clerk" },
  realtime: { ru: "Realtime", en: "Realtime" },
  rateLimit: { ru: "Rate limit", en: "Rate limit" },
  media: { ru: "Медиа", en: "Media" },
  observability: { ru: "Наблюдаемость", en: "Observability" },
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
  const title = locale === "ru" ? "Здоровье системы" : "System health";
  const lead = locale === "ru"
    ? "Показывает только состояние интеграций — без ключей, личных данных и содержимого тусы."
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
    <section className="admin-table-card" style={{ marginTop: 24 }}>
      <div className="admin-table-head"><div><span className="admin-kicker">NEXT ACTION</span><h2>{locale === "ru" ? "Перед строгим production-режимом" : "Before strict production mode"}</h2></div></div>
      <p className="admin-empty">{locale === "ru" ? "Добавьте Ably и Upstash в Production, затем установите TUSA_REQUIRE_DISTRIBUTED_SERVICES=true. До этого экран честно показывает fallback, а не выдаёт локальную память за распределённый realtime." : "Add Ably and Upstash to Production, then set TUSA_REQUIRE_DISTRIBUTED_SERVICES=true. Until then, this screen reports fallback instead of presenting local memory as distributed realtime."}</p>
    </section>
  </main>;
}
