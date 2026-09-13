import { RISK_LEVEL_LABELS } from "@/lib/config";
import type { RiskLevel } from "@/lib/types";

const classes: Record<RiskLevel, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${classes[level]}`}>{RISK_LEVEL_LABELS[level]}</span>;
}
