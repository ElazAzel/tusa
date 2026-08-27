import { ClerkLoaded, ClerkLoading, SignIn } from "@/lib/local-auth/client";
import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <section className="auth-shell">
        <header>
          <Link href="/" aria-label="TUSA.game"><BrandLogo priority /></Link>
          <span>Твоя туса. Твои правила.</span>
        </header>
        <div className="auth-card">
          <AuthLoading>
            <div className="auth-loading" role="status">
              <span className="auth-loading-mark" aria-hidden="true">T</span>
              <strong>Готовим вход…</strong>
              <small>Google, Apple или email</small>
            </div>
          </AuthLoading>
          <AuthLoaded>
            <SignInForm routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/app" appearance={{ variables: { colorPrimary: "#2D00F7", colorForeground: "#000000", borderRadius: "12px", fontFamily: "var(--font-inter), sans-serif" }, elements: { cardBox: "clerk-card-box", card: "clerk-card", headerTitle: "clerk-title", formButtonPrimary: "clerk-primary", socialButtonsBlockButton: "clerk-social", footerActionLink: "clerk-link" } }} />
          </AuthLoaded>
        </div>
        <footer><Link href="/privacy">Конфиденциальность</Link><Link href="/terms">Условия</Link><Link href="/">← На TUSA.game</Link></footer>
      </section>
    </main>
  );
}
