"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";

type Enrollment = { secret: string; qrCodeDataUrl: string };

export default function AdminMfaPanel({ enabled, recoveryCodesRemaining, locale }: { enabled: boolean; recoveryCodesRemaining: number; locale: "ru" | "en" }) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function setup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const password = new FormData(event.currentTarget).get("password");
    const response = await fetch("/api/admin/mfa/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error ?? "MFA setup failed");
    setEnrollment(data);
  }
  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const code = new FormData(event.currentTarget).get("code");
    const response = await fetch("/api/admin/mfa/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error ?? "MFA confirmation failed");
    setRecoveryCodes(data.recoveryCodes ?? []); setEnrollment(null);
  }
  return <section className="admin-table-card admin-mfa-panel">
    <div className="admin-table-head"><div><span className="admin-kicker">ROOT SECURITY</span><h2>{locale === "ru" ? "MFA администратора" : "Administrator MFA"}</h2></div><strong>{enabled ? (locale === "ru" ? "Включена" : "Enabled") : (locale === "ru" ? "Не включена" : "Not enabled")}</strong></div>
    {enabled && recoveryCodes.length === 0 && <p className="admin-empty">{locale === "ru" ? `Осталось recovery-кодов: ${recoveryCodesRemaining}` : `Recovery codes remaining: ${recoveryCodesRemaining}`}</p>}
    {!enabled && !enrollment && <form className="admin-mfa-form" onSubmit={setup}><label><span>{locale === "ru" ? "Подтвердите пароль root-admin" : "Confirm root-admin password"}</span><input name="password" type="password" autoComplete="current-password" required /></label><button className="admin-button admin-button--lime" disabled={busy}>{locale === "ru" ? "Начать настройку" : "Start enrollment"}</button></form>}
    {enrollment && <div className="admin-mfa-enrollment"><Image src={enrollment.qrCodeDataUrl} width={240} height={240} unoptimized alt={locale === "ru" ? "QR-код для приложения-аутентификатора" : "Authenticator QR code"} /><p><code>{enrollment.secret}</code></p><form className="admin-mfa-form" onSubmit={confirm}><label><span>{locale === "ru" ? "Код из приложения" : "Authenticator code"}</span><input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required /></label><button className="admin-button admin-button--lime" disabled={busy}>{locale === "ru" ? "Подтвердить и включить" : "Confirm and enable"}</button></form></div>}
    {recoveryCodes.length > 0 && <div className="admin-recovery-codes"><p>{locale === "ru" ? "Сохраните коды сейчас. Повторно они не показываются." : "Save these codes now. They will not be shown again."}</p><pre>{recoveryCodes.join("\n")}</pre></div>}
    {error && <p className="admin-error" role="alert">{error}</p>}
  </section>;
}
