"use client";

import { createContext, FormEvent, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type ClientUser = { id: string; fullName: string; firstName: string; imageUrl: string; primaryEmailAddress: { emailAddress: string } };
type AuthState = { isLoaded: boolean; isSignedIn: boolean; user: ClientUser | null; refresh: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export function ClerkProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const refresh = async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    setUser(data.user ?? null);
    setIsLoaded(true);
  };
  useEffect(() => { void refresh(); }, []);
  const value = useMemo(() => ({ isLoaded, isSignedIn: !!user, user, refresh }), [isLoaded, user]);
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
    <label>Пароль<input name="password" type="password" required minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} /></label>
    {error && <p className="local-auth-error" role="alert">{error}</p>}
    <button className="clerk-primary" disabled={busy} type="submit">{busy ? "Подождите..." : isSignUp ? "Создать аккаунт" : "Войти"}</button>
    <a className="clerk-link" href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}</a>
  </form>;
}

export function SignIn(_: Record<string, unknown>) { return <AuthForm mode="sign-in" />; }
export function SignUp(_: Record<string, unknown>) { return <AuthForm mode="sign-up" />; }

export function UserButton(_: { appearance?: unknown }) {
  const { user } = useAuthState();
  const { signOut } = useClerk();
  if (!user) return null;
  return <button className="account-avatar" title="Выйти" onClick={() => void signOut()} type="button">{user.firstName.slice(0, 1).toUpperCase()}</button>;
}
