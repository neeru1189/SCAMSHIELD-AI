"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AnalysisResult } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { SafetyAssistant } from "./SafetyAssistant";

interface LoadedAnalysis {
  id?: string;
  result: AnalysisResult;
  createdAt?: string;
}

export function ResultView() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId") ?? undefined;

  const [analysis, setAnalysis] = useState<LoadedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      if (analysisId) {
        try {
          const response = await fetch(`/api/history/${analysisId}`, { cache: "no-store" });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error ?? "Unable to load analysis.");
          }

          setAnalysis({ id: data.analysis.id, result: data.analysis.result, createdAt: data.analysis.createdAt });
          setLoading(false);
          return;
        } catch {
          // continue to local fallback
        }
      }

      const local = sessionStorage.getItem("latestAnalysis");
      if (local) {
        setAnalysis({ result: JSON.parse(local) as AnalysisResult });
      } else {
        setError("No analysis result found. Please run a new analysis.");
      }

      setLoading(false);
    };

    void load();
  }, [analysisId]);

  if (loading) {
    return <p className="rounded-lg bg-white p-6">Loading analysis...</p>;
  }

  if (error || !analysis) {
    return <p className="rounded-lg bg-red-50 p-6 text-red-700">{error ?? "No analysis found."}</p>;
  }

  const result = analysis.result;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <RiskBadge level={result.risk_level} />
          <span className="text-2xl font-bold text-slate-900">{result.risk_score} / 100</span>
        </div>
        <p className="mt-3 text-lg text-slate-800">{result.summary}</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="font-semibold text-slate-900">Why we flagged it</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {result.findings.length === 0 && <li>No major warning signs were detected.</li>}
              {result.findings.map((finding, index) => (
                <li key={`${finding.category}-${index}`} className="rounded-md bg-slate-50 p-2">
                  <span className="font-medium">{finding.category}:</span> {finding.explanation}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">What you should do</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
              {result.recommendations.map((rec, index) => (
                <li key={`${rec}-${index}`}>{rec}</li>
              ))}
            </ol>

            <h3 className="mt-4 font-semibold text-slate-900">What you should avoid</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {result.avoid.map((avoid, index) => (
                <li key={`${avoid}-${index}`}>{avoid}</li>
              ))}
            </ul>
          </div>
        </div>

        {(result.detected_urls?.length ?? 0) > 0 && (
          <div className="mt-5 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium">Detected URLs</p>
            <ul className="list-disc pl-5">
              {result.detected_urls?.map((url) => (
                <li key={url}>{url}</li>
              ))}
            </ul>
          </div>
        )}

        {result.decoded_qr_payload && (
          <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            Decoded QR destination: {result.decoded_qr_payload}
          </p>
        )}
      </section>

      <SafetyAssistant analysisId={analysis.id} contextSummary={result.summary} />
    </div>
  );
}
