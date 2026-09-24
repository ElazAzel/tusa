import { AuthFooter, AuthText } from "@/app/components/AuthChrome";
import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";
import { PasswordResetForm } from "@/lib/local-auth/client";

export default function ForgotPasswordPage() {
  return <main className="auth-page"><section className="auth-shell">
    <header><Link href="/" aria-label="TUSA.game"><BrandLogo priority /></Link><span><AuthText k="forgot" /></span></header>
    <div className="auth-card"><PasswordResetForm /></div>
    <AuthFooter />
  </section></main>;
}
