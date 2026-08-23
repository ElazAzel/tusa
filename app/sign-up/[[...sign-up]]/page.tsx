import { ClerkLoaded, ClerkLoading, SignUp } from "@/lib/local-auth/client";
import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <section className="auth-shell">
        <header>
          <Link href="/" aria-label="TUSA.game"><BrandLogo priority /></Link>
          <span>Собери своих. Начни игру.</span>
        </header>
        <div className="auth-card">
          <ClerkLoading>
            <div className="auth-loading" role="status"><span className="auth-loading-mark" aria-hidden="true">T</span><strong>Готовим регистрацию…</strong><small>Google, Apple или email</small></div>
          </ClerkLoading>
          <ClerkLoaded>
            <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/app" appearance={{ variables: { colorPrimary: "#2D00F7", colorForeground: "#000000", borderRadius: "12px", fontFamily: "var(--font-inter), sans-serif" }, elements: { cardBox: "clerk-card-box", card: "clerk-card", headerTitle: "clerk-title", formButtonPrimary: "clerk-primary", socialButtonsBlockButton: "clerk-social", footerActionLink: "clerk-link" } }} />
          </ClerkLoaded>
        </div>
        <footer><Link href="/privacy">Конфиденциальность</Link><Link href="/terms">Условия</Link><Link href="/">← На TUSA.game</Link></footer>
      </section>
    </main>
  );
}
