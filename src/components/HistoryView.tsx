"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { RiskBadge } from "./RiskBadge";
import type { AnalysisType, RiskLevel } from "@/lib/types";

interface HistoryItem {
  id: string;
  inputType: AnalysisType;
  riskLevel: RiskLevel;
  riskScore: number;
  summary: string;
  createdAt: string;
}

export function HistoryView({ initialItems }: { initialItems: HistoryItem[] }) {
  const [items, setItems] = useState<HistoryItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [inputType, setInputType] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (options?: { skipLoading?: boolean }) => {
    if (!options?.skipLoading) {
      setLoading(true);
    }
    setError("");

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (riskLevel) params.set("riskLevel", riskLevel);
      if (inputType) params.set("inputType", inputType);

      const response = await fetch(`/api/history?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load history.");
      }

      setItems(data.analyses);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load history.");
    } finally {
      setLoading(false);
    }
  }, [search, riskLevel, inputType]);

  const deleteItem = async (id: string) => {
    const response = await fetch(`/api/history/${id}`, { method: "DELETE" });
    if (response.ok) {
      await load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold">Analysis History</h1>
        <p className="mt-1 text-sm text-slate-600">Only your account analyses are shown here.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            className="rounded-md border border-slate-300 p-2"
            placeholder="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="rounded-md border border-slate-300 p-2"
            value={riskLevel}
            onChange={(event) => setRiskLevel(event.target.value)}
          >
            <option value="">All risk levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            className="rounded-md border border-slate-300 p-2"
            value={inputType}
            onChange={(event) => setInputType(event.target.value)}
          >
            <option value="">All analysis types</option>
            <option value="message">Message</option>
            <option value="url">URL</option>
            <option value="screenshot">Screenshot</option>
            <option value="qr">QR</option>
          </select>
          <button onClick={() => void load()} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Apply Filters
          </button>
        </div>
      </div>

      {loading && <p className="rounded-lg bg-white p-4">Loading history...</p>}
      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="rounded-lg bg-white p-6 text-slate-700">No analysis history yet.</p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <RiskBadge level={item.riskLevel} />
                  <span className="text-sm text-slate-600">{item.riskScore} / 100</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase text-slate-600">{item.inputType}</span>
                </div>
                <p className="mt-2 text-slate-800">{item.summary}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/results?analysisId=${item.id}`} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">
                  Open
                </Link>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
