"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { withBasePath } from "../lib/basePath";

const NAV_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-md border border-[color:var(--topbar-text)]/25 px-2.5 py-2 text-sm font-medium text-[color:var(--topbar-text)] transition hover:bg-[color:var(--topbar-ctrl-hover)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--topbar-text)]/40 sm:px-3";

const ICON_CLASS = "h-5 w-5 shrink-0";

function BackToMapIcon() {
  return (
    <svg aria-hidden="true" className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6 3-6-3z" />
      <path d="M9 7v13M15 4v13" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg aria-hidden="true" className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v18" />
      <circle cx="6" cy="8" r="2" />
      <circle cx="6" cy="16" r="2" />
      <path d="M11 8h9M11 16h6" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg aria-hidden="true" className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 17l5-5-5-5" />
      <path d="M20 12H9" />
      <path d="M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function SignInIcon() {
  return (
    <svg aria-hidden="true" className={ICON_CLASS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 17l5-5-5-5" />
      <path d="M19 12H8" />
      <path d="M11 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname() ?? "";
  const isTimelineRoute = pathname.startsWith("/timeline");
  const isAuthRoute = pathname.startsWith("/auth");
  const showBack = pathname.startsWith("/events/") || isTimelineRoute;

  return (
    <header className="sticky top-0 z-[1200] flex h-[var(--topbar-height)] w-full items-center justify-between gap-2 border-b border-[color:var(--border-soft)] bg-[color:var(--topbar-bg)] px-3 text-[color:var(--topbar-text)] sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--accent-primary)]" aria-hidden="true" />
        <Link href="/" data-heading="journal" className="truncate text-xl leading-none sm:text-2xl">
          Map Journal
        </Link>
      </div>

      {session?.user ? (
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {showBack && (
            <Link href="/" aria-label="Back to map" title="Back to map" className={NAV_BUTTON_CLASS}>
              <BackToMapIcon />
              <span className="hidden sm:inline">Back to map</span>
            </Link>
          )}

          {!isTimelineRoute && (
            <Link href="/timeline" aria-label="Timeline" title="Timeline" className={NAV_BUTTON_CLASS}>
              <TimelineIcon />
              <span className="hidden sm:inline">Timeline</span>
            </Link>
          )}

          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--topbar-text)]/25 bg-[color:var(--topbar-ctrl-bg)] px-2.5 py-2 text-sm font-medium text-[color:var(--topbar-text)] transition hover:bg-[color:var(--topbar-ctrl-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--topbar-text)]/40 sm:px-4"
            onClick={() => signOut({ callbackUrl: withBasePath("/auth/signin") })}
          >
            <SignOutIcon />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      ) : (
        status === "unauthenticated" &&
        !isAuthRoute && (
          <Link
            href="/auth/signin"
            aria-label="Sign in"
            title="Sign in"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--topbar-text)]/25 bg-[color:var(--topbar-ctrl-bg)] px-2.5 py-2 text-sm font-medium text-[color:var(--topbar-text)] transition hover:bg-[color:var(--topbar-ctrl-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--topbar-text)]/40 sm:px-4"
          >
            <SignInIcon />
            <span className="hidden sm:inline">Sign in</span>
          </Link>
        )
      )}
    </header>
  );
}
