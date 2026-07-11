import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { listAdminAudit, listAdminMembers } from "@/lib/admin-members";
import { getAdminUsers } from "@/lib/parties";
import TeamConsole from "./TeamConsole";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const access = await getAdminAccess();
  if (!access) redirect("/admin/login");
  if (!access.permissions.includes("team_read")) redirect("/admin");
  const [members, audit, users] = await Promise.all([
    listAdminMembers(),
    access.permissions.includes("team_manage")
      ? listAdminAudit()
      : Promise.resolve([]),
    access.permissions.includes("team_manage")
      ? getAdminUsers()
      : Promise.resolve([]),
  ]);
  return (
    <TeamConsole
      access={access}
      initialMembers={members}
      initialAudit={audit}
      users={users}
    />
  );
}
