"use client";

import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";

type AuthControlsProps = {
  hasClerk: boolean;
  mode?: "site" | "shell";
};

export function AuthControls({
  hasClerk,
  mode = "site",
}: AuthControlsProps) {
  const { isSignedIn } = useAuth();

  if (!hasClerk) {
    return mode === "site" ? (
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
        >
          Try Demo
        </Link>
      </div>
    ) : null;
  }

  if (mode === "shell") {
    return isSignedIn ? <UserButton /> : null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!isSignedIn ? (
        <>
        <SignInButton mode="modal">
          <button
            type="button"
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
          >
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            type="button"
            className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-semibold text-white"
          >
            Sign Up
          </button>
        </SignUpButton>
        </>
      ) : (
        <>
        <Link
          href="/dashboard"
          className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-semibold text-white"
        >
          Dashboard
        </Link>
        <UserButton />
        </>
      )}
    </div>
  );
}
