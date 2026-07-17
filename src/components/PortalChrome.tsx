"use client";

import { useEffect, useState } from "react";
import { PortalHeader, type PortalHeaderApp } from "@upwithagents/ui";

interface PortalContext {
  userName?: string;
  userEmail?: string;
  apps: PortalHeaderApp[];
}

export default function PortalChrome() {
  const [context, setContext] = useState<PortalContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portal/context")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PortalContext | null) => {
        if (!cancelled) setContext(data);
      })
      .catch(() => {
        if (!cancelled) setContext(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Render nothing until the client-side fetch resolves: this keeps the
  // server-rendered markup and the initial client render identical (both
  // null), avoiding a hydration mismatch from PortalHeader's ThemeToggle
  // reading window.matchMedia/localStorage.
  if (!context) return null;

  return (
    <PortalHeader
      currentSlug="sheetup"
      apps={context.apps}
      userName={context.userName}
      userEmail={context.userEmail}
      logoutSlot={<a href="/api/auth/signout">Log out</a>}
    />
  );
}
