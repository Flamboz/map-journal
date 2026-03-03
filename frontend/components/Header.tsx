"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="w-full border-b bg-white/60 px-6 py-3 flex items-center justify-between">
      <div className="font-bold">Map Journal</div>
      {session?.user && (
        <button
          type="button"
          aria-label="Sign out"
          title="Sign out"
          className="p-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 transition"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      )}
    </header>
  );
}
