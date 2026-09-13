import Link from "next/link";
import { APP_NAME, TAGLINE } from "@/lib/config";

const actions = [
  { href: "/analyze/message", label: "Analyze Message", description: "Check suspicious SMS, WhatsApp, email, or payment requests." },
  { href: "/analyze/url", label: "Check URL", description: "Inspect suspicious links using safe non-invasive checks." },
  { href: "/analyze/screenshot", label: "Upload Screenshot", description: "Analyze suspicious screenshots with multimodal extraction." },
  { href: "/analyze/qr", label: "Scan QR", description: "Decode and assess QR destinations before acting." },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">{APP_NAME}</h1>
        <p className="mt-2 text-lg text-slate-700">{TAGLINE}</p>
        <p className="mt-3 text-slate-600">Check before you click.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="rounded-xl border bg-white p-5 shadow-sm hover:border-blue-300">
            <h2 className="text-xl font-semibold text-slate-900">{action.label}</h2>
            <p className="mt-2 text-sm text-slate-600">{action.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
