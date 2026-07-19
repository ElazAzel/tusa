import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { isAdmin, isAdminMfaConfigured } from "@/lib/admin-auth";
import { detectLocale, normalizeLocale, copy } from "@/lib/i18n";
import AdminLoginForm from "../AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const params = await searchParams;
  const store = await cookies();
  const requestHeaders = await headers();
  const cookieLocale = store.get("tusa_locale")?.value;
  const browserLocale = detectLocale(requestHeaders.get("accept-language"));
  const locale = normalizeLocale(cookieLocale ?? browserLocale);
  return <AdminLoginForm initialError={params.error === "invalid" ? copy(locale, "adminLoginInvalid") : ""} mfaRequired={isAdminMfaConfigured()} />;
}
