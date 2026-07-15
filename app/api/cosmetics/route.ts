import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCosmeticsCatalogue } from "@/lib/parties";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json({ items: await getCosmeticsCatalogue() });
  } catch {
    return NextResponse.json({ error: "Failed to load cosmetics." }, { status: 500 });
  }
}
