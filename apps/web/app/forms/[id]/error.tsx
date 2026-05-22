"use client";

import Link from "next/link";
import { useEffect } from "react";

import { DossierPageShell } from "~/components/dossier/page-shell";
import { Button } from "~/components/ui/button";

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    error.message.includes("Failed to load chunk") ||
    error.message.includes("Loading chunk") ||
    error.message.includes("_next/static/chunks")
  );
}

export default function FormRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunkError = isChunkLoadError(error);

  useEffect(() => {
    if (!chunkError) return;

    const key = `chunk-reload:${window.location.pathname}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");
    window.location.reload();
  }, [chunkError]);

  return (
    <DossierPageShell classification="RESTRICTED">
      <div className="mx-auto max-w-lg px-6 py-16 md:px-10">
        <p className="dossier-kicker text-[var(--color-stamp)]">TRANSMISSION INTERRUPTED</p>
        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-black text-[var(--color-ink)]">
          {chunkError ? "Intelligence module out of date" : "Could not load dossier section"}
        </h1>
        <p className="mt-4 dossier-body text-[var(--color-ink-faded)]">
          {chunkError
            ? "A newer version of this archive was deployed while this terminal was active. Reload to fetch the latest intelligence modules."
            : "An unexpected error occurred while opening this section of the dossier."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-2 border-[var(--color-ink)] bg-transparent font-[family-name:var(--font-courier)] uppercase tracking-wider text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink-faded)] hover:bg-[var(--color-paper-dark)]"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
          {!chunkError ? (
            <Button
              type="button"
              variant="ghost"
              className="font-[family-name:var(--font-courier)] uppercase tracking-wider text-[var(--color-ink-faded)] hover:text-[var(--color-ink)]"
              onClick={reset}
            >
              Try again
            </Button>
          ) : null}
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 font-[family-name:var(--font-courier)] text-sm uppercase tracking-wider text-[var(--color-brass)] hover:text-[var(--color-stamp)]"
          >
            ← Intelligence overview
          </Link>
        </div>
      </div>
    </DossierPageShell>
  );
}
