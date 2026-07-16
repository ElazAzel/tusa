import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { getCosmeticsCatalogue } from "@/lib/parties";
import CosmeticsAdmin from "./CosmeticsAdmin";

export const dynamic = "force-dynamic";

export default async function CosmeticsAdminPage() {
  const access = await getAdminAccess();
  if (!access) redirect("/admin/login?redirect=/admin/cosmetics");
  if (!access.permissions.includes("ads_read")) redirect("/admin");
  const items = await getCosmeticsCatalogue();
  return <CosmeticsAdmin initialItems={items} canWrite={access.permissions.includes("ads_write")} />;
}
