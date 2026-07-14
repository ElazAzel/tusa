import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CreatePartyForm from "./CreatePartyForm";

export default async function NewPartyPage() {
  let userId: string | null = null;
  try {
    try { userId = (await auth()).userId ?? null; } catch { /* auth unavailable */ }
    if (!userId) redirect("/sign-in?redirect_url=/app/new");
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[NewPartyPage] render error:", err);
    redirect("/sign-in?redirect_url=/app/new");
  }
  return <CreatePartyForm />;
}
