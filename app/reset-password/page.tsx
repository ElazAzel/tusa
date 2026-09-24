import { AuthFooter, AuthText } from "@/app/components/AuthChrome";
import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";
import { PasswordResetForm } from "@/lib/local-auth/client";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className="auth-page"><section className="auth-shell">
    <header><Link href="/" aria-label="TUSA.game"><BrandLogo priority /></Link><span><AuthText k="reset" /></span></header>
    <div className="auth-card"><PasswordResetForm token={token} /></div>
    <AuthFooter />
  </section></main>;
}
