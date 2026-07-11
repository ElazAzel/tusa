import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { getAdminProductStats, listPromoCodes } from "@/lib/parties";
import PromoConsole from "./PromoConsole";

export const dynamic = "force-dynamic";

export default async function PromoAdminPage() {
  const access = await getAdminAccess();
  if (!access) redirect("/admin/login");
  if (!access.permissions.includes("promos_read")) redirect("/admin");
  const [promos, stats] = await Promise.all([
    listPromoCodes(),
    getAdminProductStats(),
  ]);
  return (
    <PromoConsole
      canWrite={access.permissions.includes("promos_write")}
      initialPromos={promos}
      initialStats={stats}
    />
  );
}
