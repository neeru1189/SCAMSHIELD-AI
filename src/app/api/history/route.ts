import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listUserAnalyses } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const riskLevel = searchParams.get("riskLevel") ?? undefined;
  const inputType = searchParams.get("inputType") ?? undefined;

  const analyses = listUserAnalyses({ userId: user.id, search, riskLevel, inputType });
  return NextResponse.json({ analyses });
}
