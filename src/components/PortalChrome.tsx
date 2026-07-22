"use client";

import { useEffect, useState } from "react";
import { AscentProgress, PortalHeader, type PortalHeaderApp } from "@upwithagents/ui";

interface PortalContext {
  userName?: string;
  userEmail?: string;
  apps: PortalHeaderApp[];
}

export default function PortalChrome({ children }: { children: React.ReactNode }) {
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

  // Hold the app's own content back behind the progress bar too, not just
  // the header - otherwise it renders immediately (server-rendered markup
  // has no dependency on this fetch) while the header pops in later once
  // the fetch resolves, shoving everything else down the page. Gating both
  // together also keeps the server/initial-client render identical (both
  // null), avoiding a hydration mismatch from PortalHeader's ThemeToggle
  // reading window.matchMedia/localStorage.
  return (
    <>
      {/* Mounted unconditionally: unmounting it the instant `context`
          resolves would cut its own fill/fade animation short mid-transition,
          which read as a flicker or a broken/discontinuous bar. */}
      <AscentProgress />
      {context && (
        <>
          <div data-portal-chrome>
            <PortalHeader
              currentSlug="sheetup"
              apps={context.apps}
              userName={context.userName}
              userEmail={context.userEmail}
              logoutSlot={<a href="/api/auth/signout">Log out</a>}
            />
          </div>
          {children}
        </>
      )}
    </>
  );
}
