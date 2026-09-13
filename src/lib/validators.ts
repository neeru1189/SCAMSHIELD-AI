import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  displayName: z.string().trim().min(2).max(60),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const safetyAssistantSchema = z.object({
  question: z.string().trim().min(3).max(1000),
  analysisId: z.string().uuid().optional(),
  contextSummary: z.string().trim().max(1000).optional(),
});
