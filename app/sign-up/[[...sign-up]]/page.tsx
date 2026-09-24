import { AuthFooter, AuthText } from "@/app/components/AuthChrome";
import { AuthLoaded, AuthLoading, SignUpForm } from "@/lib/local-auth/client";
import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <section className="auth-shell">
        <header>
          <Link href="/" aria-label="TUSA.game"><BrandLogo priority /></Link>
          <span><AuthText k="signUp" /></span>
        </header>
        <div className="auth-card">
          <AuthLoading>
            <div className="auth-loading" role="status"><span className="auth-loading-mark" aria-hidden="true">T</span><strong><AuthText k="loadingSignUp" /></strong><small><AuthText k="loadingHint" /></small></div>
          </AuthLoading>
          <AuthLoaded>
            <SignUpForm routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/app" appearance={{ variables: { colorPrimary: "#2D00F7", colorForeground: "#000000", borderRadius: "12px", fontFamily: "var(--font-inter), sans-serif" }, elements: { cardBox: "clerk-card-box", card: "clerk-card", headerTitle: "clerk-title", formButtonPrimary: "clerk-primary", socialButtonsBlockButton: "clerk-social", footerActionLink: "clerk-link" } }} />
          </AuthLoaded>
        </div>
        <AuthFooter />
      </section>
    </main>
  );
}
