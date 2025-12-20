"use client";

import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";

/**
 * Minimal runtime probe to surface Clerk context issues early.
 * Renders a hidden marker that only mounts when ClerkProvider is present.
 */
export function ClerkContextCheck() {
  const { isLoaded } = useUser();

  return (
    <span
      className="sr-only"
      aria-hidden="true"
      data-clerk-status={isLoaded ? "ready" : "loading"}
    >
      <SignedIn>clerk:in</SignedIn>
      <SignedOut>clerk:out</SignedOut>
    </span>
  );
}
