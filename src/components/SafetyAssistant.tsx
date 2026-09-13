"use client";

import { useState } from "react";

export function SafetyAssistant({ analysisId, contextSummary }: { analysisId?: string; contextSummary: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/safety-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, analysisId, contextSummary }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to fetch advice.");
      }

      setAnswer(data.answer);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to fetch advice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">What should I do now?</h2>
      <p className="mt-1 text-sm text-slate-600">Ask for next-step safety guidance based on this analysis.</p>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="I already clicked the link. What should I do?"
          className="h-24 w-full rounded-lg border border-slate-300 p-3"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Getting guidance..." : "Get Guidance"}
        </button>
      </form>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {answer && <p className="mt-3 rounded-md bg-blue-50 px-3 py-3 text-sm text-blue-900">{answer}</p>}
    </section>
  );
}
