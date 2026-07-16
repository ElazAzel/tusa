import { NextResponse } from "next/server";
import { getCosmeticsCatalogue } from "@/lib/parties";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getCosmeticsCatalogue();
    return NextResponse.json({ items: items.filter((item) => item.active) });
  } catch {
    return NextResponse.json({ error: "Could not load cosmetics catalogue." }, { status: 503 });
  }
}
