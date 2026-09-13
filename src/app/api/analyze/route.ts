import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, MAX_TEXT_LENGTH } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";
import { runGuardian } from "@/lib/guardian";
import { checkRateLimit, getClientIp, normalizeUrl, redactSensitiveContent } from "@/lib/security";
import { saveAnalysis } from "@/lib/db";
import type { AnalysisType } from "@/lib/types";
import { AiConfigError } from "@/lib/ai/provider";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`analyze:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait and try again." }, { status: 429 });
  }

  const user = await getCurrentUser();

  try {
    const formData = await request.formData();
    const inputType = formData.get("inputType") as AnalysisType | null;

    if (!inputType || !["message", "url", "screenshot", "qr"].includes(inputType)) {
      return NextResponse.json({ error: "Unsupported analysis type." }, { status: 400 });
    }

    let textInput = (formData.get("text") as string | null)?.trim() ?? "";
    const file = formData.get("file") as File | null;

    if (textInput.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Input is too long. Please keep input below ${MAX_TEXT_LENGTH} characters.` },
        { status: 400 },
      );
    }

    let imageBuffer: Buffer | undefined;
    let imageMimeType: string | undefined;

    if (inputType === "screenshot" || inputType === "qr") {
      if (!file) {
        return NextResponse.json({ error: "Please upload an image file." }, { status: 400 });
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Unsupported file type. Use PNG, JPEG, or WEBP." }, { status: 400 });
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json({ error: "File is too large. Maximum supported size is 5MB." }, { status: 400 });
      }

      imageBuffer = Buffer.from(await file.arrayBuffer());
      imageMimeType = file.type;
    }

    if ((inputType === "message" || inputType === "url") && !textInput) {
      return NextResponse.json({ error: "Input cannot be empty." }, { status: 400 });
    }

    if (inputType === "url") {
      const normalized = normalizeUrl(textInput);
      if (!normalized) {
        return NextResponse.json({ error: "Please enter a valid URL." }, { status: 400 });
      }
      textInput = normalized;
    }

    const result = await runGuardian({
      inputType,
      text: textInput,
      url: textInput,
      imageBuffer,
      imageMimeType,
    });

    const analysisId = saveAnalysis({
      userId: user?.id ?? null,
      inputType,
      inputText: inputType === "message" ? redactSensitiveContent(textInput) : undefined,
      sourceUrl: inputType === "url" ? textInput : undefined,
      result,
    });

    return NextResponse.json({
      analysisId,
      result,
      authRequiredForHistory: !user,
    });
  } catch (error) {
    if (error instanceof AiConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
