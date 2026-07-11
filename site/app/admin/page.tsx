import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import {
  getWaitlistStats,
  listWaitlistApplications,
  type WaitlistStats,
} from "@/lib/waitlist";
import { getAdminParties, getAdminUsers } from "@/lib/parties";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

const emptyStats: WaitlistStats = {
  capacity: 765,
  baseline: 254,
  applications: 0,
  total: 254,
  remaining: 511,
  statuses: { new: 0, shortlisted: 0, invited: 0, rejected: 0 },
  betaApplicants: 0,
  registeredUsers: 0,
};

export default async function AdminPage() {
  const access = await getAdminAccess();
  if (!access) redirect("/admin/login");
  if (!access.permissions.includes("dashboard_read")) redirect("/");

  const [initialStats, initialApplications, initialUsers, initialParties] =
    await Promise.all([
      access.permissions.includes("waitlist_read")
        ? getWaitlistStats()
        : Promise.resolve(emptyStats),
      access.permissions.includes("waitlist_read")
        ? listWaitlistApplications()
        : Promise.resolve([]),
      access.permissions.includes("users_read")
        ? getAdminUsers()
        : Promise.resolve([]),
      access.permissions.includes("parties_read")
        ? getAdminParties()
        : Promise.resolve([]),
    ]);

  return (
    <AdminDashboard
      access={access}
      initialStats={initialStats}
      initialApplications={initialApplications}
      initialUsers={initialUsers}
      initialParties={initialParties}
    />
  );
}
