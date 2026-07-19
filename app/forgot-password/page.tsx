import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";
import { PasswordResetForm } from "@/lib/local-auth/client";

export default function ForgotPasswordPage() {
  return <main className="auth-page"><section className="auth-shell">
    <header><Link href="/" aria-label="TUSA.game"><BrandLogo priority /></Link><span>Вернись в свою тусу.</span></header>
    <div className="auth-card"><PasswordResetForm /></div>
    <footer><Link href="/privacy">Конфиденциальность</Link><Link href="/terms">Условия</Link><Link href="/">← На TUSA.game</Link></footer>
  </section></main>;
}
