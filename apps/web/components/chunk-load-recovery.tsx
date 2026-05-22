"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const RELOAD_KEY_PREFIX = "chunk-reload:";

function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof Error) {
    return (
      error.name === "ChunkLoadError" ||
      error.message.includes("Failed to load chunk") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("_next/static/chunks")
    );
  }

  if (typeof error === "string") {
    return (
      error.includes("Failed to load chunk") ||
      error.includes("ChunkLoadError") ||
      error.includes("_next/static/chunks")
    );
  }

  return false;
}

function tryReloadForChunkError(): void {
  const key = `${RELOAD_KEY_PREFIX}${window.location.pathname}`;
  if (sessionStorage.getItem(key)) return;

  sessionStorage.setItem(key, "1");
  toast.info("App updated — reloading…");
  window.location.reload();
}

export function ChunkLoadRecovery() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
        event.preventDefault();
        tryReloadForChunkError();
      }
    }

    function onRejection(event: PromiseRejectionEvent) {
      if (isChunkLoadError(event.reason)) {
        event.preventDefault();
        tryReloadForChunkError();
      }
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
