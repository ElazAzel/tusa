import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";
import { PasswordResetForm } from "@/lib/local-auth/client";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className="auth-page"><section className="auth-shell">
    <header><Link href="/" aria-label="TUSA.game"><BrandLogo priority /></Link><span>Новый пароль, тот же профиль.</span></header>
    <div className="auth-card"><PasswordResetForm token={token} /></div>
    <footer><Link href="/privacy">Конфиденциальность</Link><Link href="/terms">Условия</Link><Link href="/">← На TUSA.game</Link></footer>
  </section></main>;
}
