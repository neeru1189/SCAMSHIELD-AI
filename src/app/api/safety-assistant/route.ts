import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAnalysisById, saveAssistantMessage } from "@/lib/db";
import { getSafetyAssistantAdvice } from "@/lib/ai/provider";
import { safetyAssistantSchema } from "@/lib/validators";

function fallbackAdvice(question: string) {
  const normalized = question.toLowerCase();
  const base = [
    "Stop interacting with the suspicious source immediately.",
    "Do not share more information or make further payments.",
    "Keep screenshots, transaction references, and phone numbers as evidence.",
  ];

  if (normalized.includes("paid") || normalized.includes("payment") || normalized.includes("money")) {
    return [
      "Contact your bank or payment provider immediately and report the transaction as suspicious.",
      "Request transaction dispute or fraud escalation where available.",
      ...base,
    ].join(" ");
  }

  if (normalized.includes("clicked") || normalized.includes("link")) {
    return [
      "Disconnect from risky pages and do not enter more details.",
      "Change passwords for affected accounts from a trusted device.",
      ...base,
    ].join(" ");
  }

  return [
    "Verify official help channels independently from trusted websites.",
    "If financial loss or identity misuse is suspected, report to official cybercrime channels in your region.",
    ...base,
  ].join(" ");
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = safetyAssistantSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid assistant request." }, { status: 400 });
    }

    let contextSummary = parsed.data.contextSummary ?? "";
    if (parsed.data.analysisId) {
      const analysis = getAnalysisById(parsed.data.analysisId);
      if (analysis) {
        contextSummary = analysis.summary;
      }
    }

    let answer = await getSafetyAssistantAdvice(parsed.data.question, contextSummary);
    if (!answer) {
      answer = fallbackAdvice(parsed.data.question);
    }

    const user = await getCurrentUser();
    saveAssistantMessage({
      userId: user?.id ?? null,
      analysisId: parsed.data.analysisId,
      question: parsed.data.question,
      answer,
    });

    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ error: "Safety assistant is temporarily unavailable." }, { status: 500 });
  }
}
