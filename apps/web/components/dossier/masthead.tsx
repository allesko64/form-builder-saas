"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@repo/auth/client";
import { cn } from "~/lib/utils";

import { DossierNavLink } from "./nav-link";

type MastheadProps = {
  classification?: string;
};

export function DossierMasthead({ classification = "RESTRICTED" }: MastheadProps) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const homeHref = session?.user ? "/explore" : "/";
  const onDashboard = pathname === "/dashboard" || pathname.startsWith("/forms");

  return (
    <header className="relative z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b-2 border-[var(--color-ink)] bg-[var(--color-paper-dark)] px-6 py-3 md:px-8">
      <span className="dossier-meta text-[var(--color-ink)]">EST. MMXXVI</span>

      <Link
        href={isPending ? "/" : homeHref}
        className="justify-self-center font-[family-name:var(--font-playfair)] text-xl font-black tracking-tight text-[var(--color-ink)] no-underline transition-colors hover:text-[var(--color-ink-faded)]"
      >
        THE DOSSIER TIMES
      </Link>

      <div className="flex items-center justify-end gap-4">
        {classification ? (
          <span className="dossier-meta hidden text-[var(--color-ink-faded)] lg:inline">
            {classification}
          </span>
        ) : null}

        {isPending ? (
          <span className="dossier-meta">...</span>
        ) : session?.user ? (
          <>
            <span className="dossier-caption hidden max-w-[10rem] truncate normal-case sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <Link
              href="/dashboard"
              className={cn(
                "dossier-nav border-b transition-colors",
                onDashboard
                  ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                  : "border-[var(--color-ink-faded)] text-[var(--color-ink-faded)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
              )}
            >
              OVERVIEW →
            </Link>
          </>
        ) : (
          <>
            <DossierNavLink href="/sign-in" variant="secondary">
              SIGN IN
            </DossierNavLink>
            <DossierNavLink href="/sign-up" variant="primary" className="hidden md:inline-block">
              BEGIN FILING
            </DossierNavLink>
          </>
        )}
      </div>
    </header>
  );
}
