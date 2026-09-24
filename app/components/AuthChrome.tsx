import Link from "next/link";
import { cookies, headers } from "next/headers";
import { normalizeLocale, type Locale } from "@/lib/i18n";

const COPY = {
  ru: { signIn: "Твоя туса. Твои правила.", signUp: "Собери своих. Начни игру.", forgot: "Вернись в свою тусу.", reset: "Новый пароль, тот же профиль.", loadingSignIn: "Открываем вход…", loadingSignUp: "Готовим регистрацию…", loadingHint: "Вход по email и паролю", privacy: "Конфиденциальность", terms: "Условия", home: "← На TUSA.game" },
  en: { signIn: "Your party. Your rules.", signUp: "Gather your people. Start the game.", forgot: "Get back to your party.", reset: "New password, same profile.", loadingSignIn: "Opening sign-in…", loadingSignUp: "Preparing sign-up…", loadingHint: "Email and password sign-in", privacy: "Privacy", terms: "Terms", home: "← Back to TUSA.game" },
} as const;

export type AuthCopyKey = keyof (typeof COPY)["ru"];

export async function authLocale(): Promise<Locale> {
  const store = await cookies();
  const requestHeaders = await headers();
  return normalizeLocale(store.get("tusa_locale")?.value ?? requestHeaders.get("accept-language"));
}

export async function AuthText({ k }: { k: AuthCopyKey }) {
  return <>{COPY[await authLocale()][k]}</>;
}

export async function AuthFooter() {
  const c = COPY[await authLocale()];
  return <footer><Link href="/privacy">{c.privacy}</Link><Link href="/terms">{c.terms}</Link><Link href="/">{c.home}</Link></footer>;
}
