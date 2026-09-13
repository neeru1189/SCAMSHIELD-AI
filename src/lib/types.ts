export type RiskLevel = "low" | "medium" | "high" | "critical";
export type Severity = RiskLevel;

export type AnalysisType = "message" | "url" | "screenshot" | "qr";

export interface Finding {
  category: string;
  severity: Severity;
  explanation: string;
  signal?: string;
}

export interface AnalysisResult {
  risk_level: RiskLevel;
  risk_score: number;
  summary: string;
  findings: Finding[];
  recommendations: string[];
  avoid: string[];
  analysis_sources: string[];
  extracted_text?: string;
  detected_urls?: string[];
  qr_detected?: boolean;
  decoded_qr_payload?: string;
}

export interface GuardianInput {
  inputType: AnalysisType;
  text?: string;
  url?: string;
  imageBuffer?: Buffer;
  imageMimeType?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}
