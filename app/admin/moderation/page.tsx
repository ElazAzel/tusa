import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { listSafetyReports } from "@/lib/parties";
import ModerationConsole from "./ModerationConsole";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const access = await getAdminAccess();
  if (!access) redirect("/admin/login");
  if (!access.permissions.includes("moderation_read")) redirect("/admin");
  return <ModerationConsole initialReports={await listSafetyReports()} canModerate={access.permissions.includes("moderation_write")} />;
}
