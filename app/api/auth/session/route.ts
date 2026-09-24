import { NextResponse } from "next/server";
import { currentUser } from "@/lib/local-auth/server";

export async function GET() {
  return NextResponse.json({ user: await currentUser() });
}
