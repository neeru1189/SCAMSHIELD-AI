export default function SettingsPage() {
  return (
    <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Settings & About</h1>
      <section>
        <h2 className="font-semibold">Privacy</h2>
        <p className="mt-1 text-sm text-slate-700">
          ScamShield AI processes submitted text, links, and screenshots for risk analysis. Never submit passwords, OTPs, PINs,
          CVVs, or banking credentials. You can delete your saved analyses from History.
        </p>
      </section>
      <section>
        <h2 className="font-semibold">Data Retention</h2>
        <p className="mt-1 text-sm text-slate-700">
          Analysis history is stored only for your account and can be removed at any time. Uploaded image content is processed for
          analysis and not exposed to other users.
        </p>
      </section>
      <section>
        <h2 className="font-semibold">AI Limitations</h2>
        <p className="mt-1 text-sm text-slate-700">
          Risk scores are indicators based on detected patterns, not proof. Always verify through official channels before acting.
        </p>
      </section>
      <section>
        <h2 className="font-semibold">Safety Disclaimer</h2>
        <p className="mt-1 text-sm text-slate-700">
          ScamShield AI does not represent banks, police, government agencies, or payment providers.
        </p>
      </section>
    </div>
  );
}
