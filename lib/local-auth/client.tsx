"use client";

import { createContext, FormEvent, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/app/components/LocaleProvider";

type ClientUser = { id: string; fullName: string; firstName: string; imageUrl: string; primaryEmailAddress: { emailAddress: string } };
type AuthState = { isLoaded: boolean; isSignedIn: boolean; user: ClientUser | null; refresh: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

async function fetchSession(signal?: AbortSignal): Promise<ClientUser | null> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch("/api/auth/session", { cache: "no-store", signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json().catch(() => ({})) as { user?: ClientUser | null };
    return data.user ?? null;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setUser(await fetchSession());
    } catch {
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void fetchSession(controller.signal)
      .then((nextUser) => {
        if (!active) return;
        setUser(nextUser);
        setIsLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setIsLoaded(true);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const value = useMemo(() => ({ isLoaded, isSignedIn: !!user, user, refresh }), [isLoaded, refresh, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthState() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is required.");
  return context;
}

export function useAuth() {
  const { isLoaded, isSignedIn, user } = useAuthState();
  return { isLoaded, isSignedIn, userId: user?.id ?? null };
}

export function useUser() {
  const { isLoaded, user } = useAuthState();
  return { isLoaded, isSignedIn: !!user, user };
}

export function useAuthClient() {
  const { refresh } = useAuthState();
  const router = useRouter();
  return { signOut: async (options?: { redirectUrl?: string }) => { await fetch("/api/auth/sign-out", { method: "POST" }); await refresh(); router.replace(options?.redirectUrl ?? "/"); } };
}

export function AuthLoading({ children }: { children: ReactNode }) {
  return useAuthState().isLoaded ? null : <>{children}</>;
}

export function AuthLoaded({ children }: { children: ReactNode }) {
  return useAuthState().isLoaded ? <>{children}</> : null;
}

const AUTH_COPY = {
  ru: {
    signUpTitle: "Создать аккаунт", signInTitle: "Войти", signUpLead: "Сохраняй свои тусовки, игры и профиль.", signInLead: "Продолжай свою тусу.",
    name: "Имя", email: "Email", password: "Пароль", passwordHint: "Минимум 10 символов, хотя бы одна буква и одна цифра.", showPassword: "Показать пароль", hidePassword: "Скрыть пароль",
    forgot: "Забыли пароль?", wait: "Подождите...", haveAccount: "Уже есть аккаунт? Войти", noAccount: "Нет аккаунта? Зарегистрироваться",
    resetNewTitle: "Новый пароль", resetTitle: "Сброс пароля", resetNewLead: "Задайте новый пароль. Все старые сессии будут завершены.", resetLead: "Отправим одноразовую ссылку на email аккаунта.",
    newPassword: "Новый пароль", resetSent: "Если аккаунт существует, ссылка для сброса уже отправлена.", devLink: "Открыть тестовую ссылку", changePassword: "Сменить пароль", sendLink: "Отправить ссылку", backToSignIn: "Вернуться ко входу", signOut: "Выйти",
    errors: { invalid_credentials: "Неверный email или пароль.", email_taken: "Этот email уже зарегистрирован. Попробуй войти.", weak_password: "Пароль должен содержать минимум 10 символов, букву и цифру.", invalid_email: "Проверь email.", name_required: "Введи имя.", rate_limited: "Слишком много попыток. Попробуй через несколько минут.", invalid_input: "Проверь данные в форме.", unknown: "Не получилось. Попробуй ещё раз.", request: "Не удалось выполнить запрос." },
  },
  en: {
    signUpTitle: "Create account", signInTitle: "Sign in", signUpLead: "Keep your hangouts, games and profile in one place.", signInLead: "Get back to your hangout.",
    name: "Name", email: "Email", password: "Password", passwordHint: "At least 10 characters with a letter and a number.", showPassword: "Show password", hidePassword: "Hide password",
    forgot: "Forgot password?", wait: "Please wait...", haveAccount: "Already have an account? Sign in", noAccount: "No account yet? Sign up",
    resetNewTitle: "New password", resetTitle: "Reset password", resetNewLead: "Set a new password. All previous sessions will be signed out.", resetLead: "We will send a one-time link to your account email.",
    newPassword: "New password", resetSent: "If the account exists, a reset link is on its way.", devLink: "Open test link", changePassword: "Change password", sendLink: "Send link", backToSignIn: "Back to sign in", signOut: "Sign out",
    errors: { invalid_credentials: "Wrong email or password.", email_taken: "This email is already registered. Try signing in.", weak_password: "Use at least 10 characters with a letter and a number.", invalid_email: "Check your email.", name_required: "Enter your name.", rate_limited: "Too many attempts. Try again in a few minutes.", invalid_input: "Check the form fields.", unknown: "Something went wrong. Try again.", request: "The request could not be completed." },
  },
} as const;

function useAuthCopy() {
  const { locale } = useLocale();
  return AUTH_COPY[locale === "en" ? "en" : "ru"];
}

function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { refresh } = useAuthState();
  const router = useRouter();
  const copy = useAuthCopy();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password"), ...(mode === "sign-up" ? { name: form.get("name") } : {}) }) });
    const data = await response.json().catch(() => ({})) as { code?: keyof typeof copy.errors };
    if (!response.ok) { setError(copy.errors[data.code ?? "unknown"] ?? copy.errors.unknown); setBusy(false); return; }
    await refresh();
    const target = new URLSearchParams(window.location.search).get("redirect_url") || "/app";
    router.replace(target.startsWith("/") && !target.startsWith("//") ? target : "/app");
  };
  const isSignUp = mode === "sign-up";
  return <form className="local-auth-form" onSubmit={submit}>
    <h1>{isSignUp ? copy.signUpTitle : copy.signInTitle}</h1>
    <p>{isSignUp ? copy.signUpLead : copy.signInLead}</p>
    {isSignUp && <label>{copy.name}<input name="name" required autoComplete="name" maxLength={80} /></label>}
    <label>{copy.email}<input name="email" type="email" required autoComplete="email" /></label>
    <label>{copy.password}<span className="local-auth-password"><input aria-describedby={isSignUp ? "password-hint" : undefined} name="password" type={showPassword ? "text" : "password"} required minLength={isSignUp ? 10 : 8} pattern={isSignUp ? "(?=.*[A-Za-zА-Яа-яЁё])(?=.*\\d).{10,}" : undefined} autoComplete={isSignUp ? "new-password" : "current-password"} /><button aria-label={showPassword ? copy.hidePassword : copy.showPassword} onClick={() => setShowPassword((value) => !value)} type="button"><span className="material-symbols-rounded">{showPassword ? "visibility_off" : "visibility"}</span></button></span></label>
    {isSignUp && <small className="local-auth-hint" id="password-hint">{copy.passwordHint}</small>}
    {!isSignUp && <Link className="clerk-link local-auth-forgot" href="/forgot-password">{copy.forgot}</Link>}
    {error && <p className="local-auth-error" role="alert">{error}</p>}
    <button className="clerk-primary" disabled={busy} type="submit">{busy ? copy.wait : isSignUp ? copy.signUpTitle : copy.signInTitle}</button>
    <Link className="clerk-link" href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? copy.haveAccount : copy.noAccount}</Link>
  </form>;
}

export function SignInForm(props: Record<string, unknown>) { void props; return <AuthForm mode="sign-in" />; }
export function SignUpForm(props: Record<string, unknown>) { void props; return <AuthForm mode="sign-up" />; }

export function PasswordResetForm({ token }: { token?: string }) {
  const router = useRouter();
  const copy = useAuthCopy();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const endpoint = token ? "/api/auth/password-reset/confirm" : "/api/auth/password-reset/request";
    const body = token ? { token, password: form.get("password") } : { email: form.get("email") };
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(response.status === 429 ? copy.errors.rate_limited : token ? copy.errors.weak_password : copy.errors.request);
    else if (token) router.replace("/app");
    else {
      setNotice(copy.resetSent);
      setDevResetUrl(data.resetUrl ?? "");
    }
    setBusy(false);
  }

  return <form className="local-auth-form" onSubmit={submit}>
    <h1>{token ? copy.resetNewTitle : copy.resetTitle}</h1>
    <p>{token ? copy.resetNewLead : copy.resetLead}</p>
    {token ? <label>{copy.newPassword}<input autoComplete="new-password" minLength={10} name="password" required type="password" /></label> : <label>{copy.email}<input autoComplete="email" name="email" required type="email" /></label>}
    {token && <small className="local-auth-hint">{copy.passwordHint}</small>}
    {error && <p className="local-auth-error" role="alert">{error}</p>}
    {notice && <p className="local-auth-success" role="status">{notice}</p>}
    {devResetUrl && <a className="clerk-link" href={devResetUrl}>{copy.devLink}</a>}
    <button className="clerk-primary" disabled={busy} type="submit">{busy ? copy.wait : token ? copy.changePassword : copy.sendLink}</button>
    <Link className="clerk-link" href="/sign-in">{copy.backToSignIn}</Link>
  </form>;
}

export function UserButton({ appearance }: { appearance?: unknown }) {
  void appearance;
  const { user } = useAuthState();
  const { signOut } = useAuthClient();
  const copy = useAuthCopy();
  if (!user) return null;
  return <button className="account-avatar" title={copy.signOut} aria-label={copy.signOut} onClick={() => void signOut()} type="button">{user.firstName.slice(0, 1).toUpperCase()}</button>;
}
