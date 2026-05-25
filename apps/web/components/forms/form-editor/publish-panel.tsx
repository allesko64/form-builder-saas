"use client";

import { Copy, ExternalLink } from "lucide-react";
import type { RouterOutputs } from "@repo/trpc/client";
import { toast } from "sonner";

import { DossierStamp } from "~/components/dossier/stamp";
import { publicFormUrl } from "~/lib/app-url";
import { cn } from "~/lib/utils";

type Form = RouterOutputs["form"]["getById"];

type PublishPanelProps = {
  form: Form;
  /** At least one directive must exist before transmission. */
  hasDirectives: boolean;
  isPublishing: boolean;
  onPublish: (status: "published_public" | "published_unlisted") => void;
  onUnpublish: () => void;
};

export function PublishPanel({
  form,
  hasDirectives,
  isPublishing,
  onPublish,
  onUnpublish,
}: PublishPanelProps) {
  const isPublished = form.status === "published_public" || form.status === "published_unlisted";
  const shareUrl = publicFormUrl(form.slug);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Transmission link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <div className="space-y-5">
      <p className="dossier-kicker text-[var(--color-stamp)]">PUBLICATION DIRECTIVE</p>

      <div className="flex items-center gap-3">
        <DossierStamp
          variant={isPublished ? "ink" : "brass"}
          rotate={isPublished ? 2 : -4}
          size="sm"
        >
          {form.status.replace(/_/g, " ").toUpperCase()}
        </DossierStamp>
      </div>

      {!hasDirectives && !isPublished ? (
        <div className="border-2 border-dotted border-[var(--color-stamp)] bg-[color-mix(in_srgb,var(--color-paper-dark)_50%,transparent)] p-4">
          <DossierStamp variant="red" rotate={-4} size="sm">
            NO DIRECTIVES ON FILE
          </DossierStamp>
          <p className="mt-3 dossier-body text-sm text-[var(--color-ink-faded)]">
            File at least one directive on the canvas before this dossier can be transmitted to a
            public or unlisted terminal.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <button
          type="button"
          disabled={!hasDirectives || isPublishing || form.status === "published_public"}
          onClick={() => onPublish("published_public")}
          className={cn(
            "w-full border-2 px-4 py-3 dossier-nav transition-colors disabled:opacity-50",
            form.status === "published_public"
              ? "border-[var(--color-stamp)] bg-[var(--color-stamp)] text-[var(--color-paper)]"
              : "border-[var(--color-ink)] text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]",
          )}
        >
          PUBLISH — PUBLIC TERMINAL
        </button>
        <p className="font-[family-name:var(--font-lora)] text-xs text-[var(--color-ink-faded)]">
          Listed on the explore page. Anyone with the link may file a report.
        </p>

        <button
          type="button"
          disabled={!hasDirectives || isPublishing || form.status === "published_unlisted"}
          onClick={() => onPublish("published_unlisted")}
          className={cn(
            "w-full border-2 px-4 py-3 dossier-nav transition-colors disabled:opacity-50",
            form.status === "published_unlisted"
              ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
              : "border-[var(--color-ink-faded)] text-[var(--color-ink-faded)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
          )}
        >
          PUBLISH — UNLISTED
        </button>
        <p className="font-[family-name:var(--font-lora)] text-xs text-[var(--color-ink-faded)]">
          Hidden from explore. Only operatives with the direct link may access.
        </p>

        {isPublished ? (
          <button
            type="button"
            disabled={isPublishing}
            onClick={onUnpublish}
            className="w-full border-2 border-[var(--color-stamp)] px-4 py-3 dossier-nav text-[var(--color-stamp)] transition-colors hover:bg-[var(--color-stamp)] hover:text-[var(--color-paper)] disabled:opacity-50"
          >
            RETURN TO DRAFT
          </button>
        ) : null}
      </div>

      {isPublished ? (
        <div className="border-t-2 border-dashed border-[var(--color-ink-faded)] pt-5">
          <p className="dossier-nav text-[var(--color-ink-faded)]">TRANSMISSION LINK</p>
          <div className="mt-2 flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="dossier-value min-w-0 flex-1 border border-dotted border-[var(--color-ink-faded)] bg-[var(--color-paper-dark)] px-3 py-2 normal-case"
            />
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center border-2 border-[var(--color-ink)] px-3 text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
              aria-label="Copy link"
            >
              <Copy className="size-4" />
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border-2 border-[var(--color-brass)] px-3 text-[var(--color-brass)] hover:bg-[var(--color-brass)] hover:text-[var(--color-paper)]"
              aria-label="Open public form"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
          <p className="dossier-caption mt-2">SLUG /{form.slug}</p>
        </div>
      ) : null}
    </div>
  );
}
