"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const showBack =
    typeof pathname === "string" && (pathname.startsWith("/events/") || pathname.startsWith("/timeline"));

  return (
    <header className="sticky top-0 z-[1200] flex h-[var(--topbar-height)] w-full items-center justify-between border-b border-[color:var(--border-soft)] bg-[#1d2140] px-4 text-[#f7f1e6] sm:px-6">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent-primary)]" aria-hidden="true" />
        <Link href="/" data-heading="journal" className="text-2xl leading-none">
          Map Journal
        </Link>
      </div>
      {session?.user && (
        <div className="flex items-center gap-3">
          {showBack && (
            <Link
              href="/"
              className="hidden sm:inline-flex rounded-md border border-[#f7f1e6]/25 bg-[#2a2f55]/0 px-3 py-2 text-sm font-medium text-[#f7f1e6] hover:bg-[#2a2f55]/10"
            >
              ← Back to map
            </Link>
          )}

          <Link
            href="/timeline"
            className="hidden sm:inline-flex rounded-md border border-[#f7f1e6]/25 bg-[#2a2f55]/0 px-3 py-2 text-sm font-medium text-[#f7f1e6] hover:bg-[#2a2f55]/10"
          >
            Timeline
          </Link>

          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            className="rounded-full border border-[#f7f1e6]/25 bg-[#2a2f55] px-4 py-2 text-sm font-medium text-[#f7f1e6] transition hover:bg-[#353c6a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7f1e6]/40"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
