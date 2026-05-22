"use client";

import Link from "next/link";

import { DossierPageShell } from "~/components/dossier/page-shell";
import { DossierStamp } from "~/components/dossier/stamp";
import { Spinner } from "~/components/ui/spinner";
import { trpc } from "~/trpc/client";

const TICKER_ITEMS = [
  "PUBLIC DOSSIER INDEX — DECLASSIFIED FORMS AVAILABLE",
  "SELECT A CASE FILE TO FILE YOUR FIELD REPORT",
  "UNLISTED TRANSMISSIONS NOT SHOWN IN THIS INDEX",
];

export default function ExplorePage() {
  const { data: forms, isPending } = trpc.public.getForms.useQuery();

  return (
    <DossierPageShell tickerItems={TICKER_ITEMS}>
      <div className="px-6 py-10 md:px-10">
        <p className="dossier-kicker text-[var(--color-ink-faded)]">
          DECLASSIFIED INDEX
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-black text-[var(--color-ink)]">
          Public Dossiers
        </h1>
        <p className="mt-3 max-w-xl dossier-body">
          Operative-submitted intelligence forms cleared for public access. Unlisted
          transmissions require a direct handler link.
        </p>

        {isPending ? (
          <div className="mt-12 flex items-center gap-3">
            <Spinner className="size-5" />
            <span className="dossier-meta text-[var(--color-ink-faded)]">
              INDEXING RECORDS...
            </span>
          </div>
        ) : !forms?.length ? (
          <div className="mt-12 border-2 border-dashed border-[var(--color-ink-faded)] py-16 text-center">
            <DossierStamp variant="brass" rotate={-3} size="sm">
              INDEX EMPTY
            </DossierStamp>
            <p className="mt-6 dossier-body">
              No public dossiers have been published yet.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Link
                key={form.id}
                href={`/f/${form.slug}`}
                className="group border-2 border-[var(--color-ink)] bg-[var(--color-paper)] p-5 transition-colors hover:bg-[var(--color-paper-dark)]"
              >
                <DossierStamp variant="ink" rotate={2} size="xs">
                  PUBLIC
                </DossierStamp>
                <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--color-ink)] group-hover:text-[var(--color-stamp)]">
                  {form.title}
                </h2>
                {form.description ? (
                  <p className="mt-2 line-clamp-2 dossier-body text-sm">
                    {form.description}
                  </p>
                ) : null}
                <p className="mt-4 dossier-label text-[var(--color-brass)]">
                  OPEN TERMINAL →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DossierPageShell>
  );
}
