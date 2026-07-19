"use client";

import { createContext, FormEvent, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

export function ClerkProvider({ children }: { children: ReactNode }) {
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
  if (!context) throw new Error("ClerkProvider is required.");
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

export function useClerk() {
  const { refresh } = useAuthState();
  return { signOut: async (options?: { redirectUrl?: string }) => { await fetch("/api/auth/sign-out", { method: "POST" }); await refresh(); window.location.assign(options?.redirectUrl ?? "/"); } };
}

export function ClerkLoading({ children }: { children: ReactNode }) {
  return useAuthState().isLoaded ? null : <>{children}</>;
}

export function ClerkLoaded({ children }: { children: ReactNode }) {
  return useAuthState().isLoaded ? <>{children}</> : null;
}

function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { refresh } = useAuthState();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password"), name: form.get("name") }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error ?? "Не удалось выполнить вход."); setBusy(false); return; }
    await refresh();
    const target = new URLSearchParams(window.location.search).get("redirect_url") || "/app";
    window.location.assign(target.startsWith("/") ? target : "/app");
  };
  const isSignUp = mode === "sign-up";
  return <form className="local-auth-form" onSubmit={submit}>
    <h1>{isSignUp ? "Создать аккаунт" : "Войти"}</h1>
    <p>{isSignUp ? "Сохраняй свои тусовки, игры и профиль." : "Продолжай свою тусу."}</p>
    {isSignUp && <label>Имя<input name="name" required autoComplete="name" maxLength={80} /></label>}
    <label>Email<input name="email" type="email" required autoComplete="email" /></label>
    <label>Пароль<span className="local-auth-password"><input name="password" type={showPassword ? "text" : "password"} required minLength={isSignUp ? 10 : 8} autoComplete={isSignUp ? "new-password" : "current-password"} /><button aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} onClick={() => setShowPassword((value) => !value)} type="button"><span className="material-symbols-rounded">{showPassword ? "visibility_off" : "visibility"}</span></button></span></label>
    {!isSignUp && <Link className="clerk-link local-auth-forgot" href="/forgot-password">Забыли пароль?</Link>}
    {error && <p className="local-auth-error" role="alert">{error}</p>}
    <button className="clerk-primary" disabled={busy} type="submit">{busy ? "Подождите..." : isSignUp ? "Создать аккаунт" : "Войти"}</button>
    <a className="clerk-link" href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}</a>
  </form>;
}

export function SignIn(props: Record<string, unknown>) { void props; return <AuthForm mode="sign-in" />; }
export function SignUp(props: Record<string, unknown>) { void props; return <AuthForm mode="sign-up" />; }

export function PasswordResetForm({ token }: { token?: string }) {
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
    if (!response.ok) setError(data.error ?? "Не удалось выполнить запрос.");
    else if (token) window.location.assign("/app");
    else {
      setNotice("Если аккаунт существует, ссылка для сброса уже отправлена.");
      setDevResetUrl(data.resetUrl ?? "");
    }
    setBusy(false);
  }

  return <form className="local-auth-form" onSubmit={submit}>
    <h1>{token ? "Новый пароль" : "Сброс пароля"}</h1>
    <p>{token ? "Задайте новый пароль. Все старые сессии будут завершены." : "Отправим одноразовую ссылку на email аккаунта."}</p>
    {token ? <label>Новый пароль<input autoComplete="new-password" minLength={10} name="password" required type="password" /></label> : <label>Email<input autoComplete="email" name="email" required type="email" /></label>}
    {error && <p className="local-auth-error" role="alert">{error}</p>}
    {notice && <p className="local-auth-success" role="status">{notice}</p>}
    {devResetUrl && <a className="clerk-link" href={devResetUrl}>Открыть тестовую ссылку</a>}
    <button className="clerk-primary" disabled={busy} type="submit">{busy ? "Подождите..." : token ? "Сменить пароль" : "Отправить ссылку"}</button>
    <Link className="clerk-link" href="/sign-in">Вернуться ко входу</Link>
  </form>;
}

export function UserButton({ appearance }: { appearance?: unknown }) {
  void appearance;
  const { user } = useAuthState();
  const { signOut } = useClerk();
  if (!user) return null;
  return <button className="account-avatar" title="Выйти" onClick={() => void signOut()} type="button">{user.firstName.slice(0, 1).toUpperCase()}</button>;
}
