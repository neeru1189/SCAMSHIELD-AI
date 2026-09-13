"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_EXAMPLES } from "@/lib/config";
import type { AnalysisType } from "@/lib/types";

interface AnalyzeClientProps {
  type: AnalysisType;
  title: string;
  description: string;
  placeholder?: string;
  acceptsFile?: boolean;
}

export function AnalyzeClient({ type, title, description, placeholder, acceptsFile }: AnalyzeClientProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demos = DEMO_EXAMPLES.filter((example) => example.type === type);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("inputType", type);
      if (text) {
        formData.set("text", text);
      }
      if (file) {
        formData.set("file", file);
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to analyze input.");
      }

      sessionStorage.setItem("latestAnalysis", JSON.stringify(data.result));
      router.push(`/results?analysisId=${data.analysisId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to analyze input.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">{description}</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        {!acceptsFile && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Input</label>
            <textarea
              className="h-48 w-full rounded-lg border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
              placeholder={placeholder}
              value={text}
              onChange={(event) => setText(event.target.value)}
              required
            />
          </div>
        )}

        {acceptsFile && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Upload image (PNG, JPG, WEBP, max 5MB)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-slate-300 p-3"
              required
            />
          </div>
        )}

        {demos.length > 0 && !acceptsFile && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Demo examples</p>
            <div className="flex flex-wrap gap-2">
              {demos.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  className="rounded-md bg-slate-100 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200"
                  onClick={() => setText(demo.input)}
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Never paste passwords, OTPs, PINs, CVVs, or banking credentials.
        </p>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>
    </div>
  );
}
