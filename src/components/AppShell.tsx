"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { APP_NAME, TAGLINE } from "@/lib/config";
import type { AuthUser } from "@/lib/types";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/analyze/message", label: "Message" },
  { href: "/analyze/url", label: "URL" },
  { href: "/analyze/screenshot", label: "Screenshot" },
  { href: "/analyze/qr", label: "QR" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children, initialUser }: { children: React.ReactNode; initialUser: AuthUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = initialUser;

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.refresh();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-xl font-bold text-blue-700">
              {APP_NAME}
            </Link>
            <p className="text-sm text-slate-600">{TAGLINE}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Hi, {user.displayName}</span>
                <button
                  onClick={handleSignOut}
                  className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100">
                  Sign in
                </Link>
                <Link href="/auth/signup" className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm ${
                pathname === item.href ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
