import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  return NextResponse.json({ user: await currentUser() });
}
