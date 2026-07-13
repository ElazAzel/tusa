import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCosmeticsCatalogue } from "@/lib/parties";
import CosmeticsAdmin from "./CosmeticsAdmin";

export const dynamic = "force-dynamic";

export default async function CosmeticsAdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/login?redirect=/admin/cosmetics");
  const items = await getCosmeticsCatalogue();
  return <CosmeticsAdmin initialItems={items} />;
}
