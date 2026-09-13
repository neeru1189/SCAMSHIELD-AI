import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteAnalysisById, getAnalysisById } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = getAnalysisById(id);

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  const user = await getCurrentUser();

  if (analysis.userId && analysis.userId !== user?.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  return NextResponse.json({ analysis });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const deleted = deleteAnalysisById(id, user.id);

  if (!deleted) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
