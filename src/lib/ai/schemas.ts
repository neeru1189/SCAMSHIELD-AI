import { z } from "zod";

export const aiFindingSchema = z.object({
  category: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  explanation: z.string(),
  signal: z.string().optional(),
});

export const aiStructuredSchema = z.object({
  findings: z.array(aiFindingSchema).default([]),
  summary: z.string().optional(),
  recommendations: z.array(z.string()).default([]),
  avoid: z.array(z.string()).default([]),
});

export const visionExtractionSchema = z.object({
  extracted_text: z.string().default(""),
  detected_urls: z.array(z.string()).default([]),
  qr_detected: z.boolean().default(false),
});
