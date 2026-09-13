import { HistoryView } from "@/components/HistoryView";
import { getCurrentUser } from "@/lib/auth";
import { listUserAnalyses } from "@/lib/db";
import type { RiskLevel } from "@/lib/types";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  const initialItems = user
    ? listUserAnalyses({ userId: user.id }).map((item) => ({
        ...item,
        riskLevel: item.riskLevel as RiskLevel,
      }))
    : [];

  return <HistoryView initialItems={initialItems} />;
}
